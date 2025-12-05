#!/bin/bash

#######################################################################
# ListFlow - Quick Start Script
# Starts both backend and frontend servers
#######################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════╗"
echo "║         Starting ListFlow                ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Check if .env exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo -e "${YELLOW}Warning: .env file not found. Run install.sh first.${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo -e "${YELLOW}Warning: Dependencies not installed. Run install.sh first.${NC}"
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo ""
    echo -e "${CYAN}Shutting down ListFlow...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${GREEN}Starting backend server...${NC}"
cd "$SCRIPT_DIR"
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo -e "${GREEN}Starting frontend server...${NC}"
cd "$SCRIPT_DIR/client"
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ListFlow is running!             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Backend API:${NC}  http://localhost:3001"
echo -e "  ${CYAN}Frontend:${NC}     http://localhost:5173"
echo ""
echo -e "Press ${YELLOW}Ctrl+C${NC} to stop all services"
echo ""

# Open browser (if available)
if command -v xdg-open &> /dev/null; then
    sleep 2
    xdg-open http://localhost:5173 2>/dev/null &
elif command -v open &> /dev/null; then
    sleep 2
    open http://localhost:5173 2>/dev/null &
fi

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
