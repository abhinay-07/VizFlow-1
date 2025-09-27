import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import UploadForm from '../components/UploadForm';
import { Card, Button, Badge } from '../components/ui';
import { formatNumber, formatDate } from '../utils/helpers';

export default function UploadPage() {
  const navigate = useNavigate();
  const [recentUploads, setRecentUploads] = useState([]);

  const handleUploadComplete = (result) => {
    // Add the new upload to recent uploads
    setRecentUploads(prev => [
      {
        id: Date.now(),
        ...result,
        timestamp: new Date()
      },
      ...prev.slice(0, 4) // Keep only the 5 most recent
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Files</h1>
        <p className="text-gray-600 mt-1">
          Upload and process your data files. Supported formats: PDF, CSV, JSON, XML, and images.
        </p>
      </div>

      {/* Upload Form */}
      <UploadForm onUploadComplete={handleUploadComplete} />

      {/* Recent Uploads Results */}
      {recentUploads.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Upload Results</h2>
            <Button 
              variant="secondary"
              onClick={() => navigate('/data')}
            >
              View All Data
            </Button>
          </div>

          <div className="space-y-4">
            {recentUploads.map((upload) => (
              <UploadResult key={upload.id} upload={upload} />
            ))}
          </div>
        </Card>
      )}

      {/* Upload Tips */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Supported File Types</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>PDF:</strong> Text extraction with OCR support</li>
              <li>• <strong>CSV:</strong> Automatic delimiter detection</li>
              <li>• <strong>JSON:</strong> Nested object flattening</li>
              <li>• <strong>XML:</strong> Structure parsing and conversion</li>
              <li>• <strong>Images:</strong> OCR text extraction (PNG, JPG, JPEG)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Best Practices</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Keep file sizes under 50MB for optimal processing</li>
              <li>• Use clear, structured data formats when possible</li>
              <li>• Ensure text in images is clear and readable</li>
              <li>• Name files descriptively for easier identification</li>
              <li>• Review error logs to improve data quality</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Processing Pipeline Info */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">1. Parse</h3>
            <p className="text-sm text-gray-600">Extract data from various file formats</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">2. Clean</h3>
            <p className="text-sm text-gray-600">Validate and normalize data fields</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">3. Detect Errors</h3>
            <p className="text-sm text-gray-600">Identify and log data issues</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">4. Store</h3>
            <p className="text-sm text-gray-600">Save clean data and error logs</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function UploadResult({ upload }) {
  const { data } = upload;
  const summary = data?.summary || {};

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-medium text-gray-900">{data.originalFileName}</h3>
            <Badge variant="info" className="text-xs">
              {data.fileType?.toUpperCase()}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Records:</span>
              <div className="font-medium">{formatNumber(summary.totalRecords || 0)}</div>
            </div>
            <div>
              <span className="text-gray-500">Clean Records:</span>
              <div className="font-medium text-green-600">
                {formatNumber(summary.cleanedRecords || 0)}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Errors:</span>
              <div className="font-medium text-red-600">
                {formatNumber(summary.errorRecords || 0)}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Processing Time:</span>
              <div className="font-medium">
                {summary.processingTimeMs ? `${summary.processingTimeMs}ms` : 'N/A'}
              </div>
            </div>
          </div>

          {data.errorSummary && (
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(data.errorSummary).map(([type, count]) => (
                count > 0 && (
                  <Badge key={type} variant="warning" className="text-xs">
                    {type.replace('_', ' ')}: {count}
                  </Badge>
                )
              ))}
            </div>
          )}
        </div>
        
        <div className="text-right text-sm text-gray-500">
          {formatDate(upload.timestamp, 'relative')}
        </div>
      </div>
    </div>
  );
}