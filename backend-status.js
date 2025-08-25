import fetch from 'node-fetch';

// Base URL for API
const API_BASE_URL = 'http://localhost:5000/api';

// Check server status
async function checkServerStatus() {
  console.log('Checking ScaleSense AI backend server status...');
  
  try {
    // Try to connect to the server
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'wrong_password'
      }),
      timeout: 3000
    });
    
    if (response.status === 401) {
      console.log('✅ Backend server is running and responding to authentication requests');
      return true;
    } else {
      console.log(`⚠️ Backend server responded with unexpected status: ${response.status}`);
      const data = await response.json();
      console.log('Response:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Backend server is not responding');
    console.error('Error details:', error.message);
    console.log('\nPossible solutions:');
    console.log('1. Make sure the server is running (npm run server)');
    console.log('2. Check if the server is running on the correct port (5000)');
    console.log('3. Check server logs for errors');
    return false;
  }
}

// Execute check
checkServerStatus();
