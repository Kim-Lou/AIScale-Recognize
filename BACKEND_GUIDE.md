# ScaleSense AI 后端系统完整指南

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
npm install express cors better-sqlite3 bcryptjs jsonwebtoken multer dotenv uuid

# 或者一次性安装所有依赖
npm install express cors better-sqlite3 bcryptjs jsonwebtoken multer dotenv uuid concurrently nodemon
```

### 2. 启动后端服务

#### 方式1：同时启动前端和后端
```bash
npm run start
```

#### 方式2：分别启动
```bash
# 启动后端 (端口5000)
npm run server

# 启动前端开发服务器 (端口5173)
npm run dev
```

#### 方式3：开发模式（带热重载）
```bash
npm run start:dev
```

## 📋 API 端点文档

### 认证相关
- **POST** `/api/auth/login` - 用户登录
  ```json
  请求体：
  {
    "username": "admin",
    "password": "admin123"
  }
  ```

### 用户管理
- **GET** `/api/users` - 获取所有用户
- **GET** `/api/users/:id` - 获取单个用户
- **POST** `/api/users` - 创建用户
- **PUT** `/api/users/:id` - 更新用户
- **DELETE** `/api/users/:id` - 删除用户

### 客户管理
- **GET** `/api/customers` - 获取所有客户
- **GET** `/api/customers/:id` - 获取单个客户
- **POST** `/api/customers` - 创建客户
- **PUT** `/api/customers/:id` - 更新客户
- **DELETE** `/api/customers/:id` - 删除客户

### 称重记录管理
- **GET** `/api/weights` - 获取所有称重记录
- **GET** `/api/weights/customer/:customerId` - 获取客户的称重记录
- **GET** `/api/weights/:id` - 获取单个称重记录
- **POST** `/api/weights` - 创建称重记录
- **PUT** `/api/weights/:id` - 更新称重记录
- **DELETE** `/api/weights/:id` - 删除称重记录

### 文件上传
- **POST** `/api/upload` - 上传图片文件

### 外部系统API
- **POST** `/api/external/weight-records` - 外部系统创建称重记录
- **GET** `/api/external/weight-records/:weighRecordId` - 获取称重记录
- **PATCH** `/api/external/weight-records/:weighRecordId` - 更新称重记录

## 🔐 默认账户

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin  | admin123 | 管理员 |

## 📊 数据库结构

### 用户表 (users)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 客户表 (customers)
```sql
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  rfid TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 称重记录表 (weight_records)
```sql
CREATE TABLE weight_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  weighRecordId TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  waste_type TEXT NOT NULL,
  bin_type TEXT NOT NULL,
  total_weight REAL NOT NULL,
  bin_weight REAL NOT NULL,
  net_weight REAL NOT NULL,
  weighing_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  image_url TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
```

## 🔧 环境变量配置

创建 `.env` 文件：
```
PORT=5000
DB_PATH=./server/data/scalesense.db
JWT_SECRET=your_jwt_secret_key_here
TOKEN_EXPIRE=24h
EXTERNAL_API_KEY=ss-api-2023-external-system-key
```

## 🎯 前端与后端集成

### API基础URL
前端配置文件：`src/services/api.js`
```javascript
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### 认证流程
1. 用户登录后，token保存在localStorage
2. 所有API请求自动附带token
3. token过期或无效时自动跳转到登录页

## 📁 文件上传

- 上传目录：`server/uploads/`
- 文件大小限制：10MB
- 支持的图片格式：jpg, jpeg, png, gif, webp
- 访问URL：`http://localhost:5000/uploads/filename.ext`

## 🔍 调试和测试

### 测试后端API
```bash
# 测试登录
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 获取所有客户
curl -X GET http://localhost:5000/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 查看数据库
```bash
# 使用SQLite命令行工具
sqlite3 server/data/scalesense.db

# 查看所有表
.tables

# 查看数据
SELECT * FROM customers;
SELECT * FROM weight_records LIMIT 10;
```

## 🚨 常见问题解决

### 端口冲突
如果5000端口被占用，修改 `.env` 文件：
```
PORT=5001
```

### 数据库权限问题
在macOS/Linux上：
```bash
chmod 755 server/data/
```

### 跨域问题
后端已配置CORS，允许所有来源访问。如需限制，修改 `server/index.js`：
```javascript
app.use(cors({
  origin: 'http://localhost:5173'
}));
```

## 📈 性能优化建议

1. **数据库索引**：为常用查询字段添加索引
2. **分页**：大数据集时实现分页查询
3. **缓存**：对频繁查询的数据实施缓存策略
4. **图片优化**：实施图片压缩和CDN分发

## 🔐 安全建议

1. **HTTPS**：生产环境使用HTTPS
2. **输入验证**：所有用户输入进行验证和清理
3. **API限制**：实施API限流和防暴力破解
4. **文件安全**：上传文件类型严格检查
5. **数据库安全**：使用参数化查询防止SQL注入

## 📞 技术支持

如需技术支持，请检查：
- 后端日志：`console.log`输出
- 前端控制台：浏览器开发者工具
- 网络请求：Network面板查看API调用