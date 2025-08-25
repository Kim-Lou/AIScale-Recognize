import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/scalesense.db');

// Ensure the data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create a database connection
let db;

// Initialize the database
export const initializeDatabase = async () => {
  return new Promise((resolve, reject) => {
    try {
      db = new Database(dbPath);
      
      // Enable foreign keys
      db.pragma('foreign_keys = ON');
      
      // Create users table
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create customers table
      db.exec(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          rfid TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Check if we need to add or rename the weighRecordId column in weight_records table
      let weightTableExists = false;
      try {
        const tableInfo = db.prepare("PRAGMA table_info(weight_records)").all();
        weightTableExists = tableInfo.length > 0;
        
        // Check if uid column exists
        const uidColumnExists = tableInfo.some(col => col.name === 'uid');
        
        // Check if weighRecordId column exists
        const weighRecordIdColumnExists = tableInfo.some(col => col.name === 'weighRecordId');
        
        if (weightTableExists) {
          if (uidColumnExists && !weighRecordIdColumnExists) {
            // Rename uid column to weighRecordId
            console.log('Renaming uid column to weighRecordId in weight_records table...');
            
            // SQLite doesn't directly support RENAME COLUMN, so we need to create a new table
            // with the desired schema, copy the data, drop the old table, and rename the new one
            
            db.exec(`
              -- Create a new table with the desired schema
              CREATE TABLE weight_records_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                weighRecordId TEXT NOT NULL UNIQUE,
                customer_id TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                waste_type TEXT NOT NULL,
                bin_type TEXT NOT NULL,
                total_weight REAL NOT NULL,
                bin_weight REAL NOT NULL,
                net_weight REAL NOT NULL,
                weighing_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                image_url TEXT,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
              );
              
              -- Copy data from the old table to the new one, renaming the column
              INSERT INTO weight_records_new (
                id, weighRecordId, customer_id, customer_name, waste_type, bin_type,
                total_weight, bin_weight, net_weight, weighing_time, image_url
              )
              SELECT
                id, uid, customer_id, customer_name, waste_type, bin_type,
                total_weight, bin_weight, net_weight, weighing_time, image_url
              FROM weight_records;
              
              -- Drop the old table
              DROP TABLE weight_records;
              
              -- Rename the new table to the original name
              ALTER TABLE weight_records_new RENAME TO weight_records;
            `);
            
            console.log('Successfully renamed uid column to weighRecordId');
          } else if (!uidColumnExists && !weighRecordIdColumnExists) {
            // Add weighRecordId column if neither exists
            console.log('Adding weighRecordId column to weight_records table...');
            db.exec(`ALTER TABLE weight_records ADD COLUMN weighRecordId TEXT`);
            
            // Update existing records with new IDs
            const existingRecords = db.prepare("SELECT id FROM weight_records").all();
            const updateId = db.prepare("UPDATE weight_records SET weighRecordId = ? WHERE id = ?");
            
            existingRecords.forEach(record => {
              updateId.run(uuidv4(), record.id);
            });
            
            console.log(`Updated ${existingRecords.length} records with weighRecordId values`);
          }
        }
      } catch (err) {
        console.log('Weight records table does not exist yet.', err);
        weightTableExists = false;
      }
      
      // Create or recreate weight records table if it doesn't exist
      if (!weightTableExists) {
        db.exec(`
          CREATE TABLE IF NOT EXISTS weight_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            weighRecordId TEXT NOT NULL UNIQUE,
            customer_id TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            waste_type TEXT NOT NULL,
            bin_type TEXT NOT NULL,
            total_weight REAL NOT NULL,
            bin_weight REAL NOT NULL,
            net_weight REAL NOT NULL,
            weighing_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            image_url TEXT,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
          )
        `);
      }
      
      // Check if we need to seed the database with initial data
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
      
      if (userCount.count === 0) {
        // Only create default admin user, no sample data
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync('admin123', salt);
        
        db.prepare(`
          INSERT INTO users (name, username, password)
          VALUES (?, ?, ?)
        `).run('Administrator', 'admin', hashedPassword);
        
        console.log('Created default admin user only, no sample data added');
      }
      
      console.log('Database initialized successfully');
      resolve();
    } catch (error) {
      console.error('Database initialization error:', error);
      reject(error);
    }
  });
};

// Export the database instance
export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};
