#!/bin/bash

# Quick API Test Script
# Run after services are started with: docker-compose up -d

echo "=========================================="
echo "Testing Energy Ingestion Engine API"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3001/v1"

# Check if API is reachable
echo "Checking API connectivity..."
if ! curl -s --connect-timeout 5 ${BASE_URL}/analytics/performance/test > /dev/null 2>&1; then
    echo "❌ ERROR: Cannot connect to API at ${BASE_URL}"
    echo "   Check if services are running: sudo docker-compose ps"
    echo "   Check application logs: sudo docker-compose logs app"
    exit 1
fi
echo "✅ API is reachable"
echo ""

# Test 1: Meter Ingestion
echo "Test 1: Ingesting Meter Telemetry..."
HTTP_CODE1=$(curl -s -o /tmp/response1.json -w "%{http_code}" -X POST ${BASE_URL}/ingestion/meter \
  -H "Content-Type: application/json" \
  -d '{
    "meterId": "meter-001",
    "kwhConsumedAc": 12.5,
    "voltage": 240.0,
    "timestamp": "2024-01-15T10:30:00Z"
  }')

RESPONSE1=$(cat /tmp/response1.json 2>/dev/null || echo "")
echo "HTTP Status: $HTTP_CODE1"
echo "Response: $RESPONSE1"
echo ""

# Test 2: Vehicle Ingestion
echo "Test 2: Ingesting Vehicle Telemetry..."
HTTP_CODE2=$(curl -s -o /tmp/response2.json -w "%{http_code}" -X POST ${BASE_URL}/ingestion/vehicle \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "vehicle-001",
    "soc": 85.5,
    "kwhDeliveredDc": 10.8,
    "batteryTemp": 28.5,
    "timestamp": "2024-01-15T10:30:00Z"
  }')

RESPONSE2=$(cat /tmp/response2.json 2>/dev/null || echo "")
echo "HTTP Status: $HTTP_CODE2"
echo "Response: $RESPONSE2"
echo ""

# Test 3: Analytics
echo "Test 3: Getting Vehicle Performance Analytics..."
HTTP_CODE3=$(curl -s -o /tmp/response3.json -w "%{http_code}" ${BASE_URL}/analytics/performance/vehicle-001)
RESPONSE3=$(cat /tmp/response3.json 2>/dev/null || echo "")
echo "HTTP Status: $HTTP_CODE3"
echo "Response: $RESPONSE3"
echo ""

# Summary
echo "=========================================="
echo "Test Summary:"
echo "  Meter Ingestion:    HTTP $HTTP_CODE1"
echo "  Vehicle Ingestion:  HTTP $HTTP_CODE2"
echo "  Analytics:          HTTP $HTTP_CODE3"
echo "=========================================="

# Cleanup
rm -f /tmp/response*.json
