# 外部系统集成API - 称重记录创建接口文档

## 1. 接口概述

本接口用于外部系统向ScaleSense AI系统推送数据，创建新的称重记录。系统会在`weight_records`表中新增一条记录，并自动生成唯一的`weighRecordId`。

## 2. API端点

```
POST /api/external/weight-records
```

## 3. 认证方式

接口使用API密钥进行认证，需要在请求头中包含有效的API密钥：

| 请求头字段 | 类型 | 描述 | 必填 |
|----------|------|------|------|
| X-API-KEY | String | API密钥 | 是 |

### 默认API密钥

系统默认配置了以下API密钥（仅用于开发和测试环境）：
- `ss-api-2023-external-system-key`（可通过环境变量`EXTERNAL_API_KEY`自定义）
- `test-api-key-for-integration`

> **注意**：生产环境应使用环境变量配置唯一的API密钥，并实现更安全的密钥管理机制。

## 4. 请求参数

### 4.1 表单数据（multipart/form-data）

请求应使用`multipart/form-data`格式，包含以下字段：

| 参数名 | 类型 | 描述 | 必填 |
|-------|------|------|------|
| rfid | String | 客户的RFID编号 | 是 |
| total_weight | Number | 总重量，单位为kg | 是 |
| weighing_time | String | 称重时间，ISO格式的日期时间字符串（例如："2023-10-15T14:30:00Z"） | 否（默认为当前时间） |
| image | File | 称重照片，支持jpg、jpeg、png、gif、webp格式，文件大小上限10MB | 是 |

> **注意**：根据您的需求，`image`参数被标记为必填项。

## 5. 响应格式

### 5.1 成功响应

创建成功后，系统返回HTTP状态码201（Created），并返回以下简化的响应数据：

```json
{
  "rfid": "客户的RFID编号",
  "weighRecordId": "550e8400-e29b-41d4-a716-446655440000",
  "image_url": "/uploads/weight-1634283000000-123456789.jpg"
}
```

### 5.2 错误响应

系统在不同情况下返回不同的错误响应：

| 状态码 | 错误信息 | 描述 |
|-------|---------|------|
| 401 | {"error": "API key is required"} | 请求头中未提供API密钥 |
| 403 | {"error": "Invalid API key"} | 提供的API密钥无效 |
| 400 | {"error": "Missing required fields", "required": ["rfid", "total_weight"]} | 缺少必填字段 |
| 400 | {"error": "Total weight must be a number"} | total_weight不是有效的数字 |
| 404 | {"error": "Customer not found"} | 已废弃：系统现在会自动创建新客户
| 500 | {"error": "Internal server error"} | 服务器内部错误 |

## 6. 数据处理逻辑

系统收到请求后执行以下逻辑：

1. 验证API密钥是否有效
2. 检查必填参数是否提供且格式正确
3. 验证请求中的`rfid`是否存在于客户表中
4. 如果`rfid`不存在，系统将自动创建一个新客户，其ID格式为"C"开头加上4位排序号
5. 处理上传的图片文件（如果提供）
6. 生成唯一的`weighRecordId`（UUID格式）
7. 设置默认值：
   - `waste_type`: "Unclassified"
   - `bin_type`: "Unknown"
   - `bin_weight`: 0
   - `net_weight`: 等于total_weight
   - `weighing_time`: 如果未提供，则使用当前时间
8. 将记录保存到数据库
9. 返回创建的完整记录信息

## 7. 集成示例

### 7.1 使用JavaScript/Node.js集成示例

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// 配置
const API_KEY = 'ss-api-2023-external-system-key';
const API_URL = 'http://localhost:5001/api/external/weight-records';

// 创建表单数据
const formData = new FormData();
formData.append('rfid', '客户的RFID编号');
formData.append('total_weight', '50.5');
formData.append('weighing_time', new Date().toISOString());
formData.append('image', fs.createReadStream('path/to/weight-image.jpg'));

// 发送请求
axios.post(API_URL, formData, {
  headers: {
    'X-API-KEY': API_KEY,
    ...formData.getHeaders()
  }
})
.then(response => {
  console.log('创建成功:', response.data);
  // 响应数据包含三个字段：rfid、weighRecordId和image_url
  const weighRecordId = response.data.weighRecordId;
  const rfid = response.data.rfid;
  const imageUrl = response.data.image_url;
  console.log('生成的记录ID:', weighRecordId);
  console.log('客户RFID:', rfid);
  console.log('图片URL:', imageUrl);
})
.catch(error => {
  console.error('创建失败:', error.response?.data || error.message);
});
```

### 7.2 使用Python集成示例

```python
import requests
import os
from datetime import datetime

# 配置
API_KEY = 'ss-api-2023-external-system-key'
API_URL = 'http://localhost:5001/api/external/weight-records'

# 准备请求参数
files = {
    'image': open('path/to/weight-image.jpg', 'rb')
}
# 准备请求参数
data = {
    'rfid': '客户的RFID编号',
    'total_weight': '50.5',
    'weighing_time': datetime.now().isoformat()
}

# 添加请求头
headers = {
    'X-API-KEY': API_KEY
}

# 发送请求
response = requests.post(API_URL, files=files, data=data, headers=headers)

# 处理响应
if response.status_code == 201:
    record = response.json()
    print('创建成功:', record)
    # 响应数据包含三个字段：rfid、weighRecordId和image_url
    weigh_record_id = record['weighRecordId']
    rfid = record['rfid']
    image_url = record.get('image_url')
    print('生成的记录ID:', weigh_record_id)
    print('客户RFID:', rfid)
    if image_url:
        print('图片URL:', image_url)
else:
    print(f'创建失败: {response.status_code}, {response.json()}')
```

## 8. 注意事项

1. **安全性**：确保API密钥安全存储，不要在客户端代码中暴露
2. **性能优化**：上传图片时应进行适当压缩，以减少传输时间和服务器负载
3. **错误处理**：集成时请实现完整的错误处理逻辑，特别是针对客户不存在等常见情况
4. **重试机制**：对于网络不稳定的环境，建议实现请求重试机制
5. **数据一致性**：确保customer_id与系统中实际存在的客户ID匹配
6. **生产环境配置**：生产环境中应通过环境变量配置API密钥，并考虑使用HTTPS加密通信

## 9. 相关API端点

系统还提供了以下相关的API端点，可根据需要使用：

- **获取称重记录**：`GET /api/external/weight-records/:weighRecordId`
- **更新称重记录**：`PATCH /api/external/weight-records/:weighRecordId`