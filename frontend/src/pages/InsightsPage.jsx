import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Activity,
  FileText,
  AlertCircle,
  Database,
  Calendar
} from 'lucide-react';
import { Card, LoadingSpinner, Badge, Select } from '../components/ui';
import { useApi } from '../hooks';
import { dataAPI, errorsAPI } from '../services/api';
import { formatNumber, formatDate, generateRandomColor } from '../utils/helpers';

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState('30');

  // Fetch data summary
  const { data: dataSummary, loading: dataLoading } = useApi(dataAPI.getSummary);
  
  // Fetch error summary
  const { data: errorSummary, loading: errorLoading } = useApi(errorsAPI.getSummary);
  
  // Fetch error chart data
  const { data: errorChartData, loading: chartLoading } = useApi(errorsAPI.getChartData);

  const isLoading = dataLoading || errorLoading || chartLoading;

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Insights & Analytics</h1>
          <p className="text-gray-600 mt-1">
            Analyze your data processing patterns and trends
          </p>
        </div>
        
        <Select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="w-40"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Processing Success Rate"
          value="94.2%"
          change="+2.1%"
          changeType="positive"
          icon={TrendingUp}
          color="bg-green-500"
        />
        <MetricCard
          title="Avg Processing Time"
          value="2.3s"
          change="-0.5s"
          changeType="positive"
          icon={Activity}
          color="bg-blue-500"
        />
        <MetricCard
          title="Data Quality Score"
          value="8.7/10"
          change="+0.3"
          changeType="positive"
          icon={Database}
          color="bg-purple-500"
        />
        <MetricCard
          title="Files Processed"
          value={formatNumber(dataSummary?.data?.summary?.totalDocuments || 0)}
          change="+15"
          changeType="positive"
          icon={FileText}
          color="bg-orange-500"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Type Distribution */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">File Type Distribution</h2>
            <PieChartIcon className="w-5 h-5 text-gray-400" />
          </div>
          
          {dataSummary?.data?.fileTypeStats ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dataSummary.data.fileTypeStats.map((stat, index) => ({
                    name: stat._id.toUpperCase(),
                    value: stat.count,
                    records: stat.records
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dataSummary.data.fileTypeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [
                  `${value} files (${formatNumber(props.payload.records)} records)`,
                  name
                ]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </Card>

        {/* Error Type Distribution */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Error Type Distribution</h2>
            <AlertCircle className="w-5 h-5 text-gray-400" />
          </div>
          
          {errorChartData?.data?.errorTypeDistribution ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={errorChartData.data.errorTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {errorChartData.data.errorTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              No error data available
            </div>
          )}
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6">
        {/* Error Trends */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Error Trends (Last 30 Days)</h2>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          
          {errorChartData?.data?.errorTrends ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={errorChartData.data.errorTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => `Date: ${value}`}
                  formatter={(value, name) => [value, name === 'errors' ? 'Errors' : 'Documents']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="errors" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Errors"
                />
                <Line 
                  type="monotone" 
                  dataKey="documents" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Documents"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              No trend data available
            </div>
          )}
        </Card>
      </div>

      {/* File Type Error Analysis */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Error Rate by File Type</h2>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>
        
        {errorChartData?.data?.fileTypeErrors ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={errorChartData.data.fileTypeErrors}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fileType" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'totalErrors') return [formatNumber(value), 'Total Errors'];
                  if (name === 'documentCount') return [value, 'Documents'];
                  if (name === 'averageErrors') return [value.toFixed(2), 'Avg Errors/Doc'];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="totalErrors" fill="#EF4444" name="Total Errors" />
              <Bar dataKey="averageErrors" fill="#F59E0B" name="Avg Errors per Document" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-300 flex items-center justify-center text-gray-500">
            No file type error data available
          </div>
        )}
      </Card>

      {/* Data Quality Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Quality Summary</h2>
          <div className="space-y-4">
            <QualityMetric
              label="Clean Records"
              value={dataSummary?.data?.summary?.totalRecords || 0}
              total={(dataSummary?.data?.summary?.totalRecords || 0) + (errorSummary?.data?.summary?.totalErrors || 0)}
              color="text-green-600"
            />
            <QualityMetric
              label="Error Records"
              value={errorSummary?.data?.summary?.totalErrors || 0}
              total={(dataSummary?.data?.summary?.totalRecords || 0) + (errorSummary?.data?.summary?.totalErrors || 0)}
              color="text-red-600"
            />
            <QualityMetric
              label="Processing Success"
              value={dataSummary?.data?.summary?.totalDocuments || 0}
              total={(dataSummary?.data?.summary?.totalDocuments || 0) + (errorSummary?.data?.summary?.totalErrorDocuments || 0)}
              color="text-blue-600"
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Performance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Avg Records per Document</span>
              <span className="font-semibold">
                {dataSummary?.data?.summary?.averageRecordsPerDocument || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Documents Processed</span>
              <span className="font-semibold">
                {formatNumber(dataSummary?.data?.summary?.totalDocuments || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Error Rate</span>
              <span className="font-semibold text-red-600">
                {calculateErrorRate(
                  errorSummary?.data?.summary?.totalErrors || 0,
                  dataSummary?.data?.summary?.totalRecords || 0
                )}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Success Rate</span>
              <span className="font-semibold text-green-600">
                {calculateSuccessRate(
                  dataSummary?.data?.summary?.totalRecords || 0,
                  errorSummary?.data?.summary?.totalErrors || 0
                )}%
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, changeType, icon: Icon, color }) {
  return (
    <Card>
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center">
          <Badge 
            variant={changeType === 'positive' ? 'success' : 'error'}
            className="text-xs"
          >
            {change}
          </Badge>
          <span className="text-sm text-gray-500 ml-2">vs last period</span>
        </div>
      )}
    </Card>
  );
}

function QualityMetric({ label, value, total, color }) {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`font-semibold ${color}`}>
          {formatNumber(value)} ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            color.includes('green') ? 'bg-green-500' :
            color.includes('red') ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function calculateErrorRate(totalErrors, totalRecords) {
  const total = totalErrors + totalRecords;
  return total > 0 ? ((totalErrors / total) * 100).toFixed(1) : 0;
}

function calculateSuccessRate(totalRecords, totalErrors) {
  const total = totalErrors + totalRecords;
  return total > 0 ? ((totalRecords / total) * 100).toFixed(1) : 0;
}