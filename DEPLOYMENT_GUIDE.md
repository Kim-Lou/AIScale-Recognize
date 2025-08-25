# 🚀 阿里云部署准备和版本管理指南

## 📋 版本管理策略

### 1. Git版本控制初始化

#### 初始化Git仓库
```bash
# 在项目根目录执行
git init

# 添加所有文件（排除.gitignore中的内容）
git add .

# 创建初始提交
git commit -m "Initial commit: ScaleSense AI system v1.0.0"

# 添加远程仓库（后续在阿里云创建后添加）
git remote add origin https://github.com/your-username/scalesense-ai.git
```

#### 分支策略
```bash
# 创建主要分支
git checkout -b develop          # 开发分支
git checkout -b staging          # 预发布分支
git checkout -b production       # 生产分支
git checkout main               # 回到主分支
```

### 2. 版本标签管理

#### 语义化版本号
```bash
# 创建版本标签
git tag -a v1.0.0 -m "第一个稳定版本 - 基础功能完整"
git tag -a v1.1.0 -m "新增图片上传功能"
git tag -a v1.2.0 -m "修复API端点问题和图片显示"

# 推送标签到远程
git push origin v1.0.0
git push origin --tags
```

## 🏗️ 阿里云部署准备

### 1. 环境配置分离

#### 创建环境配置文件
```bash
# 生产环境配置
.env.production
PORT=80
DB_PATH=/app/data/scalesense.db
JWT_SECRET=your-production-secret-key
EXTERNAL_API_KEY=your-production-api-key
CORS_ORIGIN=https://your-domain.com
USE_MOCK_DATA=false
ENABLE_SAMPLE_DATA=false

# 预发布环境配置
.env.staging
PORT=8080
DB_PATH=/app/data/scalesense.db
JWT_SECRET=your-staging-secret-key
EXTERNAL_API_KEY=your-staging-api-key
CORS_ORIGIN=https://staging.your-domain.com
```

### 2. Docker容器化

#### 创建Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 创建上传目录
RUN mkdir -p /app/server/uploads

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["npm", "run", "start:prod"]
```

#### 创建docker-compose.yml
```yaml
# docker-compose.yml
version: '3.8'
services:
  scalesense-app:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./data:/app/server/data
      - ./uploads:/app/server/uploads
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - scalesense-app
    restart: unless-stopped
```

### 3. 阿里云ECS部署脚本

#### 创建部署脚本
```bash
#!/bin/bash
# deploy-aliyun.sh

# 阿里云ECS部署脚本
set -e

echo "🚀 开始部署到阿里云..."

# 配置变量
ALIYUN_HOST="your-ecs-ip"
ALIYUN_USER="root"
PROJECT_NAME="scalesense-ai"
DEPLOY_PATH="/opt/scalesense-ai"

# 1. 构建生产版本
echo "📦 构建生产版本..."
npm run build

