#!/bin/bash

# Start and verify the Energy Ingestion Engine

echo "=========================================="
echo "Starting Energy Ingestion Engine"
echo "=========================================="
echo ""

# Step 1: Stop any existing containers
echo "Step 1: Stopping any existing containers..."
sudo docker-compose down 2>/dev/null || echo "No containers to stop"
echo ""

# Step 2: Start services
echo "Step 2: Starting services..."
sudo docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start services"
    exit 1
fi

echo ""
echo "Step 3: Waiting for services to initialize..."
sleep 25

# Step 4: Check container status
echo ""
echo "Step 4: Checking container status..."
echo "-----------------------------------"
sudo docker-compose ps
echo ""

# Step 5: Check if API is responding
echo "Step 5: Checking API connectivity..."
if curl -s --connect-timeout 5 http://localhost:3001/v1/analytics/performance/test > /dev/null 2>&1; then
    echo "✅ API is responding"
else
    echo "⚠️  API not responding yet, checking logs..."
    echo ""
    echo "Recent application logs:"
    sudo docker-compose logs --tail 20 app | tail -10
    echo ""
    echo "Waiting a bit more..."
    sleep 10
fi

# Step 6: Run full API tests
echo ""
echo "=========================================="
echo "Running API Tests"
echo "=========================================="
echo ""

bash test-api.sh

echo ""
echo "=========================================="
echo "Verification Complete!"
echo "=========================================="
echo ""
echo "Services are running. You can now:"
echo "  - View logs:    sudo docker-compose logs -f app"
echo "  - Stop:         sudo docker-compose down"
echo "  - Test API:     bash test-api.sh"
echo ""
