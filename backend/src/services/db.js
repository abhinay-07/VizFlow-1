const mongoose = require('mongoose');

const cleanedDataSchema = new mongoose.Schema({
  originalFileName: { type: String, required: true },
  fileType: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  cleanedData: { type: mongoose.Schema.Types.Mixed, required: true },
  recordCount: { type: Number, required: true },
  processingTime: { type: Number }, // in milliseconds
  metadata: {
    totalFields: Number,
    uniqueFields: [String],
    dataTypes: mongoose.Schema.Types.Mixed
  }
});

const errorLogSchema = new mongoose.Schema({
  originalFileName: { type: String, required: true },
  fileType: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  errors: [{
    type: { type: String, required: true }, // 'missing_field', 'invalid_format', 'duplicate', 'validation_error'
    field: String,
    value: mongoose.Schema.Types.Mixed,
    message: String,
    rowIndex: Number,
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
  }],
  errorCount: { type: Number, required: true },
  errorSummary: {
    missing_fields: { type: Number, default: 0 },
    invalid_formats: { type: Number, default: 0 },
    duplicates: { type: Number, default: 0 },
    validation_errors: { type: Number, default: 0 }
  }
}, { suppressReservedKeysWarning: true });

const CleanedData = mongoose.model('CleanedData', cleanedDataSchema);
const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);

module.exports = { CleanedData, ErrorLog };