#!/bin/bash

echo "╔═══════════════════════════════════════╗"
echo "║   ConsoleEbay Setup Script            ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Check if running as root for port 80
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Note: To run on port 80, you'll need sudo privileges."
    echo "   You can run: sudo ./setup.sh"
    echo ""
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed."
    exit 1
fi

if ! command_exists docker; then
    echo "⚠️  Docker is not installed. You'll need to install PostgreSQL manually."
fi

echo "✅ Prerequisites check passed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set up database with Docker
echo ""
echo "🗄️  Setting up database..."
if command_exists docker; then
    echo "Starting PostgreSQL with Docker..."
    docker-compose up -d postgres redis
    sleep 5
else
    echo "⚠️  Please ensure PostgreSQL is running on port 5432"
    echo "   Database: consoleebay"
    echo "   User: ebayuser"
    echo "   Password: ebaypassword"
    read -p "Press Enter when database is ready..."
fi

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo ""
echo "🔄 Running database migrations..."
npx prisma migrate dev --name init

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your API keys:"
    echo "   - SEGMIND_API_KEY"
    echo "   - EBAY_APP_ID, EBAY_CERT_ID, etc."
fi

# Set up nginx for port 80 (optional)
echo ""
echo "🌐 Web Server Setup Options:"
echo ""
echo "Option 1: Run with nginx on port 80 (recommended for production)"
echo "  - Install nginx: sudo apt-get install nginx"
echo "  - Copy config: sudo cp nginx.conf /etc/nginx/sites-available/consoleebay"
echo "  - Enable site: sudo ln -s /etc/nginx/sites-available/consoleebay /etc/nginx/sites-enabled/"
echo "  - Restart nginx: sudo systemctl restart nginx"
echo ""
echo "Option 2: Run with port forwarding (for development)"
echo "  - Use iptables: sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3001"
echo ""
echo "Option 3: Run with authbind (allows non-root to bind port 80)"
echo "  - Install: sudo apt-get install authbind"
echo "  - Configure: sudo touch /etc/authbind/byport/80"
echo "  - Set permissions: sudo chmod 550 /etc/authbind/byport/80"
echo "  - Set owner: sudo chown $USER /etc/authbind/byport/80"
echo "  - Run: authbind --deep npm run start"
echo ""

# Create CLI symlink
echo "🔗 Setting up CLI tool..."
if [ -d "/usr/local/bin" ]; then
    echo "Creating global CLI command..."
    npm link
    echo "✅ You can now use 'ebay-cli' command globally"
else
    echo "⚠️  Run 'npm run cli' to use the CLI tool"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📖 Quick Start Guide:"
echo ""
echo "1. Start the backend server:"
echo "   npm run dev"
echo ""
echo "2. Start the frontend (in another terminal):"
echo "   cd client && npm run dev"
echo ""
echo "3. Use the CLI tool:"
echo "   npm run cli process"
echo "   OR"
echo "   ebay-cli process"
echo ""
echo "4. Access the web interface:"
echo "   - Desktop: http://localhost:5173"
echo "   - Mobile: http://[your-ip]:5173"
echo ""
echo "5. For production on port 80:"
echo "   Follow the nginx setup instructions above"
echo ""
echo "📱 Mobile Photo Capture:"
echo "   Access the web app from your phone's browser"
echo "   The interface will automatically adapt for mobile"
echo ""
echo "🔑 Default Test Users:"
echo "   - photographer@test.com (Photo upload)"
echo "   - processor@test.com (Review/Edit)"
echo "   - pricer@test.com (Set prices)"
echo "   - publisher@test.com (Final review)"
echo ""