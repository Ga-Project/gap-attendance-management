#!/bin/bash
set -e

echo "🧪 Running all tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}${1}${NC}"
}

# Check if Docker Compose is running
if ! docker-compose ps | grep -q "Up"; then
    print_status "⚠️  Starting Docker Compose services..." $YELLOW
    docker-compose up -d
    sleep 10
fi

print_status "🔍 Running Backend Tests (RSpec)..." $YELLOW
if docker compose exec -T backend rspec --format progress; then
    print_status "✅ Backend tests passed!" $GREEN
else
    print_status "❌ Backend tests failed!" $RED
    exit 1
fi

print_status "🔍 Running Frontend Tests (Jest)..." $YELLOW
if docker compose exec -T frontend npm test -- --watchAll=false --coverage; then
    print_status "✅ Frontend tests passed!" $GREEN
else
    print_status "❌ Frontend tests failed!" $RED
    exit 1
fi

print_status "🔍 Running Backend Lint (Rubocop)..." $YELLOW
if docker compose exec -T backend bundle exec rubocop; then
    print_status "✅ Backend lint passed!" $GREEN
else
    print_status "❌ Backend lint failed!" $RED
    exit 1
fi

print_status "🔍 Running Frontend Lint (ESLint)..." $YELLOW
if docker compose exec -T frontend npm run lint; then
    print_status "✅ Frontend lint passed!" $GREEN
else
    print_status "❌ Frontend lint failed!" $RED
    exit 1
fi

print_status "🎉 All tests and lints passed successfully!" $GREEN

echo ""
echo "📊 Test Summary:"
echo "=================="
echo "✅ Backend Tests (RSpec)"
echo "✅ Frontend Tests (Jest)"
echo "✅ Backend Lint (Rubocop)"
echo "✅ Frontend Lint (ESLint)"
echo ""
echo "🚀 Ready for deployment!"