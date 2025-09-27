const _ = require('lodash');

class CleanerService {
  constructor() {
    this.errors = [];
    this.cleanedData = [];
  }

  cleanData(rawData, fileName, fileType) {
    this.errors = [];
    this.cleanedData = [];
    
    if (!Array.isArray(rawData)) {
      rawData = [rawData];
    }

    rawData.forEach((record, index) => {
      const cleanedRecord = this.cleanRecord(record, index);
      if (cleanedRecord) {
        this.cleanedData.push(cleanedRecord);
      }
    });

    // Remove duplicates
    this.cleanedData = this.removeDuplicates(this.cleanedData);

    return {
      cleanedData: this.cleanedData,
      errors: this.errors,
      summary: {
        originalCount: rawData.length,
        cleanedCount: this.cleanedData.length,
        errorCount: this.errors.length
      }
    };
  }

  cleanRecord(record, rowIndex) {
    if (!record || typeof record !== 'object') {
      this.logError('validation_error', null, record, 'Invalid record format', rowIndex, 'high');
      return null;
    }

    const cleanedRecord = {};
    let hasValidData = false;

    for (const [key, value] of Object.entries(record)) {
      const cleanedKey = this.cleanFieldName(key);
      const cleanedValue = this.cleanFieldValue(value, cleanedKey, rowIndex);
      
      if (cleanedValue !== null && cleanedValue !== undefined && cleanedValue !== '') {
        cleanedRecord[cleanedKey] = cleanedValue;
        hasValidData = true;
      } else if (this.isRequiredField(cleanedKey)) {
        this.logError('missing_field', cleanedKey, value, `Required field '${cleanedKey}' is missing or empty`, rowIndex, 'high');
      }
    }

    // Add metadata
    cleanedRecord._metadata = {
      originalRowIndex: rowIndex,
      cleanedAt: new Date().toISOString(),
      fieldCount: Object.keys(cleanedRecord).length - 1 // Exclude _metadata
    };

    return hasValidData ? cleanedRecord : null;
  }

