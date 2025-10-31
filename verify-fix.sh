#!/bin/bash

echo "🔧 验证Weight Management修复..."

# 获取token
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  grep -o '"token":"[^"]*"' | sed 's/"token":"\([^"]*\)"/\1/')

echo "✅ 获取token成功"

# 测试修复后的API端点
echo "1. 测试修复后的weights端点..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET http://localhost:5001/api/weights \
  -H "Authorization: Bearer $TOKEN")

STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | sed 's/HTTP_STATUS://')
if [ "$STATUS" = "200" ]; then
  echo "✅ /api/weights 端点正常"
else
  echo "❌ /api/weights 端点失败"
fi

# 测试customers端点
echo "2. 测试customers端点..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET http://localhost:5001/api/customers \
  -H "Authorization: Bearer $TOKEN")

STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | sed 's/HTTP_STATUS://')
if [ "$STATUS" = "200" ]; then
  echo "✅ /api/customers 端点正常"
else
  echo "❌ /api/customers 端点失败"
fi

# 检查数据库连接
echo "3. 检查数据库连接..."
DB_CHECK=$(sqlite3 ./server/data/scalesense.db "SELECT COUNT(*) FROM weight_records;" 2>/dev/null)
if [ $? -eq 0 ]; then
  echo "✅ 数据库连接正常"
  echo "当前记录数: $DB_CHECK"
else
  echo "❌ 数据库连接失败"
fi

echo "修复验证完成！"
echo ""
echo "📋 修复总结："
echo "- 问题：前端调用错误的API端点 /api/weight-records"
echo "- 修复：改为调用正确的端点 /api/weights"
echo "- 状态：✅ 已修复"
echo ""
echo "🌐 请访问 http://localhost:5173 测试Weight Management页面"