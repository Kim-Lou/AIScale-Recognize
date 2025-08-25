#!/bin/bash

# 外部API测试脚本
# 用于测试三个外部接口

set -e

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 获取配置
API_BASE_URL="http://localhost:5000"
API_KEY="your-external-api-key"

# 检查服务是否运行
if ! curl -s http://localhost:5000/api/health > /dev/null; then
    echo -e "${RED}❌ 服务未运行，请先启动服务${NC}"
    exit 1
fi

echo "🧪 开始测试外部API接口..."

# 1. 测试POST接口 - 创建称重记录
echo -e "${YELLOW}1. 测试POST接口...${NC}"
POST_RESPONSE=$(curl -s -X POST \
  -H "X-API-KEY: $API_KEY" \
  -F "customer_id=C001" \
  -F "total_weight=125.5" \
  -F "weighing_time=2023-12-01T10:30:00Z" \
  "$API_BASE_URL/api/external/weight-records")

echo "POST响应: $POST_RESPONSE"
WEIGH_RECORD_ID=$(echo $POST_RESPONSE | grep -o '"weighRecordId":"[^"]*"' | cut -d'"' -f4)

if [ -n "$WEIGH_RECORD_ID" ]; then
    echo -e "${GREEN}✅ POST接口正常，weighRecordId: $WEIGH_RECORD_ID${NC}"
else
    echo -e "${RED}❌ POST接口失败${NC}"
    exit 1
fi

# 2. 测试GET接口 - 获取称重记录
echo -e "${YELLOW}2. 测试GET接口...${NC}"
GET_RESPONSE=$(curl -s -X GET \
  -H "X-API-KEY: $API_KEY" \
  "$API_BASE_URL/api/external/weight-records/$WEIGH_RECORD_ID")

echo "GET响应: $GET_RESPONSE"
if echo $GET_RESPONSE | grep -q "$WEIGH_RECORD_ID"; then
    echo -e "${GREEN}✅ GET接口正常${NC}"
else
    echo -e "${RED}❌ GET接口失败${NC}"
fi

# 3. 测试PATCH接口 - 更新称重记录
echo -e "${YELLOW}3. 测试PATCH接口...${NC}"
PATCH_RESPONSE=$(curl -s -X PATCH \
  -H "X-API-KEY: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"waste_type":"Plastic","bin_weight":5.5}' \
  "$API_BASE_URL/api/external/weight-records/$WEIGH_RECORD_ID")

echo "PATCH响应: $PATCH_RESPONSE"
if echo $PATCH_RESPONSE | grep -q "Plastic"; then
    echo -e "${GREEN}✅ PATCH接口正常${NC}"
else
    echo -e "${RED}❌ PATCH接口失败${NC}"
fi

echo -e "${GREEN}🎉 所有接口测试完成！${NC}"
echo "📊 测试总结:"
echo "   POST: 创建称重记录"
echo "   GET: 获取称重记录"
echo "   PATCH: 更新称重记录"