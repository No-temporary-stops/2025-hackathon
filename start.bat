@echo off
echo ========================================
echo    師生通訊軟體 - 一鍵啟動腳本
echo ========================================
echo.

:: 檢查 Docker 是否安裝
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [錯誤] 請先安裝 Docker Desktop
    echo 下載地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [1/4] 檢查 Docker 狀態...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [錯誤] Docker 未運行，請啟動 Docker Desktop
    pause
    exit /b 1
)

echo [2/4] 啟動 MongoDB 容器...
:: 檢查容器是否已存在
docker ps -a --format "table {{.Names}}" | findstr "teacher-student-mongodb-dev" >nul
if %errorlevel% equ 0 (
    echo MongoDB 容器已存在，正在啟動...
    docker start teacher-student-mongodb-dev >nul
) else (
    echo 創建新的 MongoDB 容器...
    docker run -d --name teacher-student-mongodb-dev -p 27017:27017 mongo:6.0 >nul
)

:: 等待 MongoDB 啟動
echo 等待 MongoDB 啟動...
timeout /t 3 /nobreak >nul

echo [3/4] 安裝依賴...
if not exist node_modules (
    echo 安裝服務器依賴...
    npm install >nul 2>&1
)

if not exist client\node_modules (
    echo 安裝客戶端依賴...
    cd client
    npm install >nul 2>&1
    cd ..
)

echo [4/4] 創建環境配置文件...
if not exist .env (
    copy env.example .env >nul 2>&1
    echo 已創建 .env 文件，請根據需要修改配置
)

echo.
echo ========================================
echo           啟動完成！
echo ========================================
echo.
echo 正在啟動應用程式...
echo 前端: http://localhost:3000
echo 後端: http://localhost:5000
echo.
echo 按 Ctrl+C 停止服務器
echo ========================================

:: 啟動應用程式
npm run dev
