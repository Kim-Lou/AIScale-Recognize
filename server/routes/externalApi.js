import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/database.js';
import { authenticateApiKey } from '../middleware/auth.js';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure file upload for images
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'weight-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

/**
 * @api {post} /api/external/weight-records Create a new weight record
 * @apiName CreateWeightRecord
 * @apiGroup ExternalAPI
 * @apiDescription Creates a new weight record with data from external system
 * 
 * @apiHeader {String} X-API-KEY External system API key for authentication
 * 
 * @apiBody {String} customer_id The customer ID
 * @apiBody {Number} total_weight The total weight in kg
 * @apiBody {String} [weighing_time] Optional ISO datetime string (defaults to current time)
 * @apiBody {File} [image] Optional image file of the weighing process
 * 
 * @apiSuccess {Object} weightRecord The created weight record
 * @apiSuccess {Number} weightRecord.id Internal record ID
 * @apiSuccess {String} weightRecord.weighRecordId Globally unique record identifier
 * @apiSuccess {String} weightRecord.customer_id Customer ID
 * @apiSuccess {String} weightRecord.customer_name Customer name
 * @apiSuccess {Number} weightRecord.total_weight Total weight in kg
 * @apiSuccess {String} weightRecord.weighing_time ISO datetime of weighing
 * @apiSuccess {String} [weightRecord.image_url] URL to the weighing image
 */
