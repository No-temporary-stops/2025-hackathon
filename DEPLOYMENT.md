# 部署指南

## 🌐 雲端部署（推薦給客戶使用）

### 部署到 Heroku（最簡單）

1. **準備工作**
```bash
# 安裝 Heroku CLI
# 下載：https://devcenter.heroku.com/articles/heroku-cli
```

2. **創建 Heroku 應用**
```bash
# 登入 Heroku
heroku login

# 創建應用
heroku create your-app-name

# 添加 MongoDB 插件（免費）
heroku addons:create mongolab:sandbox

# 設置環境變量
heroku config:set JWT_SECRET=your_production_secret_key
heroku config:set NODE_ENV=production
```

3. **部署**
```bash
# 推送代碼
git push heroku main

# 創建演示數據
heroku run npm run seed
```

4. **訪問應用**
- 您的應用網址：`https://your-app-name.herokuapp.com`
- 客戶只需訪問這個網址即可使用

### 部署到 Railway

1. **連接 GitHub**
   - 將代碼推送到 GitHub
   - 在 Railway 連接您的 GitHub 倉庫

2. **設置環境變量**
```
MONGODB_URI=自動提供
JWT_SECRET=your_production_secret
NODE_ENV=production
```

3. **自動部署**
   - Railway 會自動構建和部署
   - 每次推送代碼都會自動更新

### 部署到 Vercel + MongoDB Atlas

1. **設置 MongoDB Atlas**
   - 在 https://cloud.mongodb.com 創建免費集群
   - 獲取連接字符串

2. **部署到 Vercel**
```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

3. **設置環境變量**
```
MONGODB_URI=您的 Atlas 連接字符串
JWT_SECRET=your_production_secret
NODE_ENV=production
```

## 🏠 自託管部署

### 使用 Docker（推薦）

```bash
# 克隆代碼到您的伺服器
git clone <your-repo>
cd teacher-student-communication-app

# 使用 Docker Compose 部署
docker-compose up -d

# 創建演示數據
docker-compose exec app npm run seed
```

### 傳統部署

1. **伺服器要求**
   - Ubuntu 18.04+ 或 CentOS 7+
   - Node.js 16+
   - MongoDB 4.4+
   - Nginx（反向代理）

2. **部署步驟**
```bash
# 安裝依賴
npm install --production

# 構建前端
cd client && npm run build && cd ..

# 使用 PM2 運行
npm install -g pm2
pm2 start server.js --name "teacher-student-app"

# 設置 Nginx
sudo nano /etc/nginx/sites-available/your-domain
```

## 📊 部署架構說明

### 客戶使用流程

```
客戶瀏覽器 → 您的網址 → 雲端伺服器 → MongoDB 數據庫
```

**客戶需要做的：**
- ✅ 打開瀏覽器
- ✅ 輸入您的網址
- ✅ 開始使用

**客戶不需要做的：**
- ❌ 安裝任何軟體
- ❌ 配置數據庫
- ❌ 管理伺服器

### 您需要管理的：

1. **伺服器維護**
   - 定期更新代碼
   - 監控伺服器狀態
   - 備份數據

2. **用戶管理**
   - 創建學期
   - 管理用戶權限
   - 處理技術支援

3. **數據備份**
   - 定期備份 MongoDB
   - 保存用戶上傳文件

## 💰 成本估算

### Heroku（免費方案）
- **優點**：完全免費，易於部署
- **限制**：應用會在 30 分鐘無活動後休眠
- **適合**：小規模測試使用

### Railway
- **費用**：$5/月
- **優點**：24/7 運行，自動部署
- **適合**：小型生產環境

### Vercel + MongoDB Atlas
- **費用**：免費（有使用限制）
- **優點**：高性能，全球 CDN
- **適合**：中等規模使用

### 自託管（VPS）
- **費用**：$5-20/月
- **優點**：完全控制，無限制
- **適合**：大型部署

## 🚀 推薦部署方案

### 小型學校/機構
**推薦：Heroku + MongoDB Atlas**
- 成本：免費
- 設置時間：30 分鐘
- 維護難度：低

### 中型學校/機構
**推薦：Railway**
- 成本：$5/月
- 設置時間：15 分鐘
- 維護難度：低

### 大型學校/機構
**推薦：自託管 VPS**
- 成本：$20/月
- 設置時間：2 小時
- 維護難度：中等

## 📞 客戶支援

部署完成後，您可以：

1. **提供使用指南**
   - 發送網址給客戶
   - 提供測試帳戶
   - 製作使用教學影片

2. **遠程支援**
   - 通過電話指導
   - 遠程桌面協助
   - 在線客服

3. **培訓服務**
   - 為老師提供培訓
   - 為管理員提供培訓
   - 定期功能更新說明
