# Grafana Dashboards Configuration

## Overview

This document provides Grafana dashboard configurations for monitoring the Prompt Driver application using Prometheus metrics and Loki logs.

## Data Source Configuration

### Prometheus Data Source
1. Go to **Configuration** > **Data Sources** > **Add data source**
2. Select **Prometheus**
3. Configure:
   - **URL**: `http://prometheus:9091` (if Grafana runs in Docker) or `http://localhost:9091`
   - **Access**: Server (default)
   - **Scrape interval**: 15s
4. Test connection and save

### Loki Data Source
1. Add another data source
2. Select **Loki**
3. Configure:
   - **URL**: `http://loki:3100` (if Grafana runs in Docker) or `http://localhost:3100`
   - **Access**: Server (default)
4. Test connection and save

## Dashboard Templates

### 1. Application Overview Dashboard

```json
{
  "dashboard": {
    "id": null,
    "title": "Prompt Driver - Application Overview",
    "tags": ["spring-boot", "prompt-driver"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_server_requests_total{job=\"spring-boot-app\"}[5m]))",
            "legendFormat": "Requests/sec"
          }
        ],
        "gridPos": {"h": 4, "w": 6, "x": 0, "y": 0},
        "fieldConfig": {
          "defaults": {
            "unit": "reqps"
          }
        }
      },
      {
        "id": 2,
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_server_requests_total{job=\"spring-boot-app\",status=~\"5..\"}[5m]))",
            "legendFormat": "Errors/sec"
          }
        ],
        "gridPos": {"h": 4, "w": 6, "x": 6, "y": 0},
        "fieldConfig": {
          "defaults": {
            "unit": "reqps",
            "color": {"mode": "palette-classic"}
          }
        }
      }
    ],
    "time": {"from": "now-1h", "to": "now"},
    "refresh": "10s"
  }
}
```

### 2. HTTP Metrics Dashboard Panels

#### Request Volume Panel
```json
{
  "title": "HTTP Request Volume",
  "type": "graph",
  "targets": [
    {
      "expr": "sum(rate(http_server_requests_total{job=\"spring-boot-app\"}[5m])) by (uri)",
      "legendFormat": "{{uri}}"
    }
  ],
  "yAxes": [
    {
      "label": "Requests/sec",
      "unit": "reqps"
    }
  ]
}
```

#### Response Time Panel
```json
{
  "title": "HTTP Response Time",
  "type": "graph",
  "targets": [
    {
      "expr": "histogram_quantile(0.50, sum(rate(http_server_requests_seconds_bucket{job=\"spring-boot-app\"}[5m])) by (le))",
      "legendFormat": "50th percentile"
    },
    {
      "expr": "histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket{job=\"spring-boot-app\"}[5m])) by (le))",
      "legendFormat": "95th percentile"
    },
    {
      "expr": "histogram_quantile(0.99, sum(rate(http_server_requests_seconds_bucket{job=\"spring-boot-app\"}[5m])) by (le))",
      "legendFormat": "99th percentile"
    }
  ],
  "yAxes": [
    {
      "label": "Response Time",
      "unit": "s"
    }
  ]
}
```

### 3. JVM Metrics Dashboard

```json
{
  "title": "JVM Memory Usage",
  "type": "graph",
  "targets": [
    {
      "expr": "jvm_memory_used_bytes{job=\"spring-boot-app\",area=\"heap\"}",
      "legendFormat": "Heap Used"
    },
    {
      "expr": "jvm_memory_max_bytes{job=\"spring-boot-app\",area=\"heap\"}",
      "legendFormat": "Heap Max"
    },
    {
      "expr": "jvm_memory_used_bytes{job=\"spring-boot-app\",area=\"nonheap\"}",
      "legendFormat": "Non-Heap Used"
    }
  ],
  "yAxes": [
    {
      "label": "Memory",
      "unit": "bytes"
    }
  ]
}
```

#### Garbage Collection Panel
```json
{
  "title": "Garbage Collection",
  "type": "graph",
  "targets": [
    {
      "expr": "rate(jvm_gc_pause_seconds_count{job=\"spring-boot-app\"}[5m])",
      "legendFormat": "GC Rate - {{gc}}"
    }
  ],
  "yAxes": [
    {
      "label": "Collections/sec",
      "unit": "ops"
    }
  ]
}
```

### 4. Database Metrics Dashboard

