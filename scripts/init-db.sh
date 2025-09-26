#!/bin/bash
set -e

# Create database if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create extensions if needed
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Set timezone
    SET timezone = 'UTC';
    
    -- Create indexes for better performance (will be created by migrations, but good to have as backup)
    -- These will be ignored if they already exist
EOSQL

echo "Database initialization completed."