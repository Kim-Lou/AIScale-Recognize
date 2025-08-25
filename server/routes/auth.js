import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getDb } from '../config/database.js';

dotenv.config();
const router = express.Router();

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'scalesense_secret_key';
const TOKEN_EXPIRE = process.env.TOKEN_EXPIRE || '24h';

// Login route
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Compare password
    const isMatch = bcrypt.compareSync(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Create and sign JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRE }
    );
    
    // Return user info and token (excluding password)
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
