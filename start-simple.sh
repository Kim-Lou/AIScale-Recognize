#!/bin/bash

# 简化启动脚本 - 适用于没有Node.js环境的情况
# 这个脚本会引导你安装Node.js并启动项目

set -e

echo "🚀 ScaleSense AI System 启动脚本"
echo "=================================="

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    echo ""
    echo "📥 请按照以下步骤安装Node.js："
    echo ""
    echo "方法1 - 使用Homebrew (推荐):"
    echo "  brew install node"
    echo ""
    echo "方法2 - 从官网下载:"
    echo "  访问: https://nodejs.org/zh-cn/download/"
    echo "  下载LTS版本并安装"
    echo ""
    echo "方法3 - 使用nvm:"
    echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "  source ~/.zshrc"
    echo "  nvm install --lts"
    echo ""
    exit 1
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    echo "请重新安装Node.js"
    exit 1
fi

# 显示版本信息
echo "✅ Node.js版本: $(node --version)"
echo "✅ npm版本: $(npm --version)"

# 进入项目目录
cd "$(dirname "$0")"

# 安装依赖
echo ""
echo "📦 安装项目依赖..."
npm install

# 检查端口占用
PORT=5173
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "⚠️  端口 $PORT 已被占用，将使用备用端口 5174"
    PORT=5174
fi

# 启动项目
echo ""
echo "🎯 启动ScaleSense AI系统..."
echo ""
echo "📋 启动选项:"
echo "1) 同时启动前端和后端"
echo "2) 只启动前端"
echo "3) 只启动后端"
echo ""

read -p "请选择启动方式 [1-3]: " choice

case $choice in
    1) 
        echo "🚀 启动前后端..."
        npm run dev:full
        ;;
    2)
        echo "🌐 启动前端..."
        npm run dev
        ;;
    3)
        echo "🔧 启动后端..."
        npm run server
        ;;
    *)
        echo "❌ 无效选择，默认启动前后端"
        npm run dev:full
        ;;
esac