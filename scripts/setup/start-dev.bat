@echo off
echo 正在啟動師生通訊軟體開發環境...
echo.

echo 檢查 Docker 是否運行...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo 錯誤：Docker 未運行，請先啟動 Docker Desktop
    pause
    exit /b 1
)

echo 啟動 MongoDB 容器...
docker-compose -f docker-compose.dev.yml up -d mongodb

echo 等待 MongoDB 啟動...
timeout /t 5 /nobreak >nul

echo.
echo 檢查 Node.js 是否已安裝...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 錯誤：未找到 Node.js，請先安裝 Node.js
    echo 下載地址：https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo 安裝服務器依賴...
npm install
if %errorlevel% neq 0 (
    echo 錯誤：安裝服務器依賴失敗
    pause
    exit /b 1
)

echo.
echo 安裝客戶端依賴...
cd client
npm install
if %errorlevel% neq 0 (
    echo 錯誤：安裝客戶端依賴失敗
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo 創建環境配置文件...
if not exist .env (
    copy env.example .env
    echo 已創建 .env 文件，使用 Docker MongoDB 配置
)

echo.
echo 創建演示數據...
npm run seed
if %errorlevel% neq 0 (
    echo 警告：創建演示數據失敗，但應用程式仍可正常運行
)

echo.
echo 啟動應用程式...
echo 服務器將在 http://localhost:5000 運行
echo 客戶端將在 http://localhost:3000 運行
echo MongoDB 在 Docker 容器中運行
echo.
echo 測試帳戶：
echo 老師: teacher1@example.com / password123
echo 學生: student1@example.com / password123
echo 家長: parent1@example.com / password123
echo.
echo 按 Ctrl+C 停止服務器
echo.

npm run dev

echo.
echo 停止 MongoDB 容器...
docker-compose -f docker-compose.dev.yml down

pause
