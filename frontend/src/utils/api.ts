import axios from 'axios';
import { SearchParams, SearchResults, Region } from '../types';

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
        { code: 'eu', name: 'Europe' }
      ];
    }
  }
};

export default api; 