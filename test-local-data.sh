#!/bin/bash
# 本地环境数据测试脚本
# 用于在本地环境创建两条测试称重记录

# 初始化成功计数
SUCCESS_COUNT=0

echo "🚀 开始在本地环境创建测试数据..."

echo "\n1. 获取认证token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"//g' | sed 's/"//g')

if [ -z "$TOKEN" ]; then
  echo "❌ 获取token失败: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token获取成功: $TOKEN"

# 获取现有客户ID和名称
echo "\n2. 获取可用的客户ID和名称..."
CUSTOMERS_RESPONSE=$(curl -s -X GET http://localhost:5001/api/customers \
  -H "Authorization: Bearer $TOKEN")

# 提取第一个客户的ID和名称
CUSTOMER_ID=$(echo $CUSTOMERS_RESPONSE | grep -o '"id":"[^"]*"' | head -n 1 | sed 's/"id":"//g' | sed 's/"//g')
CUSTOMER_NAME=$(echo $CUSTOMERS_RESPONSE | grep -o '"name":"[^"]*"' | head -n 1 | sed 's/"name":"//g' | sed 's/"//g')

if [ -z "$CUSTOMER_ID" ]; then
  echo "❌ 未找到可用客户，将创建一个新客户..."
  # 创建一个新客户
  CREATE_CUSTOMER_RESPONSE=$(curl -s -X POST http://localhost:5001/api/customers \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"测试客户","rfid":"test-rfid-001","contact":"test@example.com","phone":"1234567890"}')
  
  CUSTOMER_ID=$(echo $CREATE_CUSTOMER_RESPONSE | grep -o '"id":"[^"]*"' | sed 's/"id":"//g' | sed 's/"//g')
  CUSTOMER_NAME=$(echo $CREATE_CUSTOMER_RESPONSE | grep -o '"name":"[^"]*"' | sed 's/"name":"//g' | sed 's/"//g')
  
  if [ -z "$CUSTOMER_ID" ]; then
    echo "❌ 创建客户失败: $CREATE_CUSTOMER_RESPONSE"
    exit 1
  fi
  
  echo "✅ 新客户创建成功，ID: $CUSTOMER_ID, 名称: $CUSTOMER_NAME"
else
  echo "✅ 找到客户ID: $CUSTOMER_ID, 名称: $CUSTOMER_NAME"
fi

# 创建第一条测试数据
echo "\n3. 创建第一条测试称重记录..."
RESPONSE1=$(curl -s -X POST http://localhost:5001/api/weights \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"'"$CUSTOMER_ID"'", "customer_name":"'"$CUSTOMER_NAME"'", "total_weight":125.5, "bin_weight":10.2, "net_weight":115.3, "waste_type":"Plastic", "bin_type":"Type A"}')

echo "第一条记录响应: $RESPONSE1"

# 检查第一条记录是否创建成功
if echo "$RESPONSE1" | grep -q '"id":'; then
  echo "✅ 第一条记录创建成功"
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
  echo "❌ 第一条记录创建失败"
fi

# 创建第二条测试数据
echo "\n4. 创建第二条测试称重记录..."
RESPONSE2=$(curl -s -X POST http://localhost:5001/api/weights \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"'"$CUSTOMER_ID"'", "customer_name":"'"$CUSTOMER_NAME"'", "total_weight":200.75, "bin_weight":15.5, "net_weight":185.25, "waste_type":"Paper", "bin_type":"Type B"}')

echo "第二条记录响应: $RESPONSE2"

# 检查第二条记录是否创建成功
if echo "$RESPONSE2" | grep -q '"id":'; then
  echo "✅ 第二条记录创建成功"
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
  echo "❌ 第二条记录创建失败"
fi

# 验证数据是否创建成功
echo "\n5. 验证数据是否成功创建..."
VERIFY_RESPONSE=$(curl -s -X GET "http://localhost:5001/api/weights?limit=2" \
  -H "Authorization: Bearer $TOKEN")

echo "最近两条记录: $VERIFY_RESPONSE"

echo "\n📊 测试数据创建完成！"
if [ "$SUCCESS_COUNT" -eq 2 ]; then
  echo "✅ 成功创建了两条测试数据"
elif [ "$SUCCESS_COUNT" -gt 0 ]; then
  echo "⚠️ 部分数据创建成功，共创建了 $SUCCESS_COUNT 条记录"
else
  echo "❌ 所有数据创建失败，请检查日志"
fi

echo "\n💡 提示: 您可以访问前端应用(http://localhost:5173)查看这些测试数据。"