const express = require('express');
const { CleanedData } = require('../services/db');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const xml2js = require('xml2js');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// GET /api/download/:id/:format - Download cleaned data in specified format
router.get('/:id/:format', async (req, res) => {
  try {
    const { id, format } = req.params;
    const validFormats = ['csv', 'json', 'xml'];
    
    if (!validFormats.includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid format. Supported formats: ${validFormats.join(', ')}`
      });
    }

    const document = await CleanedData.findById(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const cleanedData = document.cleanedData || [];
    
    if (cleanedData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data available for download'
      });
    }

    // Remove metadata from records for export
    const exportData = cleanedData.map(record => {
      const { _metadata, ...cleanRecord } = record;
      return cleanRecord;
    });

    const fileName = `${document.originalFileName.split('.')[0]}_cleaned`;
    
    switch (format.toLowerCase()) {
      case 'csv':
        return await downloadCSV(res, exportData, fileName);
      case 'json':
        return downloadJSON(res, exportData, fileName);
      case 'xml':
        return await downloadXML(res, exportData, fileName);
    }
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate download'
    });
  }
});

// Helper function to download as CSV
async function downloadCSV(res, data, fileName) {
  try {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    // Get all unique headers from all records
    const headers = new Set();
    data.forEach(record => {
      Object.keys(record).forEach(key => headers.add(key));
    });
    
    const headerArray = Array.from(headers);
    
    // Create temporary file path
    const tempFilePath = path.join(__dirname, '../../uploads', `${fileName}_${Date.now()}.csv`);
    
    // Configure CSV writer
    const csvWriter = createCsvWriter({
      path: tempFilePath,
      header: headerArray.map(header => ({ id: header, title: header }))
    });

    // Fill missing fields with empty strings
    const normalizedData = data.map(record => {
      const normalizedRecord = {};
      headerArray.forEach(header => {
        normalizedRecord[header] = record[header] || '';
      });
      return normalizedRecord;
    });

    // Write CSV file
    await csvWriter.writeRecords(normalizedData);
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);
    
    // Stream file and delete after sending
    const fileStream = fs.createReadStream(tempFilePath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      // Delete temporary file
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    });
    
  } catch (error) {
    console.error('CSV generation error:', error);
    throw error;
  }
}

// Helper function to download as JSON
function downloadJSON(res, data, fileName) {
  const jsonData = {
    exportInfo: {
      fileName: fileName,
      exportDate: new Date().toISOString(),
      recordCount: data.length,
      format: 'JSON'
    },
    data: data
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}.json"`);
  
  res.json(jsonData);
}

// Helper function to download as XML
async function downloadXML(res, data, fileName) {
  try {
    const xmlData = {
      export: {
        $: {
          fileName: fileName,
          exportDate: new Date().toISOString(),
          recordCount: data.length,
          format: 'XML'
        },
        records: {
          record: data
        }
      }
    };
    
    const builder = new xml2js.Builder({
      rootName: 'VizFlowExport',
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { pretty: true, indent: '  ' }
    });
    
    const xml = builder.buildObject(xmlData);
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.xml"`);
    
    res.send(xml);
    
  } catch (error) {
    console.error('XML generation error:', error);
    throw error;
  }
}

// GET /api/download/bulk/all - Download all cleaned data
router.get('/bulk/all/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const validFormats = ['csv', 'json', 'xml'];
    
    if (!validFormats.includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid format. Supported formats: ${validFormats.join(', ')}`
      });
    }

    // Get all documents
    const documents = await CleanedData.find().sort({ uploadDate: -1 });
    
    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data available for download'
      });
    }

    // Combine all cleaned data
    const allData = [];
    documents.forEach(doc => {
      doc.cleanedData.forEach(record => {
        const { _metadata, ...cleanRecord } = record;
        // Add source file info
        allData.push({
          ...cleanRecord,
          _sourceFile: doc.originalFileName,
          _uploadDate: doc.uploadDate,
          _fileType: doc.fileType
        });
      });
    });

    const fileName = `VizFlow_AllData_${new Date().toISOString().split('T')[0]}`;
    
    switch (format.toLowerCase()) {
      case 'csv':
        return await downloadCSV(res, allData, fileName);
      case 'json':
        return downloadJSON(res, allData, fileName);
      case 'xml':
        return await downloadXML(res, allData, fileName);
    }
    
  } catch (error) {
    console.error('Bulk download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate bulk download'
    });
  }
});

// GET /api/download/formats - Get available download formats
router.get('/formats', (req, res) => {
  res.json({
    success: true,
    data: {
      formats: [
        {
          key: 'csv',
          name: 'CSV',
          description: 'Comma-separated values file',
          mimeType: 'text/csv'
        },
        {
          key: 'json',
          name: 'JSON',
          description: 'JavaScript Object Notation file',
          mimeType: 'application/json'
        },
        {
          key: 'xml',
          name: 'XML',
          description: 'Extensible Markup Language file',
          mimeType: 'application/xml'
        }
      ]
    }
  });
});

module.exports = router;