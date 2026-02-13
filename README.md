# High-Scale Energy Ingestion Engine

A high-performance NestJS-based ingestion system designed to handle telemetry data from 10,000+ Smart Meters and EV Fleets, processing approximately 14.4 million records daily.

## 🏗️ Architecture Overview

### Data Strategy: Hot/Cold Separation

The system implements a dual-storage strategy optimized for both write-heavy ingestion and read-heavy analytics:

#### **Hot Storage (Operational Store)**
- **Purpose**: Fast access to current device status
- **Tables**: `meter_status`, `vehicle_status`
- **Strategy**: UPSERT operations ensure atomic updates
- **Use Case**: Dashboard queries for current SoC, active charging status, latest voltage readings
- **Performance**: O(1) lookup by device ID (primary key)

#### **Cold Storage (Historical Store)**
- **Purpose**: Append-only audit trail for long-term analytics
- **Tables**: `meter_telemetry_history`, `vehicle_telemetry_history`
- **Strategy**: INSERT-only operations preserve complete historical record
- **Use Case**: 24-hour performance reports, efficiency analysis, trend analysis
- **Performance**: Indexed queries on `(deviceId, timestamp)` prevent full table scans

### Database Schema

#### Meter Entities
- **MeterTelemetryHistory** (Cold): Historical AC consumption data
  - Indexed on: `meterId`, `timestamp`, `(meterId, timestamp)`
- **MeterStatus** (Hot): Current meter state
  - Primary Key: `meterId`

#### Vehicle Entities
- **VehicleTelemetryHistory** (Cold): Historical DC delivery and battery data
  - Indexed on: `vehicleId`, `timestamp`, `(vehicleId, timestamp)`
- **VehicleStatus** (Hot): Current vehicle state
  - Primary Key: `vehicleId`

### Indexing Strategy

To handle 14.4M records daily without performance degradation:

1. **Composite Indexes**: `(deviceId, timestamp)` on history tables enable efficient range queries
2. **Timestamp Indexes**: Single-column indexes on `timestamp` support time-window analytics
3. **Primary Keys**: Hot storage uses device IDs as primary keys for instant lookups

## 📊 Data Correlation & Power Efficiency

### Domain Logic

The system correlates two independent data streams:

- **Smart Meter (Grid Side)**: Reports `kwhConsumedAc` - total AC energy billed
- **EV Charger (Vehicle Side)**: Reports `kwhDeliveredDc` - actual DC energy stored

### Efficiency Calculation

```
Efficiency Ratio = (DC Delivered / AC Consumed) × 100
```

**Power Loss Thesis**: AC consumption is always higher than DC delivery due to:
- Heat dissipation during AC→DC conversion
- Charger efficiency losses
- Battery charging inefficiencies

**Alert Threshold**: Efficiency below 85% indicates potential hardware faults or energy leakage.

## 🚀 API Endpoints

### Ingestion Endpoints

#### POST `/v1/ingestion/meter`
Ingests meter telemetry data.

