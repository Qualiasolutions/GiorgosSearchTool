import axios, { AxiosError } from 'axios';
import { SearchParams, SearchResults, Region, Store, Product, SearchHistory } from '../types';

// Determine API URL based on environment
const getApiUrl = () => {
  // In production, use the deployed API URL
  if (process.env.NODE_ENV === 'production') {
    // If deployed on render.com
    if (window.location.hostname.includes('render.com')) {
      return 'https://giorgospowersearch-api.onrender.com/api';
    }
    // For other production environments, use relative URL
    return '/api';
  }
  // In development, use local API
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

// Base API URL
const API_URL = getApiUrl();

// Configure axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 60000; // Increased timeout to 60 seconds

// Maximum number of retries for failed requests
const MAX_RETRIES = 2;

/**
 * Enhanced interface for search response with success and error fields
 */
export interface SearchResponse extends SearchResults {
  success: boolean;
  error?: string;
  search_time?: number;
}

/**
 * Retry mechanism for API requests
 */
const retryRequest = async <T>(
  requestFn: () => Promise<T>, 
  maxRetries: number = MAX_RETRIES
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      console.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      
      // Only retry certain types of errors (network issues, timeouts, 5xx errors)
      const shouldRetry = (error instanceof AxiosError) && 
        (error.code === 'ECONNABORTED' || 
         error.code === 'ETIMEDOUT' || 
         !error.response || 
         error.response.status >= 500);
      
      if (!shouldRetry || attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff with a small initial delay
      const delay = Math.min(1000 * (2 ** attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

const api = {
  /**
   * Searches for products across multiple e-commerce platforms
   */
  async search(params: SearchParams): Promise<SearchResponse> {
    return retryRequest(async () => {
      const response = await axios.post<SearchResponse>('/search', params);
      return response.data;
    });
  },

  /**
   * Creates a SearchHistory object from search results
   */
  createSearchHistoryItem(
    query: string, 
    results: SearchResponse
  ): SearchHistory {
    return {
      query,
      timestamp: new Date().toISOString(),
      results_count: results.total_results,
      region: 'global',
      sort_by: 'relevance',
      page: results.page,
      limit: results.limit
    };
  },

  /**
   * Gets a list of available e-commerce stores
   */
  async getStores(): Promise<string[]> {
    try {
      const response = await axios.get('/stores');
      return response.data.stores;
    } catch (error) {
      console.error('Error fetching stores:', error);
      return ['amazon', 'ebay', 'walmart', 'aliexpress'];
    }
  },

  /**
   * Performs a health check on the backend API
   */
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await axios.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
};

export default api; 