```json
{
  "title": "Database Connection Pool",
  "type": "graph",
  "targets": [
    {
      "expr": "hikaricp_connections_active{job=\"spring-boot-app\"}",
      "legendFormat": "Active Connections"
    },
    {
      "expr": "hikaricp_connections_idle{job=\"spring-boot-app\"}",
      "legendFormat": "Idle Connections"
    },
    {
      "expr": "hikaricp_connections_pending{job=\"spring-boot-app\"}",
      "legendFormat": "Pending Connections"
    },
    {
      "expr": "hikaricp_connections_max{job=\"spring-boot-app\"}",
      "legendFormat": "Max Connections"
    }
  ],
  "yAxes": [
    {
      "label": "Connections",
      "unit": "short"
    }
  ]
}
```

### 5. Business Metrics Dashboard

```json
{
  "title": "User Registrations",
  "type": "stat",
  "targets": [
    {
      "expr": "increase(http_server_requests_total{job=\"spring-boot-app\",uri=\"/api/v1/auth/register\",status=\"201\"}[1h])",
      "legendFormat": "Registrations/hour"
    }
  ]
}
```

```json
{
  "title": "Prompt Creation Rate",
  "type": "graph",
  "targets": [
    {
      "expr": "rate(http_server_requests_total{job=\"spring-boot-app\",uri=\"/api/v1/prompts\",method=\"POST\",status=\"201\"}[5m])",
      "legendFormat": "Prompts Created/sec"
    }
  ]
}
```

### 6. Log Analysis Dashboard

#### Log Volume Panel
```json
{
  "title": "Log Volume by Level",
  "type": "graph",
  "targets": [
    {
      "expr": "sum(rate({job=\"spring-boot\",app=\"prompt-driver\"}[5m])) by (level)",
      "legendFormat": "{{level}}"
    }
  ],
  "datasource": "Loki"
}
```

#### Recent Errors Panel
```json
{
  "title": "Recent Error Logs",
  "type": "logs",
  "targets": [
    {
      "expr": "{job=\"spring-boot\",app=\"prompt-driver\",level=\"ERROR\"}",
      "maxLines": 100
    }
  ],
  "datasource": "Loki",
  "options": {
    "showTime": true,
    "showLabels": true
  }
}
```

## Complete Dashboard JSON

### Application Performance Dashboard

Save this as `grafana-dashboards/application-performance.json`:

```json
{
  "dashboard": {
    "id": null,
    "title": "Prompt Driver - Application Performance",
    "description": "Application performance metrics and logs",
    "tags": ["spring-boot", "prompt-driver", "performance"],
    "timezone": "browser",
    "editable": true,
    "graphTooltip": 1,
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "stat",
        "targets": [
          {
            "datasource": "Prometheus",
            "expr": "sum(rate(http_server_requests_total{job=\"spring-boot-app\"}[5m]))",
            "legendFormat": "req/sec"
          }
        ],
        "gridPos": {"h": 4, "w": 4, "x": 0, "y": 0},
        "fieldConfig": {
          "defaults": {
            "unit": "reqps",
            "displayName": "Requests/sec"
          }
        }
      },
      {
        "id": 2,
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "datasource": "Prometheus",
            "expr": "sum(rate(http_server_requests_total{job=\"spring-boot-app\",status=~\"5..\"}[5m]))",
            "legendFormat": "errors/sec"
          }
        ],
        "gridPos": {"h": 4, "w": 4, "x": 4, "y": 0},
        "fieldConfig": {
          "defaults": {
            "unit": "reqps",
            "displayName": "Errors/sec",
            "color": {"mode": "palette-classic", "fixedColor": "red"}
          }
        }
      },
      {
        "id": 3,
        "title": "Response Time (95th)",
        "type": "stat",
        "targets": [
          {
            "datasource": "Prometheus",
            "expr": "histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket{job=\"spring-boot-app\"}[5m])) by (le))",
            "legendFormat": "95th percentile"
          }
        ],
        "gridPos": {"h": 4, "w": 4, "x": 8, "y": 0},
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "displayName": "Response Time"
          }
        }
      },
      {
        "id": 4,
        "title": "JVM Memory Usage",
        "type": "stat",
        "targets": [
          {
            "datasource": "Prometheus",
            "expr": "(jvm_memory_used_bytes{job=\"spring-boot-app\",area=\"heap\"} / jvm_memory_max_bytes{job=\"spring-boot-app\",area=\"heap\"}) * 100",
            "legendFormat": "Heap Usage %"
          }
        ],
        "gridPos": {"h": 4, "w": 4, "x": 12, "y": 0},
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "displayName": "Memory Usage"
          }
        }
      },
      {
        "id": 5,
        "title": "HTTP Request Volume by Endpoint",
        "type": "graph",
        "targets": [
          {
            "datasource": "Prometheus",
            "expr": "sum(rate(http_server_requests_total{job=\"spring-boot-app\"}[5m])) by (uri)",
            "legendFormat": "{{uri}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 4},
        "yAxes": [
          {
            "label": "Requests/sec",
            "unit": "reqps"
          }
        ]
      },
      {
        "id": 6,
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "datasource": "Prometheus",
            "expr": "hikaricp_connections_active{job=\"spring-boot-app\"}",
            "legendFormat": "Active"
          },
          {
            "datasource": "Prometheus",
            "expr": "hikaricp_connections_idle{job=\"spring-boot-app\"}",
            "legendFormat": "Idle"
          },
          {
            "datasource": "Prometheus",
            "expr": "hikaricp_connections_max{job=\"spring-boot-app\"}",
            "legendFormat": "Max"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 4},
        "yAxes": [
          {
            "label": "Connections",
            "unit": "short"
          }
        ]
      }
    ],
    "time": {"from": "now-1h", "to": "now"},
    "refresh": "10s",
    "schemaVersion": 16,
    "version": 1
  }
}
```

