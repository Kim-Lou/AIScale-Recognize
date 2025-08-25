#!/bin/bash

echo "🔍 测试登录功能..."
echo

# 测试1: 直接API调用
echo "1. 测试后端API登录:"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5174" \
  -d '{"username":"admin","password":"admin123"}')

echo "$response"
echo

# 检查是否成功
if echo "$response" | grep -q "HTTP_STATUS:200"; then
    echo "✅ 登录API正常工作"
    
    # 提取token
    token=$(echo "$response" | grep -o '"token":"[^"]*"' | sed 's/"token":"//g' | sed 's/"//g')
    if [ ! -z "$token" ]; then
        echo "✅ Token获取成功: ${token:0:20}..."
        
        # 测试使用token访问受保护端点
        echo
        echo "2. 测试Token验证:"
        auth_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET http://localhost:8080/api/users \
          -H "Authorization: Bearer $token")
        echo "$auth_response"
        
        if echo "$auth_response" | grep -q "HTTP_STATUS:200"; then
            echo "✅ Token验证成功"
        else
            echo "❌ Token验证失败"
        fi
    else
        echo "❌ 无法提取token"
    fi
else
    echo "❌ 登录API失败"
fi

echo
echo "3. 前端访问测试:"
echo "请打开浏览器访问: http://localhost:5174"
echo "使用用户名: admin"
echo "使用密码: admin123"