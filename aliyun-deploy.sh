#!/bin/bash

# 阿里云服务器部署自动化脚本
# 使用方法：chmod +x aliyun-deploy.sh && ./aliyun-deploy.sh

# 设置颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 检查是否以root用户运行
if [ "$(id -u)" != "0" ]; then
   echo -e "${RED}此脚本需要以root用户身份运行！${NC}"
   echo -e "请使用：sudo ./aliyun-deploy.sh"
   exit 1
fi

# 显示欢迎信息
echo -e "${BLUE}========================================${NC}"
 echo -e "${BLUE}  ScaleSense AI 阿里云服务器部署脚本   ${NC}"
 echo -e "${BLUE}========================================${NC}"

# 获取用户输入
read -p "请输入服务器公网IP: " SERVER_IP
read -p "请输入域名（可选，直接回车跳过）: " DOMAIN
read -p "请输入项目代码仓库地址: " GIT_REPO
read -p "请输入API密钥（用于外部系统集成）: " API_KEY

# 设置默认值
if [ -z "$DOMAIN" ]; then
    DOMAIN=$SERVER_IP
fi

# 记录开始时间
START_TIME=$(date +%s)

# 步骤1：更新系统包
echo -e "\n${YELLOW}步骤1：更新系统包...${NC}"
apt update && apt upgrade -y
if [ $? -ne 0 ]; then
    echo -e "${RED}系统更新失败，请检查网络连接后重试。${NC}"
    exit 1
fi

# 步骤2：安装必要软件
echo -e "\n${YELLOW}步骤2：安装必要软件...${NC}"
apt install -y git nginx curl build-essential
if [ $? -ne 0 ]; then
    echo -e "${RED}安装软件失败，请检查网络连接后重试。${NC}"
    exit 1
fi

# 步骤3：安装Node.js
echo -e "\n${YELLOW}步骤3：安装Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
if [ $? -ne 0 ]; then
    echo -e "${RED}Node.js安装失败，请检查网络连接后重试。${NC}"
    exit 1
fi

# 验证Node.js和npm安装
echo -e "\n${GREEN}Node.js版本: $(node -v)${NC}"
echo -e "${GREEN}npm版本: $(npm -v)${NC}"

# 步骤4：安装PM2
echo -e "\n${YELLOW}步骤4：安装PM2进程管理器...${NC}"
npm install -g pm2
if [ $? -ne 0 ]; then
    echo -e "${RED}PM2安装失败，请检查网络连接后重试。${NC}"
    exit 1
fi

# 步骤5：创建项目目录并克隆代码
echo -e "\n${YELLOW}步骤5：创建项目目录并克隆代码...${NC}"
mkdir -p /var/www/scalesense
cd /var/www/scalesense
git clone $GIT_REPO .
if [ $? -ne 0 ]; then
    echo -e "${RED}代码克隆失败，请检查仓库地址是否正确。${NC}"
    exit 1
fi

# 步骤6：配置环境变量
echo -e "\n${YELLOW}步骤6：配置环境变量...${NC}"
cp .env.example .env

# 使用sed命令更新.env文件
sed -i "s|^PORT=.*|PORT=5001|" .env
sed -i "s|^DB_PATH=.*|DB_PATH=/var/www/scalesense/server/data/scalesense.db|" .env
sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://$DOMAIN,https://$DOMAIN|" .env
sed -i "s|^EXTERNAL_API_KEY=.*|EXTERNAL_API_KEY=$API_KEY|" .env
sed -i "s|^REACT_APP_API_BASE_URL=.*|REACT_APP_API_BASE_URL=http://$SERVER_IP:5001/api|" .env
sed -i "s|^REACT_APP_BACKEND_BASE_URL=.*|REACT_APP_BACKEND_BASE_URL=http://$SERVER_IP:5001|" .env

# 显示配置摘要
echo -e "\n${GREEN}环境变量配置摘要：${NC}"
echo -e "- 服务器端口: 5001"
echo -e "- 数据库路径: /var/www/scalesense/server/data/scalesense.db"
echo -e "- CORS源: http://$DOMAIN,https://$DOMAIN"
echo -e "- API密钥: $API_KEY"

