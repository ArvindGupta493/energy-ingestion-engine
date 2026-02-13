#!/bin/bash
echo "=========================================="
echo "Viewing Application Logs"
echo "=========================================="
echo ""
echo "Recent logs (last 50 lines):"
echo ""
sudo docker-compose logs --tail 50 app
echo ""
echo "=========================================="
echo "To follow logs in real-time, run:"
echo "  sudo docker-compose logs -f app"
echo "=========================================="
