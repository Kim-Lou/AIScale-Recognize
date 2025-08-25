import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { getDb } from '../config/database.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'scalesense_secret_key';

// Middleware to verify JWT token for web interface
export const authenticateToken = (req, res, next) => {
  // Get the token from the Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

// Middleware to verify API key for external system integration
export const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }
  
  try {
    const db = getDb();
    
    // Check if API key exists in the database
    // Note: In a real implementation, API keys would be stored in the database
    // This is a simplified version using predefined keys
    
    // Simple API key validation for demo purposes
    // In production, use a more robust method and store hashed keys in the database
    const validApiKeys = [
      process.env.EXTERNAL_API_KEY || 'ss-api-2023-external-system-key',
      'test-api-key-for-integration'
    ];
    
    // Hash the provided API key for comparison (to avoid timing attacks)
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Hash each valid key and compare
    const isValidKey = validApiKeys.some(key => {
      const validHashedKey = crypto.createHash('sha256').update(key).digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(hashedKey, 'hex'),
        Buffer.from(validHashedKey, 'hex')
      );
    });
    
    if (!isValidKey) {
      return res.status(403).json({ error: 'Invalid API key' });
    }
    
    // Store API key usage information (for audit purposes)
    // This could be expanded to include rate limiting, etc.
    const ipAddress = req.ip || req.connection.remoteAddress;
    console.log(`API request from ${ipAddress} using key: ${apiKey.substring(0, 8)}...`);
    
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
