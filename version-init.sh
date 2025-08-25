#!/bin/bash

# 🚀 ScaleSense AI 版本管理初始化脚本
# 用于快速建立Git版本管理和阿里云部署准备

echo "🎯 ScaleSense AI 版本管理初始化"
echo "================================"

# 检查是否已初始化Git
if [ -d ".git" ]; then
    echo "✅ Git仓库已存在，跳过初始化"
else
    echo "📦 初始化Git仓库..."
    git init
    
    # 配置用户信息（请根据实际情况修改）
    read -p "请输入Git用户名: " GIT_USER
    read -p "请输入Git邮箱: " GIT_EMAIL
    
    git config user.name "$GIT_USER"
    git config user.email "$GIT_EMAIL"
    
    echo "✅ Git仓库初始化完成"
fi

# 添加所有文件到版本控制
echo "📁 添加文件到版本控制..."
git add .

# 创建初始提交
if git diff --cached --quiet; then
    echo "✅ 没有需要提交的更改"
else
    echo "💾 创建初始提交..."
    git commit -m "🎉 Initial commit: ScaleSense AI system v1.0.0

- Complete weight management system
- Customer management functionality
- Image upload and display support
- User authentication and authorization
- RESTful API endpoints
- Responsive web interface
- Docker support ready"
    
    echo "✅ 初始提交完成"
fi

# 创建主要分支
echo "🌿 创建分支结构..."

# 创建开发分支（如果不存在）
if git branch | grep -q "develop"; then
    echo "✅ develop分支已存在"
else
    git checkout -b develop
    echo "✅ develop分支创建完成"
fi

# 创建预发布分支
if git branch | grep -q "staging"; then
    echo "✅ staging分支已存在"
else
    git checkout -b staging
    echo "✅ staging分支创建完成"
fi

# 创建生产分支
if git branch | grep -q "production"; then
    echo "✅ production分支已存在"
else
    git checkout -b production
    echo "✅ production分支创建完成"
fi

# 回到主分支
git checkout main

# 创建版本标签
echo "🏷️ 创建版本标签..."
git tag -a v1.2.0 -m "🚀 Stable version with fixes

Fixed issues:
- Weight Management API endpoint mismatch
- Image display port configuration
- CORS configuration updates
- System stability improvements

Features:
- Complete weight tracking system
- Customer management
- Image upload and preview
- JWT authentication
- Responsive UI"

echo "✅ 版本标签 v1.2.0 创建完成"

# 显示当前状态
echo ""
echo "📊 当前Git状态:"
echo "================"
git branch -a
echo ""
echo "📋 版本标签:"
git tag -l
echo ""
echo "📊 提交历史:"
git log --oneline -5

echo ""
echo "🎉 版本管理初始化完成！"
echo ""
echo "📋 下一步操作:"
echo "1. 创建GitHub仓库: https://github.com/new"
echo "2. 添加远程仓库: git remote add origin https://github.com/your-username/scalesense-ai.git"
echo "3. 推送代码: git push -u origin main"
echo "4. 推送所有分支: git push --all origin"
echo "5. 推送标签: git push --tags origin"
echo ""
echo "🚀 阿里云部署准备:"
echo "1. 阅读 DEPLOYMENT_GUIDE.md"
echo "2. 准备阿里云ECS实例"
echo "3. 配置域名和SSL证书"
echo "4. 运行部署脚本"
echo ""
echo "🔗 访问地址:"
echo "- 本地开发: http://localhost:5174"
echo "- 后端API: http://localhost:8080"