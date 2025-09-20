# 多階段構建 Dockerfile

# 第一階段：構建客戶端
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production
COPY client/ ./
RUN npm run build

# 第二階段：構建服務器
FROM node:18-alpine AS server-build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 第三階段：生產環境
FROM node:18-alpine AS production
WORKDIR /app

# 安裝 MongoDB 工具（可選，用於健康檢查）
RUN apk add --no-cache mongodb-tools

# 複製服務器代碼和依賴
COPY --from=server-build /app/node_modules ./node_modules
COPY --from=server-build /app/package*.json ./
COPY server.js ./
COPY routes/ ./routes/
COPY models/ ./models/
COPY middleware/ ./middleware/

# 複製構建好的客戶端
COPY --from=client-build /app/client/build ./client/build

# 創建非root用戶
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# 暴露端口
EXPOSE 5000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 啟動命令
CMD ["node", "server.js"]
