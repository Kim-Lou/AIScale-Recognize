# ScaleSense AI 外部系统API文档

## 概述

ScaleSense AI 提供外部系统API，允许集成设备和第三方应用程序与ScaleSense AI平台交互。本文档详细介绍了可用的API端点、请求格式、响应结构以及身份验证机制。

## 身份验证

### 设备ID + API密钥认证

所有外部API请求必须使用设备ID和API密钥进行双重认证，以确保安全性和完整性。认证信息需要在请求头中提供：

```
X-DEVICE-ID: <设备ID>
X-API-KEY: <API密钥>
```

这些凭证是通过设备注册接口获取的。

## 设备注册接口

### POST /api/devices

用于注册新的称重设备到ScaleSense AI平台。注册成功后，设备将获得唯一的设备ID和API密钥，用于后续的外部API访问。

#### 请求参数

| 参数名 | 类型 | 描述 | 必填 |
|-------|------|------|------|
| device_id | string | 设备ID | 是 |
| registration_key | string | 设备注册密钥 | 是 |

#### 请求示例

```json
POST http://localhost:5173/api/devices
Content-Type: application/json

{
  "device_id": "1Jq2v3RnP",
  "registration_key": "reg-key-argmwRyvkCIYWE3EMcgMU0Dfvxmnnmzc"
}
```

#### 成功响应

```json
{
  "success": true,
  "data": {
    "device_id": "1Jq2v3RnP",
    "api_key": "API-KEY-123456789",
    "registration_status": "success",
    "registration_info": "设备注册成功"
  }
}
```

#### 错误响应

```json
{
  "success": false,
  "message": "无效的注册密钥",
  "data": {
    "registration_status": "failed",
    "registration_info": "无效的注册密钥"
  }
}
```

## 创建称重记录

### POST /api/external/weight-records

用于创建新的称重记录。称重记录包含重量数据、客户信息和可选的图片。

#### 请求头

```
Content-Type: multipart/form-data
X-DEVICE-ID: <设备ID>
X-API-KEY: <API密钥>
```

#### 请求参数

| 参数名 | 类型 | 描述 | 必填 |
|-------|------|------|------|
| rfid | string | 客户的RFID标签 | 是 |
| total_weight | number | 总重量值（单位：kg） | 是 |
| weighing_time | string | 称重时间戳（ISO格式） | 是 |
| image | file | 称重照片（可选，支持JPG、PNG格式） | 否 |

#### 请求示例

```bash
curl -X POST "http://localhost:5001/api/external/weight-records" \
  -H "X-DEVICE-ID: test-success-en-123" \
  -H "X-API-KEY: ss-api-1761882609945-q0VybCJjYiYMd3DwA1oqaLbQt9gK41uQkopCS_Hyy1c" \
  -F "rfid=RF1234" \
  -F "total_weight=65.75" \
  -F "weighing_time=2024-01-01T12:00:00Z" \
  -F "image=@server/uploads/test-image.png"
```

#### 成功响应 (201 Created)

```json
{
  "success": true,
  "data": {
    "weighRecordId": "123",
    "device_id": "test-success-en-123",
    "rfid": "RF1234",
    "total_weight": 65.75,
    "weighing_time": "2024-01-01T12:00:00Z",
    "image_url": "/uploads/weight-1761883284235-22381894.png"
  }
}
```

#### 错误响应

| 状态码 | 描述 | 响应体 |
|-------|------|--------|
| 400 Bad Request | 无效的参数 | `{"success": false, "message": "缺少必要参数"}` |
| 400 Bad Request | RFID不匹配 | `{"success": false, "message": "rfid不匹配"}` |
| 401 Unauthorized | 设备验证失败 | `{"success": false, "message": "设备验证失败"}` |
| 500 Internal Server Error | 服务器错误 | `{"success": false, "message": "服务器错误"}` |

## 数据处理流程

### 设备验证流程

1. 验证请求头中的 `X-DEVICE-ID` 和 `X-API-KEY` 是否存在
2. 验证设备ID是否已在系统中注册
3. 验证API密钥是否与设备ID匹配

### RFID验证流程

1. 验证提供的RFID是否存在于客户表中
2. 如果RFID不存在，返回400错误（"rfid不匹配"）

### 图片上传处理

1. 接收图片文件（支持JPG、PNG格式）
2. 生成唯一文件名
3. 保存到服务器的uploads目录
4. 返回图片的URL路径

## 集成示例

### C++ 集成示例

#### 所需依赖

```bash
# 在Ubuntu/Debian系统上安装依赖
sudo apt-get install libcurl4-openssl-dev

# 对于JSON处理，需要下载nlohmann/json库
# 可以从GitHub获取：https://github.com/nlohmann/json
# 或者使用包管理器安装
```

#### C++ 完整示例代码

