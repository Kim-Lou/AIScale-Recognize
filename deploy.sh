#!/bin/bash

# ScaleSense AI 一键部署/更新脚本
# 适用于 Ubuntu/CentOS/macOS

set -e

# 检测是否为更新模式（通过参数或检查是否存在.server.pid文件）
UPDATE_MODE=false
if [ "$1" == "--update" ] || [ -f .server.pid ]; then
    UPDATE_MODE=true
    echo "🔄 开始更新 ScaleSense AI 系统..."
else
    echo "🚀 开始部署 ScaleSense AI 系统..."
fi

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 更新模式：停止现有服务
if [ "$UPDATE_MODE" == true ] && [ -f .server.pid ]; then
    echo "🛑 停止现有服务..."
    OLD_PID=$(cat .server.pid)
    if ps -p $OLD_PID > /dev/null; then
        kill $OLD_PID || true
        sleep 2
        echo -e "${GREEN}✅ 旧服务已停止${NC}"
    else
        echo -e "${YELLOW}⚠️  未找到运行中的旧服务${NC}"
    fi
    rm -f .server.pid
fi

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，正在安装...${NC}"
    
    # 检测操作系统
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install node
    else
        echo "请手动安装 Node.js 18+"
        exit 1
    fi
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js 版本: $(node --version)${NC}"
echo -e "${GREEN}✅ npm 版本: $(npm --version)${NC}"

# 更新模式：清理旧依赖并重新安装
if [ "$UPDATE_MODE" == true ]; then
    echo "🧹 清理旧依赖..."
    # 只删除node_modules，保留package-lock.json以保持依赖版本一致性
    rm -rf node_modules
fi

# 更新package.json中的依赖版本到指定版本
echo "🔧 确保依赖版本一致性..."
# 更新React相关依赖到指定版本
npm pkg set dependencies.react="18.3.1"
npm pkg set dependencies.react-dom="18.3.1"
# 更新开发工具依赖到指定版本
npm pkg set devDependencies.vite="5.4.8"
npm pkg set devDependencies."@vitejs/plugin-react"="4.3.2"
echo -e "${GREEN}✅ 依赖版本已更新到指定版本${NC}"

# 智能安装依赖：处理原生模块兼容性问题
echo "📦 检查项目依赖..."
# 设置npm镜像源加速安装
npm config set registry https://registry.npmmirror.com

# 清理并重新安装依赖以避免Node.js版本不匹配问题
if [ ! -d "node_modules" ] || [ "$UPDATE_MODE" == true ]; then
    echo "📦 安装项目依赖..."
    # 添加重试机制（最多3次）
    MAX_RETRIES=3
    retry_count=0
    while [ $retry_count -lt $MAX_RETRIES ]; do
        # 清理可能存在的不兼容依赖
        rm -rf node_modules
        
        if npm install && npm rebuild; then
            # 特别处理better-sqlite3等原生模块
            echo "🔄 确保原生模块正确编译..."
            npm rebuild better-sqlite3
            echo -e "${GREEN}✅ 依赖安装成功，原生模块已重新编译${NC}"
            break
        fi
        retry_count=$((retry_count + 1))
        echo -e "${YELLOW}⚠️  依赖安装失败，${retry_count}/${MAX_RETRIES}次重试...${NC}"
        sleep 5
    done
    
    if [ $retry_count -eq $MAX_RETRIES ]; then
        echo -e "${RED}❌ 依赖安装失败，请检查网络连接后重试${NC}"
        exit 1
    fi
else
    # 如果node_modules已存在，仍需重新编译原生模块以确保兼容性
    echo "🔄 重新编译原生模块以确保与当前Node.js版本兼容..."
    npm rebuild
    npm rebuild better-sqlite3
    echo -e "${GREEN}✅ 原生模块已重新编译完成${NC}"
fi

# 创建必要目录
mkdir -p server/uploads
mkdir -p server/data

# 生成随机密钥的函数
generate_random_key() {
    # 生成32字节随机数据并转换为base64，再替换特殊字符
    if command -v openssl &> /dev/null; then
        openssl rand -base64 32 | tr -d '/+' | cut -c1-48
    else
        # 如果没有openssl，使用tr和/dev/urandom作为备选
        tr -dc 'A-Za-z0-9' < /dev/urandom | fold -w 48 | head -n 1
    fi
}

