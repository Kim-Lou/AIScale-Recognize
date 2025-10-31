#!/bin/bash
# 测试外部系统集成API - 称重记录创建接口（带图片）

# 配置
API_KEY="ss-api-1761882609945-q0VybCJjYiYMd3DwA1oqaLbQt9gK41uQkopCS_Hyy1c"
DEVICE_ID="test-success-en-123"
API_URL="http://localhost:5001/api/external/weight-records"
IMAGE_PATH="server/uploads/test-image.png"

# 使用系统中已知存在的RFID进行测试
TEST_RFID="RF1234"
TOTAL_WEIGHT="65.75"
WEIGHING_TIME="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

# 检查图片文件是否存在
if [ ! -f "$IMAGE_PATH" ]; then
  echo "❌ 错误：图片文件不存在于 $IMAGE_PATH"
  echo "请确保uploads目录中有可用的测试图片"
  exit 1
fi

echo "🚀 开始测试外部系统集成API - 称重记录创建接口（带图片）..."
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
  -H "X-API-KEY: $API_KEY" \
  -H "X-DEVICE-ID: $DEVICE_ID" \
  -F "rfid=$TEST_RFID" \
  -F "total_weight=$TOTAL_WEIGHT" \
  -F "weighing_time=$WEIGHING_TIME" \
  -F "image=@$IMAGE_PATH")

# 提取响应体和状态码 - 兼容macOS
# 获取除最后一行外的所有行作为响应体
RESPONSE_LINES=$(echo "$RESPONSE" | wc -l | tr -d ' ')
if [ "$RESPONSE_LINES" -gt 1 ]; then
  RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
else
  RESPONSE_BODY=""
fi
# 获取最后一行作为状态码
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
  
  # 验证图片是否成功上传
  if [ ! -z "$IMAGE_URL" ]; then
    echo "✅ 图片上传成功！"
    
    # 检查生成的图片文件是否存在于uploads目录
    UPLOADS_DIR="server/uploads"
    UPLOADED_IMAGE_FILE="$UPLOADS_DIR/$(basename $IMAGE_URL)"
    
    if [ -f "$UPLOADED_IMAGE_FILE" ]; then
      echo "✅ 验证通过：上传的图片文件已存在于服务器"
      echo "  - 服务器上的文件路径：$UPLOADED_IMAGE_FILE"
    else
      echo "⚠️ 警告：上传的图片文件在服务器上找不到，但接口返回了image_url"
    fi
  else
    echo "⚠️ 警告：图片上传失败或未返回image_url"
  fi
  
  # 可选：使用GET接口验证创建的记录
    if [ ! -z "$WEIGH_RECORD_ID" ]; then
      echo "\n🔄 使用GET接口验证记录详情..."
      GET_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/$WEIGH_RECORD_ID" \
        -H "X-API-KEY: $API_KEY" \
        -H "X-DEVICE-ID: $DEVICE_ID")
    
    # 提取GET响应体和状态码 - 兼容macOS
    GET_RESPONSE_LINES=$(echo "$GET_RESPONSE" | wc -l | tr -d ' ')
    if [ "$GET_RESPONSE_LINES" -gt 1 ]; then
      GET_RESPONSE_BODY=$(echo "$GET_RESPONSE" | sed '$d')
    else
      GET_RESPONSE_BODY=""
    fi
    GET_STATUS_CODE=$(echo "$GET_RESPONSE" | tail -n 1)
    
    echo "📝 GET请求状态码：$GET_STATUS_CODE"
    echo "📊 GET响应内容：$GET_RESPONSE_BODY"
    
    if [ "$GET_STATUS_CODE" -eq 200 ]; then
      echo "✅ GET验证成功！记录已正确创建并可通过weighRecordId查询"
    else
      echo "❌ GET验证失败！无法通过weighRecordId查询记录"
    fi
  fi
  
  echo "\n✅ 外部系统集成API测试完成！"  
else
  echo "❌ 请求失败！无法创建称重记录"
  echo "💡 可能的错误原因："
  echo "  - API密钥无效或过期"
  echo "  - 缺少必填字段"
  echo "  - 服务器内部错误"
  echo "  - 图片上传失败"
  exit 1
fi