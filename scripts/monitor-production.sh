#!/bin/bash

echo "📊 Production System Monitoring"
echo "================================"

# Check if production services are running
echo "🔍 Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "💾 Disk Usage:"
df -h

echo ""
echo "🧠 Memory Usage:"
free -h

echo ""
echo "⚡ CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2 $3 $4 $5 $6 $7 $8}'

echo ""
echo "🐳 Docker Container Stats:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

echo ""
echo "📋 Recent Logs (last 20 lines):"
echo "Backend logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20 backend

echo ""
echo "Frontend logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20 frontend

echo ""
echo "Database logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20 db