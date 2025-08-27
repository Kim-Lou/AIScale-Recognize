# 阿里云服务器部署和执行指引

本指南将详细介绍如何在阿里云ECS服务器上部署和运行ScaleSense AI系统。

## 一、服务器准备

### 1. 阿里云ECS实例创建

1. 登录阿里云控制台，选择ECS服务
2. 创建新实例，推荐配置：
   - 实例规格：至少2核4G内存
   - 操作系统：Ubuntu 20.04或CentOS 7/8
   - 存储：至少40GB SSD
   - 网络：配置公网IP，开放必要端口（80、443、22、5001）

### 2. 连接服务器

使用SSH连接到您的阿里云服务器：
```bash
ssh root@您的服务器公网IP
```

## 二、环境配置

### 1. 安装必要软件

#### Ubuntu系统
```bash
apt update && apt upgrade -y
apt install -y git nginx curl build-essential
```

#### CentOS系统
```bash
yum update -y
yum install -y git nginx curl gcc gcc-c++ make
```

### 2. 安装Node.js

```bash
# 使用NodeSource安装Node.js 16或18版本
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 验证安装
export PATH=$PATH:/usr/bin
node -v
npm -v
```

### 3. 安装PM2进程管理器

PM2用于管理Node.js应用程序的进程：
```bash
npm install -g pm2
```

## 三、项目部署

### 1. 克隆项目代码

```bash
# 创建项目目录
mkdir -p /var/www/scalesense
cd /var/www/scalesense

# 克隆项目代码
# 注意：请替换为您实际的代码仓库地址
git clone https://您的代码仓库地址 .
```

### 2. 配置环境变量

复制.env.example文件为.env，并根据您的环境进行配置：

```bash
cp .env.example .env
nano .env
```

编辑.env文件，设置以下关键参数：

```env
# 服务器配置
PORT=5001

# 数据库配置
DB_PATH=/var/www/scalesense/server/data/scalesense.db

# CORS配置
CORS_ORIGIN=http://您的域名,https://您的域名

# API密钥配置（用于外部系统集成）
EXTERNAL_API_KEY=您的API密钥

# 前端配置（生产环境）
REACT_APP_API_BASE_URL=http://您的服务器IP:5001/api
REACT_APP_BACKEND_BASE_URL=http://您的服务器IP:5001
```

### 3. 安装依赖并构建项目

```bash
# 安装项目依赖
npm install

# 构建前端项目
npm run build

# 确保uploads目录存在
mkdir -p server/uploads
chmod -R 775 server/uploads
```

## 四、Nginx配置

配置Nginx作为反向代理，处理前端静态文件和API请求转发：

```bash
nano /etc/nginx/sites-available/scalesense
```

添加以下配置内容：

```nginx
server {
    listen 80;
    server_name 您的域名 您的服务器IP;

    # 前端静态文件
    location / {
        root /var/www/scalesense/dist;
        try_files $uri $uri/ /index.html;
    }

    # API请求转发
    location /api {
        proxy_pass http://localhost:5001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源访问
    location /uploads {
        alias /var/www/scalesense/server/uploads;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

启用配置并重启Nginx：

```bash
ln -s /etc/nginx/sites-available/scalesense /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 五、启动后端服务

使用PM2启动后端服务：

```bash
cd /var/www/scalesense
pm run build  # 确保前端已构建

# 启动后端服务并设置开机自启
pm run server # 先手动启动一次以确保数据库初始化成功
pm stop server
pm install pm2 -g
pm start server # 使用PM2启动后端服务
pm run dev # 如果需要同时启动前端开发服务器

# 保存当前PM2进程列表，并设置开机自启
pm save
pm startup
```

## 六、配置SSL证书（可选但推荐）

为了提高安全性，建议配置SSL证书启用HTTPS：

```bash
# 使用Certbot安装Let's Encrypt证书
apt install certbot python3-certbot-nginx -y
certbot --nginx -d 您的域名

# 配置证书自动续期
systemctl enable certbot.timer
```

## 七、外部系统集成配置

如果您需要让外部系统通过API集成，请确保：

1. 已在.env文件中设置了有效的EXTERNAL_API_KEY
2. 防火墙已开放5001端口的访问权限
3. 外部系统使用正确的API端点和密钥进行通信

API端点格式：`http://您的服务器IP:5001/api/external/weight-records`

## 八、系统维护

### 1. 查看日志

```bash
# 查看后端服务日志
pm logs server

# 查看Nginx访问日志
cat /var/log/nginx/access.log

# 查看Nginx错误日志
cat /var/log/nginx/error.log
```

### 2. 重启服务

```bash
# 重启后端服务
pm restart server

# 重启Nginx
systemctl restart nginx
```

### 3. 部署更新

```bash
cd /var/www/scalesense
# 拉取最新代码
git pull
# 安装新依赖（如果有）
npm install
# 重建前端项目
npm run build
# 重启后端服务
npm restart server
```

## 九、常见问题与解决方案

### 1. 服务无法启动
- 检查端口是否被占用：`netstat -tuln | grep 5001`
- 查看PM2日志：`pm2 logs server`
- 检查.env配置是否正确

### 2. 数据库连接错误
- 确保数据库文件路径正确且有读写权限
- 检查数据库文件是否存在：`ls -la server/data/scalesense.db`
- 尝试重新初始化数据库：删除数据库文件后重启服务

### 3. API请求返回401错误
- 检查认证token是否有效
- 确认CORS配置是否正确
- 验证用户权限设置

### 4. 图片上传失败
- 检查uploads目录权限：`chmod -R 775 server/uploads`
- 验证Nginx配置中uploads路径是否正确
- 检查文件大小是否超过限制

## 十、安全建议

1. 定期更新系统和依赖包：`apt update && apt upgrade -y`
2. 更改SSH默认端口（22）为其他端口
3. 禁用root用户直接登录，使用sudo权限的普通用户
4. 配置防火墙，只开放必要的端口
5. 定期备份数据库和重要配置文件

## 十一、系统访问

部署完成后，您可以通过以下方式访问系统：
- Web界面：`http://您的服务器IP`或`http://您的域名`
- 登录账号：默认管理员账号为admin，密码为admin123（首次登录后请及时修改）

---

本部署指南适用于阿里云ECS服务器，如有特殊环境需求，请根据实际情况进行调整。如有任何问题，请参考项目文档或联系技术支持。