## Custom Queries

### Prometheus Queries for Common Metrics

```promql
# Request rate per endpoint
sum(rate(http_server_requests_total[5m])) by (uri)

# Error rate by endpoint
sum(rate(http_server_requests_total{status=~"[4-5].."}[5m])) by (uri, status)

# Response time percentiles
histogram_quantile(0.50, sum(rate(http_server_requests_seconds_bucket[5m])) by (le))
histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket[5m])) by (le))
histogram_quantile(0.99, sum(rate(http_server_requests_seconds_bucket[5m])) by (le))

# Memory usage percentage
(jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"}) * 100

# GC frequency
rate(jvm_gc_pause_seconds_count[5m])

# Database connection pool utilization
(hikaricp_connections_active / hikaricp_connections_max) * 100

# Thread count
jvm_threads_live

# System CPU usage
system_cpu_usage * 100

# Process CPU usage
process_cpu_usage * 100
```

### Loki Queries for Log Analysis

```logql
# All application logs
{job="spring-boot", app="prompt-driver"}

# Error logs only
{job="spring-boot", app="prompt-driver", level="ERROR"}

# Authentication related logs
{job="spring-boot", app="prompt-driver"} |= "authentication" or "login" or "register"

# SQL queries
{job="spring-boot", app="prompt-driver", logger=~".*SQL.*"}

# Controller logs
{job="spring-boot", app="prompt-driver", logger=~".*controller.*"} | json

# Exception logs
{job="spring-boot", app="prompt-driver"} |= "Exception"

# Slow queries (if duration is logged)
{job="spring-boot", app="prompt-driver"} | json | duration > 1000

# Log rate by level
sum(rate({job="spring-boot", app="prompt-driver"}[5m])) by (level)
```

## Alert Configuration

### Grafana Alerts

Configure these alerts in Grafana:

1. **High Error Rate Alert**
   - Query: `sum(rate(http_server_requests_total{status=~"5.."}[5m])) > 0.1`
   - Condition: Above 0.1 errors/second for 2 minutes
   - Notification: Slack/Email

2. **High Response Time Alert**
   - Query: `histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket[5m])) by (le)) > 0.5`
   - Condition: 95th percentile > 500ms for 3 minutes

3. **Memory Usage Alert**
   - Query: `(jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"}) * 100 > 80`
   - Condition: Memory usage > 80% for 5 minutes

4. **Database Connection Alert**
   - Query: `(hikaricp_connections_active / hikaricp_connections_max) * 100 > 80`
   - Condition: Connection pool > 80% utilized for 3 minutes

## Dashboard Import/Export

### Importing Dashboards

1. Go to **Dashboards** > **Import**
2. Upload JSON file or paste JSON content
3. Configure data sources if needed
4. Save dashboard

### Exporting Dashboards

1. Open dashboard
2. Go to **Dashboard settings** (gear icon)
3. Click **JSON Model**
4. Copy JSON content
5. Save to file for version control

## Best Practices

### Dashboard Design
- Use consistent time ranges across panels
- Group related metrics together
- Use appropriate visualization types (stat, graph, table)
- Add descriptions and units to panels
- Use template variables for dynamic filtering

### Performance
- Avoid too many high-cardinality queries
- Use appropriate time ranges for different metrics
- Cache dashboard results when possible
- Optimize Prometheus queries

### Organization
- Create folders for different service categories
- Use consistent naming conventions
- Tag dashboards appropriately
- Document custom queries and their purposes

## Troubleshooting

### Common Issues

1. **No data showing**: Check data source configuration and connectivity
2. **High cardinality warnings**: Reduce label dimensions in queries
3. **Slow dashboard loading**: Optimize queries and reduce time ranges
4. **Missing metrics**: Verify Spring Boot Actuator configuration

### Query Debugging

Use Prometheus UI (`http://localhost:9091`) to test queries before adding to Grafana panels.

### Log Query Testing

Use Loki UI or Grafana Explore to test LogQL queries before creating panels.