router.post('/weight-records', authenticateApiKey, upload.single('image'), async (req, res) => {
  try {
    const { customer_id, total_weight, weighing_time } = req.body;
    
    // Validate required fields
    if (!customer_id || !total_weight) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['customer_id', 'total_weight']
      });
    }
    
    // Parse total weight
    const parsedTotalWeight = parseFloat(total_weight);
    if (isNaN(parsedTotalWeight)) {
      return res.status(400).json({ error: 'Total weight must be a number' });
    }
    
    const db = getDb();
    
    // Check if customer exists
    const customer = db.prepare('SELECT id, name FROM customers WHERE id = ?').get(customer_id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Process image file if uploaded
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }
    
    // Generate weighRecordId
    const weighRecordId = uuidv4();
    
    // Default values for new record
    const binWeight = 0;
    const netWeight = parsedTotalWeight; // If bin weight is unknown, net = total
    
    // Insert the new weight record
    const result = db.prepare(`
      INSERT INTO weight_records 
      (weighRecordId, customer_id, customer_name, waste_type, bin_type, 
       total_weight, bin_weight, net_weight, weighing_time, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      weighRecordId,
      customer_id,
      customer.name,
      'Unclassified', // Default waste type
      'Unknown',      // Default bin type
      parsedTotalWeight,
      binWeight,
      netWeight,
      weighing_time || new Date().toISOString(),
      imagePath
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @api {get} /api/external/weight-records/:weighRecordId Get weight record
 * @apiName GetWeightRecord
 * @apiGroup ExternalAPI
 * @apiDescription Retrieves a specific weight record by its weighRecordId
 * 
 * @apiHeader {String} X-API-KEY External system API key for authentication
 * 
 * @apiParam {String} weighRecordId The unique identifier of the weight record
 * 
 * @apiSuccess {Object} weightRecord The weight record
 * @apiSuccess {String} weightRecord.weighRecordId Globally unique record identifier
 * @apiSuccess {String} weightRecord.image_url URL to the weighing image
 * @apiSuccess {String} weightRecord.customer_id Customer ID
 * @apiSuccess {String} weightRecord.customer_name Customer name
 * @apiSuccess {String} weightRecord.waste_type Waste type
 * @apiSuccess {String} weightRecord.bin_type Bin type
 * @apiSuccess {Number} weightRecord.total_weight Total weight in kg
 * @apiSuccess {Number} weightRecord.bin_weight Bin weight in kg
 * @apiSuccess {Number} weightRecord.net_weight Net weight in kg
 * @apiSuccess {String} weightRecord.weighing_time ISO datetime of weighing
 */
router.get('/weight-records/:weighRecordId', authenticateApiKey, (req, res) => {
  try {
    const { weighRecordId } = req.params;
    
    if (!weighRecordId) {
      return res.status(400).json({ error: 'Missing weighRecordId parameter' });
    }
    
    const db = getDb();
    
    // Get the weight record by weighRecordId
    const weightRecord = db.prepare(`
      SELECT weighRecordId, image_url, customer_id, customer_name, waste_type, bin_type,
             ROUND(total_weight, 1) as total_weight, 
             ROUND(bin_weight, 1) as bin_weight, 
             ROUND(net_weight, 1) as net_weight, 
             weighing_time
      FROM weight_records
      WHERE weighRecordId = ?
    `).get(weighRecordId);
    
    if (!weightRecord) {
      return res.status(404).json({ error: 'Weight record not found' });
    }
    
    // If image exists, convert relative path to absolute URL
    if (weightRecord.image_url) {
      const host = req.get('host');
      const protocol = req.protocol;
      weightRecord.image_url = `${protocol}://${host}${weightRecord.image_url}`;
    }
    
    res.json(weightRecord);
  } catch (error) {
    console.error('Error retrieving weight record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @api {patch} /api/external/weight-records/:weighRecordId Update weight record
 * @apiName UpdateWeightRecord
 * @apiGroup ExternalAPI
 * @apiDescription Updates specific fields of a weight record
 * 
 * @apiHeader {String} X-API-KEY External system API key for authentication
 * 
 * @apiParam {String} weighRecordId The unique identifier of the weight record
 * 
 * @apiBody {String} [waste_type] The waste type
 * @apiBody {String} [bin_type] The bin type
 * @apiBody {Number} [bin_weight] The bin weight in kg
 * @apiBody {Number} [net_weight] The net weight in kg
 * 
 * @apiSuccess {Object} weightRecord The updated weight record
 * @apiSuccess {String} weightRecord.weighRecordId Globally unique record identifier
 * @apiSuccess {String} weightRecord.customer_id Customer ID
 * @apiSuccess {String} weightRecord.customer_name Customer name
 * @apiSuccess {String} weightRecord.waste_type Waste type
 * @apiSuccess {String} weightRecord.bin_type Bin type
 * @apiSuccess {Number} weightRecord.total_weight Total weight in kg
 * @apiSuccess {Number} weightRecord.bin_weight Bin weight in kg
 * @apiSuccess {Number} weightRecord.net_weight Net weight in kg
 * @apiSuccess {String} weightRecord.weighing_time ISO datetime of weighing
 * @apiSuccess {String} [weightRecord.image_url] URL to the weighing image
 */
router.patch('/weight-records/:weighRecordId', authenticateApiKey, (req, res) => {
  try {
    const { weighRecordId } = req.params;
    const { waste_type, bin_type, bin_weight, net_weight } = req.body;
    
    if (!weighRecordId) {
      return res.status(400).json({ error: 'Missing weighRecordId parameter' });
    }
    
    // At least one update field is required
    if (waste_type === undefined && bin_type === undefined && 
        bin_weight === undefined && net_weight === undefined) {
      return res.status(400).json({ 
        error: 'At least one field to update is required',
        allowed: ['waste_type', 'bin_type', 'bin_weight', 'net_weight']
      });
    }
    
    const db = getDb();
    
    // Check if weight record exists
    const existingRecord = db.prepare('SELECT * FROM weight_records WHERE weighRecordId = ?').get(weighRecordId);
    
    if (!existingRecord) {
      return res.status(404).json({ error: 'Weight record not found' });
    }
    
    // Prepare update fields and values
    const updateFields = [];
    const updateValues = [];
    
    if (waste_type !== undefined) {
      updateFields.push('waste_type = ?');
      updateValues.push(waste_type);
    }
    
    if (bin_type !== undefined) {
      updateFields.push('bin_type = ?');
      updateValues.push(bin_type);
    }
    
    if (bin_weight !== undefined) {
      const parsedBinWeight = parseFloat(bin_weight);
      if (isNaN(parsedBinWeight)) {
        return res.status(400).json({ error: 'Bin weight must be a number' });
      }
      updateFields.push('bin_weight = ?');
      updateValues.push(parsedBinWeight);
      
      // Recalculate net weight if bin weight is updated but net weight isn't provided
      if (net_weight === undefined) {
        const newNetWeight = Math.max(0, existingRecord.total_weight - parsedBinWeight);
        updateFields.push('net_weight = ?');
        updateValues.push(newNetWeight);
      }
    }
    
    if (net_weight !== undefined) {
      const parsedNetWeight = parseFloat(net_weight);
      if (isNaN(parsedNetWeight)) {
        return res.status(400).json({ error: 'Net weight must be a number' });
      }
      updateFields.push('net_weight = ?');
      updateValues.push(parsedNetWeight);
      
      // Recalculate bin weight if net weight is updated but bin weight isn't provided
      if (bin_weight === undefined) {
        const newBinWeight = Math.max(0, existingRecord.total_weight - parsedNetWeight);
        updateFields.push('bin_weight = ?');
        updateValues.push(newBinWeight);
      }
    }
    
    // Add weighRecordId to the values array for the WHERE clause
    updateValues.push(weighRecordId);
    
    // Execute the update
    db.prepare(`
      UPDATE weight_records
      SET ${updateFields.join(', ')}
      WHERE weighRecordId = ?
    `).run(...updateValues);
    
    // Get the updated record
    const updatedRecord = db.prepare(`
      SELECT id, weighRecordId, customer_id, customer_name, waste_type, bin_type,
             ROUND(total_weight, 1) as total_weight, 
             ROUND(bin_weight, 1) as bin_weight, 
             ROUND(net_weight, 1) as net_weight, 
             weighing_time, image_url
      FROM weight_records
      WHERE weighRecordId = ?
    `).get(weighRecordId);
    
    res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating weight record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
