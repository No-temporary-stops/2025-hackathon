#!/bin/bash

echo "正在啟動師生通訊軟體..."
echo

# 檢查 Node.js 是否已安裝
if ! command -v node &> /dev/null; then
    echo "錯誤：未找到 Node.js，請先安裝 Node.js"
    echo "下載地址：https://nodejs.org/"
    exit 1
fi

# 檢查 MongoDB 是否已安裝
if ! command -v mongod &> /dev/null; then
    echo "警告：未找到 MongoDB，請確保 MongoDB 服務正在運行"
    echo "下載地址：https://www.mongodb.com/try/download/community"
fi

echo "Node.js 版本：$(node --version)"
echo

# 安裝服務器依賴
echo "安裝服務器依賴..."
npm install
if [ $? -ne 0 ]; then
    echo "錯誤：安裝服務器依賴失敗"
    exit 1
fi

# 安裝客戶端依賴
echo
echo "安裝客戶端依賴..."
cd client
npm install
if [ $? -ne 0 ]; then
    echo "錯誤：安裝客戶端依賴失敗"
    cd ..
    exit 1
fi
cd ..

# 創建環境配置文件
echo
echo "創建環境配置文件..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "已創建 .env 文件，請根據需要修改配置"
fi

echo
echo "啟動應用程式..."
echo "服務器將在 http://localhost:5000 運行"
echo "客戶端將在 http://localhost:3000 運行"
echo
echo "按 Ctrl+C 停止服務器"
echo

npm run dev
