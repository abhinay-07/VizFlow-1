import { useState, useEffect, useCallback } from 'react';

export function useApi(apiFunction, dependencies = [], options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { 
    immediate = true,
    onSuccess,
    onError 
  } = options;

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction(...args);
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError]);

  const refresh = useCallback(() => {
    return execute();
  }, [execute]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  return {
    data,
    loading,
    error,
    execute,
    refresh,
    setData
  };
}

export function usePagination(initialPage = 1, initialLimit = 10) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const updatePagination = (paginationData) => {
    if (paginationData) {
      setTotal(paginationData.totalDocuments || paginationData.totalRecords || 0);
      setTotalPages(paginationData.totalPages || 0);
    }
  };

  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const changeLimit = (newLimit) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  };

  return {
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    goToPage,
    nextPage,
    prevPage,
    changeLimit,
    updatePagination
  };
}

export function useSearch(initialQuery = '', debounceMs = 300) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const clearSearch = () => {
    setQuery('');
    setDebouncedQuery('');
  };

  return {
    query,
    debouncedQuery,
    setQuery,
    clearSearch
  };
}

export function useFilters(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const removeFilter = (key) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const hasActiveFilters = () => {
    return Object.keys(filters).some(key => 
      filters[key] !== undefined && 
      filters[key] !== null && 
      filters[key] !== ''
    );
  };

  return {
    filters,
    setFilters,
    updateFilter,
    removeFilter,
    clearFilters,
    hasActiveFilters
  };
}

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  };

  return [storedValue, setValue, removeValue];
}

export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return [value, toggle, setTrue, setFalse, setValue];
}

export function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}