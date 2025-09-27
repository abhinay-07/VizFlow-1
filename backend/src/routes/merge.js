const express = require("express");
const { MergeService } = require("../services/merge");
const { CleanedData } = require("../services/db");

const router = express.Router();
const mergeService = new MergeService();

// POST /api/merge - Merge customer data from multiple documents
router.post("/", async (req, res) => {
  try {
    const { documentIds, validateSchema = true } = req.body;

    if (
      !documentIds ||
      !Array.isArray(documentIds) ||
      documentIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "documentIds array is required and must contain at least one ID",
      });
    }

    console.log(`Merging data from ${documentIds.length} documents...`);

    // Merge the data
    const mergeResult = await mergeService.mergeCustomerData(documentIds);

    // Validate schema if requested
    let validationErrors = [];
    if (validateSchema) {
      validationErrors = mergeService.validateCustomerSchema(
        mergeResult.mergedData
      );
    }

    // Store merged data if validation passes
    let savedDocument = null;
    if (validationErrors.length === 0) {
      const mergedDoc = new CleanedData({
        originalFileName: `merged_customer_data_${Date.now()}`,
        fileType: "merged",
        cleanedData: mergeResult.mergedData,
        recordCount: mergeResult.mergedData.length,
        processingTime: 0,
        metadata: {
          totalFields: Object.keys(mergeService.customerSchema).length,
          uniqueFields: Object.keys(mergeService.customerSchema),
          dataTypes: { merged: "object" },
          mergeInfo: mergeResult.summary,
        },
      });

      savedDocument = await mergedDoc.save();
      console.log("Merged data saved to MongoDB");
    }

    res.json({
      success: true,
      data: {
        mergedData: mergeResult.mergedData,
        summary: mergeResult.summary,
        validationErrors: validationErrors,
        savedDocumentId: savedDocument ? savedDocument._id : null,
      },
    });
  } catch (error) {
    console.error("Merge processing error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to merge data",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// GET /api/merge/status - Check merge service status
router.get("/status", (req, res) => {
  res.json({
    success: true,
    message: "Merge service is running",
    supportedOperations: ["customer_data_merge"],
    schemaFields: Object.keys(mergeService.customerSchema),
  });
});

module.exports = router;
