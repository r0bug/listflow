#!/bin/bash

# ListFlow Dependencies Installation Script
# Run this with: sudo ./INSTALL_DEPENDENCIES.sh

set -e

echo "========================================="
echo "Installing ListFlow Dependencies"
echo "========================================="
echo ""

# Update package list
echo "Updating package list..."
apt-get update

# Install PostgreSQL
echo ""
echo "Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

# Install Redis
echo ""
echo "Installing Redis..."
apt-get install -y redis-server

# Start services
echo ""
echo "Starting services..."
systemctl start postgresql
systemctl start redis-server
systemctl enable postgresql
systemctl enable redis-server

# Create PostgreSQL user and database
echo ""
echo "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE USER listflow WITH PASSWORD 'listflow123';" || true
sudo -u postgres psql -c "CREATE DATABASE listflow OWNER listflow;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE listflow TO listflow;" || true

# Test PostgreSQL connection
echo ""
echo "Testing PostgreSQL connection..."
sudo -u postgres psql -c "SELECT version();" || echo "PostgreSQL connection failed"

# Test Redis connection
echo ""
echo "Testing Redis connection..."
redis-cli ping || echo "Redis connection failed"

echo ""
echo "========================================="
echo "✅ Dependencies installed successfully!"
echo "========================================="
echo ""
echo "PostgreSQL:"
echo "  - User: listflow"
echo "  - Password: listflow123"
echo "  - Database: listflow"
echo "  - Connection: postgresql://listflow:listflow123@localhost:5432/listflow"
echo ""
echo "Redis:"
echo "  - Connection: redis://localhost:6379"
echo ""
echo "Next steps:"
echo "  1. cd /home/ynebay/listflow"
echo "  2. ./install.sh"
echo ""
