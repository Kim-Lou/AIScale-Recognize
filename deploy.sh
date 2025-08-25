#!/bin/bash

# ScaleSense AI 一键部署脚本
# 适用于 Ubuntu/CentOS/macOS

set -e

echo "🚀 开始部署 ScaleSense AI 系统..."

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# 安装依赖
echo "📦 安装项目依赖..."
npm install

# 创建必要目录
mkdir -p server/uploads
mkdir -p server/data

# 复制生产环境配置
if [ ! -f .env ]; then
    cp .env.production .env
    echo -e "${YELLOW}⚠️  请编辑 .env 文件配置实际参数${NC}"
fi

# 启动应用
echo "🚀 启动应用..."
npm run server &
SERVER_PID=$!
sleep 3

# 测试接口
echo "🔍 测试接口..."
LOCAL_IP=$(hostname -I 2>/dev/null || ipconfig getifaddr en0 2>/dev/null || echo "localhost")

# 测试健康检查
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health || echo "无法连接"

echo -e "${GREEN}✅ 部署完成！${NC}"
echo "📱 本地访问: http://localhost:5000"
echo "🌐 局域网访问: http://${LOCAL_IP}:5000"
echo "📊 接口文档: http://localhost:5000/api-docs"
echo ""
echo "🔑 外部API测试命令:"
echo "curl -X POST \\"
echo "  -H \"X-API-KEY: $(grep EXTERNAL_API_KEY .env | cut -d'=' -f2)\" \\"
echo "  -F \"customer_id=test001\" \\"
echo "  -F \"total_weight=100.5\" \\"
echo "  http://${LOCAL_IP}:5000/api/external/weight-records"

# 保存进程ID
echo $SERVER_PID > .server.pid