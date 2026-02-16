# 基于 Node.js 18 Alpine 镜像（轻量、启动快）
FROM node:18-alpine

# 创建工作目录
WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存层加速构建
COPY package*.json ./

# 安装生产依赖
RUN npm install --production

# 复制项目代码
COPY . .

# 暴露端口（云托管默认监听 80）
EXPOSE 80

# 启动服务
CMD ["node", "src/app.js"]
