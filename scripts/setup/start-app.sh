#!/bin/bash

echo "Starting Hackathon App..."

# 檢查 Node.js 是否已安裝
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# 檢查 MongoDB 是否運行
echo "Checking MongoDB connection..."
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/hackathon', {useNewUrlParser: true, useUnifiedTopology: true}).then(() => {console.log('MongoDB connected'); process.exit(0);}).catch(() => {console.log('MongoDB not running'); process.exit(1);});" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Warning: MongoDB is not running. Please start MongoDB first."
    echo "You can start MongoDB with: mongod"
fi

# 獲取腳本目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# 安裝後端依賴
echo "Installing backend dependencies..."
cd "$PROJECT_ROOT"
if [ ! -d "node_modules" ]; then
    echo "Installing backend packages..."
    npm install
fi

# 安裝前端依賴
echo "Installing frontend dependencies..."
cd client
if [ ! -d "node_modules" ]; then
    echo "Installing frontend packages..."
    npm install
fi
cd ..

# 啟動應用
echo "Starting the application..."
echo "Backend will run on http://localhost:5000"
echo "Frontend will run on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

# 使用 concurrently 同時啟動前後端
npx concurrently "npm run dev" "cd client && npm start"
