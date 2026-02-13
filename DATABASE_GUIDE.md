# 🗄️ Database Guide

## Database Information

**Database Type**: PostgreSQL 15  
**Container Name**: `energy-ingestion-db`  
**Database Name**: `energy_ingestion`  
**Username**: `postgres`  
**Password**: `postgres`  
**Port**: `5432` (mapped to host)

## Database Schema

### Hot Storage Tables (Current Status)

#### 1. `meter_status`
Stores current state of Smart Meters.

**Columns**:
- `meterId` (VARCHAR, Primary Key) - Meter identifier
- `kwhConsumedAc` (DECIMAL) - Current AC consumption
- `voltage` (DECIMAL) - Current voltage reading
- `timestamp` (TIMESTAMP) - Last update time
- `updatedAt` (TIMESTAMP) - Auto-updated timestamp

**Purpose**: Fast lookup of current meter status (O(1) by meterId)

#### 2. `vehicle_status`
Stores current state of Vehicles.

**Columns**:
- `vehicleId` (VARCHAR, Primary Key) - Vehicle identifier
- `soc` (DECIMAL) - Current State of Charge (0-100%)
- `kwhDeliveredDc` (DECIMAL) - Current DC delivery
- `batteryTemp` (DECIMAL) - Current battery temperature
- `timestamp` (TIMESTAMP) - Last update time
- `updatedAt` (TIMESTAMP) - Auto-updated timestamp

**Purpose**: Fast lookup of current vehicle status (O(1) by vehicleId)

### Cold Storage Tables (Historical Data)

#### 3. `meter_telemetry_history`
Stores complete historical record of meter telemetry.

**Columns**:
- `id` (UUID, Primary Key) - Auto-generated unique ID
- `meterId` (VARCHAR) - Meter identifier
- `kwhConsumedAc` (DECIMAL) - AC consumption at this point
- `voltage` (DECIMAL) - Voltage reading at this point
- `timestamp` (TIMESTAMP) - When reading was taken
- `ingestedAt` (TIMESTAMP) - When record was ingested

**Indexes**:
- `meterId` - For device-specific queries
- `timestamp` - For time-window queries
- `(meterId, timestamp)` - Composite index for efficient range queries

**Purpose**: Append-only audit trail for analytics

#### 4. `vehicle_telemetry_history`
Stores complete historical record of vehicle telemetry.

**Columns**:
- `id` (UUID, Primary Key) - Auto-generated unique ID
- `vehicleId` (VARCHAR) - Vehicle identifier
- `soc` (DECIMAL) - State of Charge at this point
- `kwhDeliveredDc` (DECIMAL) - DC delivery at this point
- `batteryTemp` (DECIMAL) - Battery temperature at this point
- `timestamp` (TIMESTAMP) - When reading was taken
- `ingestedAt` (TIMESTAMP) - When record was ingested

**Indexes**:
- `vehicleId` - For device-specific queries
- `timestamp` - For time-window queries
- `(vehicleId, timestamp)` - Composite index for efficient range queries

**Purpose**: Append-only audit trail for analytics

## How to View Data

### Option 1: Use the View Script

```bash
bash view-database.sh
```

This script shows:
- Table structure
- Current status (hot storage)
- Historical data (cold storage)
- Record counts
- Quick access commands

### Option 2: Connect Directly to Database

```bash
sudo docker exec -it energy-ingestion-db psql -U postgres -d energy_ingestion
```

Once connected, you can run SQL queries:

```sql
-- List all tables
\dt

-- View meter status
SELECT * FROM meter_status;

-- View vehicle status
SELECT * FROM vehicle_status;

-- View meter history (last 20 records)
SELECT * FROM meter_telemetry_history 
ORDER BY timestamp DESC 
LIMIT 20;

-- View vehicle history (last 20 records)
SELECT * FROM vehicle_telemetry_history 
ORDER BY timestamp DESC 
LIMIT 20;

-- Count records
SELECT 
    'meter_status' as table_name, COUNT(*) as count FROM meter_status
UNION ALL
SELECT 'vehicle_status', COUNT(*) FROM vehicle_status
UNION ALL
SELECT 'meter_telemetry_history', COUNT(*) FROM meter_telemetry_history
UNION ALL
SELECT 'vehicle_telemetry_history', COUNT(*) FROM vehicle_telemetry_history;

-- Exit
\q
```

