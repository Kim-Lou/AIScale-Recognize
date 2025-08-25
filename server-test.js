import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure environment
dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Logger setup
const logFile = path.join(logsDir, `backend-test-${new Date().toISOString().replace(/:/g, '-')}.log`);
const logger = {
  log: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] INFO: ${message}`;
    console.log(logMessage);
    fs.appendFileSync(logFile, logMessage + '\n');
  },
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}`;
    const errorDetails = error ? `\n${error.stack || error}` : '';
    console.error(logMessage, errorDetails);
    fs.appendFileSync(logFile, logMessage + errorDetails + '\n');
  }
};

// Base URL for API
const API_BASE_URL = 'http://localhost:5000/api';

// Test authentication
async function testAuth() {
  logger.log('Testing authentication...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      logger.log('✅ Authentication successful');
      logger.log(`Token received: ${data.token.substring(0, 15)}...`);
      return data.token;
    } else {
      logger.error(`❌ Authentication failed: ${data.message}`);
      return null;
    }
  } catch (error) {
    logger.error('❌ Authentication request failed', error);
    return null;
  }
}

// Test getting users
async function testGetUsers(token) {
  logger.log('Testing GET /users endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      logger.log(`✅ Successfully retrieved ${data.length} users`);
      logger.log(`First user: ${JSON.stringify(data[0])}`);
      return true;
    } else {
      logger.error(`❌ Failed to get users: ${data.message}`);
      return false;
    }
  } catch (error) {
    logger.error('❌ User request failed', error);
    return false;
  }
}

// Test getting customers
async function testGetCustomers(token) {
  logger.log('Testing GET /customers endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      logger.log(`✅ Successfully retrieved ${data.length} customers`);
      logger.log(`First customer: ${JSON.stringify(data[0])}`);
      return true;
    } else {
      logger.error(`❌ Failed to get customers: ${data.message}`);
      return false;
    }
  } catch (error) {
    logger.error('❌ Customer request failed', error);
    return false;
  }
}

// Test getting weight records
async function testGetWeightRecords(token) {
  logger.log('Testing GET /weights endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/weights`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      logger.log(`✅ Successfully retrieved ${data.length} weight records`);
      logger.log(`First weight record: ${JSON.stringify(data[0])}`);
      return true;
    } else {
      logger.error(`❌ Failed to get weight records: ${data.message}`);
      return false;
    }
  } catch (error) {
    logger.error('❌ Weight records request failed', error);
    return false;
  }
}

// Test creating a customer
async function testCreateCustomer(token) {
  logger.log('Testing POST /customers endpoint...');
  
  const testCustomer = {
    id: `C${Math.floor(1000 + Math.random() * 9000)}`,
    rfid: `RF${Math.floor(10000 + Math.random() * 90000)}`,
    name: `Test Customer ${new Date().toISOString()}`
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testCustomer)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      logger.log(`✅ Successfully created customer: ${JSON.stringify(data)}`);
      return data.id;
    } else {
      logger.error(`❌ Failed to create customer: ${data.message}`);
      return null;
    }
  } catch (error) {
    logger.error('❌ Create customer request failed', error);
    return null;
  }
}

// Test creating a weight record
async function testCreateWeightRecord(token, customerId) {
  logger.log('Testing POST /weights endpoint...');
  
  if (!customerId) {
    logger.error('❌ Cannot create weight record without customer ID');
    return null;
  }
  
  // Get customer details first
  try {
    const customerResponse = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const customerData = await customerResponse.json();
    
    if (!customerResponse.ok) {
      logger.error(`❌ Failed to get customer details: ${customerData.message}`);
      return null;
    }
    
    const testWeightRecord = {
      customer_id: customerId,
      customer_name: customerData.name,
      waste_type: 'Test Waste',
      bin_type: 'Test Container',
      total_weight: 100 + Math.random() * 50,
      bin_weight: 10 + Math.random() * 5,
      net_weight: 90 + Math.random() * 45,
      image_url: null
    };
    
    const response = await fetch(`${API_BASE_URL}/weights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testWeightRecord)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      logger.log(`✅ Successfully created weight record: ${JSON.stringify(data)}`);
      return data.id;
    } else {
      logger.error(`❌ Failed to create weight record: ${data.message}`);
      return null;
    }
  } catch (error) {
    logger.error('❌ Create weight record request failed', error);
    return null;
  }
}

// Test deleting a customer
async function testDeleteCustomer(token, customerId) {
  if (!customerId) {
    logger.error('❌ Cannot delete customer without ID');
    return false;
  }
  
  logger.log(`Testing DELETE /customers/${customerId} endpoint...`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      logger.log(`✅ Successfully deleted customer: ${data.message}`);
      return true;
    } else {
      const data = await response.json();
      logger.error(`❌ Failed to delete customer: ${data.message}`);
      return false;
    }
  } catch (error) {
    logger.error('❌ Delete customer request failed', error);
    return false;
  }
}

// Main test function
async function runTests() {
  logger.log('Starting backend verification tests...');
  logger.log(`API Base URL: ${API_BASE_URL}`);
  
  // Test server connectivity first
  try {
    await fetch(`${API_BASE_URL}/auth/login`);
    logger.log('✅ Server is reachable');
  } catch (error) {
    logger.error('❌ Cannot connect to server. Is it running?', error);
    return;
  }
  
  // Test authentication
  const token = await testAuth();
  if (!token) {
    logger.error('❌ Authentication failed, cannot proceed with other tests');
    return;
  }
  
  // Test basic GET endpoints
  const usersOk = await testGetUsers(token);
  const customersOk = await testGetCustomers(token);
  const weightsOk = await testGetWeightRecords(token);
  
  if (!usersOk || !customersOk || !weightsOk) {
    logger.error('❌ Basic GET endpoints test failed, skipping write operations');
    return;
  }
  
  // Test write operations
  const newCustomerId = await testCreateCustomer(token);
  if (newCustomerId) {
    const newWeightId = await testCreateWeightRecord(token, newCustomerId);
    if (newWeightId) {
      logger.log('✅ Write operations test passed');
    }
    
    // Clean up by deleting the test customer
    await testDeleteCustomer(token, newCustomerId);
  } else {
    logger.error('❌ Write operations test failed');
  }
  
  logger.log('Backend verification tests completed');
}

// Run the tests
runTests().catch(error => {
  logger.error('Unhandled error during tests', error);
});
