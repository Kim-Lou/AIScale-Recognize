#!/bin/bash

# 外部系统集成API测试脚本
# 用于测试创建称重记录的API接口

# 配置
API_KEY="ss-api-2023-external-system-key"
API_URL="http://localhost:5001/api/external/weight-records"
TEST_IMAGE="test-image.jpg"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查curl是否安装
if ! command -v curl &> /dev/null
then
    echo -e "${RED}错误: curl 命令未找到，请先安装curl。${NC}"
    exit 1
fi

# 检查服务器是否运行
echo -e "${BLUE}正在检查服务器是否运行...${NC}"
curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" > /dev/null
if [ $? -ne 0 ]
then
    echo -e "${YELLOW}警告: 无法连接到服务器，尝试使用默认端口...${NC}"
    API_URL="http://localhost:5000/api/external/weight-records"
fi

# 创建临时测试图片
if [ ! -f "$TEST_IMAGE" ]
then
    echo -e "${BLUE}正在创建测试图片...${NC}"
    # 使用Base64编码的简单测试图片
    echo 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=' | base64 -d > $TEST_IMAGE
fi

# 生成随机测试数据
CUSTOMER_ID="CUST-TEST-$(date +%s)"
TOTAL_WEIGHT="$(echo "$RANDOM / 10" | bc -l)"
WEIGHING_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# 显示测试数据
echo -e "${BLUE}测试数据:${NC}"
echo "API URL: $API_URL"
echo "API Key: $API_KEY"
echo "Customer ID: $CUSTOMER_ID"
echo "Total Weight: $TOTAL_WEIGHT kg"
echo "Weighing Time: $WEIGHING_TIME"

# 发送测试请求
echo -e "${BLUE}\n正在发送测试请求...${NC}"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_URL" \
  -H "X-API-KEY: $API_KEY" \
  -F "customer_id=$CUSTOMER_ID" \
  -F "total_weight=$TOTAL_WEIGHT" \
  -F "weighing_time=$WEIGHING_TIME" \
  -F "image=@$TEST_IMAGE")

# 提取响应体和状态码
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
STATUS_CODE=$(echo "$RESPONSE" | tail -n1)

# 输出结果
if [ "$STATUS_CODE" -eq 201 ]
then
    echo -e "${GREEN}\nAPI调用成功! 状态码: $STATUS_CODE${NC}"
    echo -e "${BLUE}\n响应数据:${NC}"
    echo "$RESPONSE_BODY" | jq .
    
    # 提取生成的weighRecordId
    WEIGH_RECORD_ID=$(echo "$RESPONSE_BODY" | jq -r '.weighRecordId')
    echo -e "${GREEN}\n生成的称重记录ID: $WEIGH_RECORD_ID${NC}"
    
    # 提供查询此记录的命令示例
    echo -e "${BLUE}\n您可以使用以下命令查询此记录:${NC}"
    echo "curl -H 'X-API-KEY: $API_KEY' '$API_URL/$WEIGH_RECORD_ID'"
else
    echo -e "${RED}\nAPI调用失败! 状态码: $STATUS_CODE${NC}"
    echo -e "${RED}\n错误响应:${NC}"
    echo "$RESPONSE_BODY"
    
    # 常见错误处理建议
    if [ "$STATUS_CODE" -eq 404 ]
    then
        echo -e "${YELLOW}\n提示: 客户ID '$CUSTOMER_ID' 不存在。请使用系统中已存在的客户ID进行测试。${NC}"
    elif [ "$STATUS_CODE" -eq 401 ] || [ "$STATUS_CODE" -eq 403 ]
    then
        echo -e "${YELLOW}\n提示: API密钥可能无效或未提供。请检查API密钥配置。${NC}"
    elif [ "$STATUS_CODE" -eq 500 ]
    then
        echo -e "${YELLOW}\n提示: 服务器内部错误。请检查服务器日志获取详细信息。${NC}"
    fi
fi

# 清理临时图片
if [ -f "$TEST_IMAGE" ]
then
    rm -f "$TEST_IMAGE"
fi

# 显示帮助信息
echo -e "${BLUE}\n使用说明:${NC}"
echo "1. 确保服务器正在运行"
echo "2. 根据需要修改脚本顶部的配置参数"
echo "3. 使用实际存在的客户ID进行测试"
echo "4. 可以提供自定义图片路径代替临时生成的图片"