### Option 3: Quick SQL Commands

```bash
# View all tables
sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c "\dt"

# View meter status
sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c "SELECT * FROM meter_status;"

# View vehicle status
sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c "SELECT * FROM vehicle_status;"

# View meter history
sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c "SELECT * FROM meter_telemetry_history ORDER BY timestamp DESC LIMIT 10;"

# View vehicle history
sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c "SELECT * FROM vehicle_telemetry_history ORDER BY timestamp DESC LIMIT 10;"

# Count records in each table
sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c "
SELECT 'meter_status' as table_name, COUNT(*) as count FROM meter_status
UNION ALL SELECT 'vehicle_status', COUNT(*) FROM vehicle_status
UNION ALL SELECT 'meter_telemetry_history', COUNT(*) FROM meter_telemetry_history
UNION ALL SELECT 'vehicle_telemetry_history', COUNT(*) FROM vehicle_telemetry_history;
"
```

## Example Queries

### View Recent Meter Readings
```sql
SELECT 
    meterId,
    kwhConsumedAc,
    voltage,
    timestamp
FROM meter_telemetry_history
ORDER BY timestamp DESC
LIMIT 20;
```

### View Recent Vehicle Readings
```sql
SELECT 
    vehicleId,
    soc,
    kwhDeliveredDc,# View all tables
sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c "\dt"

# View meter status
sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c "SELECT * FROM meter_status;"

# View vehicle status
sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c "SELECT * FROM vehicle_status;"

# View meter history (last 10 records)
sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c "SELECT * FROM meter_telemetry_history ORDER BY timestamp DESC LIMIT 10;"

# View vehicle history (last 10 records)
sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c "SELECT * FROM vehicle_telemetry_history ORDER BY timestamp DESC LIMIT 10;"
    batteryTemp,
    timestamp
FROM vehicle_telemetry_history
ORDER BY timestamp DESC
LIMIT 20;
```

### View Current Status of All Meters
```sql
SELECT 
    meterId,
    kwhConsumedAc,
    voltage,
    timestamp,
    updatedAt
FROM meter_status
ORDER BY updatedAt DESC;
```

### View Current Status of All Vehicles
```sql
SELECT 
    vehicleId,
    soc,
    kwhDeliveredDc,
    batteryTemp,
    timestamp,
    updatedAt
FROM vehicle_status
ORDER BY updatedAt DESC;
```

### Analytics Query (24-hour summary for a vehicle)
```sql
-- Get 24-hour vehicle performance
WITH vehicle_data AS (
    SELECT 
        SUM(kwhDeliveredDc) as totalDc,
        AVG(batteryTemp) as avgTemp
    FROM vehicle_telemetry_history
    WHERE vehicleId = 'vehicle-001'
    AND timestamp >= NOW() - INTERVAL '24 hours'
),
meter_data AS (
    SELECT 
        SUM(kwhConsumedAc) as totalAc
    FROM meter_telemetry_history
    WHERE timestamp >= NOW() - INTERVAL '24 hours'
)
SELECT 
    v.totalDc,
    m.totalAc,
    CASE 
        WHEN m.totalAc > 0 THEN (v.totalDc / m.totalAc) * 100 
        ELSE 0 
    END as efficiencyRatio,
    v.avgTemp
FROM vehicle_data v, meter_data m;
```

## Database Connection Details

**From Host Machine**:
- Host: `localhost`
- Port: `5432`
- Database: `energy_ingestion`
- User: `postgres`
- Password: `postgres`

**From Docker Container**:
- Host: `postgres` (service name)
- Port: `5432`
- Database: `energy_ingestion`
- User: `postgres`
- Password: `postgres`

## Data Storage Location

Data is persisted in a Docker volume:
- Volume Name: `energy-ingestion-engine_postgres_data`
- Location: `/var/lib/postgresql/data` (inside container)
- Persistence: Data survives container restarts

## Backup & Restore

### Backup Database
```bash
sudo docker exec energy-ingestion-db pg_dump -U postgres energy_ingestion > backup.sql
```

### Restore Database
```bash
sudo docker exec -i energy-ingestion-db psql -U postgres energy_ingestion < backup.sql
```
