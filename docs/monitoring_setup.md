# Monitoring Setup Guide

## Overview

This document describes the monitoring stack setup for the Prompt Driver application using Prometheus, Loki, and Grafana.

## Architecture

```
Spring Boot Backend (port 9090)
├── Micrometer Metrics → Prometheus (port 9091)
├── Structured Logs → Loki (port 3100) via Promtail
└── Grafana Dashboard (port 3000) ← combines metrics + logs
```

## Current Backend Analysis

**✅ Already Configured:**
- Spring Boot 3.2 with Actuator enabled
- Logback logging with DEBUG level
- Metrics endpoint exposed at `/actuator/metrics`
- Structured logging with custom pattern

## Prerequisites

- Docker and Docker Compose installed
- Spring Boot application running on port 9090
- Grafana instance running (as mentioned)

## Implementation Steps

### 1. Update Spring Boot Configuration

#### Add Prometheus Dependencies

Add to `build.gradle.kts`:

```kotlin
dependencies {
    // Existing dependencies...

    // Prometheus metrics
    implementation("io.micrometer:micrometer-registry-prometheus")
    implementation("org.springframework.boot:spring-boot-starter-actuator") // Already exists
}
```

#### Update application.yml

Enhance the existing configuration:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus  # Add prometheus
  endpoint:
    prometheus:
      enabled: true
    health:
      show-details: when-authorized
  metrics:
    export:
      prometheus:
        enabled: true
    distribution:
      percentiles-histogram:
        "[http.server.requests]": true
      sla:
        "[http.server.requests]": "50ms,100ms,200ms,500ms,1s"
    tags:
      application: prompt-driver
      environment: development

# Enhanced logging for better observability
logging:
  level:
    com.promptdriver: INFO  # Change from DEBUG for production
    org.springframework.web: INFO
    org.springframework.security: WARN
    org.hibernate.SQL: WARN
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level [%X{traceId}] %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level [%X{traceId}] %logger{36} - %msg%n"
  file:
    name: logs/prompt-driver.log
  logback:
    rollingpolicy:
      max-file-size: 10MB
      max-history: 10
```

### 2. Create Custom Metrics Configuration

Create `src/main/kotlin/com/promptdriver/config/MetricsConfig.kt`:

```kotlin
package com.promptdriver.config

import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.config.MeterRegistryConfig
import org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableScheduling

@Configuration
@EnableScheduling
class MetricsConfig {

    @Bean
    fun customMetrics(): MeterRegistryCustomizer<MeterRegistry> {
        return MeterRegistryCustomizer { registry ->
            registry.config()
                .commonTags(
                    "application", "prompt-driver",
                    "environment", "development"
                )
        }
    }
}
```

### 3. Docker Compose Monitoring Stack

Create `docker-compose.monitoring.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9091:9090"  # Changed to avoid conflict with backend
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/prometheus/rules.yml:/etc/prometheus/rules.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
    networks:
      - monitoring
    restart: unless-stopped

  loki:
    image: grafana/loki:latest
    container_name: loki
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki/loki.yml:/etc/loki/loki.yml
      - loki_data:/tmp/loki
    command: -config.file=/etc/loki/loki.yml
    networks:
      - monitoring
    restart: unless-stopped

  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    volumes:
      - ./logs:/var/log/app:ro
      - ./monitoring/promtail/promtail.yml:/etc/promtail/promtail.yml
      - /var/run/docker.sock:/var/run/docker.sock:ro
    command: -config.file=/etc/promtail/promtail.yml
    depends_on:
      - loki
    networks:
      - monitoring
    restart: unless-stopped

volumes:
  prometheus_data:
  loki_data:

networks:
  monitoring:
    driver: bridge
```

## Configuration Files

### Prometheus Configuration

Create `monitoring/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules.yml"

scrape_configs:
  - job_name: 'spring-boot-app'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:9090']  # Spring Boot app
    scrape_interval: 5s
    scrape_timeout: 3s
    metrics_path: /actuator/prometheus

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

### Loki Configuration

Create `monitoring/loki/loki.yml`:

```yaml
server:
  http_listen_port: 3100
  grpc_listen_port: 9096

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 1h
  max_chunk_age: 1h
  chunk_target_size: 1048576
  chunk_retain_period: 30s
  max_transfer_retries: 0

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /tmp/loki/boltdb-shipper-active
    cache_location: /tmp/loki/boltdb-shipper-cache
    shared_store: filesystem
  filesystem:
    directory: /tmp/loki/chunks

compactor:
  working_directory: /tmp/loki/boltdb-shipper-compactor
  shared_store: filesystem

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
  ingestion_rate_mb: 16
  ingestion_burst_size_mb: 32

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: false
  retention_period: 0s

ruler:
  storage:
    type: local
    local:
      directory: /tmp/loki/rules
  rule_path: /tmp/loki/rules-temp
  alertmanager_url: http://localhost:9093
  ring:
    kvstore:
      store: inmemory
  enable_api: true
```

