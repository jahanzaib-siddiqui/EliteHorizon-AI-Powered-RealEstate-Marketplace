#!/bin/bash
# ── ELITE HORIZON — Run All Services ──

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

clear
echo "=========================================================="
echo "         🚀 STARTING ELITE HORIZON SERVICES 🚀"
echo "=========================================================="

# Function to check if a port is in use and free it
free_port() {
  local port=$1
  local pid=$(lsof -t -i:$port)
  if [ ! -z "$pid" ]; then
    echo "⚠️ Port $port is in use. Freeing process $pid..."
    kill -9 $pid 2>/dev/null
    sleep 0.5
  fi
}

# Clean ports to prevent startup conflicts
echo "🔍 Checking ports..."
free_port 5001  # Express Backend
free_port 5002  # Flask ML API
free_port 5173  # React User Frontend (Vite)
free_port 5174  # React Admin Panel (Vite)

# 1. Start Node Express Database Server in a new Terminal window
echo "📦 Launching Node Express Server (Port 5001)..."
osascript -e 'tell application "Terminal" to do script "cd '"$DIR/backend"' && npm run dev"'

# 2. Start Flask ML API in a new Terminal window
echo "🧠 Launching Python Machine Learning API (Port 5002)..."
osascript -e 'tell application "Terminal" to do script "cd '"$DIR/ai-models"' && python3 predict_api.py"'

# 3. Start React User Frontend in a new Terminal window
echo "💻 Launching React User Frontend (Port 5173)..."
osascript -e 'tell application "Terminal" to do script "cd '"$DIR/frontend"' && npm run dev"'

# 4. Start React Admin Panel in a new Terminal window
echo "🛡️ Launching React Admin Panel (Port 5174)..."
osascript -e 'tell application "Terminal" to do script "cd '"$DIR/admin"' && npm run dev"'

# 5. Wait for servers to spin up and launch browser windows
echo "🌐 Opening User site (http://localhost:5173) in browser..."
sleep 2.5
open "http://localhost:5173"

echo "🌐 Opening Admin Panel (http://localhost:5174) in browser..."
sleep 0.5
open "http://localhost:5174"

echo "=========================================================="
echo "  ✅ All 4 servers launched in separate Terminal windows!"
echo "  💡 Close those windows to stop the servers when done."
echo "=========================================================="
