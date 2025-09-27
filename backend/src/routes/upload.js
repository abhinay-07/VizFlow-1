const express = require('express');
const multer = require('multer');
const path = require('path');
const { CleanedData, ErrorLog } = require('../services/db');
const parserService = require('../services/parser');
const cleanerService = require('../services/cleaner');
const FileUtils = require('../utils/fileUtils');
const { uploadDir } = require('../config');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    FileUtils.ensureUploadDirectory(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = FileUtils.generateUniqueFileName(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (FileUtils.isValidFileType(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported: PDF, CSV, JSON, XML, PNG, JPG, JPEG'), false);
    }
  }
});

// POST /api/upload - Upload and process file
router.post('/', upload.single('file'), async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    filePath = req.file.path;
    const originalName = req.file.originalname;
    const fileType = FileUtils.getFileExtension(originalName);

    console.log(`Processing file: ${originalName} (${fileType})`);

    // Validate file size
    if (!FileUtils.validateFileSize(filePath, 50)) {
      throw new Error('File size exceeds 50MB limit');
    }

    // Step 1: Parse the file
    console.log('Step 1: Parsing file...');
    const { parsedData, processingTime } = await parserService.parseFile(filePath, fileType);
    
    if (!parsedData || parsedData.length === 0) {
      throw new Error('No data could be extracted from the file');
    }

    console.log(`Parsed ${parsedData.length} records`);

    // Step 2: Clean the data and detect errors
    console.log('Step 2: Cleaning data and detecting errors...');
    const { cleanedData, errors, summary } = cleanerService.cleanData(parsedData, originalName, fileType);

    console.log(`Cleaning complete: ${cleanedData.length} clean records, ${errors.length} errors`);

    // Step 3: Calculate metadata
    const metadata = calculateMetadata(cleanedData);

    // Step 4: Save cleaned data to MongoDB
    if (cleanedData.length > 0) {
      console.log('Step 3: Saving cleaned data to MongoDB...');
      const cleanedDoc = new CleanedData({
        originalFileName: originalName,
        fileType: fileType,
        cleanedData: cleanedData,
        recordCount: cleanedData.length,
        processingTime: processingTime,
        metadata: metadata
      });

      await cleanedDoc.save();
      console.log('Cleaned data saved to MongoDB');
    }

    // Step 5: Save error logs to MongoDB
    if (errors.length > 0) {
      console.log('Step 4: Saving error logs to MongoDB...');
      const errorSummary = calculateErrorSummary(errors);
      
      const errorDoc = new ErrorLog({
        originalFileName: originalName,
        fileType: fileType,
        errors: errors,
        errorCount: errors.length,
        errorSummary: errorSummary
      });

      await errorDoc.save();
      console.log('Error logs saved to MongoDB');
    }

    // Clean up uploaded file
    FileUtils.deleteFile(filePath);

    // Return success response
    res.json({
      success: true,
      message: 'File processed successfully',
      data: {
        originalFileName: originalName,
        fileType: fileType,
        summary: {
          totalRecords: parsedData.length,
          cleanedRecords: cleanedData.length,
          errorRecords: errors.length,
          processingTimeMs: processingTime
        },
        metadata: metadata,
        errorSummary: errors.length > 0 ? calculateErrorSummary(errors) : null
      }
    });

  } catch (error) {
    console.error('Upload processing error:', error);
    
    // Clean up uploaded file in case of error
    if (filePath) {
      FileUtils.deleteFile(filePath);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process file',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Helper method to calculate metadata
function calculateMetadata(cleanedData) {
  if (!cleanedData || cleanedData.length === 0) {
    return { totalFields: 0, uniqueFields: [], dataTypes: {} };
  }

  const allFields = new Set();
  const dataTypes = {};

  cleanedData.forEach(record => {
    Object.keys(record).forEach(key => {
      if (key !== '_metadata') {
        allFields.add(key);
        
        // Detect data type
        const value = record[key];
        const type = typeof value;
        
        if (!dataTypes[key]) {
          dataTypes[key] = new Set();
        }
        dataTypes[key].add(type);
      }
    });
  });

  // Convert Sets to arrays for JSON serialization
  const finalDataTypes = {};
  Object.keys(dataTypes).forEach(key => {
    finalDataTypes[key] = Array.from(dataTypes[key]);
  });

  return {
    totalFields: allFields.size,
    uniqueFields: Array.from(allFields),
    dataTypes: finalDataTypes
  };
}

// Helper method to calculate error summary
function calculateErrorSummary(errors) {
  const summary = {
    missing_fields: 0,
    invalid_formats: 0,
    duplicates: 0,
    validation_errors: 0
  };

  errors.forEach(error => {
    if (summary.hasOwnProperty(error.type)) {
      summary[error.type]++;
    }
  });

  return summary;
}

// GET /api/upload/status - Check upload status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Upload service is running',
    supportedFormats: ['PDF', 'CSV', 'JSON', 'XML', 'PNG', 'JPG', 'JPEG'],
    maxFileSize: '50MB'
  });
});

module.exports = router;