# 📡 API Documentation

## Overview

This project implements **3 API endpoints** for the Energy Ingestion Engine:

1. **POST** `/v1/ingestion/meter` - Meter Telemetry Ingestion
2. **POST** `/v1/ingestion/vehicle` - Vehicle Telemetry Ingestion  
3. **GET** `/v1/analytics/performance/:vehicleId` - Vehicle Performance Analytics

All endpoints are prefixed with `/v1` (API versioning).

---

## API Endpoint Details

### 1. Meter Telemetry Ingestion API

**Endpoint**: `POST /v1/ingestion/meter`

**Purpose**: Ingests telemetry data from Smart Meters (Grid Side)

**Request Body**:
```json
{
  "meterId": "meter-001",
  "kwhConsumedAc": 12.5,
  "voltage": 240.0,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Field Validation**:
- `meterId`: String (required)
- `kwhConsumedAc`: Number ≥ 0 (required) - AC energy consumed from grid
- `voltage`: Number ≥ 0 (required) - Voltage reading
- `timestamp`: ISO 8601 date string (required)

**Response**: `202 Accepted`
```json
{
  "status": "accepted",
  "message": "Meter telemetry ingested successfully"
}
```

**How It Works**:
1. Validates incoming request data using DTO validation
2. **Cold Storage (INSERT)**: Appends record to `meter_telemetry_history` table
   - Creates immutable audit trail
   - Preserves complete historical data
3. **Hot Storage (UPSERT)**: Updates `meter_status` table
   - Atomic update-or-insert operation
   - Ensures current status is always available
   - Uses `meterId` as conflict target
4. Returns 202 Accepted immediately (async processing)

**Database Operations**:
- INSERT into `meter_telemetry_history` (append-only)
- UPSERT into `meter_status` (update current status)

---

### 2. Vehicle Telemetry Ingestion API

**Endpoint**: `POST /v1/ingestion/vehicle`

**Purpose**: Ingests telemetry data from EV Chargers (Vehicle Side)

**Request Body**:
```json
{
  "vehicleId": "vehicle-001",
  "soc": 85.5,
  "kwhDeliveredDc": 10.8,
  "batteryTemp": 28.5,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Field Validation**:
- `vehicleId`: String (required)
- `soc`: Number between 0-100 (required) - State of Charge (Battery %)
- `kwhDeliveredDc`: Number ≥ 0 (required) - DC energy delivered to battery
- `batteryTemp`: Number (required) - Battery temperature in Celsius
- `timestamp`: ISO 8601 date string (required)

**Response**: `202 Accepted`
```json
{
  "status": "accepted",
  "message": "Vehicle telemetry ingested successfully"
}
```

**How It Works**:
1. Validates incoming request data using DTO validation
2. **Cold Storage (INSERT)**: Appends record to `vehicle_telemetry_history` table
   - Creates immutable audit trail
   - Preserves complete historical data for analytics
3. **Hot Storage (UPSERT)**: Updates `vehicle_status` table
   - Atomic update-or-insert operation
   - Ensures current SoC, battery temp, and status are always available
   - Uses `vehicleId` as conflict target
4. Returns 202 Accepted immediately (async processing)

**Database Operations**:
- INSERT into `vehicle_telemetry_history` (append-only)
- UPSERT into `vehicle_status` (update current status)

---

### 3. Vehicle Performance Analytics API

**Endpoint**: `GET /v1/analytics/performance/:vehicleId`

**Purpose**: Returns 24-hour performance summary for a specific vehicle

**URL Parameters**:
- `vehicleId`: String (path parameter) - The vehicle ID to analyze

**Example**: `GET /v1/analytics/performance/vehicle-001`

**Response**: `200 OK`
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

**Response Fields**:
- `vehicleId`: The vehicle ID queried
- `period`: Object with `start` and `end` timestamps (24-hour window)
- `totalKwhConsumedAc`: Sum of AC energy consumed from meters (kWh)
- `totalKwhDeliveredDc`: Sum of DC energy delivered to vehicle (kWh)
- `efficiencyRatio`: Calculated as `(DC / AC) × 100` (percentage)
- `averageBatteryTemp`: Average battery temperature over 24 hours (°C)

**How It Works**:
1. **Vehicle Verification**: Checks if vehicle exists in `vehicle_status` table (hot storage)
   - Returns 404 if vehicle not found
2. **Time Window Calculation**: Calculates 24-hour window
   - `endTime` = Current time
   - `startTime` = Current time - 24 hours
3. **Vehicle Data Aggregation**: Queries `vehicle_telemetry_history` (cold storage)
   - Uses indexed query: `WHERE vehicleId = ? AND timestamp BETWEEN startTime AND endTime`
   - Aggregates: `SUM(kwhDeliveredDc)`, `AVG(batteryTemp)`
   - Uses composite index `(vehicleId, timestamp)` for performance
4. **Meter Data Aggregation**: Queries `meter_telemetry_history` (cold storage)
   - Aggregates all meter data in the same time window
   - Aggregates: `SUM(kwhConsumedAc)`
   - Uses timestamp index for efficient range scan
5. **Efficiency Calculation**: 
   - Formula: `(totalKwhDeliveredDc / totalKwhConsumedAc) × 100`
   - Returns 0 if no AC data available
6. **Response Assembly**: Combines all metrics into response object

**Database Operations**:
- SELECT from `vehicle_status` (verify vehicle exists)
- SELECT with aggregation from `vehicle_telemetry_history` (indexed query)
- SELECT with aggregation from `meter_telemetry_history` (indexed query)

**Performance Optimization**:
- Uses indexed WHERE clauses to avoid full table scans
- Composite index `(vehicleId, timestamp)` enables efficient vehicle-specific queries
- Timestamp index enables efficient time-window queries
- Aggregation done at database level (SUM, AVG)

---

## API Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Meter Ingestion API                      │
│              POST /v1/ingestion/meter                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    [Validation]
                            │
                            ▼
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────────┐              ┌───────────────────┐
│ Cold Storage      │              │ Hot Storage       │
│ INSERT            │              │ UPSERT            │
│ meter_telemetry_  │              │ meter_status      │
│ history           │              │ (current status)  │
└───────────────────┘              └───────────────────┘
        │                                       │
        └───────────────────┬───────────────────┘
                            ▼
                    [202 Accepted]

┌─────────────────────────────────────────────────────────────┐
│                  Vehicle Ingestion API                      │
│              POST /v1/ingestion/vehicle                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    [Validation]
                            │
                            ▼
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────────┐              ┌───────────────────┐
│ Cold Storage      │              │ Hot Storage       │
│ INSERT            │              │ UPSERT            │
│ vehicle_telemetry_│              │ vehicle_status    │
│ history           │              │ (current status)  │
└───────────────────┘              └───────────────────┘
        │                                       │
        └───────────────────┬───────────────────┘
                            ▼
                    [202 Accepted]

┌─────────────────────────────────────────────────────────────┐
│              Analytics API                                  │
│         GET /v1/analytics/performance/:vehicleId           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    [Verify Vehicle]
                    (check hot storage)
                            │
                            ▼
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────────┐              ┌───────────────────┐
│ Query Vehicle    │              │ Query Meter      │
│ History          │              │ History          │
│ (24-hour window) │              │ (24-hour window) │
│ SUM(DC)          │              │ SUM(AC)          │
│ AVG(Temp)        │              │                  │
└───────────────────┘              └───────────────────┘
        │                                       │
        └───────────────────┬───────────────────┘
                            ▼
                    [Calculate Metrics]
                    - Efficiency Ratio
                    - Totals
                    - Averages
                            │
                            ▼
                    [200 OK + JSON]
```

---

## Summary

**Total APIs**: 3 endpoints

1. **Meter Ingestion** (POST) - Ingests Smart Meter data
   - Writes to both hot and cold storage
   - Returns 202 Accepted

2. **Vehicle Ingestion** (POST) - Ingests EV Charger data
   - Writes to both hot and cold storage
   - Returns 202 Accepted

3. **Analytics** (GET) - Returns 24-hour performance summary
   - Reads from cold storage (historical data)
   - Performs aggregations
   - Calculates efficiency metrics
   - Returns 200 OK with analytics data

**Key Features**:
- ✅ Hot/Cold storage separation
- ✅ INSERT for history (immutable audit trail)
- ✅ UPSERT for status (current state)
- ✅ Indexed queries (no full table scans)
- ✅ Data correlation (AC vs DC)
- ✅ Efficiency calculation
