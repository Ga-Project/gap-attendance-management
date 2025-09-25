#!/bin/bash

# Script to run all code quality checks

set -e

echo "🔍 Running code quality checks..."
echo ""

# Backend quality checks
echo "📋 Checking backend code quality (Rubocop)..."
cd backend
if bundle exec rubocop; then
    echo "✅ Backend code quality check passed"
else
    echo "❌ Backend code quality check failed"
    echo "Run 'cd backend && bundle exec rubocop -a' to auto-fix issues"
    exit 1
fi
cd ..

echo ""

# Frontend quality checks
echo "📋 Checking frontend code quality (ESLint)..."
cd frontend
if npm run lint; then
    echo "✅ Frontend code quality check passed"
else
    echo "❌ Frontend code quality check failed"
    echo "Run 'cd frontend && npm run lint:fix' to auto-fix issues"
    exit 1
fi
cd ..

echo ""
echo "🎉 All code quality checks passed!"