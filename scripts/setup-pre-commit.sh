#!/bin/bash

# Setup script for pre-commit hooks

echo "Setting up pre-commit hooks for code quality..."

# Check if pre-commit is installed
if ! command -v pre-commit &> /dev/null; then
    echo "Installing pre-commit..."
    
    # Try to install via pip
    if command -v pip &> /dev/null; then
        pip install pre-commit
    elif command -v pip3 &> /dev/null; then
        pip3 install pre-commit
    elif command -v brew &> /dev/null; then
        brew install pre-commit
    else
        echo "Error: Could not install pre-commit. Please install it manually:"
        echo "  pip install pre-commit"
        echo "  or visit: https://pre-commit.com/#installation"
        exit 1
    fi
fi

# Install the git hook scripts
echo "Installing pre-commit hooks..."
pre-commit install

# Run hooks against all files to test setup
echo "Running pre-commit hooks against all files..."
pre-commit run --all-files

echo "Pre-commit hooks setup complete!"
echo ""
echo "The following hooks are now active:"
echo "  - Rubocop (Ruby code style)"
echo "  - ESLint (JavaScript/TypeScript code style)"
echo "  - Trailing whitespace removal"
echo "  - End of file fixer"
echo "  - YAML syntax check"
echo "  - Large file check"
echo ""
echo "These will run automatically before each commit."