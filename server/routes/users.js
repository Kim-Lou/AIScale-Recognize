import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all users
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare(`
      SELECT id, name, username, created_at, updated_at
      FROM users
      ORDER BY id
    `).all();
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single user
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  try {
    const db = getDb();
    const user = db.prepare(`
      SELECT id, name, username, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new user
router.post('/', authenticateToken, (req, res) => {
  const { name, username, password } = req.body;
  
  if (!name || !username || !password) {
    return res.status(400).json({ message: 'Name, username and password are required' });
  }
  
  try {
    const db = getDb();
    
    // Check if username already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    
    // Insert the new user
    const result = db.prepare(`
      INSERT INTO users (name, username, password)
      VALUES (?, ?, ?)
    `).run(name, username, hashedPassword);
    
    // Get the newly created user (without password)
    const newUser = db.prepare(`
      SELECT id, name, username, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(result.lastInsertRowid);
    
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a user
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, username, password } = req.body;
  
  if (!name || !username) {
    return res.status(400).json({ message: 'Name and username are required' });
  }
  
  try {
    const db = getDb();
    
    // Check if user exists
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if username is taken by another user
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, id);
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    if (password) {
      // If password is provided, update with new password
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);
      
      db.prepare(`
        UPDATE users
        SET name = ?, username = ?, password = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, username, hashedPassword, id);
    } else {
      // If no password, update only name and username
      db.prepare(`
        UPDATE users
        SET name = ?, username = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, username, id);
    }
    
    // Get the updated user (without password)
    const updatedUser = db.prepare(`
      SELECT id, name, username, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(id);
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a user
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  try {
    const db = getDb();
    
    // Check if user exists
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete the user
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
