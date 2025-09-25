#!/bin/bash

echo "🚀 Setting up Attendance Management System..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your configuration."
fi

# Build and start services
echo "🏗️  Building Docker containers..."
docker-compose build

echo "🗄️  Setting up database..."
docker-compose run --rm backend rails db:create db:migrate

echo "📦 Installing frontend dependencies..."
docker-compose run --rm frontend npm install

echo "✅ Setup complete! You can now run:"
echo "   docker-compose up"
echo ""
echo "Access the application at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   Health Check: http://localhost:3001/health"