# Monitoring Stack Troubleshooting Guide

## Overview

This guide helps diagnose and resolve common issues with the Prometheus, Loki, and Grafana monitoring stack for the Prompt Driver application.

## Quick Health Check Commands

```bash
# Check if services are running
docker-compose -f docker-compose.monitoring.yml ps

# Check service logs
docker-compose -f docker-compose.monitoring.yml logs prometheus
docker-compose -f docker-compose.monitoring.yml logs loki
docker-compose -f docker-compose.monitoring.yml logs promtail

# Test endpoints
curl -f http://localhost:9090/actuator/prometheus    # Spring Boot metrics
curl -f http://localhost:9091/targets              # Prometheus targets
curl -f http://localhost:3100/ready                # Loki readiness
curl -f http://localhost:3100/metrics              # Loki metrics

# Test log ingestion
curl -X GET "http://localhost:3100/loki/api/v1/labels"
```

## Common Issues and Solutions

### 1. Spring Boot Application Issues

#### Problem: `/actuator/prometheus` endpoint not accessible

**Symptoms:**
- 404 error when accessing `/actuator/prometheus`
- Prometheus shows spring-boot-app target as DOWN

**Solutions:**

1. **Check Actuator Configuration**
```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus  # Must include prometheus
  endpoint:
    prometheus:
      enabled: true  # Must be explicitly enabled
```

2. **Verify Micrometer Dependency**
```kotlin
// build.gradle.kts - ensure this dependency exists
implementation("io.micrometer:micrometer-registry-prometheus")
```

3. **Check Application Startup Logs**
```bash
./gradlew bootRun --info | grep -i "prometheus\|actuator"
```

4. **Test Endpoint Manually**
```bash
curl -v http://localhost:9090/actuator/prometheus
# Should return metrics in Prometheus format
```

#### Problem: Application not starting after configuration changes

**Symptoms:**
- Application fails to start
- Configuration binding errors

**Solutions:**

1. **Check YAML Syntax**
```bash
# Validate YAML syntax
python -c "import yaml; yaml.safe_load(open('src/main/resources/application.yml'))"
```

2. **Review Application Logs**
```bash
./gradlew bootRun 2>&1 | grep -i "error\|exception"
```

3. **Start with Minimal Configuration**
```yaml
# Minimal working configuration
management:
  endpoints:
    web:
      exposure:
        include: prometheus
  endpoint:
    prometheus:
      enabled: true
```

### 2. Prometheus Issues

#### Problem: Prometheus not scraping Spring Boot application

**Symptoms:**
- Target shows as DOWN in Prometheus UI
- No metrics from spring-boot-app job

**Diagnostic Steps:**
```bash
# Check Prometheus targets
curl http://localhost:9091/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health, lastError: .lastError}'

# Check Prometheus configuration
docker exec prometheus cat /etc/prometheus/prometheus.yml

# Check if Spring Boot is accessible from container
docker exec prometheus wget -qO- http://host.docker.internal:9090/actuator/prometheus | head -10
```

**Solutions:**

1. **Network Connectivity Issues**
```yaml
# prometheus.yml - try different target addresses
scrape_configs:
  - job_name: 'spring-boot-app'
    static_configs:
      # Try these in order:
      - targets: ['host.docker.internal:9090']  # For Docker Desktop
      - targets: ['172.17.0.1:9090']           # Docker bridge network
      - targets: ['localhost:9090']            # If Prometheus runs on host
```

2. **Configuration Validation**
```bash
# Validate Prometheus configuration
docker exec prometheus promtool check config /etc/prometheus/prometheus.yml

# Reload configuration without restart
curl -X POST http://localhost:9091/-/reload
```

3. **Firewall/Port Issues**
```bash
# Check if port 9090 is accessible
telnet localhost 9090
netstat -tulpn | grep :9090
```

#### Problem: Prometheus consuming too much memory/disk

**Symptoms:**
- Container crashes with OOM
- Disk space filling up rapidly

**Solutions:**

1. **Add Resource Limits**
```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    # ... other config
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
    command:
      - '--storage.tsdb.retention.time=7d'     # Reduce retention
      - '--storage.tsdb.retention.size=1GB'   # Limit storage size
```

