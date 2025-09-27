const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const xml2js = require("xml2js");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const { createWorker } = require("tesseract.js");

class ParserService {
  constructor() {
    this.supportedFormats = [
      "pdf",
      "csv",
      "json",
      "xml",
      "xlsx",
      "png",
      "jpg",
      "jpeg",
    ];
  }

  async parseFile(filePath, fileType) {
    const startTime = Date.now();
    let parsedData = null;

    try {
      switch (fileType.toLowerCase()) {
        case "pdf":
          parsedData = await this.parsePDF(filePath);
          break;
        case "csv":
          parsedData = await this.parseCSV(filePath);
          break;
        case "json":
          parsedData = await this.parseJSON(filePath);
          break;
        case "xml":
          parsedData = await this.parseXML(filePath);
          break;
        case "xlsx":
          parsedData = await this.parseXLSX(filePath);
          break;
        case "png":
        case "jpg":
        case "jpeg":
          parsedData = await this.parseImage(filePath);
          break;
        default:
          throw new Error(`Unsupported file format: ${fileType}`);
      }

      const processingTime = Date.now() - startTime;
      return { parsedData, processingTime };
    } catch (error) {
      console.error("Parsing error:", error);
      throw new Error(`Failed to parse ${fileType} file: ${error.message}`);
    }
  }

  async parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    // Try to extract structured data from text
    const text = pdfData.text;
    const lines = text.split("\n").filter((line) => line.trim());

    // Attempt to detect table-like structure
    const structuredData = this.extractStructuredDataFromText(lines);
    return structuredData.length > 0 ? structuredData : [{ content: text }];
  }

  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = fs
        .createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", (error) => reject(error));
    });
  }

  async parseJSON(filePath) {
    const data = fs.readFileSync(filePath, "utf8");
    const jsonData = JSON.parse(data);

    // Ensure data is in array format for consistent processing
    return Array.isArray(jsonData) ? jsonData : [jsonData];
  }

  async parseXML(filePath) {
    const data = fs.readFileSync(filePath, "utf8");
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(data);

    // Try to extract meaningful data from XML structure
    return this.flattenXMLData(result);
  }

  async parseXLSX(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
    return jsonData;
  }

  async parseImage(filePath) {
    try {
      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(filePath);
      await worker.terminate();

      const lines = text.split("\n").filter((line) => line.trim());
      const structuredData = this.extractStructuredDataFromText(lines);

      return structuredData.length > 0 ? structuredData : [{ content: text }];
    } catch (error) {
      console.error("OCR Error:", error);
      return [{ content: "", error: "Failed to extract text from image" }];
    }
  }

  extractStructuredDataFromText(lines) {
    const data = [];
    let headers = [];

    // Try to detect headers (first line with multiple words/columns)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const columns = line.split(/\s{2,}|\t|,/).filter((col) => col.trim());

      if (columns.length > 1) {
        if (headers.length === 0) {
          headers = columns.map((col) =>
            col.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase()
          );
        } else {
          const row = {};
          columns.forEach((col, index) => {
            const key = headers[index] || `column_${index}`;
            row[key] = col.trim();
          });
          data.push(row);
        }
      }
    }

    return data;
  }

  flattenXMLData(obj, prefix = "") {
    const result = [];

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        result.push(...this.flattenXMLData(item, `${prefix}[${index}]`));
      });
    } else if (typeof obj === "object" && obj !== null) {
      const flatObj = {};

      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          Object.assign(flatObj, this.flattenObject(value, newKey));
        } else {
          flatObj[newKey] = value;
        }
      }

      result.push(flatObj);
    }

    return result.length > 0 ? result : [obj];
  }

  flattenObject(obj, prefix = "") {
    const flattened = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }
}

module.exports = new ParserService();
