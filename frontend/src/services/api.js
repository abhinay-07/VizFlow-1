import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    // config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorMessage =
        error.response.data?.error ||
        error.response.data?.message ||
        "An error occurred";
      throw new Error(errorMessage);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error("No response from server. Please check your connection.");
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(error.message || "Request failed");
    }
  }
);

// Upload API
export const uploadAPI = {
  uploadFile: (file, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },

  getUploadStatus: () => api.get("/upload/status"),
};

// Data API
export const dataAPI = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return api.get(`/data?${searchParams}`);
  },

  getById: (id) => api.get(`/data/${id}`),

  getRecords: (id, params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return api.get(`/data/${id}/records?${searchParams}`);
  },

  getSummary: () => api.get("/data/stats/summary"),

  deleteById: (id) => api.delete(`/data/${id}`),
};

// Errors API
export const errorsAPI = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return api.get(`/errors?${searchParams}`);
  },

  getById: (id) => api.get(`/errors/${id}`),

  getDetails: (id, params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return api.get(`/errors/${id}/details?${searchParams}`);
  },

  getSummary: () => api.get("/errors/stats/summary"),

  getChartData: () => api.get("/errors/stats/charts"),

  deleteById: (id) => api.delete(`/errors/${id}`),
};

// Download API
export const downloadAPI = {
  downloadFile: (id, format) => {
    return api
      .get(`/download/${id}/${format}`, {
        responseType: "blob",
      })
      .then((response) => {
        // Create blob link to download
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `data.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
  },

  downloadBulk: (format) => {
    return api
      .get(`/download/bulk/all/${format}`, {
        responseType: "blob",
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `all_data.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
  },

  getFormats: () => api.get("/download/formats"),
};

// System API
export const systemAPI = {
  health: () => api.get("/health"),
};

// Chatbot API
export const chatbotAPI = {
  sendMessage: (message) => api.post("/chatbot/message", { message }),
  getCapabilities: () => api.get("/chatbot/capabilities"),
};

// Merge API
export const mergeAPI = {
  mergeFiles: (fileIds) => api.post("/merge", { fileIds }),
  getMergeHistory: () => api.get("/merge/history"),
};

export default api;