```cpp
#include <iostream>
#include <string>
#include <curl/curl.h>
#include <fstream>
#include <sstream>
#include <ctime>
#include "nlohmann/json.hpp" // 需要安装nlohmann/json库

using json = nlohmann::json;

// CURL回调函数，用于获取HTTP响应
static size_t WriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    ((std::string*)userp)->append((char*)contents, size * nmemb);
    return size * nmemb;
}

// 获取当前时间的ISO格式字符串
std::string getCurrentISOTime() {
    std::time_t now = std::time(nullptr);
    std::tm* tm_now = std::gmtime(&now);
    
    char buffer[80];
    std::strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", tm_now);
    
    return std::string(buffer);
}

// 设备注册函数
bool registerDevice(const std::string& deviceId, const std::string& registrationKey, json& responseData) {
    CURL* curl = curl_easy_init();
    if (!curl) {
        std::cerr << "初始化CURL失败" << std::endl;
        return false;
    }

    // 构建JSON请求体
    json requestBody = {
        {"device_id", deviceId},
        {"registration_key", registrationKey}
    };
    std::string requestBodyStr = requestBody.dump();

    // 设置CURL选项
    curl_easy_setopt(curl, CURLOPT_URL, "http://localhost:5173/api/devices");
    curl_easy_setopt(curl, CURLOPT_POST, 1L);
    
    // 设置请求头
    struct curl_slist* headers = NULL;
    headers = curl_slist_append(headers, "Content-Type: application/json");
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    
    // 设置请求体
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, requestBodyStr.c_str());
    
    // 设置响应回调
    std::string response;
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

    // 执行请求
    CURLcode res = curl_easy_perform(curl);
    
    // 清理资源
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    // 检查请求是否成功
    if (res != CURLE_OK) {
        std::cerr << "设备注册请求失败: " << curl_easy_strerror(res) << std::endl;
        return false;
    }

    // 解析响应
    try {
        responseData = json::parse(response);
        if (responseData.contains("success") && responseData["success"] == true) {
            std::cout << "设备注册成功！" << std::endl;
            if (responseData.contains("data")) {
                std::cout << "设备ID: " << responseData["data"]["device_id"] << std::endl;
                std::cout << "API密钥: " << responseData["data"]["api_key"] << std::endl;
            }
            return true;
        } else {
            std::cerr << "设备注册失败！" << std::endl;
            if (responseData.contains("message")) {
                std::cerr << "错误信息: " << responseData["message"] << std::endl;
            }
            return false;
        }
    } catch (const json::exception& e) {
        std::cerr << "解析响应失败: " << e.what() << std::endl;
        return false;
    }
}

// 创建称重记录函数（带图片上传）
bool createWeightRecord(const std::string& deviceId, const std::string& apiKey, 
                       const std::string& rfid, double totalWeight, 
                       const std::string& imagePath, json& responseData) {
    CURL* curl = curl_easy_init();
    if (!curl) {
        std::cerr << "初始化CURL失败" << std::endl;
        return false;
    }

    // 创建multipart表单
    curl_mime* form = curl_mime_init(curl);
    
    // 添加表单字段
    curl_mimepart* field = curl_mime_addpart(form);
    curl_mime_name(field, "rfid");
    curl_mime_data(field, rfid.c_str(), CURL_ZERO_TERMINATED);
    
    field = curl_mime_addpart(form);
    curl_mime_name(field, "total_weight");
    std::string weightStr = std::to_string(totalWeight);
    curl_mime_data(field, weightStr.c_str(), CURL_ZERO_TERMINATED);
    
    field = curl_mime_addpart(form);
    curl_mime_name(field, "weighing_time");
    std::string timeStr = getCurrentISOTime();
    curl_mime_data(field, timeStr.c_str(), CURL_ZERO_TERMINATED);
    
    // 添加图片文件
    field = curl_mime_addpart(form);
    curl_mime_name(field, "image");
    curl_mime_filedata(field, imagePath.c_str());

    // 设置CURL选项
    curl_easy_setopt(curl, CURLOPT_URL, "http://localhost:5001/api/external/weight-records");
    curl_easy_setopt(curl, CURLOPT_MIMEPOST, form);
    
    // 设置请求头
    struct curl_slist* headers = NULL;
    headers = curl_slist_append(headers, ("X-DEVICE-ID: " + deviceId).c_str());
    headers = curl_slist_append(headers, ("X-API-KEY: " + apiKey).c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    
    // 设置响应回调
    std::string response;
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

    // 获取HTTP状态码
    long httpCode = 0;

    // 执行请求
    CURLcode res = curl_easy_perform(curl);
    
    // 获取响应状态码
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &httpCode);
    
    // 清理资源
    curl_slist_free_all(headers);
    curl_mime_free(form);
    curl_easy_cleanup(curl);

    // 检查请求是否成功
    if (res != CURLE_OK) {
        std::cerr << "创建称重记录请求失败: " << curl_easy_strerror(res) << std::endl;
        return false;
    }

    // 检查HTTP状态码
    std::cout << "HTTP状态码: " << httpCode << std::endl;
    
    // 解析响应
    try {
        responseData = json::parse(response);
        if (httpCode == 201) {
            std::cout << "称重记录创建成功！" << std::endl;
            std::cout << "响应数据: " << response << std::endl;
            return true;
        } else {
            std::cerr << "称重记录创建失败！" << std::endl;
            std::cerr << "响应: " << response << std::endl;
            return false;
        }
    } catch (const json::exception& e) {
        std::cerr << "解析响应失败: " << e.what() << std::endl;
        std::cerr << "原始响应: " << response << std::endl;
        return false;
    }
}

// 主函数示例
int main() {
    // 初始化CURL全局环境
    curl_global_init(CURL_GLOBAL_DEFAULT);

    // 示例1: 设备注册
    std::string deviceId = "my-device-123";
    std::string registrationKey = "reg-key-argmwRyvkCIYWE3EMcgMU0Dfvxmnnmzc";
    json regResponse;
    
    std::cout << "===== 设备注册示例 =====" << std::endl;
    if (registerDevice(deviceId, registrationKey, regResponse)) {
        // 注册成功，可以获取API密钥用于后续请求
        std::string apiKey;
        if (regResponse.contains("data") && regResponse["data"].contains("api_key")) {
            apiKey = regResponse["data"]["api_key"];
        }
        
        // 示例2: 创建称重记录（如果有真实的图片路径和有效API密钥）
        std::cout << "\n===== 创建称重记录示例 =====" << std::endl;
        // 使用已有的设备凭证（这里使用示例值，实际应该从注册响应中获取）
        std::string testDeviceId = "test-success-en-123";
        std::string testApiKey = "ss-api-1761882609945-q0VybCJjYiYMd3DwA1oqaLbQt9gK41uQkopCS_Hyy1c";
        std::string rfid = "RF1234";
        double weight = 65.75;
        std::string imagePath = "server/uploads/test-image.png";
        json weightResponse;
        
        createWeightRecord(testDeviceId, testApiKey, rfid, weight, imagePath, weightResponse);
    }

    // 清理CURL全局环境
    curl_global_cleanup();
    
    return 0;
}
```

