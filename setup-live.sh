#!/bin/bash
set -e

echo "========================================="
echo "  ListFlow Live Setup Script"
echo "========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

step() { echo -e "\n${GREEN}[STEP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; }

# -------------------------------------------
# 1. Install PostgreSQL
# -------------------------------------------
step "Installing PostgreSQL..."
sudo apt-get update -qq
sudo apt-get install -y postgresql postgresql-contrib

step "Starting PostgreSQL..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

# -------------------------------------------
# 2. Create database and user
# -------------------------------------------
step "Creating database..."
DB_USER="listflow"
DB_PASS="listflow_$(openssl rand -hex 8)"
DB_NAME="listflow"

sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}'; END IF; END \$\$;" 2>/dev/null
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
sudo -u postgres psql -c "ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
echo -e "${GREEN}Database URL:${NC} ${DATABASE_URL}"

# -------------------------------------------
# 3. Create .env file
# -------------------------------------------
step "Creating .env file..."
JWT_SECRET=$(openssl rand -hex 32)

cat > /home/robug/listflow/.env << ENVEOF
# Server Configuration
PORT=3001
NODE_ENV=production

# Database
DATABASE_URL=${DATABASE_URL}

# Security
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=$(openssl rand -hex 16)

# Frontend URL
CLIENT_URL=https://listflow.robug.com,https://list.robug.com

# Segmind AI Configuration
SEGMIND_API_KEY=
SEGMIND_MODEL=llava-v1.6

# eBay API Configuration (optional)
EBAY_SANDBOX=true
EBAY_APP_ID=
EBAY_CERT_ID=
EBAY_DEV_ID=
EBAY_AUTH_TOKEN=

# Seller Information
SELLER_POSTAL_CODE=10001

# Image Hosting
PUBLIC_IMAGE_BASE_URL=https://list.robug.com
PUBLIC_IMAGES_DIR=public-images
ENVEOF

echo ".env created"

# -------------------------------------------
# 4. Install dependencies
# -------------------------------------------
step "Installing backend dependencies..."
cd /home/robug/listflow
npm install

step "Installing frontend dependencies..."
cd /home/robug/listflow/client
npm install
cd /home/robug/listflow

# -------------------------------------------
# 5. Generate Prisma client & run migrations
# -------------------------------------------
step "Generating Prisma client..."
npx prisma generate

step "Running database migrations..."
npx prisma migrate deploy

# -------------------------------------------
# 6. Seed database (creates admin user bossman:555Timer)
# -------------------------------------------
step "Seeding database..."
npx ts-node prisma/seed.ts

# -------------------------------------------
# 7. Create public-images directory
# -------------------------------------------
step "Creating public-images directory..."
mkdir -p /home/robug/listflow/public-images/listflow

# -------------------------------------------
# 8. Build frontend
# -------------------------------------------
step "Building frontend..."
cd /home/robug/listflow/client
npm run build
cd /home/robug/listflow

# -------------------------------------------
# 9. Set up PM2 for process management
# -------------------------------------------
step "Setting up PM2..."
sudo npm install -g pm2 2>/dev/null || npm install -g pm2

# Stop existing if any
pm2 delete listflow-api 2>/dev/null || true
pm2 delete listflow-frontend 2>/dev/null || true

# Start backend
pm2 start npm --name "listflow-api" -- run dev

# Start frontend (vite preview serves the built app)
cd /home/robug/listflow/client
pm2 start npm --name "listflow-frontend" -- run preview -- --host 0.0.0.0 --port 5173
cd /home/robug/listflow

# Save PM2 config and set up startup
pm2 save
pm2 startup systemd -u robug --hp /home/robug 2>/dev/null || warn "Run the pm2 startup command it suggests manually"

# -------------------------------------------
# 10. Wait and verify
# -------------------------------------------
step "Waiting for services to start..."
sleep 5

echo ""
echo "========================================="
echo "  Checking services..."
echo "========================================="

# Check backend
if curl -s http://localhost:3001/health | grep -q "ok"; then
    echo -e "${GREEN}Backend:${NC}  Running on port 3001"
else
    warn "Backend not responding yet. Check: pm2 logs listflow-api"
fi

# Check frontend
if curl -s http://localhost:5173 | grep -q "html"; then
    echo -e "${GREEN}Frontend:${NC} Running on port 5173"
else
    warn "Frontend not responding yet. Check: pm2 logs listflow-frontend"
fi

echo ""
echo "========================================="
echo -e "  ${GREEN}Setup Complete!${NC}"
echo "========================================="
echo ""
echo "  Site:  https://listflow.robug.com"
echo "  Alt:   https://list.robug.com"
echo ""
echo "  Admin Login:"
echo "    Email:    admin@listflow.local"
echo "    Password: 555Timer"
echo ""
echo "  Commands:"
echo "    pm2 status          - Check process status"
echo "    pm2 logs            - View logs"
echo "    pm2 restart all     - Restart services"
echo ""
