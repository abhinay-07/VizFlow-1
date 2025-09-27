const { CleanedData, ErrorLog } = require("./db");

class ChatbotService {
  constructor() {
    this.intents = {
      greeting: {
        patterns: [
          "hello",
          "hi",
          "hey",
          "good morning",
          "good afternoon",
          "good evening",
        ],
        responses: [
          "Hello! How can I help you with your data today?",
          "Hi there! What would you like to know about your processed data?",
        ],
      },
      data_summary: {
        patterns: [
          "summary",
          "overview",
          "stats",
          "statistics",
          "how many",
          "total records",
          "data count",
        ],
        responses: ["Let me get you a summary of your processed data."],
        action: "getDataSummary",
      },
      error_summary: {
        patterns: [
          "errors",
          "problems",
          "issues",
          "error count",
          "failed records",
        ],
        responses: ["Let me check the error statistics for you."],
        action: "getErrorSummary",
      },
      download_help: {
        patterns: ["download", "export", "save", "get file", "export data"],
        responses: [
          "You can download your processed data in CSV, JSON, or XML format from the dashboard.",
        ],
        action: "getDownloadInfo",
      },
      merge_help: {
        patterns: ["merge", "combine", "unified", "join data"],
        responses: [
          "You can merge multiple customer data files using the merge endpoint to create unified customer profiles.",
        ],
        action: "getMergeInfo",
      },
      help: {
        patterns: ["help", "what can you do", "commands", "features"],
        responses: [
          "I can help you with:\n• Data summaries and statistics\n• Error analysis\n• Download information\n• Data merging guidance\n• General data processing questions",
        ],
      },
    };
  }

  async processMessage(message) {
    try {
      const intent = this.classifyIntent(message.toLowerCase());
      const response = this.generateResponse(intent, message);

      // If there's an action, execute it
      if (intent.action) {
        const actionResult = await this.executeAction(intent.action);
        return {
          response: response,
          data: actionResult,
          intent: intent.name,
        };
      }

      return {
        response: response,
        intent: intent.name,
      };
    } catch (error) {
      console.error("Chatbot error:", error);
      return {
        response:
          "Sorry, I encountered an error processing your request. Please try again.",
        error: error.message,
      };
    }
  }

  classifyIntent(message) {
    for (const [intentName, intentData] of Object.entries(this.intents)) {
      for (const pattern of intentData.patterns) {
        if (message.includes(pattern)) {
          return { name: intentName, ...intentData };
        }
      }
    }

    // Check for specific queries
    if (
      message.includes("customer") &&
      (message.includes("count") || message.includes("total"))
    ) {
      return { name: "data_summary", action: "getCustomerCount" };
    }

    if (
      message.includes("transaction") &&
      (message.includes("count") || message.includes("total"))
    ) {
      return { name: "data_summary", action: "getTransactionCount" };
    }

    return {
      name: "unknown",
      responses: [
        "I'm not sure I understand. Try asking about data summaries, errors, or downloads.",
      ],
    };
  }

  generateResponse(intent, originalMessage) {
    if (intent.responses && intent.responses.length > 0) {
      return intent.responses[
        Math.floor(Math.random() * intent.responses.length)
      ];
    }
    return "I'm here to help with your data processing questions!";
  }

  async executeAction(action) {
    switch (action) {
      case "getDataSummary":
        return await this.getDataSummary();
      case "getErrorSummary":
        return await this.getErrorSummary();
      case "getDownloadInfo":
        return this.getDownloadInfo();
      case "getMergeInfo":
        return this.getMergeInfo();
      case "getCustomerCount":
        return await this.getCustomerCount();
      case "getTransactionCount":
        return await this.getTransactionCount();
      default:
        return null;
    }
  }

  async getDataSummary() {
    try {
      const totalDocs = await CleanedData.countDocuments();
      const totalRecords = await CleanedData.aggregate([
        { $group: { _id: null, total: { $sum: "$recordCount" } } },
      ]);

      const fileTypes = await CleanedData.aggregate([
        { $group: { _id: "$fileType", count: { $sum: 1 } } },
      ]);

      return {
        totalDocuments: totalDocs,
        totalRecords: totalRecords[0]?.total || 0,
        fileTypes: fileTypes.map((ft) => ({ type: ft._id, count: ft.count })),
      };
    } catch (error) {
      return { error: "Failed to fetch data summary" };
    }
  }

  async getErrorSummary() {
    try {
      const totalErrors = await ErrorLog.countDocuments();
      const errorTypes = await ErrorLog.aggregate([
        { $project: { errorSummary: 1 } },
        {
          $group: {
            _id: null,
            missing_fields: { $sum: "$errorSummary.missing_fields" },
            invalid_formats: { $sum: "$errorSummary.invalid_formats" },
            duplicates: { $sum: "$errorSummary.duplicates" },
            validation_errors: { $sum: "$errorSummary.validation_errors" },
          },
        },
      ]);

      return {
        totalErrorDocuments: totalErrors,
        errorBreakdown: errorTypes[0] || {},
      };
    } catch (error) {
      return { error: "Failed to fetch error summary" };
    }
  }

  getDownloadInfo() {
    return {
      formats: ["CSV", "JSON", "XML"],
      endpoints: {
        single: "/api/download/:id/:format",
        bulk: "/api/download/bulk/all/:format",
      },
      description: "Download processed data in your preferred format",
    };
  }

  getMergeInfo() {
    return {
      endpoint: "/api/merge",
      method: "POST",
      description: "Merge multiple customer data files into unified profiles",
      payload: {
        documentIds: ["array of document IDs"],
        validateSchema: true,
      },
    };
  }

  async getCustomerCount() {
    try {
      const result = await CleanedData.aggregate([
        { $unwind: "$cleanedData" },
        { $match: { "cleanedData.customer_id": { $exists: true } } },
        { $group: { _id: "$cleanedData.customer_id" } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]);

      return { uniqueCustomers: result[0]?.count || 0 };
    } catch (error) {
      return { error: "Failed to count customers" };
    }
  }

  async getTransactionCount() {
    try {
      const result = await CleanedData.aggregate([
        { $unwind: "$cleanedData" },
        { $match: { "cleanedData.transaction_id": { $exists: true } } },
        { $count: "totalTransactions" },
      ]);

      return { totalTransactions: result[0]?.totalTransactions || 0 };
    } catch (error) {
      return { error: "Failed to count transactions" };
    }
  }
}

module.exports = { ChatbotService };
