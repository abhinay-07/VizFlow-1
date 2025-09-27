const express = require('express');
const { ErrorLog } = require('../services/db');

const router = express.Router();

// GET /api/errors - Get all error logs with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const search = req.query.search || '';
    const severity = req.query.severity || '';
    const errorType = req.query.errorType || '';
    
    // Build query filter
    const query = {};
    if (search) {
      query.$or = [
        { originalFileName: { $regex: search, $options: 'i' } },
        { 'errors.message': { $regex: search, $options: 'i' } }
      ];
    }
    if (severity) {
      query['errors.severity'] = severity;
    }
    if (errorType) {
      query['errors.type'] = errorType;
    }

    const totalDocuments = await ErrorLog.countDocuments(query);
    const documents = await ErrorLog.find(query)
      .select('-errors') // Exclude large errors array for list view
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
    console.error('Error fetching error logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch error logs'
    });
  }
});

// GET /api/errors/:id - Get specific error log document
router.get('/:id', async (req, res) => {
  try {
    const document = await ErrorLog.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Error log not found'
      });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error fetching error log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch error log'
    });
  }
});

// GET /api/errors/:id/details - Get paginated errors from a specific document
router.get('/:id/details', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const severityFilter = req.query.severity || '';
    const typeFilter = req.query.type || '';
    
    const document = await ErrorLog.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Error log not found'
      });
    }

    let errors = document.errors || [];
    
    // Apply filters
    if (severityFilter) {
      errors = errors.filter(error => error.severity === severityFilter);
    }
    if (typeFilter) {
      errors = errors.filter(error => error.type === typeFilter);
    }

    const totalErrors = errors.length;
    const paginatedErrors = errors.slice(skip, skip + limit);

    res.json({
      success: true,
      data: {
        errors: paginatedErrors,
        documentInfo: {
          _id: document._id,
          originalFileName: document.originalFileName,
          fileType: document.fileType,
          uploadDate: document.uploadDate,
          errorCount: document.errorCount,
          errorSummary: document.errorSummary
        }
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalErrors / limit),
        totalErrors,
        hasNextPage: skip + limit < totalErrors,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching error details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch error details'
    });
  }
});

// GET /api/errors/stats/summary - Get error statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalErrorDocs = await ErrorLog.countDocuments();
    const totalErrors = await ErrorLog.aggregate([
      { $group: { _id: null, totalErrors: { $sum: '$errorCount' } } }
    ]);

    // Error type distribution
    const errorTypeStats = await ErrorLog.aggregate([
      { $project: { errorSummary: 1 } },
      {
        $group: {
          _id: null,
          missing_fields: { $sum: '$errorSummary.missing_fields' },
          invalid_formats: { $sum: '$errorSummary.invalid_formats' },
          duplicates: { $sum: '$errorSummary.duplicates' },
          validation_errors: { $sum: '$errorSummary.validation_errors' }
        }
      }
    ]);

    // Error severity distribution
    const severityStats = await ErrorLog.aggregate([
      { $unwind: '$errors' },
      { $group: { _id: '$errors.severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Files with most errors
    const topErrorFiles = await ErrorLog.find()
      .select('originalFileName errorCount fileType uploadDate')
      .sort({ errorCount: -1 })
      .limit(5);

    // Recent error logs
    const recentErrors = await ErrorLog.find()
      .select('originalFileName fileType uploadDate errorCount')
      .sort({ uploadDate: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        summary: {
          totalErrorDocuments: totalErrorDocs,
          totalErrors: totalErrors[0]?.totalErrors || 0,
          averageErrorsPerDocument: totalErrorDocs > 0 ? Math.round((totalErrors[0]?.totalErrors || 0) / totalErrorDocs) : 0
        },
        errorTypeDistribution: errorTypeStats[0] || {
          missing_fields: 0,
          invalid_formats: 0,
          duplicates: 0,
          validation_errors: 0
        },
        severityDistribution: severityStats,
        topErrorFiles,
        recentErrors
      }
    });
  } catch (error) {
    console.error('Error fetching error stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch error statistics'
    });
  }
});

// GET /api/errors/stats/charts - Get chart data for error visualization
router.get('/stats/charts', async (req, res) => {
  try {
    // Error trends over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const errorTrends = await ErrorLog.aggregate([
      { $match: { uploadDate: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$uploadDate'
            }
          },
          errorCount: { $sum: '$errorCount' },
          documentCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Error type pie chart data
    const errorTypePieData = await ErrorLog.aggregate([
      { $project: { errorSummary: 1 } },
      {
        $group: {
          _id: null,
          missing_fields: { $sum: '$errorSummary.missing_fields' },
          invalid_formats: { $sum: '$errorSummary.invalid_formats' },
          duplicates: { $sum: '$errorSummary.duplicates' },
          validation_errors: { $sum: '$errorSummary.validation_errors' }
        }
      }
    ]);

    // Format pie chart data
    const pieData = [];
    if (errorTypePieData[0]) {
      const data = errorTypePieData[0];
      Object.keys(data).forEach(key => {
        if (key !== '_id' && data[key] > 0) {
          pieData.push({
            name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: data[key],
            type: key
          });
        }
      });
    }

    // File type error distribution
    const fileTypeErrors = await ErrorLog.aggregate([
      {
        $group: {
          _id: '$fileType',
          totalErrors: { $sum: '$errorCount' },
          documentCount: { $sum: 1 },
          averageErrors: { $avg: '$errorCount' }
        }
      },
      { $sort: { totalErrors: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        errorTrends: errorTrends.map(item => ({
          date: item._id,
          errors: item.errorCount,
          documents: item.documentCount
        })),
        errorTypeDistribution: pieData,
        fileTypeErrors: fileTypeErrors.map(item => ({
          fileType: item._id.toUpperCase(),
          totalErrors: item.totalErrors,
          documentCount: item.documentCount,
          averageErrors: Math.round(item.averageErrors * 100) / 100
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chart data'
    });
  }
});

// DELETE /api/errors/:id - Delete an error log document
router.delete('/:id', async (req, res) => {
  try {
    const document = await ErrorLog.findByIdAndDelete(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Error log not found'
      });
    }

    res.json({
      success: true,
      message: 'Error log deleted successfully',
      data: {
        deletedId: req.params.id,
        originalFileName: document.originalFileName
      }
    });
  } catch (error) {
    console.error('Error deleting error log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete error log'
    });
  }
});

module.exports = router;