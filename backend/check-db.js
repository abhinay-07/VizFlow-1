const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vizflow');

// Define schemas (same as in your app)
const cleanedDataSchema = new mongoose.Schema({
  originalFileName: String,
  fileType: String,
  uploadDate: { type: Date, default: Date.now },
  processedDate: Date,
  totalRows: Number,
  cleanRows: Number,
  errorCount: Number,
  data: [mongoose.Schema.Types.Mixed],
  metadata: {
    fileSize: Number,
    columns: [String],
    dataTypes: mongoose.Schema.Types.Mixed,
    summary: mongoose.Schema.Types.Mixed
  }
}, { collection: 'cleaned_data' });

const errorLogSchema = new mongoose.Schema({
  uploadId: mongoose.Schema.Types.ObjectId,
  fileName: String,
  errorType: String,
  errorMessage: String,
  rowIndex: Number,
  columnName: String,
  originalValue: mongoose.Schema.Types.Mixed,
  suggestedFix: String,
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  timestamp: { type: Date, default: Date.now },
  errorDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { 
  collection: 'error_logs',
  suppressReservedKeysWarning: true 
});

const CleanedData = mongoose.model('CleanedData', cleanedDataSchema);
const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);

async function checkDatabase() {
  try {
    console.log('🔍 Checking VizFlow Database Contents...\n');
    
    // Check cleaned data
    const cleanedDataCount = await CleanedData.countDocuments();
    console.log(`📊 Cleaned Data Records: ${cleanedDataCount}`);
    
    if (cleanedDataCount > 0) {
      console.log('\n📋 Recent Cleaned Data Entries:');
      const recentData = await CleanedData.find().sort({ uploadDate: -1 }).limit(5);
      
      recentData.forEach((entry, index) => {
        console.log(`\n${index + 1}. File: ${entry.originalFileName}`);
        console.log(`   Type: ${entry.fileType}`);
        console.log(`   Upload Date: ${entry.uploadDate}`);
        console.log(`   Total Rows: ${entry.totalRows}`);
        console.log(`   Clean Rows: ${entry.cleanRows}`);
        console.log(`   Errors: ${entry.errorCount}`);
        console.log(`   Columns: ${entry.metadata?.columns?.join(', ') || 'N/A'}`);
        
        // Show first few data rows
        if (entry.data && entry.data.length > 0) {
          console.log(`   Sample Data (first 2 rows):`);
          entry.data.slice(0, 2).forEach((row, i) => {
            console.log(`     Row ${i + 1}:`, JSON.stringify(row).substring(0, 100) + '...');
          });
        }
      });
    }
    
    // Check error logs
    const errorLogCount = await ErrorLog.countDocuments();
    console.log(`\n🚨 Error Log Records: ${errorLogCount}`);
    
    if (errorLogCount > 0) {
      console.log('\n📋 Recent Error Logs:');
      const recentErrors = await ErrorLog.find().sort({ timestamp: -1 }).limit(10);
      
      recentErrors.forEach((error, index) => {
        console.log(`\n${index + 1}. File: ${error.fileName}`);
        console.log(`   Error Type: ${error.errorType}`);
        console.log(`   Message: ${error.errorMessage}`);
        console.log(`   Row: ${error.rowIndex}`);
        console.log(`   Column: ${error.columnName}`);
        console.log(`   Original Value: ${error.originalValue}`);
        console.log(`   Severity: ${error.severity}`);
        console.log(`   Timestamp: ${error.timestamp}`);
      });
    }
    
    // Database statistics
    console.log('\n📈 Database Statistics:');
    console.log(`   Total Files Processed: ${cleanedDataCount}`);
    console.log(`   Total Errors Detected: ${errorLogCount}`);
    
    if (cleanedDataCount > 0) {
      const totalRows = await CleanedData.aggregate([
        { $group: { _id: null, total: { $sum: "$totalRows" } } }
      ]);
      const totalCleanRows = await CleanedData.aggregate([
        { $group: { _id: null, total: { $sum: "$cleanRows" } } }
      ]);
      
      console.log(`   Total Rows Processed: ${totalRows[0]?.total || 0}`);
      console.log(`   Total Clean Rows: ${totalCleanRows[0]?.total || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

checkDatabase();