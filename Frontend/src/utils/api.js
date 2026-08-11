/**
 * Centralized API Configuration
 * 
 * All API calls should use this module to ensure consistent base URL handling.
 * This makes it easy to switch between development and production environments.
 */

// API Base URL - defaults to empty string for Vite proxy in development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Get the full API URL for a given endpoint
 * @param {string} endpoint - The API endpoint path (e.g., '/api/auth/login')
 * @returns {string} The full API URL
 */
export const getApiUrl = (endpoint) => {
  // If endpoint already starts with http/https, return as-is
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  
  // Ensure endpoint starts with /api if it doesn't already
  const path = endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  return `${API_BASE_URL}${path}`;
};

/**
 * Make an authenticated API request
 * @param {string} endpoint - The API endpoint path
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<object>} The API response
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  // Add authorization header if token exists
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  // Merge headers (don't override Content-Type for FormData)
  const headers = options.headers instanceof FormData 
    ? { ...options.headers } 
    : { ...defaultHeaders, ...options.headers };
  
  const config = {
    ...options,
    headers,
  };
  
  // Remove body for GET requests
  if (config.method === 'GET' || !config.method) {
    delete config.body;
  }
  
  const response = await fetch(url, config);
  
  // Handle non-JSON responses (like file downloads)
  const contentType = response.headers.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
    return response;
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw { status: response.status, ...data };
  }
  
  return data;
};

/**
 * Upload a file with optional metadata
 * @param {string} endpoint - The API endpoint path
 * @param {File} file - The file to upload
 * @param {object} additionalData - Additional form data
 * @returns {Promise<object>} The API response
 */
export const uploadFile = async (endpoint, file, additionalData = {}) => {
  const url = getApiUrl(endpoint);
  
  const token = localStorage.getItem('token');
  
  const formData = new FormData();
  formData.append('cv', file); // Default field name
  
  // Add additional data
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw { status: response.status, ...data };
  }
  
  return data;
};

/**
 * Get the base URL for file resources (like images, PDFs)
 * @returns {string} The base URL for file resources
 */
export const getFileBaseUrl = () => {
  return API_BASE_URL || '';
};

export default {
  getApiUrl,
  apiRequest,
  uploadFile,
  getFileBaseUrl,
  API_BASE_URL,
};