2. **Reduce Scrape Frequency**
```yaml
# prometheus.yml
global:
  scrape_interval: 30s  # Increase from 15s
  evaluation_interval: 30s

scrape_configs:
  - job_name: 'spring-boot-app'
    scrape_interval: 10s  # Still frequent for app metrics
```

### 3. Loki Issues

#### Problem: Loki not starting or crashing

**Symptoms:**
- Container exits immediately
- "permission denied" errors

**Diagnostic Steps:**
```bash
# Check Loki logs
docker-compose -f docker-compose.monitoring.yml logs loki

# Check Loki configuration
docker exec loki loki -config.file=/etc/loki/loki.yml -verify-config

# Check storage permissions
ls -la monitoring/loki/
docker exec loki ls -la /tmp/loki/
```

**Solutions:**

1. **Fix Storage Permissions**
```bash
# Create directories with correct permissions
sudo mkdir -p /tmp/loki/{index,chunks}
sudo chmod 755 /tmp/loki/{index,chunks}

# Or use named volumes (recommended)
```

2. **Simplify Loki Configuration**
```yaml
# loki.yml - minimal working config
server:
  http_listen_port: 3100

ingester:
  lifecycler:
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /tmp/loki/index
  filesystem:
    directory: /tmp/loki/chunks
```

#### Problem: Loki not receiving logs from Promtail

**Symptoms:**
- No logs visible in Grafana
- Loki /metrics shows low ingestion rate

**Diagnostic Steps:**
```bash
# Check Promtail logs
docker-compose -f docker-compose.monitoring.yml logs promtail

# Test Loki API
curl "http://localhost:3100/loki/api/v1/labels"
curl "http://localhost:3100/loki/api/v1/label/job/values"

# Check log files exist
ls -la logs/
docker exec promtail ls -la /var/log/app/
```

**Solutions:**

1. **Fix Log File Paths**
```yaml
# promtail.yml
scrape_configs:
  - job_name: spring-boot-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: spring-boot
          app: prompt-driver
          __path__: /var/log/app/**/*.log  # Use glob pattern
```

2. **Check File Permissions**
```bash
# Make logs readable by promtail container
chmod 644 logs/*.log

# Or run promtail as root (not recommended for production)
docker-compose.yml:
  promtail:
    user: root
```

3. **Debug Promtail Pipeline**
```yaml
# promtail.yml - add debug output
scrape_configs:
  - job_name: spring-boot-logs
    # ... other config
    pipeline_stages:
      - output:
          source: message
      # ... other stages
```

### 4. Grafana Issues

#### Problem: Data source connection failed

**Symptoms:**
- "Data source connected" but no data in panels
- HTTP errors in Grafana logs

**Solutions:**

1. **Check Data Source URLs**
```
# For Docker environments:
Prometheus: http://prometheus:9091
Loki: http://loki:3100

# For mixed environments (Grafana on host):
Prometheus: http://localhost:9091
Loki: http://localhost:3100
```

2. **Test Data Source Connection**
```bash
# From Grafana container
docker exec grafana curl -f http://prometheus:9091/api/v1/labels
docker exec grafana curl -f http://loki:3100/ready

# From host
curl -f http://localhost:9091/api/v1/labels
curl -f http://localhost:3100/ready
```

#### Problem: Panels showing "No data"

**Symptoms:**
- Dashboard panels display "No data"
- Query inspector shows no results

**Diagnostic Steps:**

1. **Test Queries in Explore**
   - Use Grafana Explore to test queries
   - Check query syntax and time ranges

2. **Verify Metrics Exist**
```bash
# List available metrics
curl http://localhost:9091/api/v1/label/__name__/values | jq

# Test specific metric
curl "http://localhost:9091/api/v1/query?query=up" | jq
```

3. **Check Time Ranges**
   - Ensure dashboard time range includes data
   - Verify metric timestamps align with query time

**Solutions:**

1. **Fix Query Syntax**
```promql
# Common query fixes
# Wrong:
http_server_requests_total{job="spring-boot"}

# Correct:
http_server_requests_total{job="spring-boot-app"}
```

2. **Adjust Time Ranges**
   - Use appropriate time ranges for different metrics
   - Consider metric collection intervals

### 5. Network and Connectivity Issues

#### Problem: Services can't communicate

