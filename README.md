# 師生通訊軟體

一個專門為師生設計的現代化通訊軟體，支援家長、老師和學生之間的多種溝通方式。

## 功能特色

### 🔐 用戶認證系統
- 支援三種用戶角色：老師、家長、學生
- 安全的註冊和登入系統
- JWT token 認證

### 💬 私訊功能
- 家長與老師之間的私人訊息
- 實時訊息傳送和接收
- 訊息已讀狀態顯示
- 打字指示器

### 📚 學期管理系統
- 按學期組織用戶和內容
- 學期結束後自動調整顯示優先級
- 活躍學期優先顯示
- 已結束學期可切換查看

### 💭 公有討論區
- 創建和參與討論串
- 分類管理（一般討論、作業、公告、問題、活動）
- 標籤系統
- 置頂和關閉討論功能
- 搜尋功能，自動跳轉到相關討論串

### 🔍 智能搜尋
- 關鍵字搜尋討論串
- 自動跳轉到已存在的相關討論
- 避免重複討論串的創建

### 📱 現代化界面
- 響應式設計，支援桌面和移動設備
- Material-UI 設計系統
- 直觀的用戶體驗

## 技術架構

### 後端
- **Node.js** + **Express.js** - 服務器框架
- **MongoDB** + **Mongoose** - 數據庫和ODM
- **Socket.io** - 實時通訊
- **JWT** - 身份認證
- **bcryptjs** - 密碼加密

### 前端
- **React** + **TypeScript** - 用戶界面框架
- **Material-UI** - UI 組件庫
- **React Router** - 路由管理
- **React Query** - 數據獲取和緩存
- **React Hook Form** - 表單處理
- **Socket.io Client** - 實時通訊客戶端

## 安裝和運行

### 環境要求
- Node.js (v16 或更高版本)
- MongoDB (v4.4 或更高版本)
- npm 或 yarn

### 1. 克隆項目
```bash
git clone <repository-url>
cd teacher-student-communication-app
```

### 2. 安裝依賴
```bash
# 安裝服務器依賴
npm install

# 安裝客戶端依賴
cd client
npm install
cd ..
```

### 3. 環境配置
創建 `.env` 文件在根目錄：
```env
MONGODB_URI=mongodb://localhost:27017/teacher-student-app
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
NODE_ENV=development
```

### 4. 啟動應用程式

#### 開發模式（推薦）
```bash
# 同時啟動服務器和客戶端
npm run dev
```

#### 分別啟動
```bash
# 啟動服務器
npm run server

# 在另一個終端啟動客戶端
npm run client
```

### 5. 訪問應用程式
- 前端：http://localhost:3000
- 後端 API：http://localhost:5000

## 使用指南

### 註冊帳戶
1. 訪問註冊頁面
2. 選擇您的身份（老師/家長/學生）
3. 填寫必要信息：
   - 學生：需要提供學號和年級
   - 家長：需要提供子女姓名
   - 老師：可以選擇教學科目
4. 完成註冊

### 創建學期
1. 老師登入後可以創建新的學期
2. 設定學期名稱、開始和結束日期
3. 添加參與者（老師、家長、學生）

### 發送訊息
1. 在訊息頁面選擇收件人
2. 輸入訊息內容
3. 發送訊息，支援實時傳送

### 參與討論
1. 在討論區查看現有討論串
2. 使用搜尋功能查找相關討論
3. 創建新的討論串或回覆現有討論

## API 文檔

### 認證端點
- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/login` - 用戶登入
- `GET /api/auth/me` - 獲取當前用戶信息

### 訊息端點
- `POST /api/messages/send` - 發送訊息
- `GET /api/messages/conversations/:semesterId` - 獲取對話列表
- `GET /api/messages/conversation/:userId/:semesterId` - 獲取特定對話

### 學期端點
- `POST /api/semesters/create` - 創建學期
- `GET /api/semesters/my-semesters` - 獲取用戶學期
- `POST /api/semesters/:semesterId/add-participant` - 添加參與者

### 討論端點
- `POST /api/discussions/create` - 創建討論串
- `GET /api/discussions/semester/:semesterId` - 獲取學期討論串
- `GET /api/discussions/search/:semesterId` - 搜尋討論串

## 部署

### 生產環境部署
1. 構建客戶端：
```bash
cd client
npm run build
cd ..
```

2. 設置生產環境變量
3. 使用 PM2 或其他進程管理器運行服務器

### Docker 部署
```bash
# 構建 Docker 映像
docker build -t teacher-student-app .

# 運行容器
docker run -p 5000:5000 teacher-student-app
```

## 貢獻指南

1. Fork 項目
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權

此項目使用 MIT 授權 - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 聯絡方式

如有問題或建議，請通過以下方式聯絡：
- 創建 Issue
- 發送郵件至：[your-email@example.com]

## 更新日誌

### v1.0.0 (2025-01-01)
- 初始版本發布
- 基本用戶認證功能
- 私訊系統
- 學期管理
- 討論區功能
- 實時通訊支援
