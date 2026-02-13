#!/bin/bash

# Script to view database data

echo "=========================================="
echo "Energy Ingestion Engine - Database Viewer"
echo "=========================================="
echo ""

# Check if container is running
if ! sudo docker ps | grep -q energy-ingestion-db; then
    echo "❌ Database container is not running"
    echo "Start with: sudo docker-compose up -d"
    exit 1
fi

echo "Database: PostgreSQL"
echo "Container: energy-ingestion-db"
echo "Database Name: energy_ingestion"
echo "User: postgres"
echo ""

echo "=========================================="
echo "1. Table Structure"
echo "=========================================="
echo ""

echo "Hot Storage Tables:"
echo "  - meter_status (current meter state)"
echo "  - vehicle_status (current vehicle state)"
echo ""
echo "Cold Storage Tables:"
echo "  - meter_telemetry_history (historical meter data)"
echo "  - vehicle_telemetry_history (historical vehicle data)"
echo ""

echo "=========================================="
echo "2. List All Tables"
echo "=========================================="
sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c "\dt"
echo ""

echo "=========================================="
echo "3. Hot Storage - Current Status"
echo "=========================================="
echo ""

echo "Meter Status (Current State):"
sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c "SELECT * FROM meter_status LIMIT 10;"
echo ""

echo "Vehicle Status (Current State):"
sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c "SELECT * FROM vehicle_status LIMIT 10;"
echo ""

echo "=========================================="
echo "4. Cold Storage - Historical Data"
echo "=========================================="
echo ""

echo "Meter Telemetry History (Last 10 records):"
sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c "SELECT * FROM meter_telemetry_history ORDER BY timestamp DESC LIMIT 10;"
echo ""

echo "Vehicle Telemetry History (Last 10 records):"
sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c "SELECT * FROM vehicle_telemetry_history ORDER BY timestamp DESC LIMIT 10;"
echo ""

echo "=========================================="
echo "5. Data Statistics"
echo "=========================================="
echo ""

echo "Record Counts:"
sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c "
SELECT 
    'meter_status' as table_name, COUNT(*) as record_count FROM meter_status
UNION ALL
SELECT 
    'vehicle_status' as table_name, COUNT(*) as record_count FROM vehicle_status
UNION ALL
SELECT 
    'meter_telemetry_history' as table_name, COUNT(*) as record_count FROM meter_telemetry_history
UNION ALL
SELECT 
    'vehicle_telemetry_history' as table_name, COUNT(*) as record_count FROM vehicle_telemetry_history;
"
echo ""

echo "=========================================="
echo "6. Quick Access Commands"
echo "=========================================="
echo ""
echo "Connect to database:"
echo "  sudo docker exec -it energy-ingestion-db psql -U postgres -d energy_ingestion"
echo ""
echo "View all tables:"
echo "  sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c '\\dt'"
echo ""
echo "View meter history:"
echo "  sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c 'SELECT * FROM meter_telemetry_history;'"
echo ""
echo "View vehicle history:"
echo "  sudo docker exec energy-ingestion-db psql -U postgres -d energy_ingestion -c 'SELECT * FROM vehicle_telemetry_history;'"
echo ""
