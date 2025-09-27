const mongoose = require("mongoose");

class MergeService {
  constructor() {
    this.customerSchema = {
      customer_id: { type: "string", required: true },
      customer_name: { type: "string", required: true },
      email: { type: "string", format: "email" },
      phone: { type: "string" },
      address: { type: "string" },
      date_of_birth: { type: "string", format: "date" },
      account_type: { type: "string" },
      registration_date: { type: "string", format: "date" },
      // Transaction fields
      transaction_id: { type: "string" },
      transaction_date: { type: "string", format: "date" },
      amount: { type: "number" },
      transaction_type: { type: "string" },
      merchant: { type: "string" },
      category: { type: "string" },
      // Credit card fields
      card_number: { type: "string" },
      card_type: { type: "string" },
      expiry_date: { type: "string" },
      credit_limit: { type: "number" },
      outstanding_balance: { type: "number" },
    };
  }

  async mergeCustomerData(documentIds) {
    try {
      const CleanedData = mongoose.model("CleanedData");
      const documents = await CleanedData.find({ _id: { $in: documentIds } });

      if (documents.length === 0) {
        throw new Error("No documents found for merging");
      }

      // Collect all customer data
      const allCustomerData = [];
      documents.forEach((doc) => {
        if (doc.cleanedData && Array.isArray(doc.cleanedData)) {
          allCustomerData.push(...doc.cleanedData);
        }
      });

      // Group by customer_id or customer_name
      const customerGroups = this.groupByCustomer(allCustomerData);

      // Merge data for each customer
      const mergedCustomers = [];
      for (const [customerKey, customerRecords] of customerGroups) {
        const mergedCustomer = this.mergeCustomerRecords(customerRecords);
        mergedCustomers.push(mergedCustomer);
      }

      return {
        success: true,
        mergedData: mergedCustomers,
        summary: {
          totalInputRecords: allCustomerData.length,
          uniqueCustomers: mergedCustomers.length,
          mergeRatio: allCustomerData.length / mergedCustomers.length,
        },
      };
    } catch (error) {
      console.error("Merge error:", error);
      throw new Error(`Failed to merge customer data: ${error.message}`);
    }
  }

  groupByCustomer(records) {
    const groups = new Map();

    records.forEach((record) => {
      // Try different customer identifiers
      const customerKey =
        record.customer_id ||
        record.customer_name ||
        record.email ||
        `unknown_${Math.random()}`;

      if (!groups.has(customerKey)) {
        groups.set(customerKey, []);
      }
      groups.get(customerKey).push(record);
    });

    return groups;
  }

  mergeCustomerRecords(records) {
    if (records.length === 1) {
      return records[0];
    }

    // Start with the most complete record
    let merged = records.reduce((acc, curr) => {
      return this.mergeTwoRecords(acc, curr);
    });

    // Add transaction arrays if they exist
    const transactions = records.flatMap((r) => r.transactions || []);
    if (transactions.length > 0) {
      merged.transactions = transactions;
    }

    return merged;
  }

  mergeTwoRecords(record1, record2) {
    const merged = { ...record1 };

    // Merge fields, preferring non-null values
    Object.keys(record2).forEach((key) => {
      if (merged[key] == null && record2[key] != null) {
        merged[key] = record2[key];
      }
    });

    // Handle special cases
    if (record2.transactions && Array.isArray(record2.transactions)) {
      merged.transactions = merged.transactions || [];
      merged.transactions.push(...record2.transactions);
    }

    return merged;
  }

  validateCustomerSchema(data) {
    const errors = [];

    if (!Array.isArray(data)) {
      return [{ type: "validation_error", message: "Data must be an array" }];
    }

    data.forEach((record, index) => {
      // Check required fields
      if (!record.customer_id && !record.customer_name) {
        errors.push({
          type: "missing_field",
          field: "customer_id or customer_name",
          message: "At least one customer identifier required",
          rowIndex: index,
        });
      }

      // Validate email format
      if (record.email && !this.isValidEmail(record.email)) {
        errors.push({
          type: "invalid_format",
          field: "email",
          value: record.email,
          message: "Invalid email format",
          rowIndex: index,
        });
      }

      // Validate amount fields
      if (record.amount && isNaN(Number(record.amount))) {
        errors.push({
          type: "invalid_format",
          field: "amount",
          value: record.amount,
          message: "Amount must be a number",
          rowIndex: index,
        });
      }
    });

    return errors;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = { MergeService };
