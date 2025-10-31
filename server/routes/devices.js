import express from 'express';
import { getDb } from '../config/database.js';
import crypto from 'crypto';

const router = express.Router();
// 延迟获取数据库实例，在路由处理函数中获取

// 获取所有设备列表（支持筛选）
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { device_id, registered_from, registered_to } = req.query;
    
    let query = 'SELECT * FROM devices WHERE 1=1';
    const params = [];
    
    // 设备ID筛选
    if (device_id) {
      query += ' AND device_id LIKE ?';
      params.push(`%${device_id}%`);
    }
    
    // 注册时间范围筛选
    if (registered_from) {
      query += ' AND registered_at >= ?';
      params.push(registered_from);
    }
    
    if (registered_to) {
      query += ' AND registered_at <= ?';
      params.push(registered_to);
    }
    
    // 按注册时间降序排序
    query += ' ORDER BY registered_at DESC';
    
    const stmt = db.prepare(query);
    const devices = stmt.all(...params);
    
    // 格式化响应数据
    const formattedDevices = devices.map(device => ({
      device_id: device.device_id,
      api_key: device.api_key,
      registered_at: device.registered_at,
      last_uploaded_at: device.last_uploaded_at,
      registration_status: device.registration_status,
      registration_info: device.registration_info
    }));
    
    res.json({
      success: true,
      data: formattedDevices,
      count: devices.length
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch devices'
    });
  }
});

// 获取单个设备详情
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM devices WHERE id = ?');
    const device = stmt.get(req.params.id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Device not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        device_id: device.device_id,
        api_key: device.api_key,
        registered_at: device.registered_at,
        last_uploaded_at: device.last_uploaded_at,
        registration_status: device.registration_status,
        registration_info: device.registration_info
      }
    });
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch device'
    });
  }
});

// 设备注册API
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { device_id, registration_key } = req.body;
    
    // 验证必要参数
    if (!device_id) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Device ID is required'
      });
    }
    
    if (!registration_key) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Registration key is required'
      });
    }
    
    // 从环境变量获取配置的注册密钥
    const validRegistrationKey = process.env.DEVICE_REGISTRATION_KEY || 'default_registration_key';
    
    // 第一步：验证注册密钥
    const isRegistrationValid = registration_key === validRegistrationKey;
    
    // 如果注册密钥不正确，直接返回失败
    if (!isRegistrationValid) {
      // 存储失败的注册尝试
      const stmt = db.prepare(`
        INSERT INTO devices (device_id, api_key, registration_key, registered_at, last_uploaded_at, registration_status, registration_info)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?)
      `);
      
      // 使用特殊格式的字符串表示失败注册，确保唯一性
      const failedApiKey = `failed-reg-${device_id}-${Date.now()}`;
      const result = stmt.run(device_id, failedApiKey, registration_key, 'failed', 'Invalid registration key');
      
      // 返回创建的设备信息
      const newDevice = db.prepare('SELECT * FROM devices WHERE id = ?').get(result.lastInsertRowid);
      
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid registration key, registration failed',
        data: {
          device_id: newDevice.device_id,
          registered_at: newDevice.registered_at,
          registration_status: newDevice.registration_status,
          registration_info: newDevice.registration_info
        }
      });
    }
    
    // 第二步：验证注册密钥正确后，检查设备ID是否已存在
    const existingDevice = db.prepare('SELECT * FROM devices WHERE device_id = ?').get(device_id);
    
    // 如果设备ID已存在，返回失败
    if (existingDevice) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate device',
        message: 'Device ID already registered'
      });
    }
    
    const registrationStatus = 'success';
    const registrationInfo = 'Registration successful';
    
    // 生成新的API密钥
    const apiKeyResult = generateApiKeyFromKeysRoute();
    
    // 存储设备信息
    const stmt = db.prepare(`
      INSERT INTO devices (device_id, api_key, registration_key, registered_at, last_uploaded_at, registration_status, registration_info)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?)
    `);
    
    const result = stmt.run(device_id, apiKeyResult, registration_key, registrationStatus, registrationInfo);
    
    // 返回创建的设备信息
    const newDevice = db.prepare('SELECT * FROM devices WHERE id = ?').get(result.lastInsertRowid);
    
    const responseData = {
      device_id: newDevice.device_id,
      registered_at: newDevice.registered_at,
      registration_status: newDevice.registration_status,
      registration_info: newDevice.registration_info
    };
    
    // 返回API密钥（因为注册成功）
    responseData.api_key = newDevice.api_key;
    
    res.status(201).json({
      success: true,
      message: 'Device registered successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to register device'
    });
  }
});

// 从keys.js模块获取API密钥生成逻辑
function generateApiKeyFromKeysRoute() {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(32).toString('base64');
  const sanitizedRandom = randomBytes
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return `ss-api-${timestamp}-${sanitizedRandom}`;
}

// 更新设备最后上传时间
router.put('/:id/upload', (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE devices 
      SET last_uploaded_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    const result = stmt.run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Device not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Last uploaded time updated successfully'
    });
  } catch (error) {
    console.error('Error updating upload time:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update upload time'
    });
  }
});

// 删除设备 - 修改为使用device_id作为参数
router.delete('/:deviceId', (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM devices WHERE device_id = ?');
    const result = stmt.run(req.params.deviceId);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Device not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete device'
    });
  }
});

// 保留原有函数以保持兼容性
function generateApiKey() {
  return generateApiKeyFromKeysRoute();
}

function generateRegistrationKey() {
  return crypto.randomBytes(24).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export default router;