**Symptoms:**
- Connection refused errors
- DNS resolution failures

**Diagnostic Steps:**
```bash
# Check Docker networks
docker network ls
docker network inspect prompt-driver_monitoring

# Test connectivity between containers
docker exec prometheus ping loki
docker exec promtail ping loki
docker exec prometheus wget -qO- http://host.docker.internal:9090/actuator/health
```

**Solutions:**

1. **Ensure Same Network**
```yaml
# docker-compose.monitoring.yml
networks:
  monitoring:
    driver: bridge

services:
  prometheus:
    networks:
      - monitoring
  loki:
    networks:
      - monitoring
```

2. **Use Correct Service Names**
```yaml
# Services should reference each other by service name
prometheus.yml:
  - targets: ['host.docker.internal:9090']  # For Spring Boot on host

promtail.yml:
  clients:
    - url: http://loki:3100/loki/api/v1/push  # Use service name
```

### 6. Performance Issues

#### Problem: High resource usage

**Symptoms:**
- Containers consuming excessive CPU/Memory
- Slow query responses

**Solutions:**

1. **Add Resource Limits**
```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

2. **Optimize Configurations**
```yaml
# Reduce scrape intervals
prometheus.yml:
  global:
    scrape_interval: 30s

# Reduce log retention
loki.yml:
  limits_config:
    retention_period: 24h
```

## Monitoring Stack Health Dashboard

Create a dashboard to monitor the monitoring stack itself:

```promql
# Prometheus health
up{job="prometheus"}

# Loki health
up{job="loki"}

# Ingestion rates
rate(loki_ingester_ingested_samples_total[5m])
rate(prometheus_tsdb_symbol_table_size_bytes[5m])

# Resource usage
container_memory_usage_bytes{name=~"prometheus|loki|promtail"}
rate(container_cpu_usage_seconds_total{name=~"prometheus|loki|promtail"}[5m])
```

## Recovery Procedures

### Complete Stack Restart
```bash
# Stop all services
docker-compose -f docker-compose.monitoring.yml down

# Clean up volumes (data loss!)
docker volume prune

# Restart with fresh data
docker-compose -f docker-compose.monitoring.yml up -d
```

### Individual Service Restart
```bash
# Restart specific service
docker-compose -f docker-compose.monitoring.yml restart prometheus

# View startup logs
docker-compose -f docker-compose.monitoring.yml logs -f prometheus
```

### Configuration Reload
```bash
# Reload Prometheus configuration (no restart needed)
curl -X POST http://localhost:9091/-/reload

# For Loki/Promtail, restart is required
docker-compose -f docker-compose.monitoring.yml restart loki promtail
```

## Backup and Recovery

### Backup Important Data
```bash
# Backup Prometheus data
docker run --rm -v prometheus_data:/data -v $(pwd):/backup alpine tar czf /backup/prometheus-backup.tar.gz -C /data .

# Backup Grafana dashboards
curl -H "Authorization: Bearer $GRAFANA_API_KEY" \
  http://localhost:3000/api/search | jq -r '.[].uri' | \
  xargs -I {} curl -H "Authorization: Bearer $GRAFANA_API_KEY" \
  http://localhost:3000/api/dashboards/{} > dashboards-backup.json
```

### Monitor Backup Automation
```bash
# Add to cron job
0 2 * * * /path/to/backup-monitoring.sh
```

## Getting Help

### Log Analysis Commands
```bash
# Aggregate all monitoring logs
docker-compose -f docker-compose.monitoring.yml logs --tail=100 > monitoring-debug.log

# Search for specific errors
grep -i "error\|exception\|failed" monitoring-debug.log

# Check container resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Useful Debug Endpoints
- Prometheus targets: `http://localhost:9091/targets`
- Prometheus config: `http://localhost:9091/config`
- Loki health: `http://localhost:3100/ready`
- Spring Boot health: `http://localhost:9090/actuator/health`
- Grafana API: `http://localhost:3000/api/health`

### Community Resources
- [Prometheus Troubleshooting Guide](https://prometheus.io/docs/prometheus/latest/troubleshooting/)
- [Loki Troubleshooting](https://grafana.com/docs/loki/latest/operations/troubleshooting/)
- [Spring Boot Actuator Guide](https://spring.io/guides/gs/actuator-service/)