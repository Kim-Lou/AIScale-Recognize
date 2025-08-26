import express from 'express';
import { getDb } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all weight records with pagination
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    // Validate parameters
    if (page < 1 || limit < 1 || limit > 1000) {
      return res.status(400).json({ 
        message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 1000' 
      });
    }
    
    // Get total count for pagination metadata
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM weight_records').get().count;
    
    // Get paginated records
    const weightRecords = db.prepare(`
      SELECT id, weighRecordId, customer_id, customer_name, waste_type, bin_type, 
             total_weight, bin_weight, net_weight, weighing_time, image_url
      FROM weight_records
      ORDER BY weighing_time DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
    
    res.json({
      records: weightRecords,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching weight records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get weight records for a specific customer
router.get('/customer/:customerId', authenticateToken, (req, res) => {
  const { customerId } = req.params;
  
  try {
    const db = getDb();
    const weightRecords = db.prepare(`
      SELECT id, weighRecordId, customer_id, customer_name, waste_type, bin_type, 
             total_weight, bin_weight, net_weight, weighing_time, image_url
      FROM weight_records
      WHERE customer_id = ?
      ORDER BY weighing_time DESC
    `).all(customerId);
    
    res.json(weightRecords);
  } catch (error) {
    console.error('Error fetching customer weight records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single weight record
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  try {
    const db = getDb();
    const weightRecord = db.prepare(`
      SELECT id, weighRecordId, customer_id, customer_name, waste_type, bin_type, 
             total_weight, bin_weight, net_weight, weighing_time, image_url
      FROM weight_records
      WHERE id = ?
    `).get(id);
    
    if (!weightRecord) {
      return res.status(404).json({ message: 'Weight record not found' });
    }
    
    res.json(weightRecord);
  } catch (error) {
    console.error('Error fetching weight record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new weight record
router.post('/', authenticateToken, (req, res) => {
  const { 
    customer_id, 
    customer_name, 
    waste_type, 
    bin_type, 
    total_weight, 
    bin_weight, 
    net_weight, 
    image_url 
  } = req.body;
  
  if (!customer_id || !customer_name || !waste_type || !bin_type || 
      total_weight === undefined || bin_weight === undefined || net_weight === undefined) {
    return res.status(400).json({ 
      message: 'Customer ID, customer name, waste type, bin type, total weight, bin weight, and net weight are required' 
    });
  }
  
  try {
    const db = getDb();
    
    // Check if customer exists
    const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(customer_id);
    
    if (!customer) {
      return res.status(400).json({ message: 'Customer not found' });
    }
    
    // Generate a new UUID for the record
    const weighRecordId = uuidv4();
    
    // Insert the new weight record
    const result = db.prepare(`
      INSERT INTO weight_records 
      (weighRecordId, customer_id, customer_name, waste_type, bin_type, total_weight, bin_weight, net_weight, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      weighRecordId,
      customer_id, 
      customer_name, 
      waste_type, 
      bin_type, 
      total_weight, 
      bin_weight, 
      net_weight, 
      image_url || null
    );
    
    // Get the newly created weight record
    const newWeightRecord = db.prepare(`
      SELECT id, weighRecordId, customer_id, customer_name, waste_type, bin_type, 
             total_weight, bin_weight, net_weight, weighing_time, image_url
      FROM weight_records
      WHERE id = ?
    `).get(result.lastInsertRowid);
    
    res.status(201).json(newWeightRecord);
  } catch (error) {
    console.error('Error creating weight record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a weight record
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { 
    customer_id, 
    customer_name, 
    waste_type, 
    bin_type, 
    total_weight, 
    bin_weight, 
    net_weight, 
    image_url 
  } = req.body;
  
  if (!customer_id || !customer_name || !waste_type || !bin_type || 
      total_weight === undefined || bin_weight === undefined || net_weight === undefined) {
    return res.status(400).json({ 
      message: 'Customer ID, customer name, waste type, bin type, total weight, bin weight, and net weight are required' 
    });
  }
  
  try {
    const db = getDb();
    
    // Check if weight record exists
    const weightRecord = db.prepare('SELECT id FROM weight_records WHERE id = ?').get(id);
    
    if (!weightRecord) {
      return res.status(404).json({ message: 'Weight record not found' });
    }
    
    // Check if customer exists
    const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(customer_id);
    
    if (!customer) {
      return res.status(400).json({ message: 'Customer not found' });
    }
    
    // Update the weight record
    db.prepare(`
      UPDATE weight_records
      SET customer_id = ?, customer_name = ?, waste_type = ?, bin_type = ?,
          total_weight = ?, bin_weight = ?, net_weight = ?, image_url = ?
      WHERE id = ?
    `).run(
      customer_id, 
      customer_name, 
      waste_type, 
      bin_type, 
      total_weight, 
      bin_weight, 
      net_weight, 
      image_url || null,
      id
    );
    
    // Get the updated weight record
    const updatedWeightRecord = db.prepare(`
      SELECT id, weighRecordId, customer_id, customer_name, waste_type, bin_type, 
             total_weight, bin_weight, net_weight, weighing_time, image_url
      FROM weight_records
      WHERE id = ?
    `).get(id);
    
    res.json(updatedWeightRecord);
  } catch (error) {
    console.error('Error updating weight record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a weight record
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  try {
    const db = getDb();
    
    // Check if weight record exists
    const weightRecord = db.prepare('SELECT id FROM weight_records WHERE id = ?').get(id);
    
    if (!weightRecord) {
      return res.status(404).json({ message: 'Weight record not found' });
    }
    
    // Delete the weight record
    db.prepare('DELETE FROM weight_records WHERE id = ?').run(id);
    
    res.json({ message: 'Weight record deleted successfully' });
  } catch (error) {
    console.error('Error deleting weight record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
