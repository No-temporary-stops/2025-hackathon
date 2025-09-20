#!/bin/bash

echo "啟動師生通訊軟體..."
echo

echo "啟動 MongoDB 容器..."
docker-compose -f docker-compose.dev.yml up -d mongodb

echo "等待 MongoDB 啟動..."
sleep 3

echo
echo "啟動服務器..."
npm run server &
SERVER_PID=$!

echo "等待服務器啟動..."
sleep 5

echo
echo "啟動客戶端..."
cd client
npm start &
CLIENT_PID=$!
cd ..

echo
echo "應用程式正在啟動中..."
echo "服務器: http://localhost:5000"
echo "客戶端: http://localhost:3000"
echo
echo "測試帳戶:"
echo "老師: teacher1@example.com / password123"
echo "學生: student1@example.com / password123"
echo "家長: parent1@example.com / password123"
echo
echo "按 Ctrl+C 停止所有服務..."

# 等待用戶中斷
trap 'echo "停止服務..."; kill $SERVER_PID $CLIENT_PID 2>/dev/null; docker-compose -f docker-compose.dev.yml down; exit' INT

# 保持腳本運行
wait