# 复制环境配置并生成随机密钥
if [ ! -f .env ]; then
    echo "📝 创建环境配置文件..."
    if [ -f .env.example ]; then
        cp .env.example .env
        # 生成随机密钥并替换.env文件中的占位符
        JWT_SECRET=$(generate_random_key)
        KEY_GENERATOR_SECRET=$(generate_random_key)
        
        # 使用sed命令替换占位符
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS上的sed需要空字符串作为备份
            sed -i '' "s/your_strong_jwt_secret_here/$JWT_SECRET/g" .env
            sed -i '' "s/your_strong_key_generator_secret_here/$KEY_GENERATOR_SECRET/g" .env
        else
            # Linux上的sed
            sed -i "s/your_strong_jwt_secret_here/$JWT_SECRET/g" .env
            sed -i "s/your_strong_key_generator_secret_here/$KEY_GENERATOR_SECRET/g" .env
        fi
        
        echo "✅ 已自动生成随机密钥并更新.env文件"
    else
        # 如果没有.env.example，则创建默认配置
        JWT_SECRET=$(generate_random_key)
        KEY_GENERATOR_SECRET=$(generate_random_key)
        DEVICE_REGISTRATION_KEY=$(generate_random_key)
        
        cat > .env << EOF
# 环境变量配置示例
# 将此文件复制为.env并根据需要修改值

# 后端服务器端口
PORT=5001

# 允许的CORS源地址（前端应用地址）
CORS_ORIGIN=http://localhost:5173

# JWT密钥（用于Web界面身份验证）
JWT_SECRET=$JWT_SECRET

# JWT令牌过期时间
TOKEN_EXPIRE=24h

# 密钥生成器验证密钥（用于调用密钥生成API）
KEY_GENERATOR_SECRET=$KEY_GENERATOR_SECRET

# 设备注册密钥（用于设备注册验证）
DEVICE_REGISTRATION_KEY=$DEVICE_REGISTRATION_KEY

# 前端使用的环境变量（需在Vite配置中启用）
# REACT_APP_API_BASE_URL=http://localhost:5001/api
# REACT_APP_BACKEND_BASE_URL=http://localhost:5001
EOF
        echo "✅ 已创建默认.env文件并生成随机密钥"
    fi
    echo "⚠️  请检查 .env 文件配置是否符合需求"
    echo -e "${GREEN}✅ .env 文件已创建${NC}"
    echo -e "${YELLOW}⚠️  请检查 .env 文件配置是否符合您的需求${NC}"
else
    echo -e "${YELLOW}⚠️  .env 文件已存在，跳过创建${NC}"
fi

# 启动应用
echo "🚀 启动应用..."
# 使用nohup确保服务在脚本退出后仍能运行
nohup npm run server > app.log 2>&1 &
SERVER_PID=$!
sleep 3

# 测试接口
echo "🔍 测试接口..."
LOCAL_IP=$(hostname -I 2>/dev/null || ipconfig getifaddr en0 2>/dev/null || echo "localhost")

# 测试健康检查
curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/health || echo "无法连接"

if [ "$UPDATE_MODE" == true ]; then
    echo -e "${GREEN}✅ 更新完成！${NC}"
else
    echo -e "${GREEN}✅ 部署完成！${NC}"
fi
# 获取配置的域名信息
DOMAIN=$(grep -m 1 "REACT_APP_BACKEND_BASE_URL=" .env | cut -d'=' -f2 || echo "")

if [ "$UPDATE_MODE" == true ]; then
    echo -e "${GREEN}✅ 更新完成！${NC}"
else
    echo -e "${GREEN}✅ 部署完成！${NC}"
fi

# 显示访问信息
echo "📱 本地访问: http://localhost:5001"
echo "🌐 局域网访问: http://${LOCAL_IP}:5001"

# 如果配置了域名，也显示域名访问信息
if [ ! -z "$DOMAIN" ]; then
    echo "🌐 域名访问: $DOMAIN"
fi

echo "📊 接口文档: http://localhost:5001/api-docs"
echo ""
echo "🔑 外部API测试命令:"
echo "curl -X POST \\
  -H \"X-API-KEY: $(grep EXTERNAL_API_KEY .env | cut -d'=' -f2 || echo '请手动设置API密钥')\" \\
  -F \"customer_id=test001\" \\
  -F \"total_weight=100.5\" \\
  http://${LOCAL_IP}:5001/api/external/weight-records"\

# 保存进程ID
echo $SERVER_PID > .server.pid