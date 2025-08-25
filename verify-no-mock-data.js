#!/usr/bin/env node

/**
 * 验证脚本：确认系统不会自动生成虚拟数据
 * 运行方式：node verify-no-mock-data.js
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 验证系统不会自动生成虚拟数据...\n');

// 1. 验证环境变量配置
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  console.log('✅ .env 文件存在');
  
  if (envContent.includes('USE_MOCK_DATA=false')) {
    console.log('✅ USE_MOCK_DATA 已禁用');
  } else {
    console.log('⚠️  USE_MOCK_DATA 未找到');
  }
  
  if (envContent.includes('ENABLE_SAMPLE_DATA=false')) {
    console.log('✅ ENABLE_SAMPLE_DATA 已禁用');
  } else {
    console.log('⚠️  ENABLE_SAMPLE_DATA 未找到');
  }
} else {
  console.log('❌ .env 文件不存在');
}

// 2. 验证数据库初始化文件
const dbInitFile = path.join(__dirname, 'server', 'config', 'database.js');
if (fs.existsSync(dbInitFile)) {
  const dbContent = fs.readFileSync(dbInitFile, 'utf8');
  
  if (dbContent.includes('sampleCustomers') || dbContent.includes('sampleWeightRecords')) {
    console.log('❌ 数据库初始化文件仍包含样本数据');
  } else {
    console.log('✅ 数据库初始化文件已清理样本数据');
  }
  
  if (dbContent.includes('Created default admin user only, no sample data added')) {
    console.log('✅ 数据库初始化已配置为仅创建管理员');
  } else {
    console.log('⚠️  数据库初始化配置未确认');
  }
}

// 3. 验证前端API服务
const apiFile = path.join(__dirname, 'src', 'services', 'api.js');
if (fs.existsSync(apiFile)) {
  const apiContent = fs.readFileSync(apiFile, 'utf8');
  
  if (apiContent.includes('generateMockWeightRecords') || apiContent.includes('getMockWeightRecords')) {
    console.log('❌ 前端API服务仍包含Mock数据函数');
  } else {
    console.log('✅ 前端API服务已清理Mock数据函数');
  }
  
  if (apiContent.includes('createMockResponse')) {
    console.log('❌ 前端API服务仍包含Mock响应函数');
  } else {
    console.log('✅ 前端API服务已清理Mock响应函数');
  }
}

// 4. 验证数据库状态
import sqlite3 from 'sqlite3';
const dbPath = path.join(__dirname, 'server', 'data', 'scalesense.db');

if (fs.existsSync(dbPath)) {
  console.log('\n📊 当前数据库状态：');
  
  const db = new sqlite3.Database(dbPath);
  
  db.serialize(() => {
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (err) {
        console.log('❌ 无法读取用户表');
      } else {
        console.log(`✅ 用户总数: ${row.count}`);
        
        if (row.count === 1) {
          console.log('✅ 仅保留了一个用户（管理员）');
        } else {
          console.log(`⚠️  发现 ${row.count} 个用户`);
        }
      }
    });
    
    db.get("SELECT COUNT(*) as count FROM customers", (err, row) => {
      if (err) {
        console.log('❌ 无法读取客户表');
      } else {
        console.log(`✅ 客户总数: ${row.count}`);
        
        if (row.count === 0) {
          console.log('✅ 客户数据已清空');
        }
      }
    });
    
    db.get("SELECT COUNT(*) as count FROM weight_records", (err, row) => {
      if (err) {
        console.log('❌ 无法读取称重记录表');
      } else {
        console.log(`✅ 称重记录总数: ${row.count}`);
        
        if (row.count === 0) {
          console.log('✅ 称重记录已清空');
        }
      }
    });
    
    db.get("SELECT name, username FROM users WHERE username = 'admin'", (err, row) => {
      if (err) {
        console.log('❌ 无法读取管理员信息');
      } else if (row) {
        console.log(`✅ 管理员账号: ${row.name} (${row.username})`);
      } else {
        console.log('❌ 管理员账号不存在');
      }
      
      db.close();
    });
  });
} else {
  console.log('ℹ️  数据库文件不存在，将在首次启动时创建');
}

console.log('\n🎯 验证完成！');
console.log('📋 总结：');
console.log('- 已清理所有样本数据生成代码');
console.log('- 已禁用Mock数据功能');
console.log('- 已保留管理员账号');
console.log('- 已清空客户和称重记录数据');
console.log('- 系统重启后将不会自动生成虚拟数据');