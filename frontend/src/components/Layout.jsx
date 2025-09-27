import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home,
  Upload,
  Database,
  AlertCircle,
  BarChart3,
  Menu,
  X,
  Activity,
  Settings
} from 'lucide-react';
import { cn } from '../utils/helpers';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Clean Data', href: '/data', icon: Database },
  { name: 'Error Logs', href: '/errors', icon: AlertCircle },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentPage = navigation.find(item => item.href === location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gradient">VizFlow</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary-50 text-primary-700 border-r-2 border-primary-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  location.pathname === item.href 
                    ? "text-primary-500" 
                    : "text-gray-400 group-hover:text-gray-600"
                )} />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              <Settings className="w-5 h-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Settings</p>
                <p className="text-xs text-gray-500">Manage preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top navigation bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentPage?.name || 'VizFlow'}
                </h2>
                <p className="text-sm text-gray-500">
                  {getPageDescription(location.pathname)}
                </p>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span>System Online</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function getPageDescription(pathname) {
  const descriptions = {
    '/': 'Overview of your data processing workflow',
    '/upload': 'Upload and process files in multiple formats',
    '/data': 'View and manage cleaned datasets', 
    '/errors': 'Monitor and analyze data processing errors',
    '/insights': 'Analytics and visualizations of your data'
  };
  
  return descriptions[pathname] || 'Data processing and visualization platform';
}