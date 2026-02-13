#!/bin/bash

# Status Check Script
# Checks Docker services and application health

echo "=========================================="
echo "Energy Ingestion Engine - Status Check"
echo "=========================================="
echo ""

# Check Docker
echo "1. Checking Docker..."
if command -v docker &> /dev/null; then
    echo "   ✅ Docker is installed"
    if docker ps &> /dev/null; then
        echo "   ✅ Docker is accessible"
    else
        echo "   ⚠️  Docker requires sudo (run: sudo docker ps)"
    fi
else
    echo "   ❌ Docker not found"
fi
echo ""

# Check containers
echo "2. Checking containers..."
if sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | grep -E "energy-ingestion|NAMES" || docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | grep -E "energy-ingestion|NAMES"; then
    echo "   ✅ Containers are running"
else
    echo "   ❌ No containers found. Start with: sudo docker-compose up -d"
fi
echo ""

# Check port
echo "3. Checking port 3001..."
if netstat -tuln 2>/dev/null | grep -q ":3001 " || ss -tuln 2>/dev/null | grep -q ":3001 "; then
    echo "   ✅ Port 3001 is listening"
else
    echo "   ❌ Port 3001 is not listening"
fi
echo ""

# Check API connectivity
echo "4. Checking API connectivity..."
if curl -s --connect-timeout 3 http://localhost:3001/v1/analytics/performance/test > /dev/null 2>&1; then
    echo "   ✅ API is responding"
else
    echo "   ❌ API is not responding"
    echo "   Check logs: sudo docker-compose logs app"
fi
echo ""

# Show recent logs (last 20 lines)
echo "5. Recent application logs (last 20 lines):"
echo "   Run: sudo docker-compose logs --tail 20 app"
echo ""

echo "=========================================="
echo "Quick Commands:"
echo "  View logs:     sudo docker-compose logs -f app"
echo "  Restart:       sudo docker-compose restart"
echo "  Stop:          sudo docker-compose down"
echo "  Start:         sudo docker-compose up -d"
echo "  Test API:      bash test-api.sh"
echo "=========================================="
