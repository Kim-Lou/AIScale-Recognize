import express from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const router = express.Router();

// 生成新密钥的接口
// 安全验证：只有提供正确的KEY_GENERATOR_SECRET才能生成新密钥
router.post('/generate', (req, res) => {
  try {
    // 获取请求头中的验证密钥
    const providedSecret = req.headers['x-key-generator-secret'];
    const validSecret = process.env.KEY_GENERATOR_SECRET || 'default_key_generator_secret';
    
    // 验证密钥是否正确
    if (!providedSecret || providedSecret !== validSecret) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid or missing key generator secret' 
      });
    }
    
    // 生成新的安全随机密钥
    // 1. 使用crypto.randomBytes生成32字节的随机数据
    // 2. 转换为base64编码，确保密钥可读且安全
    // 3. 添加前缀和时间戳，增加唯一性并便于识别
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(32).toString('base64');
    // 移除可能在URL中引起问题的字符，保持密钥的安全性
    const sanitizedRandom = randomBytes
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // 生成最终密钥，格式为：前缀-时间戳-随机字符串
    const newKey = `ss-api-${timestamp}-${sanitizedRandom}`;
    
    // 返回生成的密钥
    return res.json({
      success: true,
      key: newKey,
      generated_at: new Date().toISOString(),
      message: 'New API key generated successfully'
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate API key'
    });
  }
});

// 获取密钥生成状态信息（可选，用于监控）
router.get('/status', (req, res) => {
  try {
    // 验证请求
    const providedSecret = req.headers['x-key-generator-secret'];
    const validSecret = process.env.KEY_GENERATOR_SECRET || 'default_key_generator_secret';
    
    if (!providedSecret || providedSecret !== validSecret) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid or missing key generator secret' 
      });
    }
    
    // 返回服务状态
    return res.json({
      success: true,
      status: 'active',
      timestamp: new Date().toISOString(),
      message: 'Key generator service is running'
    });
  } catch (error) {
    console.error('Error checking key generator status:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check key generator status'
    });
  }
});

export default router;