# 2. 打包应用
echo "📦 打包应用..."
tar -czf scalesense-ai.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=*.log \
  --exclude=server/uploads/* \
  --exclude=server/data/*.db \
  .

# 3. 上传到阿里云
echo "☁️ 上传到阿里云ECS..."
scp scalesense-ai.tar.gz $ALIYUN_USER@$ALIYUN_HOST:/tmp/

# 4. 远程部署
ssh $ALIYUN_USER@$ALIYUN_HOST << 'ENDSSH'
    # 创建部署目录
    sudo mkdir -p $DEPLOY_PATH
    cd $DEPLOY_PATH
    
    # 备份当前版本
    if [ -d "current" ]; then
        sudo mv current backup-$(date +%Y%m%d-%H%M%S)
    fi
    
    # 解压新版本
    sudo tar -xzf /tmp/scalesense-ai.tar.gz -f current/
    cd current
    
    # 安装依赖
    sudo npm ci --only=production
    
    # 设置权限
    sudo chown -R www-data:www-data .
    sudo chmod -R 755 server/uploads/
    
    # 重启服务
    sudo systemctl restart scalesense-ai
    
    # 健康检查
    sleep 5
    curl -f http://localhost:8080/api/health || exit 1
ENDSSH

echo "✅ 部署完成！"
```

## 🔧 阿里云环境准备

### 1. 服务器环境配置

#### 安装必要软件
```bash
# 阿里云ECS初始化脚本
sudo yum update -y
sudo yum install -y git nodejs npm nginx

# 安装PM2进程管理器
sudo npm install -g pm2

# 创建应用用户
sudo useradd -m -s /bin/bash scalesense
sudo usermod -aG nginx scalesense
```

#### 创建系统服务
```bash
# /etc/systemd/system/scalesense-ai.service
[Unit]
Description=ScaleSense AI Application
After=network.target

[Service]
Type=simple
User=scalesense
WorkingDirectory=/opt/scalesense-ai/current
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### 2. 数据库迁移策略

#### 数据备份和恢复
```bash
#!/bin/bash
# backup-database.sh

# 数据库备份脚本
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d-%H%M%S)
DB_FILE="/opt/scalesense-ai/current/server/data/scalesense.db"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
cp $DB_FILE $BACKUP_DIR/scalesense-$DATE.db

# 上传到OSS（阿里云对象存储）
ossutil cp $BACKUP_DIR/scalesense-$DATE.db oss://your-bucket/backups/

# 保留最近7天备份
find $BACKUP_DIR -name "scalesense-*.db" -mtime +7 -delete
```

### 3. SSL证书配置

#### Nginx配置
```nginx
# /etc/nginx/conf.d/scalesense.conf
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/your-cert.pem;
    ssl_certificate_key /etc/nginx/ssl/your-key.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        alias /opt/scalesense-ai/current/server/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📊 监控和日志

### 1. 应用监控
```bash
# 安装监控工具
sudo npm install -g pm2-logrotate

# 配置PM2监控
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# 启动应用监控
pm2 start server/index.js --name scalesense-ai
pm2 startup
pm2 save
```

### 2. 健康检查
```bash
#!/bin/bash
# health-check.sh

# 健康检查脚本
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health)

if [ $RESPONSE -eq 200 ]; then
    echo "$(date): Application is healthy"
    exit 0
else
    echo "$(date): Application is unhealthy, restarting..."
    pm2 restart scalesense-ai
    exit 1
fi
```

## 🔄 CI/CD流水线

### 1. GitHub Actions配置
```yaml
# .github/workflows/deploy.yml
name: Deploy to Aliyun

on:
  push:
    branches: [ production ]
  pull_request:
    branches: [ production ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to Aliyun
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.ALIYUN_HOST }}
        username: ${{ secrets.ALIYUN_USER }}
        key: ${{ secrets.ALIYUN_KEY }}
        script: |
          cd /opt/scalesense-ai
          ./deploy-aliyun.sh
```

## 📋 部署检查清单

### 预部署检查
- [ ] 代码已提交到Git仓库
- [ ] 所有测试通过
- [ ] 环境配置文件已创建
- [ ] Docker镜像构建成功
- [ ] 阿里云ECS已创建
- [ ] 域名已解析到ECS
- [ ] SSL证书已申请

### 部署步骤
1. **版本管理初始化** → 执行Git初始化
2. **环境配置** → 创建生产环境配置
3. **容器化** → 构建Docker镜像
4. **阿里云准备** → 配置ECS和域名
5. **部署执行** → 运行部署脚本
6. **验证测试** → 健康检查和功能测试
7. **监控配置** → 设置日志和监控

## 🆘 故障排除

### 常见问题
1. **端口冲突**：检查8080端口是否被占用
2. **权限问题**：确保uploads目录有写权限
3. **数据库连接**：验证SQLite文件路径
4. **CORS问题**：确认域名配置正确

### 应急回滚
```bash
# 快速回滚到上一版本
sudo systemctl stop scalesense-ai
sudo mv current backup-failed
cd /opt/scalesense-ai
sudo ln -s backup-$(date -d '1 day ago' +%Y%m%d-%H%M%S) current
sudo systemctl start scalesense-ai
```

**下一步行动建议：**
1. 立即初始化Git版本管理
2. 创建生产环境配置
3. 测试Docker容器化
4. 准备阿里云ECS环境