#!/bin/bash

# 测试设备注册API脚本
echo "=== 测试设备注册API ==="

# 直接定义注册密钥
REGISTRATION_KEY="reg-key-argmwRyvkCIYWE3EMcgMU0Dfvxmnnmzc"
echo "使用指定的注册密钥: $REGISTRATION_KEY"

# 直接定义设备ID
DEVICE_ID="1Jq2v3RnP"
echo "使用指定的设备ID: $DEVICE_ID"

# 设置API端点（前端端口）
API_URL="http://localhost:5173/api/devices"

# 测试1: 使用正确的注册密钥
function test_valid_registration() {
  echo "\n\n=== 测试1: 使用正确的注册密钥 ==="
  
  # 使用指定的设备ID（已在上方定义）
  
  response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"device_id\": \"$DEVICE_ID\", \"registration_key\": \"$REGISTRATION_KEY\"}")
  
  echo "\n🔍 API响应:"
  echo "$response" | jq
  
  # 检查注册是否成功
  success=$(echo "$response" | jq -r '.success')
  registration_status=$(echo "$response" | jq -r '.data.registration_status')
  registration_info=$(echo "$response" | jq -r '.data.registration_info')
  
  echo "\n📊 注册状态: $registration_status"
  echo "💬 注册信息: $registration_info"
  
  if [ "$success" = "true" ] && [ "$registration_status" = "success" ]; then
    echo "\n✅ 设备注册成功!"
    
    # 获取设备ID和API密钥
    device_id=$(echo "$response" | jq -r '.data.device_id')
    api_key=$(echo "$response" | jq -r '.data.api_key')
    
    echo "📱 设备ID: $device_id"
    echo "🔑 API密钥: $api_key"
    
    return 0
  else
    echo "\n❌ 设备注册失败!"
    return 1
  fi
}

# 测试2: 使用错误的注册密钥
function test_invalid_registration() {
  echo "\n\n=== 测试2: 使用错误的注册密钥 ==="
  
  INVALID_KEY="invalid-key-$(date +%s)"
  INVALID_DEVICE_ID="invalid-$DEVICE_ID-$(date +%s)"
  
  response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"device_id\": \"$INVALID_DEVICE_ID\", \"registration_key\": \"$INVALID_KEY\"}")
  
  echo "\n🔍 API响应:"
  echo "$response" | jq
  
  # 检查响应是否包含错误信息
  success=$(echo "$response" | jq -r '.success' 2>/dev/null || echo "null")
  error=$(echo "$response" | jq -r '.error' 2>/dev/null || echo "null")
  message=$(echo "$response" | jq -r '.message' 2>/dev/null || echo "null")
  
  # 尝试获取注册状态和信息（如果存在）
  registration_status=$(echo "$response" | jq -r '.data.registration_status' 2>/dev/null || echo "null")
  registration_info=$(echo "$response" | jq -r '.data.registration_info' 2>/dev/null || echo "null")
  
  echo "\n📊 注册状态: $registration_status"
  echo "💬 注册信息: $registration_info"
  echo "❌ 错误信息: $message"
  
  # 判断错误注册是否被正确处理
  # 成功条件：(1) success为false，或者 (2) 注册状态为failed
  if [ "$success" = "false" ] || [ "$registration_status" = "failed" ]; then
    echo "\n✅ 错误的注册密钥被正确拒绝!"
    return 0
  else
    echo "\n❌ 错误的注册密钥未被正确处理!"
    return 1
  fi
}

# 测试3: 获取设备列表
function test_get_devices() {
  echo "\n\n=== 测试3: 获取设备列表 ==="
  
  response=$(curl -s "$API_URL")
  
  echo "\n🔍 设备列表响应:"
  echo "$response" | jq
  
  # 检查响应格式
  count=$(echo "$response" | jq '.count')
  
  echo "\n📊 设备总数: $count"
  
  if [ ! -z "$count" ]; then
    echo "✅ 成功获取设备列表!"
    return 0
  else
    echo "❌ 获取设备列表失败!"
    return 1
  fi
}

# 执行所有测试
valid_test_result=0
test_valid_registration || valid_test_result=$?

invalid_test_result=0
test_invalid_registration || invalid_test_result=$?

devices_test_result=0
test_get_devices || devices_test_result=$?

# 显示总体结果
echo "\n\n=== 测试结果摘要 ==="
if [ $valid_test_result -eq 0 ]; then
  echo "✅ 正确密钥注册测试: 通过"
else
  echo "❌ 正确密钥注册测试: 失败"
fi

if [ $invalid_test_result -eq 0 ]; then
  echo "✅ 错误密钥注册测试: 通过"
else
  echo "❌ 错误密钥注册测试: 失败"
fi

if [ $devices_test_result -eq 0 ]; then
  echo "✅ 设备列表测试: 通过"
else
  echo "❌ 设备列表测试: 失败"
fi

# 如果所有测试都通过，返回成功
if [ $valid_test_result -eq 0 ] && [ $invalid_test_result -eq 0 ] && [ $devices_test_result -eq 0 ]; then
  echo "\n🎉 所有测试通过!"
  exit 0
else
  echo "\n❌ 部分测试失败!"
  exit 1
fi