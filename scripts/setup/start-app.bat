@echo off
echo Starting Hackathon App...

REM 檢查 Node.js 是否已安裝
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM 檢查 MongoDB 是否運行
echo Checking MongoDB connection...
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/hackathon', {useNewUrlParser: true, useUnifiedTopology: true}).then(() => {console.log('MongoDB connected'); process.exit(0);}).catch(() => {console.log('MongoDB not running'); process.exit(1);});" 2>nul
if errorlevel 1 (
    echo Warning: MongoDB is not running. Please start MongoDB first.
    echo You can start MongoDB with: mongod
)

REM 安裝後端依賴
echo Installing backend dependencies...
cd /d "%~dp0\..\.."
if not exist node_modules (
    echo Installing backend packages...
    npm install
)

REM 安裝前端依賴
echo Installing frontend dependencies...
cd client
if not exist node_modules (
    echo Installing frontend packages...
    npm install
)
cd ..

REM 啟動應用
echo Starting the application...
echo Backend will run on http://localhost:5000
echo Frontend will run on http://localhost:3000
echo.
echo Press Ctrl+C to stop the application
echo.

REM 使用 concurrently 同時啟動前後端
npx concurrently "npm run dev" "cd client && npm start"