#### 编译和运行

```bash
# 编译命令
g++ -o scalesense_api_client scalesense_api_client.cpp -lcurl -std=c++17

# 运行程序
./scalesense_api_client
```

#### 注意事项

1. **依赖库安装**：确保已安装libcurl开发库和nlohmann/json头文件库。

2. **错误处理**：代码包含基本的错误处理机制，可以根据实际需求进行扩展。

3. **安全性**：在生产环境中，建议使用HTTPS协议，并安全存储设备凭证。

4. **异步处理**：对于需要高性能的应用，可以考虑使用libcurl的异步API或其他异步HTTP客户端库。

5. **内存管理**：代码中已经包含了基本的资源清理，避免内存泄漏。

6. **图片文件路径**：确保提供的图片文件路径存在且具有读取权限。

## 错误处理最佳实践

1. **统一响应格式**：所有API响应都遵循统一的格式，包含success、data和message字段。
2. **详细错误信息**：错误响应包含具体的错误信息，便于调试。
3. **状态码使用**：根据HTTP标准正确使用状态码表示不同的错误类型。
4. **日志记录**：在客户端实现中记录请求和响应日志，便于排查问题。
5. **重试机制**：对于可能由于网络问题导致的失败，实现合理的重试机制。

## 安全注意事项

1. **凭证保护**：设备ID和API密钥是敏感信息，应妥善保管，避免泄露。
2. **HTTPS使用**：在生产环境中，所有API通信应使用HTTPS协议进行加密。
3. **请求限流**：客户端应遵守服务器的请求限流策略，避免频繁请求导致IP被封禁。
4. **数据验证**：在发送请求前，客户端应验证数据的合法性，避免无效请求。
5. **安全存储**：设备凭证应安全存储，避免明文保存在代码或配置文件中。

## 环境配置

使用ScaleSense AI外部API前，需要确保服务端已正确配置以下环境变量：

| 环境变量 | 说明 | 默认值/示例 |
|---------|------|------------|
| PORT | 后端服务器端口 | 5001 |
| CORS_ORIGIN | 允许的CORS源地址 | http://localhost:5173 |
| DEVICE_REGISTRATION_KEY | 设备注册密钥（用于验证设备注册请求） | reg-key-argmwRyvkCIYWE3EMcgMU0Dfvxmnnmzc |
| JWT_SECRET | JWT密钥（用于Web界面认证） | your_strong_jwt_secret_here |

完整的环境变量配置请参考项目中的`.env.example`文件。部署时请将该文件复制为`.env`并根据实际情况修改配置值。

## 版本控制

本API文档对应ScaleSense AI系统版本v1.0.0。随着系统更新，API可能会有变更，请关注文档更新。

© 2024 ScaleSense AI. 保留所有权利。