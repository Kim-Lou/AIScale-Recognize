import express from 'express';
import { getDb } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all customers
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const customers = db.prepare(`
      SELECT id, rfid, name, created_at, updated_at
      FROM customers
      ORDER BY id
    `).all();
    
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single customer
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  try {
    const db = getDb();
    const customer = db.prepare(`
      SELECT id, rfid, name, created_at, updated_at
      FROM customers
      WHERE id = ?
    `).get(id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new customer
router.post('/', authenticateToken, (req, res) => {
  const { id, rfid, name } = req.body;
  
  if (!id || !rfid || !name) {
    return res.status(400).json({ message: 'Customer ID, RFID and name are required' });
  }
  
  try {
    const db = getDb();
    
    // Check if customer ID already exists
    const existingCustomerId = db.prepare('SELECT id FROM customers WHERE id = ?').get(id);
    
    if (existingCustomerId) {
      return res.status(400).json({ message: 'Customer ID already exists' });
    }
    
    // Check if RFID already exists
    const existingRfid = db.prepare('SELECT id FROM customers WHERE rfid = ?').get(rfid);
    
    if (existingRfid) {
      return res.status(400).json({ message: 'RFID already exists' });
    }
    
    // Insert the new customer
    db.prepare(`
      INSERT INTO customers (id, rfid, name)
      VALUES (?, ?, ?)
    `).run(id, rfid, name);
    
    // Get the newly created customer
    const newCustomer = db.prepare(`
      SELECT id, rfid, name, created_at, updated_at
      FROM customers
      WHERE id = ?
    `).get(id);
    
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a customer
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { newId, rfid, name } = req.body;
  
  if (!newId || !rfid || !name) {
    return res.status(400).json({ message: 'Customer ID, RFID and name are required' });
  }
  
  try {
    const db = getDb();
    
    // Check if customer exists
    const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // If ID is being changed, check if new ID already exists
    if (id !== newId) {
      const existingId = db.prepare('SELECT id FROM customers WHERE id = ?').get(newId);
      
      if (existingId) {
        return res.status(400).json({ message: 'New Customer ID already exists' });
      }
    }
    
    // Check if RFID is taken by another customer
    const existingRfid = db.prepare('SELECT id FROM customers WHERE rfid = ? AND id != ?').get(rfid, id);
    
    if (existingRfid) {
      return res.status(400).json({ message: 'RFID already exists' });
    }
    
    // Update the customer
    db.prepare(`
      UPDATE customers
      SET id = ?, rfid = ?, name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newId, rfid, name, id);
    
    // If ID changed, update related weight records
    if (id !== newId) {
      db.prepare(`
        UPDATE weight_records
        SET customer_id = ?
        WHERE customer_id = ?
      `).run(newId, id);
    }
    
    // Get the updated customer
    const updatedCustomer = db.prepare(`
      SELECT id, rfid, name, created_at, updated_at
      FROM customers
      WHERE id = ?
    `).get(newId);
    
    res.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a customer
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  try {
    const db = getDb();
    
    // Check if customer exists
    const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Delete the customer (cascade delete will remove related weight records)
    db.prepare('DELETE FROM customers WHERE id = ?').run(id);
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
