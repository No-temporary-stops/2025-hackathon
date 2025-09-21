#!/bin/bash

echo "========================================"
echo "    師生通訊軟體 - 一鍵啟動腳本"
echo "========================================"
echo

# 檢查 Docker 是否安裝
if ! command -v docker &> /dev/null; then
    echo "[錯誤] 請先安裝 Docker"
    echo "Ubuntu/Debian: sudo apt-get install docker.io"
    echo "macOS: brew install docker"
    echo "或下載 Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "[1/4] 檢查 Docker 狀態..."
if ! docker info &> /dev/null; then
    echo "[錯誤] Docker 未運行，請啟動 Docker 服務"
    echo "Ubuntu/Debian: sudo systemctl start docker"
    echo "macOS: 啟動 Docker Desktop"
    exit 1
fi

echo "[2/4] 啟動 MongoDB 容器..."
# 檢查容器是否已存在
if docker ps -a --format "table {{.Names}}" | grep -q "teacher-student-mongodb-dev"; then
    echo "MongoDB 容器已存在，正在啟動..."
    docker start teacher-student-mongodb-dev &> /dev/null
else
    echo "創建新的 MongoDB 容器..."
    docker run -d --name teacher-student-mongodb-dev -p 27017:27017 mongo:6.0 &> /dev/null
fi

# 等待 MongoDB 啟動
echo "等待 MongoDB 啟動..."
sleep 3

echo "[3/4] 安裝依賴..."
if [ ! -d "node_modules" ]; then
    echo "安裝服務器依賴..."
    npm install &> /dev/null
fi

if [ ! -d "client/node_modules" ]; then
    echo "安裝客戶端依賴..."
    cd client && npm install &> /dev/null && cd ..
fi

echo "[4/4] 創建環境配置文件..."
if [ ! -f ".env" ]; then
    cp env.example .env &> /dev/null
    echo "已創建 .env 文件，請根據需要修改配置"
fi

echo
echo "========================================"
echo "           啟動完成！"
echo "========================================"
echo
echo "正在啟動應用程式..."
echo "前端: http://localhost:3000"
echo "後端: http://localhost:5000"
echo
echo "按 Ctrl+C 停止服務器"
echo "========================================"

# 啟動應用程式
npm run dev
