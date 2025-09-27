import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Search, 
  Filter, 
  Eye, 
  Trash2,
  TrendingDown,
  BarChart3
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
import { errorsAPI } from '../services/api';
import { formatDate, formatNumber, getErrorSeverityColor, getErrorTypeColor, cn } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function ErrorsPage() {
  const [selectedErrorLog, setSelectedErrorLog] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  
  const { query, debouncedQuery, setQuery } = useSearch();
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useFilters();
  const { 
    page, 
    limit, 
    totalPages, 
    goToPage, 
    updatePagination 
  } = usePagination(1, 10);

  // Fetch error logs list
  const { 
    data: errorLogsData, 
    loading: errorLogsLoading, 
    refresh: refreshErrorLogs 
  } = useApi(
    () => errorsAPI.getAll({ 
      page, 
      limit, 
      search: debouncedQuery,
      ...filters 
    }),
    [page, limit, debouncedQuery, filters]
  );

  // Fetch error summary stats
  const { data: errorSummary } = useApi(errorsAPI.getSummary, []);

  // Fetch error details for modal
  const {
    data: errorDetailsData,
    loading: errorDetailsLoading,
    execute: fetchErrorDetails
  } = useApi(
    (logId) => errorsAPI.getDetails(logId, { limit: 50 }),
    [],
    { immediate: false }
  );

  useEffect(() => {
    if (errorLogsData?.pagination) {
      updatePagination(errorLogsData.pagination);
    }
  }, [errorLogsData]);

  const handleViewErrorLog = async (errorLog) => {
    setSelectedErrorLog(errorLog);
    setViewModalOpen(true);
    await fetchErrorDetails(errorLog._id);
  };

  const handleDeleteErrorLog = async (logId, fileName) => {
    if (!confirm(`Are you sure you want to delete error log for "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await errorsAPI.deleteById(logId);
      toast.success('Error log deleted successfully');
      refreshErrorLogs();
    } catch (error) {
      toast.error(`Failed to delete error log: ${error.message}`);
    }
  };

  const errorLogs = errorLogsData?.data || [];
  const hasErrorLogs = errorLogs.length > 0;

  if (errorLogsLoading && !hasErrorLogs) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Error Logs</h1>
        <p className="text-gray-600 mt-1">
          Monitor and analyze data processing errors
        </p>
      </div>

      {/* Error Summary Stats */}
      {errorSummary?.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Errors</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(errorSummary.data.summary.totalErrors)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-100">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Error Documents</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(errorSummary.data.summary.totalErrorDocuments)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Errors/Doc</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {errorSummary.data.summary.averageErrorsPerDocument}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <TrendingDown className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Most Common</p>
                <p className="text-lg font-semibold text-gray-900">
                  {getMostCommonErrorType(errorSummary.data.errorTypeDistribution)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Error Type Distribution */}
      {errorSummary?.data?.errorTypeDistribution && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Error Type Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(errorSummary.data.errorTypeDistribution).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(count)}
                </div>
                <div className="text-sm text-gray-500 capitalize">
                  {type.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search error logs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select
            value={filters.severity || ''}
            onChange={(e) => updateFilter('severity', e.target.value)}
          >
            <option value="">All severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
          <Select
            value={filters.errorType || ''}
            onChange={(e) => updateFilter('errorType', e.target.value)}
          >
            <option value="">All error types</option>
            <option value="missing_field">Missing Field</option>
            <option value="invalid_format">Invalid Format</option>
            <option value="duplicate">Duplicate</option>
            <option value="validation_error">Validation Error</option>
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

      {/* Error Logs Table */}
      {hasErrorLogs ? (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <Table
              headers={[
                'File', 
                'Error Count', 
                'Error Types', 
                'Upload Date', 
                'Actions'
              ]}
            >
              {errorLogs.map((errorLog) => (
                <ErrorLogRow
                  key={errorLog._id}
                  errorLog={errorLog}
                  onView={() => handleViewErrorLog(errorLog)}
                  onDelete={() => handleDeleteErrorLog(errorLog._id, errorLog.originalFileName)}
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
              totalItems={errorLogsData?.pagination?.totalDocuments || 0}
              itemsPerPage={limit}
            />
          )}
        </Card>
      ) : (
        <EmptyState
          icon={AlertCircle}
          title="No error logs found"
          description={
            debouncedQuery || hasActiveFilters() 
              ? "No error logs match your search criteria" 
              : "Great! No errors have been logged yet"
          }
          action={
            <Button onClick={() => window.location.href = '/upload'}>
              Upload Files
            </Button>
          }
        />
      )}

      {/* View Error Log Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Error Log Details"
        size="xlarge"
      >
        {selectedErrorLog && (
          <ErrorLogModal
            errorLog={selectedErrorLog}
            errorDetailsData={errorDetailsData}
            loading={errorDetailsLoading}
          />
        )}
      </Modal>
    </div>
  );
}

function ErrorLogRow({ errorLog, onView, onDelete }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm">
              {errorLog.originalFileName}
            </div>
            <div className="text-xs text-gray-500">
              {errorLog.fileType.toUpperCase()}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-lg font-semibold text-red-600">
          {formatNumber(errorLog.errorCount)}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {Object.entries(errorLog.errorSummary || {}).map(([type, count]) => (
            count > 0 && (
              <Badge 
                key={type} 
                className={cn('text-xs', getErrorTypeColor(type))}
              >
                {type.replace('_', ' ')}: {count}
              </Badge>
            )
          ))}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {formatDate(errorLog.uploadDate)}
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

function ErrorLogModal({ errorLog, errorDetailsData, loading }) {
  const errors = errorDetailsData?.data?.errors || [];
  const documentInfo = errorDetailsData?.data?.documentInfo || errorLog;

  return (
    <div className="space-y-6">
      {/* Error Log Info */}
      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">File Information</h3>
            <div className="space-y-1 text-sm">
              <div><span className="text-gray-500">Name:</span> {documentInfo.originalFileName}</div>
              <div><span className="text-gray-500">Type:</span> {documentInfo.fileType?.toUpperCase()}</div>
              <div><span className="text-gray-500">Total Errors:</span> {formatNumber(documentInfo.errorCount)}</div>
              <div><span className="text-gray-500">Uploaded:</span> {formatDate(documentInfo.uploadDate)}</div>
            </div>
          </div>
          
          {documentInfo.errorSummary && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Error Breakdown</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(documentInfo.errorSummary).map(([type, count]) => (
                  <div key={type}>
                    <span className="text-gray-500">{type.replace('_', ' ')}:</span> {count}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Errors List */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Error Details</h3>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner />
          </div>
        ) : errors.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {errors.map((error, index) => (
              <ErrorItem key={index} error={error} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Info}
            title="No error details found"
            description="Error details could not be loaded"
          />
        )}
      </div>
    </div>
  );
}

function ErrorItem({ error }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <Badge className={cn('text-xs', getErrorTypeColor(error.type))}>
              {error.type.replace('_', ' ')}
            </Badge>
            <Badge className={cn('text-xs', getErrorSeverityColor(error.severity))}>
              {error.severity}
            </Badge>
            {error.rowIndex !== null && error.rowIndex !== undefined && (
              <span className="text-xs text-gray-500">Row {error.rowIndex + 1}</span>
            )}
          </div>
          
          <p className="text-sm text-gray-900 mb-1">{error.message}</p>
          
          {error.field && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Field:</span> {error.field}
            </div>
          )}
          
          {error.value && (
            <div className="text-xs text-gray-500 mt-1">
              <span className="font-medium">Value:</span> 
              <span className="ml-1 font-mono bg-gray-200 px-1 rounded">
                {String(error.value).substring(0, 100)}
                {String(error.value).length > 100 && '...'}
              </span>
            </div>
          )}
        </div>
        
        {error.timestamp && (
          <div className="text-xs text-gray-400">
            {formatDate(error.timestamp, 'relative')}
          </div>
        )}
      </div>
    </div>
  );
}

function getMostCommonErrorType(errorTypeDistribution) {
  if (!errorTypeDistribution) return 'N/A';
  
  const entries = Object.entries(errorTypeDistribution);
  if (entries.length === 0) return 'None';
  
  const maxEntry = entries.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );
  
  return maxEntry[0].replace('_', ' ');
}