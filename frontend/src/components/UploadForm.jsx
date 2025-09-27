import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadAPI } from '../services/api';
import { validateFile, getFileIcon, formatBytes } from '../utils/helpers';
import { Button, Card, LoadingSpinner } from './ui';

export default function UploadForm({ onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      const error = errors[0];
      toast.error(`${file.name}: ${error.message}`);
    });

    // Validate and add accepted files
    const validFiles = acceptedFiles.filter(file => {
      const validation = validateFile(file);
      if (!validation.isValid) {
        toast.error(`${file.name}: ${validation.error}`);
        return false;
      }
      return true;
    });

    const newFiles = validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      status: 'pending', // pending, uploading, completed, error
      progress: 0,
      result: null,
      error: null
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/xml': ['.xml'],
      'text/xml': ['.xml'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    const pendingFiles = files.filter(f => f.status === 'pending');

    for (const fileItem of pendingFiles) {
      try {
        // Update file status to uploading
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        ));

        // Upload file with progress tracking
        const result = await uploadAPI.uploadFile(fileItem.file, (progress) => {
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, progress }
              : f
          ));
        });

        // Update file status to completed
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'completed', progress: 100, result }
            : f
        ));

        toast.success(`${fileItem.file.name} uploaded successfully`);

        // Notify parent component
        if (onUploadComplete) {
          onUploadComplete(result);
        }

      } catch (error) {
        console.error('Upload error:', error);
        
        // Update file status to error
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'error', error: error.message }
            : f
        ));

        toast.error(`Failed to upload ${fileItem.file.name}: ${error.message}`);
      }
    }

    setUploading(false);
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  const retryFailed = () => {
    setFiles(prev => prev.map(f => 
      f.status === 'error' 
        ? { ...f, status: 'pending', error: null, progress: 0 }
        : f
    ));
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const pendingCount = files.filter(f => f.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive 
              ? 'border-primary-400 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <Upload className={`w-8 h-8 ${isDragActive ? 'text-primary-600' : 'text-primary-500'}`} />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'Drop files here' : 'Upload your files'}
              </h3>
              <p className="text-gray-500 mb-4">
                Drag and drop files here, or click to browse
              </p>
              <div className="text-sm text-gray-400">
                <p>Supported formats: PDF, CSV, JSON, XML, PNG, JPG, JPEG</p>
                <p>Maximum file size: 50MB per file</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Files ({files.length})
            </h3>
            <div className="flex items-center space-x-2">
              {errorCount > 0 && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={retryFailed}
                  disabled={uploading}
                >
                  Retry Failed ({errorCount})
                </Button>
              )}
              {completedCount > 0 && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={clearCompleted}
                  disabled={uploading}
                >
                  Clear Completed ({completedCount})
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {files.map(fileItem => (
              <FileItem
                key={fileItem.id}
                fileItem={fileItem}
                onRemove={() => removeFile(fileItem.id)}
                disabled={uploading}
              />
            ))}
          </div>

          {/* Upload Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {pendingCount > 0 && `${pendingCount} files ready to upload`}
              {completedCount > 0 && ` • ${completedCount} completed`}
              {errorCount > 0 && ` • ${errorCount} failed`}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                onClick={() => setFiles([])}
                disabled={uploading}
              >
                Clear All
              </Button>
              <Button
                onClick={uploadFiles}
                loading={uploading}
                disabled={pendingCount === 0}
              >
                Upload {pendingCount > 0 ? `(${pendingCount})` : ''} Files
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function FileItem({ fileItem, onRemove, disabled }) {
  const { file, status, progress, error, result } = fileItem;
  
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <LoadingSpinner size="small" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-error-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'border-l-primary-500 bg-primary-50';
      case 'completed':
        return 'border-l-success-500 bg-success-50';
      case 'error':
        return 'border-l-error-500 bg-error-50';
      default:
        return 'border-l-gray-300 bg-white';
    }
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {getStatusIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getFileIcon(file.name.split('.').pop())}</span>
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <span className="text-xs text-gray-500">
                {formatBytes(file.size)}
              </span>
            </div>
            
            {/* Progress Bar */}
            {status === 'uploading' && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{progress}% uploaded</p>
              </div>
            )}
            
            {/* Success Message */}
            {status === 'completed' && result && (
              <div className="mt-1 text-xs text-success-600">
                Processed {result.data?.summary?.cleanedRecords || 0} records
                {result.data?.summary?.errorRecords > 0 && 
                  ` (${result.data.summary.errorRecords} errors)`
                }
              </div>
            )}
            
            {/* Error Message */}
            {status === 'error' && error && (
              <p className="mt-1 text-xs text-error-600">{error}</p>
            )}
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          disabled={disabled}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}