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
    # 检查.env.example是否存在
    if [ -f .env.example ]; then
        echo "📋 从.env.example复制配置..."
        cp .env.example .env
        # 生成随机密钥替换占位符
        sed -i '' "s/your_strong_jwt_secret_here/scalesense_secret_key_$(date +%s)/g" .env
        sed -i '' "s/your_strong_key_generator_secret_here/gen-key-$(openssl rand -base64 16 | tr -d '/+' | cut -c1-20)/g" .env
        # 执行DEVICE_REGISTRATION_KEY生成命令并替换
        reg_key=$(openssl rand -base64 24 | tr -d '/+' | cut -c1-32)
        # 使用更简单的替换模式，只匹配reg-key-前缀部分
        sed -i '' "s/^DEVICE_REGISTRATION_KEY=reg-key-.*$/DEVICE_REGISTRATION_KEY=reg-key-$reg_key/g" .env
        echo "✅ .env 文件已从.env.example创建并填充随机密钥"
    else
        # 如果.env.example不存在，使用基本配置
        echo "⚠️ .env.example不存在，使用基本配置..."
        cat > .env << EOF
# 环境变量配置

# 后端服务器端口
PORT=5001

# 允许的CORS源地址（前端应用地址）
CORS_ORIGIN=http://localhost:5173

# JWT密钥（生产环境应使用强密钥）
JWT_SECRET=scalesense_secret_key_$(date +%s)

# JWT令牌过期时间
TOKEN_EXPIRE=24h

# 密钥生成器验证密钥
KEY_GENERATOR_SECRET=gen-key-$(openssl rand -base64 16 | tr -d '/+' | cut -c1-20)

# 设备注册密钥
DEVICE_REGISTRATION_KEY=reg-key-$(openssl rand -base64 24 | tr -d '/+' | cut -c1-32)
EOF
        echo "✅ .env 文件已使用基本配置创建"
    fi
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