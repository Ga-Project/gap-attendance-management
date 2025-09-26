#!/bin/bash
set -e

echo "🚀 Starting production deployment..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please copy .env.production.example to .env.production and configure it."
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Validate required environment variables
required_vars=(
    "POSTGRES_PASSWORD"
    "SECRET_KEY_BASE"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "JWT_SECRET"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set!"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Build and start services
echo "🔨 Building production images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🗄️ Starting database..."
docker-compose -f docker-compose.prod.yml up -d db redis

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🔄 Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend bundle exec rails db:create db:migrate

echo "🌱 Seeding database (if needed)..."
docker-compose -f docker-compose.prod.yml run --rm backend bundle exec rails db:seed 2>/dev/null || echo "No seeds to run"

echo "🚀 Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

echo "🔍 Checking service health..."
sleep 30

# Check if services are healthy
if docker-compose -f docker-compose.prod.yml ps | grep -q "unhealthy"; then
    echo "❌ Some services are unhealthy. Check logs:"
    docker-compose -f docker-compose.prod.yml logs --tail=50
    exit 1
fi

echo "✅ Production deployment completed successfully!"
echo "🌐 Application should be available at: http://localhost:${FRONTEND_PORT:-80}"
echo ""
echo "📊 Service status:"
docker-compose -f docker-compose.prod.yml ps