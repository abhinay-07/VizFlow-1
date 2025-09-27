const express = require('express');
const { CleanedData } = require('../services/db');

const router = express.Router();

// GET /api/data - Get all cleaned data with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const search = req.query.search || '';
    const fileType = req.query.fileType || '';
    
    // Build query filter
    const query = {};
    if (fileType) {
      query.fileType = fileType;
    }
    if (search) {
      query.$or = [
        { originalFileName: { $regex: search, $options: 'i' } },
        { 'cleanedData.name': { $regex: search, $options: 'i' } },
        { 'cleanedData.title': { $regex: search, $options: 'i' } }
      ];
    }

    const totalDocuments = await CleanedData.countDocuments(query);
    const documents = await CleanedData.find(query)
      .select('-cleanedData') // Exclude large cleanedData field for list view
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: documents,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDocuments / limit),
        totalDocuments,
        hasNextPage: page < Math.ceil(totalDocuments / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cleaned data'
    });
  }
});

// GET /api/data/:id - Get specific cleaned data document
router.get('/:id', async (req, res) => {
  try {
    const document = await CleanedData.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document'
    });
  }
});

// GET /api/data/:id/records - Get paginated records from a specific document
router.get('/:id/records', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const document = await CleanedData.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const cleanedData = document.cleanedData || [];
    const totalRecords = cleanedData.length;
    const paginatedRecords = cleanedData.slice(skip, skip + limit);

    res.json({
      success: true,
      data: {
        records: paginatedRecords,
        documentInfo: {
          _id: document._id,
          originalFileName: document.originalFileName,
          fileType: document.fileType,
          uploadDate: document.uploadDate,
          recordCount: document.recordCount,
          metadata: document.metadata
        }
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        hasNextPage: skip + limit < totalRecords,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch records'
    });
  }
});

// GET /api/data/stats/summary - Get summary statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalDocuments = await CleanedData.countDocuments();
    const totalRecords = await CleanedData.aggregate([
      { $group: { _id: null, totalRecords: { $sum: '$recordCount' } } }
    ]);

    const fileTypeStats = await CleanedData.aggregate([
      { $group: { _id: '$fileType', count: { $sum: 1 }, records: { $sum: '$recordCount' } } },
      { $sort: { count: -1 } }
    ]);

    const recentUploads = await CleanedData.find()
      .select('originalFileName fileType uploadDate recordCount')
      .sort({ uploadDate: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        summary: {
          totalDocuments,
          totalRecords: totalRecords[0]?.totalRecords || 0,
          averageRecordsPerDocument: totalDocuments > 0 ? Math.round((totalRecords[0]?.totalRecords || 0) / totalDocuments) : 0
        },
        fileTypeStats,
        recentUploads
      }
    });
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch summary statistics'
    });
  }
});

// DELETE /api/data/:id - Delete a cleaned data document
router.delete('/:id', async (req, res) => {
  try {
    const document = await CleanedData.findByIdAndDelete(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      message: 'Document deleted successfully',
      data: {
        deletedId: req.params.id,
        originalFileName: document.originalFileName
      }
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
});

module.exports = router;