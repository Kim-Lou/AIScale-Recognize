#!/bin/bash

# 清理数据脚本 - 保留Administrator账号，清除其他所有数据

echo "🧹 开始清理数据..."

# 停止当前运行的服务
echo "🛑 停止当前服务..."
pkill -f "npm run" 2>/dev/null || true
sleep 2

# 使用SQLite直接清理数据
echo "🗑️  清理数据库数据..."
sqlite3 server/data/scalesense.db << EOF
-- 清除称重记录
DELETE FROM weight_records;

-- 清除客户数据
DELETE FROM customers;

-- 保留Administrator用户，删除其他用户
DELETE FROM users WHERE username != 'admin';

-- 重置自增ID
DELETE FROM sqlite_sequence WHERE name IN ('weight_records', 'customers');

-- 验证清理结果
SELECT '剩余用户: ' || COUNT(*) || ' 个' as result FROM users;
SELECT '剩余客户: ' || COUNT(*) || ' 个' as result FROM customers;
SELECT '剩余称重记录: ' || COUNT(*) || ' 个' as result FROM weight_records;
EOF

echo "✅ 数据清理完成！"
echo "📊 当前状态："
echo "   - Administrator用户：保留"
echo "   - 客户数据：已清空"
echo "   - 称重记录：已清空"
echo "   - 虚拟数据生成：已禁用"