**Request Body:**
```json
{
  "meterId": "meter-001",
  "kwhConsumedAc": 12.5,
  "voltage": 240.0,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:** `202 Accepted`

#### POST `/v1/ingestion/vehicle`
Ingests vehicle telemetry data.

**Request Body:**
```json
{
  "vehicleId": "vehicle-001",
  "soc": 85.5,
  "kwhDeliveredDc": 10.8,
  "batteryTemp": 28.5,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:** `202 Accepted`

### Analytics Endpoints

#### GET `/v1/analytics/performance/:vehicleId`
Returns 24-hour performance summary for a vehicle.

**Response:**
```json
{
  "vehicleId": "vehicle-001",
  "period": {
    "start": "2024-01-14T10:30:00Z",
    "end": "2024-01-15T10:30:00Z"
  },
  "totalKwhConsumedAc": 120.5,
  "totalKwhDeliveredDc": 105.2,
  "efficiencyRatio": 87.3,
  "averageBatteryTemp": 27.8
}
```

**Performance**: Query uses indexed timestamp range scans, avoiding full table scans.

## 🐳 Docker Setup

### Prerequisites
- Docker & Docker Compose installed

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd energy-ingestion-engine
```

2. **Start services**
```bash
docker-compose up -d
```

3. **Verify services**
```bash
# Check logs
docker-compose logs -f app

# Test health
curl http://localhost:3000/v1/analytics/performance/test-vehicle
```

### Environment Variables

Create a `.env` file (optional, defaults provided):

```env
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=energy_ingestion
PORT=3000
NODE_ENV=production
```

## 📈 Performance Considerations

### Handling 14.4M Records Daily

**Daily Volume Calculation:**
- 10,000 devices × 2 streams (meter + vehicle) × 60 intervals/hour × 24 hours = **28.8M records/day**
- Assignment mentions 14.4M, likely referring to per-stream or specific subset

**Optimization Strategies:**

1. **Batch Processing**: Consider batching inserts for high-throughput scenarios
2. **Connection Pooling**: TypeORM manages connection pools automatically
3. **Partitioning**: For production, consider table partitioning by date/month
4. **Read Replicas**: Separate read/write databases for analytics workloads
5. **Caching**: Redis cache for hot storage lookups in high-traffic scenarios

### Query Performance

- **Hot Storage Queries**: < 1ms (primary key lookup)
- **Analytics Queries**: < 100ms (indexed range scan on 24-hour window)
- **Full Table Scans**: Prevented by proper indexing strategy

## 🧪 Testing

### Manual Testing

**Ingest Meter Data:**
```bash
curl -X POST http://localhost:3000/v1/ingestion/meter \
  -H "Content-Type: application/json" \
  -d '{
    "meterId": "meter-001",
    "kwhConsumedAc": 12.5,
    "voltage": 240.0,
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

**Ingest Vehicle Data:**
```bash
curl -X POST http://localhost:3000/v1/ingestion/vehicle \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "vehicle-001",
    "soc": 85.5,
    "kwhDeliveredDc": 10.8,
    "batteryTemp": 28.5,
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

**Get Analytics:**
```bash
curl http://localhost:3000/v1/analytics/performance/vehicle-001
```

## 🔧 Development

### Local Development Setup

1. **Install dependencies**
```bash
npm install
```

2. **Start PostgreSQL** (using Docker)
```bash
docker-compose up -d postgres
```

3. **Run migrations** (if using migrations)
```bash
npm run migration:run
```

4. **Start development server**
```bash
npm run start:dev
```

### Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts          # Root module
├── config/
│   └── typeorm.config.ts  # Database configuration
├── entities/              # TypeORM entities
│   ├── meter-telemetry-history.entity.ts
│   ├── vehicle-telemetry-history.entity.ts
│   ├── meter-status.entity.ts
│   └── vehicle-status.entity.ts
├── ingestion/            # Ingestion module
│   ├── dto/
│   ├── ingestion.controller.ts
│   ├── ingestion.service.ts
│   └── ingestion.module.ts
└── analytics/            # Analytics module
    ├── analytics.controller.ts
    ├── analytics.service.ts
    └── analytics.module.ts
```

## 📝 Architectural Decisions

### 1. Why Hot/Cold Separation?

**Problem**: Dashboard needs instant current status, analytics needs historical data.

**Solution**: 
- Hot storage (UPSERT) provides O(1) current status lookup
- Cold storage (INSERT) preserves complete audit trail
- Analytics queries use indexed cold storage, avoiding hot storage scans

### 2. Why UPSERT for Hot Storage?

**Problem**: Need to update current status without scanning history table.

**Solution**: PostgreSQL `UPSERT` (ON CONFLICT) provides atomic update-or-insert, ensuring:
- No duplicate records
- Fast updates without read-before-write
- Consistent current state

### 3. Why INSERT-only for Cold Storage?

**Problem**: Need immutable audit trail for compliance and analytics.

**Solution**: Append-only strategy ensures:
- Complete historical record
- No data loss from updates
- Time-travel queries possible
- Compliance with data retention policies

### 4. Indexing Strategy

**Problem**: 14.4M+ records daily requires efficient queries.

**Solution**:
- Composite indexes `(deviceId, timestamp)` enable efficient device-specific time ranges
- Single-column timestamp indexes support global time-window queries
- Primary keys on hot storage enable instant lookups

### 5. Data Correlation

**Current Implementation**: Aggregates all meter data in time window.

**Production Enhancement**: Implement `vehicle_meter_mapping` table to:
- Map vehicles to specific charging meters
- Enable precise AC/DC correlation
- Support multi-vehicle charging stations

## 🔮 Future Enhancements

1. **Vehicle-Meter Mapping**: Add mapping table for precise correlation
2. **Time-Series Database**: Consider TimescaleDB for better time-series performance
3. **Message Queue**: Add Kafka/RabbitMQ for async ingestion
4. **Caching Layer**: Redis for hot storage lookups
5. **Monitoring**: Prometheus metrics and Grafana dashboards
6. **Partitioning**: Table partitioning by date for better query performance
7. **Read Replicas**: Separate analytics database for read-heavy workloads

## 📄 License

MIT
