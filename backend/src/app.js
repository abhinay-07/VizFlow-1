const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const { mongoURI, port } = require('./config');

// Import routes
const uploadRoutes = require('./routes/upload');
const dataRoutes = require('./routes/data');
const errorRoutes = require('./routes/errors');
const downloadRoutes = require('./routes/download');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // React dev servers
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files (for serving uploaded files if needed)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database connection
mongoose.connect(mongoURI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log(`📊 Database: ${mongoURI}`);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/errors', errorRoutes);
app.use('/api/download', downloadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'VizFlow API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      upload: '/api/upload',
      data: '/api/data',
      errors: '/api/errors',
      download: '/api/download'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to VizFlow API',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File size too large. Maximum size allowed is 50MB.'
    });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Too many files uploaded or unexpected field name.'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 VizFlow API Server running on port ${port}`);
  console.log(`📡 API Base URL: http://localhost:${port}`);
  console.log(`🏥 Health Check: http://localhost:${port}/api/health`);
  console.log(`📁 Upload Endpoint: http://localhost:${port}/api/upload`);
  console.log('🎯 Ready to process files!');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down VizFlow API server...');
  try {
    await mongoose.connection.close();
    console.log('📊 MongoDB connection closed.');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
  process.exit(0);
});