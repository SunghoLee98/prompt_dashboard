# Grafana Setup Instructions

## Complete Backend Monitoring Setup

The monitoring infrastructure is now organized in the `monitoring/` folder with a unified docker-compose setup! All monitoring services (Grafana, Prometheus, Loki, Promtail) are now managed together.

## Quick Start 🚀

### Option 1: Run Complete Monitoring Stack
```bash
cd monitoring/
docker-compose -f docker-compose.grafana.yml up -d
```

### Option 2: Run Specific Monitoring Components
```bash
# Run monitoring stack from docker-compose.monitoring.yml (Prometheus, Loki, Promtail only)
docker-compose -f docker-compose.monitoring.yml up -d

# Run Grafana separately if needed
docker-compose -f docker-compose.grafana.yml up grafana -d
```

## Current Status ✅

✅ **All monitoring services** are now in `monitoring/` folder
✅ **Grafana** is pre-configured with datasources via provisioning
✅ **Dashboards** are automatically imported on startup
✅ **Prometheus** metrics collection is ready
✅ **Loki** log collection is configured
✅ **Network connectivity** between all services is established

## Automatic Configuration Features

### Auto-Provisioned Data Sources
- **Prometheus**: Automatically configured at `http://prometheus:9090`
- **Loki**: Automatically configured at `http://loki:3100`
- **Trace Integration**: Links between logs and metrics

### Auto-Imported Dashboards
- **Application Performance Dashboard**: Pre-imported from `monitoring/grafana/dashboards/`
- **Real-time Updates**: Dashboard updates automatically when modified

### No Manual Configuration Required! 🎉
The new setup eliminates manual data source configuration - everything is ready when containers start.

## Dashboard Features 📊

Your new dashboard includes:

### Metrics Panels
- **Application Status**: UP/DOWN indicator
- **Request Rate**: Requests per second
- **Error Rate**: 4xx/5xx errors per second
- **Response Time**: 95th percentile latency
- **JVM Memory Usage**: Heap memory percentage
- **Database Connections**: Active connection count
- **HTTP Request Volume**: Requests by endpoint
- **Response Time Distribution**: P50, P95, P99 percentiles
- **Access Logs by Status Code**: HTTP status code distribution
- **JVM Memory Over Time**: Memory usage trends

### Log Search Capabilities
- **Recent Error Logs**: Latest ERROR level logs
- **Searchable Console Logs**: Full log search with filters
- **Log Search Instructions**: Built-in search query examples

## Log Search Examples 🔍

Once Loki is working, you can search logs using these queries:

### By Log Level
```
{job="spring-boot", app="prompt-driver", level="ERROR"}     # Error logs
{job="spring-boot", app="prompt-driver", level="INFO"}      # Info logs
{job="spring-boot", app="prompt-driver", level="WARN"}      # Warning logs
```

### By Keyword
```
{job="spring-boot", app="prompt-driver"} |= "authentication"  # Auth logs
{job="spring-boot", app="prompt-driver"} |= "SQL"             # Database logs
{job="spring-boot", app="prompt-driver"} |= "Exception"       # Exception logs
```

### By Logger/Component
```
{job="spring-boot", app="prompt-driver", logger=~".*controller.*"}  # Controller logs
{job="spring-boot", app="prompt-driver", logger=~".*service.*"}     # Service logs
```

## Current Log Examples 📝

Your backend is already generating rich logs! Here are examples from the running application:

### INFO Logs
```
2025-09-15 23:05:03.231 [restartedMain] INFO  [] c.p.PromptDriverApplicationKt - Started PromptDriverApplicationKt in 3.956 seconds
2025-09-15 23:07:06.565 [http-nio-9090-exec-1] INFO  [] c.promptdriver.service.AuthService - User logged in successfully: test1757945225857@example.com
```