### Promtail Configuration

Create `monitoring/promtail/promtail.yml`:

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: spring-boot-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: spring-boot
          app: prompt-driver
          __path__: /var/log/app/*.log
    pipeline_stages:
      - regex:
          expression: '^(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}) \[(?P<thread>[^\]]+)\] (?P<level>\w+)\s+(\[(?P<trace_id>[^\]]*)\])?\s*(?P<logger>[^\s]+) - (?P<message>.*)$'
      - timestamp:
          source: timestamp
          format: '2006-01-02 15:04:05.000'
      - labels:
          level:
          thread:
          logger:
          trace_id:
```

### Alert Rules

Create `monitoring/prometheus/rules.yml`:

```yaml
groups:
  - name: spring-boot-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_server_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_server_requests_seconds_bucket) > 0.5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "95th percentile response time is {{ $value }}s"

      - alert: ApplicationDown
        expr: up{job="spring-boot-app"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Application is down"
          description: "Spring Boot application is not responding"

      - alert: HighMemoryUsage
        expr: (jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"}) * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High JVM memory usage"
          description: "JVM heap memory usage is {{ $value }}%"

      - alert: DatabaseConnectionPoolLow
        expr: hikaricp_connections_active / hikaricp_connections_max > 0.8
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool almost exhausted"
          description: "{{ $value | humanizePercentage }} of database connections are in use"
```

## Directory Structure

After setup, your project should have this structure:

```
prompt-driver/
├── monitoring/
│   ├── prometheus/
│   │   ├── prometheus.yml
│   │   └── rules.yml
│   ├── loki/
│   │   └── loki.yml
│   └── promtail/
│       └── promtail.yml
├── logs/
│   └── prompt-driver.log (generated)
└── docker-compose.monitoring.yml
```

## Quick Start Commands

```bash
# 1. Create monitoring directories
mkdir -p monitoring/{prometheus,loki,promtail}
mkdir -p logs

# 2. Create configuration files (copy from above sections)

# 3. Update Spring Boot dependencies
./gradlew build

# 4. Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# 5. Start Spring Boot application
./gradlew bootRun

# 6. Verify endpoints
curl http://localhost:9090/actuator/prometheus  # Metrics
curl http://localhost:9091/targets             # Prometheus targets
curl http://localhost:3100/ready               # Loki readiness
```

## Verification

After setup, verify the following:

1. **Prometheus targets**: Visit `http://localhost:9091/targets` - should show spring-boot-app as UP
2. **Prometheus metrics**: Visit `http://localhost:9091/graph` and query `up`
3. **Loki logs**: Visit `http://localhost:3100/metrics` to verify Loki is running
4. **Spring Boot metrics**: `curl http://localhost:9090/actuator/prometheus`

## Next Steps

1. Configure Grafana data sources:
   - Add Prometheus: `http://localhost:9091`
   - Add Loki: `http://localhost:3100`

2. Import or create dashboards for:
   - Application performance metrics
   - JVM monitoring
   - Database metrics
   - Business metrics
   - Log analysis

3. Set up alerting in Grafana or Prometheus Alertmanager

## Key Metrics to Monitor

### Application Metrics
- `http_server_requests_total` - HTTP request count
- `http_server_requests_seconds` - HTTP request duration
- `jvm_memory_used_bytes` - JVM memory usage
- `jvm_gc_pause_seconds` - Garbage collection metrics

### Database Metrics
- `hikaricp_connections_active` - Active DB connections
- `hikaricp_connections_pending` - Pending DB connections

### Custom Business Metrics
- Prompt creation rate
- User registration rate
- Authentication success/failure rate
- Rating submission rate

## Troubleshooting

### Common Issues

1. **Prometheus can't scrape Spring Boot**:
   - Check if Spring Boot is accessible via `host.docker.internal:9090`
   - Verify `/actuator/prometheus` endpoint is accessible

2. **Promtail not sending logs**:
   - Check if logs directory is mounted correctly
   - Verify log file permissions
   - Check Promtail logs: `docker logs promtail`

3. **Loki not receiving logs**:
   - Check Loki configuration and storage permissions
   - Verify Loki is accessible from Promtail container

### Log Analysis

Use these Loki queries in Grafana:

```
# All logs from the application
{job="spring-boot", app="prompt-driver"}

# Error level logs only
{job="spring-boot", app="prompt-driver"} |= "ERROR"

# Authentication related logs
{job="spring-boot", app="prompt-driver"} |= "authentication"

# Database query logs
{job="spring-boot", app="prompt-driver", logger=~".*SQL.*"}
```

### Prometheus Queries

Common queries for dashboards:

```promql
# Request rate
rate(http_server_requests_total[5m])

# Error rate
rate(http_server_requests_total{status=~"5.."}[5m])

# Response time percentiles
histogram_quantile(0.95, http_server_requests_seconds_bucket)

# Memory usage
jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} * 100

# Active database connections
hikaricp_connections_active
```