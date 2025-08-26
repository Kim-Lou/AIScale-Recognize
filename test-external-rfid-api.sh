#!/bin/bash

# 测试外部系统API - 使用RFID创建称重记录
echo "开始测试外部系统API - 使用RFID创建称重记录..."

# 配置
SERVER_URL="http://localhost:5001/api/external"
API_KEY="ss-api-2023-external-system-key"

# 生成唯一的测试RFID
test_rfid="TEST-RFID-$(date +%s)"
# 生成随机重量
test_weight=$(echo "scale=2; $RANDOM / 100" | bc)
# 创建临时测试图片
img_file="test-image.jpg"
echo "创建临时测试图片..."
echo "Testing image content" > $img_file

# 函数：清理资源
cleanup() {
    echo "清理资源..."
    rm -f $img_file
    echo "测试完成"
}

# 注册清理函数
trap cleanup EXIT

# 检查服务器是否可达
echo "检查服务器连接..."
if ! curl -s -o /dev/null -w "%{http_code}" $SERVER_URL/weight-records; then
    echo "错误: 无法连接到服务器 $SERVER_URL"
    exit 1
fi

echo "服务器连接正常"

echo "测试数据:"
echo "- RFID: $test_rfid"
echo "- 重量: $test_weight kg"

echo "\n发送请求创建称重记录..."

# 发送请求
response=$(curl -s -w "\n%{http_code}" -X POST "$SERVER_URL/weight-records" \
    -H "X-API-KEY: $API_KEY" \
    -F "rfid=$test_rfid" \
    -F "total_weight=$test_weight" \
    -F "image=@$img_file")

# 提取响应内容和状态码
http_status=$(echo "$response" | tail -n 1)
response_body=$(echo "$response" | sed '$d')

echo "HTTP 状态码: $http_status"

echo "\n响应内容:"
echo "$response_body" | jq .

# 检查请求是否成功
if [ "$http_status" -ne 201 ]; then
    echo "\n错误: 创建称重记录失败"
    exit 1
fi

# 提取创建的记录ID
weigh_record_id=$(echo "$response_body" | jq -r '.weighRecordId')
customer_id=$(echo "$response_body" | jq -r '.customer_id')
customer_name=$(echo "$response_body" | jq -r '.customer_name')

# 验证自动创建的客户ID格式
if [[ ! $customer_id =~ ^C[0-9]{4}$ ]]; then
    echo "\n警告: 自动创建的客户ID ($customer_id) 不符合预期格式 (Cxxxx)"
else
    echo "\n验证成功: 自动创建的客户ID ($customer_id) 符合预期格式 (Cxxxx)"
fi

echo "\n测试使用同一RFID创建第二条称重记录，应该使用已存在的客户..."

test_weight2=$(echo "scale=2; $RANDOM / 100" | bc)

# 发送第二条请求
response2=$(curl -s -w "\n%{http_code}" -X POST "$SERVER_URL/weight-records" \
    -H "X-API-KEY: $API_KEY" \
    -F "rfid=$test_rfid" \
    -F "total_weight=$test_weight2" \
    -F "image=@$img_file")

# 提取第二条响应的状态码
http_status2=$(echo "$response2" | tail -n 1)
response_body2=$(echo "$response2" | sed '$d')

if [ "$http_status2" -ne 201 ]; then
    echo "\n错误: 使用同一RFID创建第二条称重记录失败"
    echo "响应内容: $response_body2"
    exit 1
fi

# 提取第二条记录的客户ID
customer_id2=$(echo "$response_body2" | jq -r '.customer_id')

if [ "$customer_id" == "$customer_id2" ]; then
    echo "\n验证成功: 同一RFID创建的两条记录使用了相同的客户ID ($customer_id)"
else
    echo "\n错误: 同一RFID创建的两条记录使用了不同的客户ID ($customer_id vs $customer_id2)"
    exit 1
fi

echo "\nAPI测试成功完成！"