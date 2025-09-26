#!/bin/bash
set -e

echo "🚀 Setting up development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}${1}${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_status "❌ Docker is not installed. Please install Docker Desktop first." $RED
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_status "❌ Docker Compose is not installed. Please install Docker Compose first." $RED
    exit 1
fi

print_status "✅ Docker and Docker Compose are installed" $GREEN

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "📝 Creating .env file from .env.example..." $YELLOW
    cp .env.example .env
    print_status "✅ .env file created. Please update it with your configuration." $GREEN
else
    print_status "✅ .env file already exists" $GREEN
fi

# Stop any running containers
print_status "🛑 Stopping any running containers..." $YELLOW
docker-compose down || true

# Build and start services
print_status "🔨 Building Docker images..." $YELLOW
docker-compose build

print_status "🚀 Starting services..." $YELLOW
docker-compose up -d

# Wait for services to be ready
print_status "⏳ Waiting for services to be ready..." $YELLOW
sleep 15

# Check if database is ready
print_status "🔍 Checking database connection..." $YELLOW
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
        print_status "✅ Database is ready!" $GREEN
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        print_status "❌ Database failed to start after $max_attempts attempts" $RED
        exit 1
    fi
    
    print_status "⏳ Waiting for database... (attempt $attempt/$max_attempts)" $YELLOW
    sleep 2
    ((attempt++))
done

# Setup database
print_status "🗄️ Setting up database..." $YELLOW
docker compose exec -T backend rails db:create
docker compose exec -T backend rails db:migrate

# Seed database (optional)
print_status "🌱 Seeding database..." $YELLOW
docker compose exec -T backend rails db:seed || print_status "⚠️  No seeds to run or seeding failed" $YELLOW

# Install dependencies
print_status "📦 Installing backend dependencies..." $YELLOW
docker compose exec -T backend bundle install

print_status "📦 Installing frontend dependencies..." $YELLOW
docker compose exec -T frontend npm install

# Run initial tests to verify setup
print_status "🧪 Running initial tests to verify setup..." $YELLOW

print_status "🔍 Testing backend..." $BLUE
if docker compose exec -T backend rails runner "puts 'Backend is working!'" > /dev/null 2>&1; then
    print_status "✅ Backend is working!" $GREEN
else
    print_status "❌ Backend test failed!" $RED
fi

print_status "🔍 Testing frontend..." $BLUE
if docker compose exec -T frontend npm run build > /dev/null 2>&1; then
    print_status "✅ Frontend build successful!" $GREEN
else
    print_status "❌ Frontend build failed!" $RED
fi

# Setup pre-commit hooks
if [ -f "./scripts/setup-pre-commit.sh" ]; then
    print_status "🪝 Setting up pre-commit hooks..." $YELLOW
    ./scripts/setup-pre-commit.sh
else
    print_status "⚠️  Pre-commit setup script not found" $YELLOW
fi

# Display service status
print_status "📊 Service Status:" $BLUE
docker-compose ps

echo ""
print_status "🎉 Development environment setup complete!" $GREEN
echo ""
echo "📍 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   Database: localhost:5432"
echo ""
echo "🛠️  Useful commands:"
echo "   Start services:     docker-compose up -d"
echo "   Stop services:      docker-compose down"
echo "   View logs:          docker-compose logs -f"
echo "   Backend console:    docker compose exec backend rails console"
echo "   Run tests:          ./scripts/run-all-tests.sh"
echo ""
echo "📚 Documentation:"
echo "   README.md           - Project overview and setup"
echo "   docs/               - Detailed documentation"
echo "   docs/CONTRIBUTING.md - Contribution guidelines"
echo ""
print_status "Happy coding! 🚀" $GREEN