# 環境設置腳本

本目錄包含環境設置相關的腳本和配置文件。

## 文件說明

### 環境設置
- `healthcheck.js` - Docker 健康檢查腳本
- `mongo-init.js` - MongoDB 初始化腳本
- `Procfile` - 生產環境進程配置

### 一鍵啟動
項目根目錄的啟動腳本：
- `start.bat` - Windows 一鍵啟動腳本
- `start.sh` - Linux/Mac 一鍵啟動腳本

## 使用方式

### 推薦方式（一鍵啟動）
```bash
# Windows
start.bat

# Linux/Mac
./start.sh
```

### 手動設置
1. 啟動 MongoDB: `docker run -d --name teacher-student-mongodb-dev -p 27017:27017 mongo:6.0`
2. 安裝依賴: `npm install && cd client && npm install && cd ..`
3. 啟動應用: `npm run dev`

## 腳本功能

### 一鍵啟動腳本
- 自動檢查 Docker 安裝和運行狀態
- 自動啟動 MongoDB 容器
- 自動安裝所有依賴
- 創建環境配置文件
- 啟動應用程式

### 健康檢查
- 監控 MongoDB 連接狀態
- 自動重試機制
- 適合生產環境部署