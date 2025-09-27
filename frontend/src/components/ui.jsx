import React from 'react';
import { cn } from '../utils/helpers';

export function LoadingSpinner({ size = 'medium', className }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-primary-600', sizeClasses[size], className)}>
    </div>
  );
}

export function Card({ children, className, ...props }) {
  return (
    <div className={cn('card', className)} {...props}>
      {children}
    </div>
  );
}

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'badge bg-gray-100 text-gray-800',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info'
  };

  return (
    <span className={cn(variants[variant], className)}>
      {children}
    </span>
  );
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  loading = false,
  className,
  ...props 
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger'
  };

  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={cn(
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        loading && 'cursor-wait',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner size="small" className="mr-2" />}
      {children}
    </button>
  );
}

export function Input({ 
  label, 
  error, 
  className,
  ...props 
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="label">
          {label}
        </label>
      )}
      <input
        className={cn(
          'input',
          error && 'border-error-500 focus:ring-error-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-error-600">{error}</p>
      )}
    </div>
  );
}

export function Select({ 
  label, 
  error, 
  children,
  className,
  ...props 
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="label">
          {label}
        </label>
      )}
      <select
        className={cn(
          'input',
          error && 'border-error-500 focus:ring-error-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-sm text-error-600">{error}</p>
      )}
    </div>
  );
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium' 
}) {
  if (!isOpen) return null;

  const sizes = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    xlarge: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className={cn(
          'inline-block w-full p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl',
          sizes[size]
        )}>
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}) {
  return (
    <div className="text-center py-12">
      {Icon && (
        <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      )}
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}

export function Table({ 
  headers, 
  children, 
  className 
}) {
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className={cn('min-w-full divide-y divide-gray-300', className)}>
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  showInfo = false,
  totalItems = 0,
  itemsPerPage = 10
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      {showInfo && (
        <div className="flex justify-between flex-1 sm:hidden">
          <p className="text-sm text-gray-700">
            Showing {startItem} to {endItem} of {totalItems} results
          </p>
        </div>
      )}
      
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        {showInfo && (
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{totalItems}</span> results
            </p>
          </div>
        )}
        
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  'relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0',
                  page === currentPage
                    ? 'bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                    : 'text-gray-900 hover:bg-gray-50'
                )}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}