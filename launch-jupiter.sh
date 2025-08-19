#!/bin/bash

# --- Jupiter Launcher for macOS ---
# This script installs dependencies, builds the app,
# starts the server, and opens it in your browser.

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# --- Main Script ---
clear
echo "🚀 Launching Jupiter..."
echo "--------------------------------"

# 1. Check for Node.js and npm
if ! command_exists node || ! command_exists npm; then
  echo "❌ Error: Node.js is not installed."
  echo "Please install Node.js and npm to continue."
  echo "You can download it from: https://nodejs.org/"
  exit 1
fi

echo "✅ Node.js and npm found."
echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"
echo "--------------------------------"

# 2. Install dependencies
echo "📦 Installing dependencies (this might take a moment)..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install npm dependencies."
    exit 1
fi
echo "✅ Dependencies installed."
echo "--------------------------------"

# 3. Build the frontend application
echo "🏗️ Building the application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to build the application."
    exit 1
fi
echo "✅ Application built successfully."
echo "--------------------------------"

# 4. Start the backend server
echo "🔥 Starting the Jupiter backend server..."
node jupiter-backend.js &
NODE_PID=$!

# Trap to kill the server on script exit (Ctrl+C)
trap "echo '🔌 Shutting down Jupiter server...'; kill $NODE_PID" EXIT

echo "✅ Server started with PID: $NODE_PID"
echo "--------------------------------"

# 5. Open the application in the browser
echo "🌐 Opening Jupiter in your browser..."
sleep 3 # Give the server a moment to start up
open http://localhost:3456

echo "--------------------------------"
echo "Jupiter is now running."
echo "The backend server is running in this terminal."
echo "Press Ctrl+C to shut down the server."
echo "--------------------------------"

# Wait for the server process to exit
wait $NODE_PID