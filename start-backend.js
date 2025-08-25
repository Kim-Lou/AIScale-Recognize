import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a log file for the server output
const logFile = fs.createWriteStream(
  path.join(logsDir, `backend-${new Date().toISOString().replace(/:/g, '-')}.log`)
);

console.log('Starting ScaleSense AI backend server...');
console.log('Server logs will be saved to:', logFile.path);

// Start the server process
const serverProcess = spawn('node', ['server/index.js'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: false
});

// Log server output to console and file
serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  logFile.write(output);
});

serverProcess.stderr.on('data', (data) => {
  const output = data.toString();
  process.stderr.write(`ERROR: ${output}`);
  logFile.write(`ERROR: ${output}`);
});

// Handle server exit
serverProcess.on('exit', (code) => {
  console.log(`Backend server exited with code ${code}`);
  logFile.end();
});

// Handle CTRL+C to gracefully shut down the server
process.on('SIGINT', () => {
  console.log('Stopping backend server...');
  serverProcess.kill();
  process.exit();
});

console.log('Backend server is running...');
console.log('Press Ctrl+C to stop the server');
