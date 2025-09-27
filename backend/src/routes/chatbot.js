const express = require("express");
const { ChatbotService } = require("../services/chatbot");

const router = express.Router();
const chatbotService = new ChatbotService();

// POST /api/chatbot/message - Send message to chatbot
router.post("/message", async (req, res) => {
  try {
    const { message } = req.body;

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Message is required and must be a non-empty string",
      });
    }

    console.log(`Chatbot query: ${message}`);

    const result = await chatbotService.processMessage(message.trim());

    res.json({
      success: true,
      response: result.response,
      data: result.data,
      intent: result.intent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process chatbot message",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// GET /api/chatbot/capabilities - Get chatbot capabilities
router.get("/capabilities", (req, res) => {
  res.json({
    success: true,
    capabilities: {
      intents: Object.keys(chatbotService.intents),
      actions: [
        "getDataSummary",
        "getErrorSummary",
        "getDownloadInfo",
        "getMergeInfo",
        "getCustomerCount",
        "getTransactionCount",
      ],
      features: [
        "Natural language queries",
        "Data statistics",
        "Error analysis",
        "Download guidance",
        "Merge assistance",
      ],
    },
  });
});

// GET /api/chatbot/status - Check chatbot service status
router.get("/status", (req, res) => {
  res.json({
    success: true,
    message: "Chatbot service is running",
    supportedIntents: Object.keys(chatbotService.intents).length,
    version: "1.0.0",
  });
});

module.exports = router;
