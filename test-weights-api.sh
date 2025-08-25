#!/bin/bash

# 测试Weight Management相关API端点

echo "🔍 测试Weight Management API端点..."

# 获取token
echo "1. 获取认证token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"\([^"]*\)"/\1/')

if [ -z "$TOKEN" ]; then
  echo "❌ 获取token失败"
  exit 1
fi

echo "✅ Token获取成功"

# 测试weights端点
echo "2. 测试GET /api/weights..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET http://localhost:8080/api/weights \
  -H "Authorization: Bearer $TOKEN")

STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | sed 's/HTTP_STATUS://')
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "状态码: $STATUS"
echo "响应: $BODY"

if [ "$STATUS" = "200" ]; then
  echo "✅ GET /api/weights 正常工作"
else
  echo "❌ GET /api/weights 失败"
fi

# 测试customers端点
echo "3. 测试GET /api/customers..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET http://localhost:8080/api/customers \
  -H "Authorization: Bearer $TOKEN")

STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | sed 's/HTTP_STATUS://')
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "状态码: $STATUS"
if [ "$STATUS" = "200" ]; then
  echo "✅ GET /api/customers 正常工作"
else
  echo "❌ GET /api/customers 失败"
fi

echo "测试完成"