#!/bin/bash

# Script to run all code quality checks in Docker environment

set -e

echo "🔍 Running code quality checks in Docker environment..."
echo ""

# Ensure Docker services are running
echo "🐳 Starting Docker services..."
docker-compose up -d

echo ""

# Backend quality checks
echo "📋 Checking backend code quality (Rubocop)..."
if docker-compose exec -T backend bundle exec rubocop; then
    echo "✅ Backend code quality check passed"
else
    echo "❌ Backend code quality check failed"
    echo "Run 'docker-compose exec backend bundle exec rubocop -a' to auto-fix issues"
    exit 1
fi

echo ""

# Frontend quality checks
echo "📋 Checking frontend code quality (ESLint)..."
if docker-compose exec -T frontend npm run lint; then
    echo "✅ Frontend code quality check passed"
else
    echo "❌ Frontend code quality check failed"
    echo "Run 'docker-compose exec frontend npm run lint:fix' to auto-fix issues"
    exit 1
fi

echo ""
echo "🎉 All code quality checks passed!"