import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(date, format = 'MMM dd, yyyy') {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (format === 'relative') {
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return d.toLocaleDateString();
  }
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function getFileIcon(fileType) {
  const icons = {
    pdf: '📄',
    csv: '📊',
    json: '📝',
    xml: '🗂️',
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    default: '📎'
  };
  
  return icons[fileType?.toLowerCase()] || icons.default;
}

export function getErrorSeverityColor(severity) {
  const colors = {
    low: 'text-yellow-600 bg-yellow-100',
    medium: 'text-orange-600 bg-orange-100', 
    high: 'text-red-600 bg-red-100'
  };
  
  return colors[severity] || colors.medium;
}

export function getErrorTypeColor(type) {
  const colors = {
    missing_field: 'text-red-600 bg-red-100',
    invalid_format: 'text-orange-600 bg-orange-100',
    duplicate: 'text-yellow-600 bg-yellow-100',
    validation_error: 'text-purple-600 bg-purple-100'
  };
  
  return colors[type] || 'text-gray-600 bg-gray-100';
}

export function validateFile(file) {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = ['pdf', 'csv', 'json', 'xml', 'png', 'jpg', 'jpeg'];
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 50MB' };
  }
  
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!allowedTypes.includes(extension)) {
    return { 
      isValid: false, 
      error: `File type not supported. Allowed: ${allowedTypes.join(', ')}` 
    };
  }
  
  return { isValid: true };
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function generateRandomColor() {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}