# 2025 Hackathon 項目結構說明

## 📁 整體結構

```
2025-hackathon/
├── 📁 client/                    # React 前端應用
├── 📁 calendar-demo/             # 日曆功能演示
├── 📁 middleware/                # Express 中間件
├── 📁 models/                    # MongoDB 數據模型
├── 📁 routes/                    # API 路由
├── 📁 scripts/                   # 腳本文件
│   ├── 📁 setup/                 # 環境設置和啟動腳本
│   └── seed-data.js             # 數據初始化腳本
├── 📄 server.js                  # Express 服務器入口
├── 📄 package.json              # 後端依賴配置
├── 📄 env.example               # 環境變量示例
└── 📄 README.md                 # 項目說明
```

## 🚀 快速啟動

### Windows 用戶
```bash
# 推薦：使用智能啟動腳本
scripts\setup\start-app.bat

# 簡單啟動
scripts\setup\start.bat
```

### Linux/Mac 用戶
```bash
# 推薦：使用智能啟動腳本
./scripts/setup/start-app.sh

# 簡單啟動
./scripts/setup/start.sh
```

## 📋 詳細結構說明

### 🎨 前端 (client/)
```
client/
├── 📁 public/                   # 靜態資源
├── 📁 src/
│   ├── 📁 components/           # 可重用組件
│   │   ├── LoadingSpinner.tsx   # 載入動畫
│   │   └── Navbar.tsx           # 導航欄
│   ├── 📁 contexts/             # React Context
│   │   ├── AuthContext.tsx      # 認證狀態管理
│   │   └── SocketContext.tsx    # WebSocket 連接管理
│   ├── 📁 pages/                # 頁面組件
│   │   ├── Calendar.tsx         # 日曆頁面
│   │   ├── Dashboard.tsx        # 儀表板
│   │   ├── DiscussionDetail.tsx # 討論詳情
│   │   ├── Discussions.tsx      # 討論列表
│   │   ├── Login.tsx            # 登入頁面
│   │   ├── Messages.tsx         # 訊息中心 ⭐
│   │   ├── Profile.tsx          # 個人資料
│   │   └── Register.tsx         # 註冊頁面
│   ├── 📁 services/             # API 服務
│   │   └── api.ts               # HTTP 請求配置
│   ├── 📁 styles/               # 樣式文件
│   │   └── calendar.css         # 日曆樣式
│   ├── App.tsx                  # 主應用組件
│   └── index.tsx                # 入口文件
├── package.json                 # 前端依賴配置
└── tsconfig.json                # TypeScript 配置
```

### 🔧 後端結構
```
server/
├── 📁 middleware/
│   └── auth.js                  # JWT 認證中間件
├── 📁 models/                   # 數據模型
│   ├── Discussion.js            # 討論模型
│   ├── Message.js               # 訊息模型
│   ├── Semester.js              # 學期模型
│   └── User.js                  # 用戶模型
├── 📁 routes/                   # API 路由
│   ├── auth.js                  # 認證路由
│   ├── discussions.js           # 討論路由
│   ├── messages.js              # 訊息路由 ⭐
│   ├── semesters.js             # 學期路由
│   └── users.js                 # 用戶路由
├── 📁 scripts/
│   ├── 📁 setup/                # 環境設置
│   │   ├── start-app.bat        # Windows 智能啟動
│   │   ├── start-app.sh         # Linux/Mac 智能啟動
│   │   ├── healthcheck.js       # 健康檢查
│   │   ├── mongo-init.js        # MongoDB 初始化
│   │   └── Procfile             # Heroku 部署配置
│   └── seed-data.js             # 數據初始化
├── server.js                    # Express 服務器
├── package.json                 # 後端依賴
└── env.example                  # 環境變量示例
```

## 💬 Messages 功能詳解

### 🏗️ 架構設計
Messages 功能採用前後端分離架構：

1. **前端 (React + TypeScript)**
   - 使用 Material-UI 組件庫
   - Socket.io 客戶端實現即時通訊
   - React Query 管理服務器狀態

2. **後端 (Node.js + Express)**
   - RESTful API 設計
   - Socket.io 服務器處理即時通訊
   - MongoDB 存儲訊息數據

### 🔄 數據流程

#### 獲取對話列表
```
前端 → GET /api/messages/conversations/:semesterId
後端 → 查詢學期參與者 + 現有對話
後端 → 返回所有可聊天用戶（含對話狀態）
前端 → 顯示左側用戶列表
```

#### 發送訊息
```
前端 → POST /api/messages/send
後端 → 保存訊息到 MongoDB
後端 → 通過 Socket.io 廣播給接收者
前端 → 更新本地訊息列表
```

### 📡 API 端點

#### 訊息相關
- `GET /api/messages/conversations/:semesterId` - 獲取對話列表
- `GET /api/messages/conversation/:userId/:semesterId` - 獲取具體對話
- `POST /api/messages/send` - 發送訊息
- `PUT /api/messages/read/:messageId` - 標記已讀
- `PUT /api/messages/read-conversation/:userId/:semesterId` - 標記對話已讀
- `GET /api/messages/unread-count` - 獲取未讀數量

#### WebSocket 事件
- `join-room` - 加入聊天室
- `leave-room` - 離開聊天室
- `send-message` - 發送即時訊息
- `typing` - 打字指示器

### 🎯 核心功能

1. **用戶列表顯示**
   - 顯示學期中所有可聊天的用戶
   - 有對話記錄的用戶優先顯示
   - 顯示未讀訊息數量徽章
   - 顯示用戶角色標籤

2. **即時通訊**
   - 即時發送和接收訊息
   - 打字指示器
   - 訊息已讀狀態

3. **訊息管理**
   - 訊息歷史記錄
   - 按學期分組
   - 自動滾動到最新訊息

## 🔧 開發環境設置

### 必要條件
- Node.js v14+
- MongoDB
- npm 或 yarn

### 環境變量
複製 `env.example` 為 `.env` 並配置：
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hackathon
JWT_SECRET=your-secret-key
REACT_APP_API_URL=http://localhost:5000/api
```

### 數據初始化
```bash
# 運行數據初始化腳本
node scripts/seed-data.js
```

## 🚀 部署

### 本地開發
```bash
# 使用智能啟動腳本（推薦）
scripts/setup/start-app.bat  # Windows
./scripts/setup/start-app.sh # Linux/Mac
```

### 生產環境
- 使用 `scripts/setup/Procfile` 進行 Heroku 部署
- 配置 MongoDB Atlas 作為生產數據庫
- 設置環境變量

## 📝 注意事項

1. **數據庫**: 確保 MongoDB 正在運行
2. **端口**: 後端 5000，前端 3000
3. **依賴**: 首次運行會自動安裝依賴
4. **認證**: 使用 JWT 進行用戶認證
5. **即時通訊**: 需要 WebSocket 支持
