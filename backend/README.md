# VizFlow Backend

VizFlow backend is a Node.js Express API that handles file upload, data processing, cleaning, error detection, and storage for multiple file formats including PDF, CSV, JSON, XML, and images.

## Features

- 📁 **Multi-format File Processing**: PDF, CSV, JSON, XML, PNG, JPG, JPEG
- 🔍 **OCR Support**: Extract text from PDF and image files using Tesseract.js
- 🧹 **Data Cleaning**: Automatic data validation, type detection, and cleaning
- ❌ **Error Detection**: Comprehensive error logging with categorization
- 📊 **MongoDB Integration**: Store cleaned data and error logs separately
- 📈 **Analytics**: Statistical insights and visualization data
- 💾 **Export Features**: Download cleaned data in CSV, JSON, or XML formats

## Prerequisites

- Node.js 16+ 
- MongoDB (local installation or MongoDB Compass)
- npm or yarn

## Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env` and configure:
   ```
   MONGO_URI=mongodb://localhost:27017/vizflow
   PORT=5000
   NODE_ENV=development
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=50MB
   ```

3. **Start MongoDB:**
   - Start MongoDB locally or ensure MongoDB Compass is connected
   - The database `vizflow` will be created automatically

4. **Run the server:**
   ```bash
   npm run dev    # Development mode with nodemon
   npm start      # Production mode
   ```

## API Endpoints

### 📁 Upload & Processing
- `POST /api/upload` - Upload and process files
- `GET /api/upload/status` - Check upload service status

### 📊 Cleaned Data
- `GET /api/data` - Get all cleaned data (paginated)
- `GET /api/data/:id` - Get specific document
- `GET /api/data/:id/records` - Get paginated records from document
- `GET /api/data/stats/summary` - Get summary statistics
- `DELETE /api/data/:id` - Delete cleaned data document

### ❌ Error Logs
- `GET /api/errors` - Get all error logs (paginated)
- `GET /api/errors/:id` - Get specific error log
- `GET /api/errors/:id/details` - Get paginated errors from document
- `GET /api/errors/stats/summary` - Get error statistics
- `GET /api/errors/stats/charts` - Get chart data for visualization
- `DELETE /api/errors/:id` - Delete error log document

### 💾 Downloads
- `GET /api/download/:id/:format` - Download cleaned data (csv, json, xml)
- `GET /api/download/bulk/all/:format` - Download all data
- `GET /api/download/formats` - Get available formats

### 🏥 System
- `GET /api/health` - Health check and API info
- `GET /` - API welcome message

## File Processing Flow

1. **Upload**: File received via multipart form-data
2. **Parsing**: Content extraction based on file type
3. **Cleaning**: Data validation, type detection, and normalization
4. **Error Detection**: Identify missing fields, invalid formats, duplicates
5. **Storage**: Save cleaned data and errors to separate MongoDB collections
6. **Response**: Return processing summary and statistics

## Supported File Types

| Format | Parser | Features |
|--------|--------|----------|
| PDF | pdf-parse + Tesseract.js | Text extraction, table detection |
| CSV | csv-parser | Automatic delimiter detection |
| JSON | Native JSON parser | Nested object flattening |
| XML | xml2js | Structure parsing and flattening |
| Images | Tesseract.js OCR | Text extraction from PNG, JPG, JPEG |

## Data Cleaning Features

- **Type Detection**: Automatic detection of numbers, dates, emails, phones, URLs, booleans
- **Format Standardization**: Consistent formatting for dates, numbers, emails
- **Validation**: Field requirement validation, format validation
- **Duplicate Removal**: Automatic duplicate record detection
- **Error Categorization**: Missing fields, invalid formats, validation errors, duplicates

## Database Schema

### Cleaned Data Collection
```javascript
{
  originalFileName: String,
  fileType: String,
  uploadDate: Date,
  cleanedData: Array,
  recordCount: Number,
  processingTime: Number,
  metadata: {
    totalFields: Number,
    uniqueFields: [String],
    dataTypes: Object
  }
}
```

### Error Log Collection
```javascript
{
  originalFileName: String,
  fileType: String,
  uploadDate: Date,
  errors: [{
    type: String, // 'missing_field', 'invalid_format', 'duplicate', 'validation_error'
    field: String,
    value: Mixed,
    message: String,
    rowIndex: Number,
    severity: String // 'low', 'medium', 'high'
  }],
  errorCount: Number,
  errorSummary: {
    missing_fields: Number,
    invalid_formats: Number,
    duplicates: Number,
    validation_errors: Number
  }
}
```

## Error Handling

The API includes comprehensive error handling for:
- File upload limits (50MB max)
- Unsupported file types
- Parsing failures
- Database connection issues
- Validation errors
- Processing timeouts

## Development

### Project Structure
```
backend/
├── src/
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic (parser, cleaner, db)
│   ├── utils/           # Utility functions
│   ├── app.js          # Main application file
│   └── config.js       # Configuration settings
├── uploads/            # Temporary file storage
├── package.json
└── .env               # Environment variables
```

### Adding New File Types

1. Update `parserService.js` with new parsing logic
2. Add file type validation in `fileUtils.js`
3. Update supported formats in documentation

### Testing

```bash
# Test file upload
curl -X POST -F "file=@sample.csv" http://localhost:5000/api/upload

# Test health check
curl http://localhost:5000/api/health
```

## Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set up proper file upload limits
4. Configure CORS for production domain
5. Set up process manager (PM2)

## License

MIT License - see LICENSE file for details.