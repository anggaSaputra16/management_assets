-- PostgreSQL Database initialization script
-- This file will be executed when the container starts

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant all privileges to postgres user
GRANT ALL PRIVILEGES ON DATABASE management_assets TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;

-- Create necessary sequences and functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: Tables will be created by Prisma migrations
