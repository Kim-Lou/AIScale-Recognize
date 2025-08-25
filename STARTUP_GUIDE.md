# 🚀 ScaleSense AI系统启动指南

## 问题：localhost:5173 无法打开

### 🔍 问题原因分析
1. **Node.js环境缺失** - 系统未安装Node.js
2. **依赖未安装** - 项目依赖包未正确安装
3. **端口冲突** - 端口5173被其他程序占用
4. **配置问题** - Vite配置可能有问题

### ✅ 解决方案

#### 方法1：使用一键启动脚本（推荐）

```bash
cd "/Volumes/ Liber/AI-GO/AI Scale & Recognize/产品代码/scalesense_ai_system_nvual5"
./start-simple.sh
```

#### 方法2：手动安装Node.js并启动

**步骤1：安装Node.js**

**macOS用户：**
```bash
# 使用Homebrew安装（推荐）
brew install node

# 或者从官网下载
# 访问：https://nodejs.org/zh-cn/download/
```

**验证安装：**
```bash
node --version  # 应该显示v18.x.x或更高
npm --version   # 应该显示9.x.x或更高
```

**步骤2：安装项目依赖**
```bash
cd "/Volumes/ Liber/AI-GO/AI Scale & Recognize/产品代码/scalesense_ai_system_nvual5"
npm install
```

**步骤3：启动项目**
```bash
# 同时启动前后端
npm run start

# 或者分别启动
npm run dev     # 前端 (localhost:5173)
npm run server  # 后端 (localhost:5000)
```

#### 方法3：使用Docker（可选）

```bash
# 需要安装Docker Desktop
docker-compose up --build
```

### 🔧 常见问题解决

#### 1. 端口被占用
```bash
# 检查端口占用
lsof -i :5173

# 杀掉占用进程
kill -9 <PID>

# 或者使用备用端口
npm run dev -- --port 5174
```

#### 2. 权限问题
```bash
# 给脚本添加执行权限
chmod +x start-simple.sh
chmod +x install.sh
```

#### 3. 依赖安装失败
```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 🌐 访问地址

- **前端界面**：http://localhost:5173
- **后端API**：http://localhost:5000
- **默认账号**：admin / admin123

### 📋 项目结构

```
scalesense_ai_system_nvual5/
├── 📁 src/                    # 前端源代码
│   ├── 📁 pages/              # 页面组件
│   ├── 📁 services/           # API服务
│   └── 📁 components/         # 通用组件
├── 📁 server/                 # 后端代码
│   ├── 📁 routes/             # API路由
│   ├── 📁 config/             # 数据库配置
│   └── 📁 uploads/            # 上传文件
├── 📄 package.json            # 项目配置
├── 📄 vite.config.js          # Vite配置
├── 📄 start-simple.sh         # 一键启动脚本
└── 📄 STARTUP_GUIDE.md       # 启动指南
```

### 🆘 需要帮助？

如果仍然遇到问题，请检查：

1. **防火墙设置** - 确保端口5173和5000未被防火墙阻止
2. **浏览器缓存** - 尝试清除浏览器缓存或使用无痕模式
3. **网络设置** - 检查是否有代理或VPN影响
4. **日志信息** - 查看终端输出的错误信息

### 📞 技术支持

提供以下信息可以帮助快速定位问题：
1. 操作系统版本
2. Node.js版本（`node --version`）
3. 终端错误截图
4. 浏览器开发者工具中的错误信息