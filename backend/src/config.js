require('dotenv').config();

module.exports = {
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/vizflow',
  port: process.env.PORT || 5000,
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: process.env.MAX_FILE_SIZE || '50MB',
  nodeEnv: process.env.NODE_ENV || 'development'
};