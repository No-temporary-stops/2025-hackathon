# 快速開始指南

## 🚀 立即開始

### 方法一：使用啟動腳本（推薦）

**Windows 用戶：**
```bash
# 雙擊運行 start.bat 或在命令行中執行
start.bat
```

**Linux/Mac 用戶：**
```bash
# 在終端中執行
./start.sh
```

### 方法二：手動安裝

1. **安裝依賴**
```bash
# 安裝服務器依賴
npm install

# 安裝客戶端依賴
cd client
npm install
cd ..
```

2. **配置環境**
```bash
# 複製環境配置文件
copy env.example .env  # Windows
# 或
cp env.example .env    # Linux/Mac
```

3. **啟動應用程式**
```bash
# 開發模式（同時啟動服務器和客戶端）
npm run dev

# 或分別啟動
npm run server    # 服務器 (http://localhost:5000)
npm run client    # 客戶端 (http://localhost:3000)
```

### 方法三：使用 Docker（推薦用於生產環境）

```bash
# 使用 Docker Compose 啟動
docker-compose up -d

# 訪問應用程式
# 前端：http://localhost:5000
# API：http://localhost:5000/api
```

## 📝 創建測試數據

```bash
# 創建演示用戶和數據
npm run seed
```

這會創建以下測試帳戶：
- **老師1**: teacher1@example.com / password123
- **老師2**: teacher2@example.com / password123  
- **學生1**: student1@example.com / password123
- **學生2**: student2@example.com / password123
- **家長1**: parent1@example.com / password123
- **家長2**: parent2@example.com / password123

## 🎯 主要功能演示

### 1. 註冊和登入
- 訪問 http://localhost:3000
- 點擊「立即註冊」
- 選擇身份（老師/家長/學生）
- 填寫必要信息完成註冊

### 2. 創建學期（老師功能）
- 老師登入後
- 在儀表板創建新學期
- 添加參與者（其他老師、家長、學生）

### 3. 發送私訊
- 進入「訊息」頁面
- 選擇收件人
- 輸入訊息內容發送
- 支援實時訊息傳送

### 4. 參與討論
- 進入「討論區」
- 查看現有討論串
- 使用搜尋功能查找相關討論
- 創建新的討論串或回覆

### 5. 學期管理
- 學期結束後會自動調整顯示優先級
- 活躍學期優先顯示
- 已結束學期可切換查看

## 🔧 故障排除

### MongoDB 連接問題
```bash
# 檢查 MongoDB 是否運行
mongod --version

# 啟動 MongoDB 服務
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### 端口衝突
- 服務器端口 5000 被佔用：修改 `.env` 文件中的 `PORT`
- 客戶端端口 3000 被佔用：修改 `client/package.json` 中的啟動腳本

### 依賴安裝失敗
```bash
# 清除緩存重新安裝
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📱 移動端支援

應用程式完全支援移動設備：
- 響應式設計適配各種屏幕尺寸
- 觸控友好的界面
- 移動端優化的導航

## 🔒 安全注意事項

1. **生產環境部署時**：
   - 修改 JWT_SECRET
   - 使用強密碼
   - 啟用 HTTPS
   - 配置防火牆

2. **數據備份**：
   - 定期備份 MongoDB 數據
   - 保存用戶上傳的文件

## 📞 獲取幫助

- 查看完整文檔：`README.md`
- 創建 Issue 報告問題
- 檢查控制台錯誤信息

## 🎉 開始使用

現在您可以：
1. 註冊第一個帳戶
2. 創建學期
3. 邀請其他用戶
4. 開始使用通訊功能

祝您使用愉快！
