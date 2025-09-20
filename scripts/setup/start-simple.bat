@echo off
echo 啟動師生通訊軟體...
echo.

echo 啟動 MongoDB 容器...
docker-compose -f docker-compose.dev.yml up -d mongodb

echo 等待 MongoDB 啟動...
timeout /t 3 /nobreak >nul

echo.
echo 啟動服務器...
start "Server" cmd /k "npm run server"

echo 等待服務器啟動...
timeout /t 5 /nobreak >nul

echo.
echo 啟動客戶端...
start "Client" cmd /k "cd client && npm start"

echo.
echo 應用程式正在啟動中...
echo 服務器: http://localhost:5000
echo 客戶端: http://localhost:3000
echo.
echo 測試帳戶:
echo 老師: teacher1@example.com / password123
echo 學生: student1@example.com / password123
echo 家長: parent1@example.com / password123
echo.
echo 按任意鍵停止所有服務...
pause

echo 停止服務...
taskkill /f /im node.exe 2>nul
docker-compose -f docker-compose.dev.yml down
