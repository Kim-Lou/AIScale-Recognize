#!/bin/bash

# ScaleSense AI 后端系统安装脚本

echo "🚀 开始安装 ScaleSense AI 后端系统..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js (v16 或更高版本)"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

echo "✅ Node.js 和 npm 已安装"

# 安装所有依赖
echo "📦 安装依赖..."
npm install

# 创建数据目录
mkdir -p server/data server/uploads

# 设置权限
chmod 755 server/data server/uploads

# 创建.env文件（如果不存在）
if [ ! -f .env ]; then
    echo "📝 创建 .env 文件..."
    cat > .env << EOF
# 服务器配置
PORT=5000

# 数据库配置
DB_PATH=./server/data/scalesense.db

# JWT配置
JWT_SECRET=scalesense_secret_key_$(date +%s)
TOKEN_EXPIRE=24h

# 外部API配置
EXTERNAL_API_KEY=ss-api-2023-external-system-key
EOF
    echo "✅ .env 文件已创建"
else
    echo "⚠️  .env 文件已存在，跳过创建"
fi

echo ""
echo "🎉 安装完成！"
echo ""
echo "🔧 启动方式："
echo "1. 同时启动前后端: npm run start"
echo "2. 仅启动后端: npm run server"
echo "3. 开发模式: npm run start:dev"
echo ""
echo "🌐 访问地址："
echo "- 前端: http://localhost:5173"
echo "- 后端: http://localhost:5000"
echo "- API文档: http://localhost:5000/api-docs"
echo ""
echo "👤 默认账户："
echo "- 用户名: admin"
echo "- 密码: admin123"