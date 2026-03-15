// Simple development server that proxies API requests
require('dotenv').config();
const express = require('express');
const apiHandler = require('./api/index.js');

const app = express();
const PORT = 3002;

app.use(express.json());

// Handle all API requests
app.all('/api/*', apiHandler);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log('Run "npm run dev" in another terminal for the frontend');
});
