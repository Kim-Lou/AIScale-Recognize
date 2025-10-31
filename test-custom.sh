#!/bin/bash
# 自定义测试外部系统集成API脚本

# 配置
DEVICE_ID="test-device-001"
API_KEY="ss-api-2023-external-system-key"
API_URL="https://ai.wkuai.xyz/api/external/weight-records"
IMAGE_PATH="server/uploads/test-image.png"

# 用户自定义参数（使用示例数据）
TEST_RFID="TEST-RFID-2025028"
TOTAL_WEIGHT="10.22"
WEIGHING_TIME="$(date -u -v-1d +'%Y-%m-%dT%H:%M:%SZ')"

# 检查图片文件是否存在
if [ ! -f "$IMAGE_PATH" ]; then
  echo "❌ 错误：图片文件不存在于 $IMAGE_PATH"
  exit 1
fi

echo "🚀 开始测试外部系统集成API..."
echo "📋 测试参数："
echo "  - 设备ID：$DEVICE_ID"
echo "  - API密钥：$API_KEY"
echo "  - API端点：$API_URL"
echo "  - 图片路径：$IMAGE_PATH"
echo "  - RFID：$TEST_RFID"
echo "  - 总重量：$TOTAL_WEIGHT kg"
echo "  - 称重时间：$WEIGHING_TIME"

echo "\n📤 发送请求创建称重记录..."

# 发送带图片的POST请求
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "X-DEVICE-ID: $DEVICE_ID" \
  -H "X-API-KEY: $API_KEY" \
  -F "rfid=$TEST_RFID" \
  -F "total_weight=$TOTAL_WEIGHT" \
  -F "weighing_time=$WEIGHING_TIME" \
  -F "image=@$IMAGE_PATH")

# 提取响应体和状态码
RESPONSE_LINES=$(echo "$RESPONSE" | wc -l | tr -d ' ')
if [ "$RESPONSE_LINES" -gt 1 ]; then
  RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
else
  RESPONSE_BODY=""
fi
STATUS_CODE=$(echo "$RESPONSE" | tail -n 1)

echo "\n📝 响应状态码：$STATUS_CODE"
echo "📊 响应内容：$RESPONSE_BODY"

# 检查请求是否成功
if [ "$STATUS_CODE" -eq 201 ]; then
  echo "✅ 请求成功！称重记录已创建"
  
  # 提取weighRecordId以便后续验证
  WEIGH_RECORD_ID=$(echo "$RESPONSE_BODY" | grep -o '"weighRecordId":"[^"]*"' | sed 's/"weighRecordId":"//g' | sed 's/"//g')
  IMAGE_URL=$(echo "$RESPONSE_BODY" | grep -o '"image_url":"[^"]*"' | sed 's/"image_url":"//g' | sed 's/"//g')
  
  echo "\n🔍 验证创建的记录..."
  echo "  - WeighRecordId: $WEIGH_RECORD_ID"
  echo "  - Image URL: $IMAGE_URL"
else
  echo "❌ 请求失败！无法创建称重记录"
  echo "💡 可能的错误原因："
  echo "  - API密钥无效或过期"
  echo "  - 缺少必填字段"
  echo "  - 服务器内部错误"
  echo "  - 图片上传失败"
  exit 1
fi