echo -e "\n${YELLOW}步骤7：安装项目依赖...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}依赖安装失败，请检查网络连接后重试。${NC}"
    exit 1
fi

# 步骤8：构建前端项目
echo -e "\n${YELLOW}步骤8：构建前端项目...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}前端构建失败，请检查代码是否有错误。${NC}"
    exit 1
fi

# 步骤9：创建uploads目录并设置权限
echo -e "\n${YELLOW}步骤9：创建uploads目录并设置权限...${NC}"
mkdir -p server/uploads
chmod -R 775 server/uploads

# 步骤10：配置Nginx
echo -e "\n${YELLOW}步骤10：配置Nginx...${NC}"

# 备份现有配置
NGINX_CONFIG="/etc/nginx/sites-available/scalesense"
if [ -f "$NGINX_CONFIG" ]; then
    mv "$NGINX_CONFIG" "${NGINX_CONFIG}.bak$(date +%Y%m%d%H%M%S)"
fi

# 创建新的Nginx配置
cat > $NGINX_CONFIG << EOL
server {
    listen 80;
    server_name $DOMAIN $SERVER_IP;

    # 前端静态文件
    location / {
        root /var/www/scalesense/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # API请求转发
    location /api {
        proxy_pass http://localhost:5001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # 静态资源访问
    location /uploads {
        alias /var/www/scalesense/server/uploads;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
EOL

# 启用配置
ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/

# 测试Nginx配置
nginx -t
if [ $? -ne 0 ]; then
    echo -e "${RED}Nginx配置错误，请检查配置文件。${NC}"
    exit 1
fi

# 重启Nginx
systemctl restart nginx
if [ $? -ne 0 ]; then
    echo -e "${RED}Nginx重启失败，请检查配置。${NC}"
    exit 1
fi

# 步骤11：启动后端服务
echo -e "\n${YELLOW}步骤11：启动后端服务...${NC}"

# 先手动启动一次以确保数据库初始化成功
cd /var/www/scalesense
node server/index.js &
SERVER_PID=$!

# 等待3秒让数据库初始化
echo -e "${BLUE}等待数据库初始化...${NC}"
sleep 3

# 停止手动启动的服务
kill $SERVER_PID

# 使用PM2启动并设置开机自启
echo -e "${BLUE}使用PM2启动服务...${NC}"
pm2 start server/index.js --name scalesense-server

# 保存当前PM2进程列表，并设置开机自启
pm2 save
pm2 startup systemd
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}PM2开机自启设置可能需要手动完成。${NC}"
fi

# 步骤12：配置防火墙（可选）
echo -e "\n${YELLOW}步骤12：配置防火墙（可选）...${NC}"
read -p "是否配置防火墙（y/n，默认n）: " CONFIG_FIREWALL

if [ "$CONFIG_FIREWALL" = "y" ] || [ "$CONFIG_FIREWALL" = "Y" ]; then
    echo -e "${BLUE}配置防火墙，开放必要端口...${NC}"
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw allow 5001/tcp  # API服务
    ufw --force enable
    echo -e "${GREEN}防火墙配置完成。${NC}"
fi

# 记录结束时间
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# 显示完成信息
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  ScaleSense AI 部署完成！              ${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${GREEN}部署信息：${NC}"
echo -e "- 部署时间：$(date)"
echo -e "- 总耗时：${DURATION}秒"
echo -e "- 系统访问地址：http://$SERVER_IP 或 http://$DOMAIN"
echo -e "- 登录账号：admin"
echo -e "- 默认密码：admin123（首次登录后请及时修改）"
echo -e "- 后端API地址：http://$SERVER_IP:5001/api"
echo -e "\n${YELLOW}注意事项：${NC}"
echo -e "1. 首次登录系统后，请立即修改管理员密码"
echo -e "2. 建议配置SSL证书启用HTTPS访问"
echo -e "3. 定期备份数据库和配置文件"
echo -e "4. 如需使用SSL证书，可运行：certbot --nginx -d $DOMAIN"
echo -e "\n${BLUE}查看日志命令：pm2 logs scalesense-server${NC}"
echo -e "${BLUE}重启服务命令：pm2 restart scalesense-server${NC}"