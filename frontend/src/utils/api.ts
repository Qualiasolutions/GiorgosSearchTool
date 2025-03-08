import axios from 'axios';
import { SearchParams, SearchResults, Region, Store } from '../types';

// Configure API URL based on environment
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:5000' // Change this to your production API URL if different
  : '';

// Create axios instance with better timeout and error handling
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increase timeout to 30 seconds for production
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Log the error but allow component to handle it
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

const api = {
  async search(params: SearchParams): Promise<SearchResults> {
    try {
      console.log('Sending search request to API:', `${API_BASE_URL}/api/search`, params);
      const response = await apiClient.post<SearchResults>('/api/search', params);
      console.log('Received API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API search error:', error);
      // Return fallback data to prevent UI crashes
      return {
        query: params.query,
        total_results: 0,
        page: params.page || 1,
        limit: params.limit || 20,
        best_deals: [],
        products: []
      };
    }
  },

  async getRegions(): Promise<Region[]> {
    try {
      const response = await apiClient.get<Region[]>('/api/regions');
      return response.data;
    } catch (error) {
      console.error('API getRegions error:', error);
      // Return default regions to prevent UI crashes
      return [
        { code: 'global', name: 'Global' },
        { code: 'us', name: 'United States' },
        { code: 'eu', name: 'Europe' },
        { code: 'uk', name: 'United Kingdom' },
        { code: 'de', name: 'Germany' },
        { code: 'gr', name: 'Greece' }
      ];
    }
  },

  async getStores(): Promise<Store[]> {
    try {
      const response = await apiClient.get<Store[]>('/api/stores');
      return response.data;
    } catch (error) {
      console.error('API getStores error:', error);
      // Return default stores to prevent UI crashes
      return [
        { code: 'amazon', name: 'Amazon', regions: ['global', 'us', 'uk', 'de'] },
        { code: 'ebay', name: 'eBay', regions: ['global', 'us', 'uk'] },
        { code: 'walmart', name: 'Walmart', regions: ['us'] },
        { code: 'aliexpress', name: 'AliExpress', regions: ['global'] },
        { code: 'bestbuy', name: 'Best Buy', regions: ['us'] }
      ];
    }
  }
};

export default api; 