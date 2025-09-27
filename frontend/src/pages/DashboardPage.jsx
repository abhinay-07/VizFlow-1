import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Database, 
  AlertCircle, 
  BarChart3,
  FileText,
  CheckCircle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Card, Button, Badge, EmptyState, LoadingSpinner } from '../components/ui';
import { useApi } from '../hooks';
import { dataAPI, errorsAPI } from '../services/api';
import { formatNumber, formatDate } from '../utils/helpers';

export default function DashboardPage() {
  const navigate = useNavigate();
  
  const { data: dataSummary, loading: dataLoading } = useApi(dataAPI.getSummary, [], {
    onError: (error) => console.error('Error fetching data summary:', error)
  });
  
  const { data: errorSummary, loading: errorLoading } = useApi(errorsAPI.getSummary, [], {
    onError: (error) => console.error('Error fetching error summary:', error)
  });

  const isLoading = dataLoading || errorLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Documents',
      value: dataSummary?.data?.summary?.totalDocuments || 0,
      change: '+12%',
      changeType: 'increase',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      name: 'Clean Records',
      value: formatNumber(dataSummary?.data?.summary?.totalRecords || 0),
      change: '+5.4%',
      changeType: 'increase',
      icon: Database,
      color: 'bg-green-500'
    },
    {
      name: 'Total Errors',
      value: formatNumber(errorSummary?.data?.summary?.totalErrors || 0),
      change: '-2.1%',
      changeType: 'decrease',
      icon: AlertCircle,
      color: 'bg-red-500'
    },
    {
      name: 'Avg Records/Doc',
      value: dataSummary?.data?.summary?.averageRecordsPerDocument || 0,
      change: '+3.2%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'bg-purple-500'
    }
  ];

  const quickActions = [
    {
      title: 'Upload Files',
      description: 'Process new data files',
      icon: Upload,
      action: () => navigate('/upload'),
      color: 'bg-primary-500 hover:bg-primary-600'
    },
    {
      title: 'View Clean Data',
      description: 'Browse processed records',
      icon: Database,
      action: () => navigate('/data'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Check Errors',
      description: 'Review data issues',
      icon: AlertCircle,
      action: () => navigate('/errors'),
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'View Insights',
      description: 'Analyze trends and patterns',
      icon: BarChart3,
      action: () => navigate('/insights'),
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome to VizFlow</h1>
            <p className="text-primary-100 mt-1">
              Process, clean, and visualize your data with ease
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="relative overflow-hidden">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Badge 
                variant={stat.changeType === 'increase' ? 'success' : 'info'}
                className="text-xs"
              >
                {stat.change}
              </Badge>
              <span className="text-sm text-gray-500 ml-2">vs last month</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={action.action}
              className={`${action.color} text-white p-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg`}
            >
              <action.icon className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-1">{action.title}</h3>
              <p className="text-sm opacity-90">{action.description}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Uploads</h2>
            <Button 
              variant="secondary" 
              size="small"
              onClick={() => navigate('/data')}
            >
              View All
            </Button>
          </div>
          
          {dataSummary?.data?.recentUploads?.length > 0 ? (
            <div className="space-y-3">
              {dataSummary.data.recentUploads.map((upload) => (
                <div key={upload._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {upload.originalFileName}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {formatNumber(upload.recordCount)} records
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="success" className="text-xs mb-1">
                      {upload.fileType.toUpperCase()}
                    </Badge>
                    <p className="text-gray-500 text-xs">
                      {formatDate(upload.uploadDate, 'relative')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No recent uploads"
              description="Upload your first file to get started"
              action={
                <Button onClick={() => navigate('/upload')}>
                  Upload Files
                </Button>
              }
            />
          )}
        </Card>

        {/* File Type Distribution */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">File Type Distribution</h2>
          
          {dataSummary?.data?.fileTypeStats?.length > 0 ? (
            <div className="space-y-3">
              {dataSummary.data.fileTypeStats.map((stat) => (
                <div key={stat._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="info" className="text-xs font-mono">
                      {stat._id.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {stat.count} {stat.count === 1 ? 'file' : 'files'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatNumber(stat.records)} records
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No data available"
              description="Upload files to see distribution"
            />
          )}
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
            <p className="text-sm text-gray-500 mt-1">All services are operational</p>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-success-500" />
            <span className="text-sm font-medium text-success-600">Online</span>
          </div>
        </div>
      </Card>
    </div>
  );
}