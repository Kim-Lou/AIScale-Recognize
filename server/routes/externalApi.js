import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/database.js';
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
 * @apiHeader {String} X-DEVICE-ID Device ID for authentication
 * @apiHeader {String} X-API-KEY Device API key for authentication
 * 
 * @apiBody {String} rfid The RFID number of the customer (required)
 * @apiBody {Number} total_weight The total weight in kg (required)
 * @apiBody {String} [weighing_time] Optional ISO datetime string (defaults to current time)
 * @apiBody {File} [image] Optional image file of the weighing process
 * 
 * @apiSuccess {String} rfid Customer's RFID number
 * @apiSuccess {String} weighRecordId Globally unique record identifier
 * @apiSuccess {String} [image_url] URL to the weighing image
 */
// Middleware to authenticate device using device_id and api_key from database
const authenticateDevice = (req, res, next) => {
  try {
    const deviceId = req.headers['x-device-id'];
    const apiKey = req.headers['x-api-key'];
    
    // Check if headers are provided
    if (!deviceId || !apiKey) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing required authentication headers: X-DEVICE-ID and X-API-KEY' });
    }
    
    const db = getDb();
    
    // Step 1: Check if device_id exists in devices table
    const deviceByDeviceId = db.prepare('SELECT id, device_id, api_key, registration_status FROM devices WHERE device_id = ?').get(deviceId);
    
    if (!deviceByDeviceId) {
      return res.status(401).json({ error: 'Unauthorized', message: '设备未注册' });
    }
    
    // Step 2: Check if api_key matches the device
    if (deviceByDeviceId.api_key !== apiKey) {
      return res.status(401).json({ error: 'Unauthorized', message: 'api_key错误' });
    }
    
    // Step 3: Check if device is registered successfully
    if (deviceByDeviceId.registration_status !== 'success') {
      return res.status(403).json({ error: 'Forbidden', message: 'Device registration not completed successfully' });
    }
    
    // Update last uploaded timestamp
    db.prepare('UPDATE devices SET last_uploaded_at = CURRENT_TIMESTAMP WHERE id = ?').run(deviceByDeviceId.id);
    
    // Store device info in request for potential use
    req.deviceInfo = deviceByDeviceId;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.post('/weight-records', authenticateDevice, upload.single('image'), async (req, res) => {
  try {
    const { rfid, total_weight, weighing_time } = req.body;
    
    // Validate required fields
    if (!rfid || !total_weight) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['rfid', 'total_weight']
      });
    }
    
    // Parse total weight
    const parsedTotalWeight = parseFloat(total_weight);
    if (isNaN(parsedTotalWeight)) {
      return res.status(400).json({ error: 'Total weight must be a number' });
    }
    
    const db = getDb();
    
    // Step 3: Check if rfid exists in customers table
    const customer = db.prepare('SELECT id, name FROM customers WHERE rfid = ?').get(rfid);
    
    if (!customer) {
      return res.status(400).json({ error: 'rfid不匹配' });
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
    
    // 验证weighing_time格式
    let validWeighingTime = new Date().toISOString(); // 默认使用当前时间
    if (weighing_time && weighing_time.trim()) {
      // 检查是否为无效的时间格式
      if (weighing_time === '0000-00-00 00:00:00' || weighing_time === '0000-00-00') {
        // 使用当前时间替代无效时间
        console.warn('Invalid weighing_time detected:', weighing_time, 'Using current time instead');
      } else {
        // 尝试解析时间字符串
        const parsedTime = new Date(weighing_time);
        // 验证是否为有效的日期对象
        if (!isNaN(parsedTime.getTime())) {
          validWeighingTime = parsedTime.toISOString();
        } else {
          console.warn('Unable to parse weighing_time:', weighing_time, 'Using current time instead');
        }
      }
    }
    
    // Get device_id from authenticated device info
    const deviceId = req.deviceInfo?.device_id || null;
    
    // Insert the new weight record
    const result = db.prepare(`
      INSERT INTO weight_records 
      (weighRecordId, customer_id, customer_name, waste_type, bin_type, 
       total_weight, bin_weight, net_weight, weighing_time, image_url, device_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      weighRecordId,
      customer.id,
      customer.name,
      'Unclassified', // Default waste type
      'Unknown',      // Default bin type
      parsedTotalWeight,
      binWeight,
      netWeight,
      validWeighingTime,
      imagePath,
      deviceId
    );
    
    // Update the device's last_uploaded_at with the weighing_time from the record
    if (deviceId) {
      db.prepare('UPDATE devices SET last_uploaded_at = ? WHERE device_id = ?').run(validWeighingTime, deviceId);
    }
    
    // Get the newly created weight record
    const newWeightRecord = db.prepare(`
      SELECT id, weighRecordId, customer_id, customer_name, waste_type, bin_type, 
             total_weight, bin_weight, net_weight, weighing_time, image_url, device_id
      FROM weight_records
      WHERE id = ?
    `).get(result.lastInsertRowid);
    
    // Return only the required fields in the response
    res.status(201).json({
      rfid: rfid,
      weighRecordId: newWeightRecord.weighRecordId,
      image_url: newWeightRecord.image_url
    });
  } catch (error) {
    console.error('Error creating weight record:', error);
    res.status(500).json({ error: 'Internal server error', message: 'An error occurred while processing your request' });
  }
});

/**
 * @api {get} /api/external/weight-records/:weighRecordId Get weight record
 * @apiName GetWeightRecord
 * @apiGroup ExternalAPI
 * @apiDescription Retrieves a specific weight record by its weighRecordId
 * 
 * @apiHeader {String} X-DEVICE-ID Device ID for authentication
 * @apiHeader {String} X-API-KEY Device API key for authentication
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
 * @apiSuccess {String} [weightRecord.device_id] Device ID that created the record
 */
router.get('/weight-records/:weighRecordId', authenticateDevice, (req, res) => {
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
             weighing_time, device_id
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
    res.status(500).json({ error: 'Internal server error', message: 'An error occurred while retrieving the weight record' });
  }
});

/**
 * @api {patch} /api/external/weight-records/:weighRecordId Update weight record
 * @apiName UpdateWeightRecord
 * @apiGroup ExternalAPI
 * @apiDescription Updates specific fields of a weight record
 * 
 * @apiHeader {String} X-DEVICE-ID Device ID for authentication
 * @apiHeader {String} X-API-KEY Device API key for authentication
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
router.patch('/weight-records/:weighRecordId', authenticateDevice, (req, res) => {
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
    res.status(500).json({ error: 'Internal server error', message: 'An error occurred while updating the weight record' });
  }
});

export default router;
