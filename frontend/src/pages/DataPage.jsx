import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  FileText,
  Database,
  ExternalLink
} from 'lucide-react';
import { 
  Card, 
  Button, 
  Input, 
  Select, 
  Table, 
  Pagination, 
  Badge, 
  Modal,
  EmptyState,
  LoadingSpinner
} from '../components/ui';
import { useApi, usePagination, useSearch, useFilters } from '../hooks';
import { dataAPI, downloadAPI } from '../services/api';
import { formatDate, formatNumber, getFileIcon, cn } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function DataPage() {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('csv');
  
  const { query, debouncedQuery, setQuery } = useSearch();
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useFilters();
  const { 
    page, 
    limit, 
    totalPages, 
    goToPage, 
    updatePagination 
  } = usePagination(1, 10);

  // Fetch documents list
  const { 
    data: documentsData, 
    loading: documentsLoading, 
    refresh: refreshDocuments 
  } = useApi(
    () => dataAPI.getAll({ 
      page, 
      limit, 
      search: debouncedQuery,
      ...filters 
    }),
    [page, limit, debouncedQuery, filters]
  );

  // Fetch document records for modal
  const {
    data: recordsData,
    loading: recordsLoading,
    execute: fetchRecords
  } = useApi(
    (docId) => dataAPI.getRecords(docId, { limit: 50 }),
    [],
    { immediate: false }
  );

  useEffect(() => {
    if (documentsData?.pagination) {
      updatePagination(documentsData.pagination);
    }
  }, [documentsData]);

  const handleViewDocument = async (doc) => {
    setSelectedDocument(doc);
    setViewModalOpen(true);
    await fetchRecords(doc._id);
  };

  const handleDeleteDocument = async (docId, fileName) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await dataAPI.deleteById(docId);
      toast.success('Document deleted successfully');
      refreshDocuments();
    } catch (error) {
      toast.error(`Failed to delete document: ${error.message}`);
    }
  };

  const handleDownload = async (docId, format) => {
    try {
      toast.loading('Preparing download...');
      await downloadAPI.downloadFile(docId, format);
      toast.dismiss();
      toast.success(`Download started`);
    } catch (error) {
      toast.dismiss();
      toast.error(`Download failed: ${error.message}`);
    }
  };

  const handleBulkDownload = async (format) => {
    try {
      toast.loading('Preparing bulk download...');
      await downloadAPI.downloadBulk(format);
      toast.dismiss();
      toast.success('Bulk download started');
    } catch (error) {
      toast.dismiss();
      toast.error(`Bulk download failed: ${error.message}`);
    }
  };

  const documents = documentsData?.data || [];
  const hasDocuments = documents.length > 0;

  if (documentsLoading && !hasDocuments) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clean Data</h1>
          <p className="text-gray-600 mt-1">
            Browse and manage your processed datasets
          </p>
        </div>
        
        {hasDocuments && (
          <div className="flex items-center space-x-3">
            <Select
              value={downloadFormat}
              onChange={(e) => setDownloadFormat(e.target.value)}
              className="w-24"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
            </Select>
            <Button
              variant="secondary"
              onClick={() => handleBulkDownload(downloadFormat)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select
            value={filters.fileType || ''}
            onChange={(e) => updateFilter('fileType', e.target.value)}
          >
            <option value="">All file types</option>
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="xml">XML</option>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
            <option value="jpeg">JPEG</option>
          </Select>
          <div className="flex items-center space-x-2">
            {hasActiveFilters() && (
              <Button
                variant="secondary"
                size="small"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}
            <Button variant="secondary" size="small">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Documents Table */}
      {hasDocuments ? (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <Table
              headers={[
                'File', 
                'Type', 
                'Records', 
                'Upload Date', 
                'Processing Time',
                'Actions'
              ]}
            >
              {documents.map((doc) => (
                <DocumentRow
                  key={doc._id}
                  document={doc}
                  onView={() => handleViewDocument(doc)}
                  onDelete={() => handleDeleteDocument(doc._id, doc.originalFileName)}
                  onDownload={(format) => handleDownload(doc._id, format)}
                />
              ))}
            </Table>
          </div>
          
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              showInfo={true}
              totalItems={documentsData?.pagination?.totalDocuments || 0}
              itemsPerPage={limit}
            />
          )}
        </Card>
      ) : (
        <EmptyState
          icon={Database}
          title="No data found"
          description={
            debouncedQuery || hasActiveFilters() 
              ? "No documents match your search criteria" 
              : "Upload your first file to see data here"
          }
          action={
            <Button onClick={() => window.location.href = '/upload'}>
              Upload Files
            </Button>
          }
        />
      )}

      {/* View Document Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Document Details"
        size="xlarge"
      >
        {selectedDocument && (
          <DocumentModal
            document={selectedDocument}
            recordsData={recordsData}
            loading={recordsLoading}
          />
        )}
      </Modal>
    </div>
  );
}

function DocumentRow({ document, onView, onDelete, onDownload }) {
  const [downloadFormat, setDownloadFormat] = useState('csv');

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getFileIcon(document.fileType)}</span>
          <div>
            <div className="font-medium text-gray-900 text-sm">
              {document.originalFileName}
            </div>
            <div className="text-xs text-gray-500">
              ID: {document._id.slice(-8)}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <Badge variant="info" className="text-xs">
          {document.fileType.toUpperCase()}
        </Badge>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {formatNumber(document.recordCount)}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {formatDate(document.uploadDate)}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {document.processingTime ? `${document.processingTime}ms` : 'N/A'}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={onView}
            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          <div className="flex items-center space-x-1">
            <select
              value={downloadFormat}
              onChange={(e) => setDownloadFormat(e.target.value)}
              className="text-xs border border-gray-300 rounded px-1 py-0.5"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
            </select>
            <button
              onClick={() => onDownload(downloadFormat)}
              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function DocumentModal({ document, recordsData, loading }) {
  const records = recordsData?.data?.records || [];
  const documentInfo = recordsData?.data?.documentInfo || document;

  return (
    <div className="space-y-6">
      {/* Document Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">File Information</h3>
            <div className="space-y-1 text-sm">
              <div><span className="text-gray-500">Name:</span> {documentInfo.originalFileName}</div>
              <div><span className="text-gray-500">Type:</span> {documentInfo.fileType?.toUpperCase()}</div>
              <div><span className="text-gray-500">Records:</span> {formatNumber(documentInfo.recordCount)}</div>
              <div><span className="text-gray-500">Uploaded:</span> {formatDate(documentInfo.uploadDate)}</div>
            </div>
          </div>
          
          {documentInfo.metadata && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Metadata</h3>
              <div className="space-y-1 text-sm">
                <div><span className="text-gray-500">Fields:</span> {documentInfo.metadata.totalFields}</div>
                <div><span className="text-gray-500">Unique Fields:</span> {documentInfo.metadata.uniqueFields?.length || 0}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Records Preview */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Records Preview</h3>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner />
          </div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <RecordsTable records={records.slice(0, 10)} />
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No records found"
            description="This document doesn't contain any records"
          />
        )}
      </div>
    </div>
  );
}

function RecordsTable({ records }) {
  if (!records || records.length === 0) return null;

  // Get all unique keys from records (excluding metadata)
  const allKeys = Array.from(new Set(
    records.flatMap(record => 
      Object.keys(record).filter(key => key !== '_metadata')
    )
  ));

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {allKeys.map(key => (
            <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              {key}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {records.map((record, index) => (
          <tr key={index} className="hover:bg-gray-50">
            {allKeys.map(key => (
              <td key={key} className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate">
                {record[key] ? String(record[key]) : ''}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}