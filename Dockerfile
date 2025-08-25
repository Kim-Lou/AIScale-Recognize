# 使用Node.js官方镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装所有依赖（包括服务器依赖）
RUN npm install

# 复制项目文件
COPY . .

# 创建上传目录
RUN mkdir -p server/uploads

# 暴露端口
EXPOSE 5173 5000

# 启动命令
CMD ["npm", "run", "start"]