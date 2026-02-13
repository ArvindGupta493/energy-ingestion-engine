#!/bin/bash

# Check application and database logs

echo "=========================================="
echo "Checking Service Logs"
echo "=========================================="
echo ""

echo "1. Container Status:"
sudo docker-compose ps
echo ""

echo "2. Database Logs (last 30 lines):"
echo "-----------------------------------"
sudo docker-compose logs --tail 30 postgres
echo ""

echo "3. Application Logs (last 50 lines):"
echo "-----------------------------------"
sudo docker-compose logs --tail 50 app
echo ""

echo "=========================================="
echo "Diagnosis:"
echo "=========================================="

# Check if database is running
if sudo docker-compose ps | grep -q "energy-ingestion-db.*Up"; then
    echo "✅ Database is running"
else
    echo "❌ Database container is not running"
    echo "   Restart with: sudo docker-compose restart postgres"
fi

# Check if app is running
if sudo docker-compose ps | grep -q "energy-ingestion-app.*Up"; then
    echo "✅ Application container is running"
else
    echo "❌ Application container is not running"
    echo "   Restart with: sudo docker-compose restart app"
fi

echo ""
echo "=========================================="