  cleanFieldName(fieldName) {
    if (typeof fieldName !== 'string') {
      return String(fieldName);
    }

    return fieldName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  cleanFieldValue(value, fieldName, rowIndex) {
    if (value === null || value === undefined) {
      return null;
    }

    // Convert to string and trim
    let cleanedValue = String(value).trim();
    
    if (cleanedValue === '') {
      return null;
    }

    // Detect and clean specific data types
    const detectedType = this.detectDataType(cleanedValue, fieldName);
    
    try {
      switch (detectedType) {
        case 'number':
          return this.cleanNumber(cleanedValue, fieldName, rowIndex);
        case 'date':
          return this.cleanDate(cleanedValue, fieldName, rowIndex);
        case 'email':
          return this.cleanEmail(cleanedValue, fieldName, rowIndex);
        case 'phone':
          return this.cleanPhone(cleanedValue, fieldName, rowIndex);
        case 'boolean':
          return this.cleanBoolean(cleanedValue, fieldName, rowIndex);
        case 'url':
          return this.cleanUrl(cleanedValue, fieldName, rowIndex);
        default:
          return this.cleanString(cleanedValue, fieldName, rowIndex);
      }
    } catch (error) {
      this.logError('validation_error', fieldName, value, `Failed to clean value: ${error.message}`, rowIndex, 'medium');
      return cleanedValue; // Return original if cleaning fails
    }
  }

  detectDataType(value, fieldName) {
    // Email detection
    if (this.isEmail(value)) return 'email';
    
    // Phone detection
    if (this.isPhone(value)) return 'phone';
    
    // URL detection
    if (this.isUrl(value)) return 'url';
    
    // Number detection
    if (this.isNumber(value)) return 'number';
    
    // Date detection
    if (this.isDate(value)) return 'date';
    
    // Boolean detection
    if (this.isBoolean(value)) return 'boolean';
    
    // Field name hints
    const lowerFieldName = fieldName.toLowerCase();
    if (lowerFieldName.includes('email')) return 'email';
    if (lowerFieldName.includes('phone') || lowerFieldName.includes('tel')) return 'phone';
    if (lowerFieldName.includes('date') || lowerFieldName.includes('time')) return 'date';
    if (lowerFieldName.includes('url') || lowerFieldName.includes('link')) return 'url';
    if (lowerFieldName.includes('price') || lowerFieldName.includes('amount') || lowerFieldName.includes('cost')) return 'number';
    
    return 'string';
  }

  cleanNumber(value, fieldName, rowIndex) {
    // Remove currency symbols and commas
    const cleaned = value.replace(/[$,€£¥]/g, '').replace(/,/g, '');
    const number = parseFloat(cleaned);
    
    if (isNaN(number)) {
      this.logError('invalid_format', fieldName, value, 'Invalid number format', rowIndex, 'medium');
      return value; // Return original if can't parse
    }
    
    return number;
  }

  cleanDate(value, fieldName, rowIndex) {
    const date = new Date(value);
    
    if (isNaN(date.getTime())) {
      this.logError('invalid_format', fieldName, value, 'Invalid date format', rowIndex, 'medium');
      return value; // Return original if can't parse
    }
    
    return date.toISOString();
  }

  cleanEmail(value, fieldName, rowIndex) {
    const email = value.toLowerCase().trim();
    
    if (!this.isValidEmail(email)) {
      this.logError('invalid_format', fieldName, value, 'Invalid email format', rowIndex, 'medium');
      return value; // Return original if invalid
    }
    
    return email;
  }

  cleanPhone(value, fieldName, rowIndex) {
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    if (cleaned.length < 10) {
      this.logError('invalid_format', fieldName, value, 'Phone number too short', rowIndex, 'medium');
      return value;
    }
    
    return cleaned;
  }

  cleanBoolean(value, fieldName, rowIndex) {
    const lowerValue = value.toLowerCase().trim();
    const truthyValues = ['true', 'yes', 'y', '1', 'on', 'enabled'];
    const falsyValues = ['false', 'no', 'n', '0', 'off', 'disabled'];
    
    if (truthyValues.includes(lowerValue)) return true;
    if (falsyValues.includes(lowerValue)) return false;
    
    this.logError('invalid_format', fieldName, value, 'Invalid boolean format', rowIndex, 'medium');
    return value;
  }

  cleanUrl(value, fieldName, rowIndex) {
    let url = value.trim();
    
    // Add protocol if missing
    if (!url.match(/^https?:\/\//)) {
      url = 'http://' + url;
    }
    
    try {
      new URL(url);
      return url;
    } catch (error) {
      this.logError('invalid_format', fieldName, value, 'Invalid URL format', rowIndex, 'medium');
      return value;
    }
  }

  cleanString(value, fieldName, rowIndex) {
    // Basic string cleaning
    let cleaned = value.trim();
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Remove special characters if it's a name field
    if (fieldName.includes('name')) {
      cleaned = cleaned.replace(/[^\w\s.-]/g, '');
    }
    
    return cleaned;
  }

  removeDuplicates(data) {
    const seen = new Set();
    const unique = [];
    const duplicates = [];

    data.forEach((record, index) => {
      // Create a hash of the record (excluding metadata)
      const { _metadata, ...recordData } = record;
      const hash = JSON.stringify(recordData);
      
      if (seen.has(hash)) {
        duplicates.push(record);
        this.logError('duplicate', null, record, 'Duplicate record found', index, 'low');
      } else {
        seen.add(hash);
        unique.push(record);
      }
    });

    return unique;
  }

  isRequiredField(fieldName) {
    const requiredFields = ['id', 'email', 'name', 'title'];
    return requiredFields.some(field => fieldName.includes(field));
  }

  // Validation helpers
  isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  isValidEmail(value) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
  }

  isPhone(value) {
    return /^[\+]?[\d\s\-\(\)]{10,}$/.test(value);
  }

  isUrl(value) {
    return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(value);
  }

  isNumber(value) {
    return /^-?[\d,]+\.?\d*$/.test(value.replace(/[$€£¥]/g, ''));
  }

  isDate(value) {
    return !isNaN(Date.parse(value));
  }

  isBoolean(value) {
    const lowerValue = value.toLowerCase().trim();
    const booleanValues = ['true', 'false', 'yes', 'no', 'y', 'n', '1', '0', 'on', 'off', 'enabled', 'disabled'];
    return booleanValues.includes(lowerValue);
  }

  logError(type, field, value, message, rowIndex, severity = 'medium') {
    this.errors.push({
      type,
      field,
      value,
      message,
      rowIndex,
      severity,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new CleanerService();