# 🎯 如何停止自动数据生成

## 🔍 问题原因

程序每次刷新自动产生数据的原因：

### 1. **前端Mock数据**（主要来源）
- 文件：`src/services/api.js`
- 功能：当后端API不可用时，自动生成模拟数据
- 生成量：过去7天，每天5-15条记录

### 2. **数据库初始化样本数据**
- 文件：`server/config/database.js`
- 触发条件：数据库为空时自动插入样本数据
- 包含：5个客户 + 20条称重记录

### 3. **开发环境配置**
- 默认启用Mock数据以便开发测试

## 🛠️ 解决方案

### **方案1：使用环境变量控制（推荐）**

1. **创建开发环境配置**（已创建）：
   ```bash
   cp .env.development .env
   ```

2. **环境变量说明**：
   ```bash
   # .env.development 已包含以下配置
   USE_MOCK_DATA=false
   ENABLE_SAMPLE_DATA=false
   ```

### **方案2：手动禁用**

#### **禁用前端Mock数据**
编辑 `src/services/api.js`：
```javascript
// 在文件顶部添加
const USE_MOCK_DATA = false; // 设置为false禁用

// 修改 getMockWeightRecords 函数
const getMockWeightRecords = () => {
  if (!USE_MOCK_DATA) return [];
  return mockWeightRecords;
};
```

#### **禁用数据库样本数据**
编辑 `server/config/database.js`：
```javascript
// 在初始化函数中添加检查
const ENABLE_SAMPLE_DATA = false; // 设置为false禁用

// 修改条件判断
if (userCount.count === 0 && ENABLE_SAMPLE_DATA) {
  // 样本数据插入代码
}
```

### **方案3：完全清除数据**

#### **清除所有数据**
```bash
# 停止服务
pkill -f "npm run dev:full"

# 删除数据库文件
rm server/data/scalesense.db

# 重新启动（不会自动插入数据）
npm run dev:full
```

#### **选择性清除**
```bash
# 仅清除称重记录（保留用户和客户）
sqlite3 server/data/scalesense.db "DELETE FROM weight_records;"

# 仅清除客户数据（保留用户）
sqlite3 server/data/scalesense.db "DELETE FROM customers;"
```

## 🚀 立即执行步骤

### **快速禁用（1分钟完成）**

1. **使用环境变量**（推荐）：
   ```bash
   cp .env.development .env
   npm run dev:full
   ```

2. **验证效果**：
   ```bash
   # 检查数据库记录数
   sqlite3 server/data/scalesense.db "SELECT COUNT(*) FROM weight_records;"
   ```

### **验证是否成功**

1. **刷新页面后**：
   - 称重记录数量应保持不变
   - 客户列表应只显示手动添加的数据
   - 仪表板应显示真实数据或无数据

2. **检查日志**：
   ```bash
   # 查看后端日志
tail -f logs/backend-*.log
   ```

## 📋 数据管理建议

### **开发阶段**
- 使用少量真实数据测试
- 定期备份数据库
- 使用不同的测试环境

### **生产环境**
- 确保 `ENABLE_SAMPLE_DATA=false`
- 使用强密码和API密钥
- 定期数据备份

### **备份恢复**
```bash
# 备份当前数据
cp server/data/scalesense.db server/data/scalesense-backup.db

# 恢复备份
cp server/data/scalesense-backup.db server/data/scalesense.db
```

## ❓ 常见问题

**Q: 禁用后没有数据怎么办？**
A: 通过外部API或管理界面手动添加数据

**Q: 如何恢复Mock数据？**
A: 删除.env文件或设置 `USE_MOCK_DATA=true`

**Q: 数据重复怎么办？**
A: 清除数据库后重新初始化

---

**总结**：使用环境变量控制是最简单的方法，只需复制 `.env.development` 到 `.env` 即可立即停止自动数据生成。