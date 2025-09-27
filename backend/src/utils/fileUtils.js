const path = require("path");
const fs = require("fs");

class FileUtils {
  static getFileExtension(filename) {
    return path.extname(filename).toLowerCase().substring(1);
  }

  static isValidFileType(filename) {
    const supportedTypes = [
      "pdf",
      "csv",
      "json",
      "xml",
      "xlsx",
      "png",
      "jpg",
      "jpeg",
    ];
    const ext = this.getFileExtension(filename);
    return supportedTypes.includes(ext);
  }

  static generateUniqueFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    return `${name}_${timestamp}_${random}${ext}`;
  }

  static ensureUploadDirectory(uploadDir) {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }

  static deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
    return false;
  }

  static getFileSizeInMB(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size / (1024 * 1024);
  }

  static validateFileSize(filePath, maxSizeMB = 50) {
    const sizeInMB = this.getFileSizeInMB(filePath);
    return sizeInMB <= maxSizeMB;
  }
}

module.exports = FileUtils;