### ERROR Logs
```
2025-09-15 23:07:06.455 [http-nio-9090-exec-3] ERROR [] c.promptdriver.service.AuthService - Invalid credentials for email: nonexistent@example.com
2025-09-15 23:07:06.468 [http-nio-9090-exec-3] ERROR [] c.p.exception.GlobalExceptionHandler - Business exception: Invalid credentials
```

## Testing Your Setup 🧪

### Test Prometheus Metrics
```bash
curl http://localhost:9091/api/v1/query?query=up
curl http://localhost:9091/api/v1/query?query=http_server_requests_total
```

### Test Application Metrics
```bash
curl http://localhost:9090/actuator/prometheus | grep http_server_requests
curl http://localhost:9090/actuator/health
```

### Generate Test Traffic
Visit your frontend or make API calls to generate metrics and logs that will appear in the dashboard.

## Available Monitoring Endpoints 🔗

- **Grafana Dashboard**: http://localhost:3000 (admin/admin)
- **Prometheus UI**: http://localhost:9091
- **Loki API**: http://localhost:3100
- **Spring Boot Actuator**: http://localhost:9090/actuator
- **Prometheus Metrics**: http://localhost:9090/actuator/prometheus

## New Folder Structure 📁

```
monitoring/
├── docker-compose.grafana.yml      # Complete monitoring stack
├── docker-compose.monitoring.yml   # Prometheus, Loki, Promtail only
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── datasources.yml     # Auto-configured data sources
│   │   └── dashboards/
│   │       └── dashboards.yml      # Dashboard provisioning config
│   └── dashboards/
│       └── grafana-dashboard.json  # Auto-imported dashboard
├── prometheus/
│   ├── prometheus.yml
│   └── rules.yml
├── loki/
│   └── loki.yml
├── promtail/
│   └── promtail.yml
└── GRAFANA_SETUP.md               # This file
```

## Troubleshooting 🔧

### If Containers Don't Start
```bash
# Check container status
docker ps -a

# Check logs
docker logs grafana
docker logs prometheus
docker logs loki
docker logs promtail
```

### If Metrics Don't Appear
1. Check Prometheus targets: http://localhost:9091/targets
2. Verify Spring Boot metrics: http://localhost:9090/actuator/prometheus
3. Restart monitoring stack: `docker-compose -f monitoring/docker-compose.grafana.yml restart`

### If Logs Don't Work
1. Check log file generation: `tail -f logs/prompt-driver.log`
2. Verify Promtail logs: `docker logs promtail`
3. Check Loki connectivity: `curl http://localhost:3100/ready`

### Network Issues
```bash
# Check if containers are on the same network
docker network ls
docker inspect monitoring_monitoring

# Recreate with fresh network
docker-compose -f monitoring/docker-compose.grafana.yml down
docker-compose -f monitoring/docker-compose.grafana.yml up -d
```

## Migration from Old Setup 🔄

If you have an existing Grafana container, stop it before starting the new setup:

```bash
# Stop old Grafana container
docker stop grafana
docker rm grafana

# Start new monitoring stack
cd monitoring/
docker-compose -f docker-compose.grafana.yml up -d
```

## Next Steps 🚀

1. **Start the monitoring stack**: `docker-compose -f monitoring/docker-compose.grafana.yml up -d`
2. **Access Grafana**: http://localhost:3000 (admin/admin)
3. **Verify data sources**: Auto-configured Prometheus and Loki should be connected
4. **View dashboard**: Application Performance dashboard should be imported automatically
5. **Set up alerts** for critical metrics
6. **Customize dashboard** for your specific needs

Your backend monitoring setup is now complete and fully automated! You have comprehensive visibility into:
- ✅ **Access Logs**: HTTP requests, response times, status codes
- ✅ **Console Logs**: Application logs with levels and search capability
- ✅ **Metrics**: Performance, memory, database, and business metrics
- ✅ **Search**: Filter logs by level, keyword, time range, and component
- ✅ **Auto-Configuration**: No manual setup required for data sources or dashboards