# 環境設置和啟動腳本

這個資料夾包含所有環境設置和啟動相關的檔案。

## 檔案說明

### 啟動腳本
- `start-app.bat` - Windows 主要啟動腳本（推薦）
- `start-app.sh` - Linux/Mac 主要啟動腳本
- `start.bat` - 簡單啟動腳本（Windows）
- `start-simple.bat` - 簡化啟動腳本（Windows）
- `start-dev.bat` - 開發環境啟動腳本（Windows）
- `start.sh` - 簡單啟動腳本（Linux/Mac）
- `start-simple.sh` - 簡化啟動腳本（Linux/Mac）

### 環境配置文件
- `healthcheck.js` - 健康檢查腳本
- `mongo-init.js` - MongoDB 初始化腳本
- `Procfile` - Heroku 部署配置

## 使用方法

### Windows 用戶
```bash
# 推薦使用（自動檢查依賴並啟動）
scripts\setup\start-app.bat

# 或使用簡單版本
scripts\setup\start.bat
```

### Linux/Mac 用戶
```bash
# 推薦使用（自動檢查依賴並啟動）
./scripts/setup/start-app.sh

# 或使用簡單版本
./scripts/setup/start.sh
```

## 注意事項

1. 確保已安裝 Node.js (v14 或更高版本)
2. 確保 MongoDB 正在運行
3. 首次運行會自動安裝依賴包
4. 後端服務運行在 http://localhost:5000
5. 前端服務運行在 http://localhost:3000
