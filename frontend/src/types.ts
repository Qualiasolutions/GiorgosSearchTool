export interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  original_price?: number;
  discount_percentage?: number;
  rating?: number;
  review_count?: number;
  url: string;
  image: string;
  description?: string;
  shipping_cost?: number;
  shipping_time?: string;
  in_stock: boolean;
  seller?: string;
  seller_rating?: number;
  site: string;
  value_score?: number;
  deal_quality?: string;
  normalized_title?: string;
  ai_summary?: string;
  saved_at?: string;
}

export interface SearchParams {
  query: string;
  region?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: 'price_asc' | 'price_desc' | 'rating' | 'value_score' | 'relevance';
  page?: number;
  limit?: number;
}

export interface SearchHistory extends SearchParams {
  timestamp: string;
  results_count?: number;
}

export interface SearchResults {
  query: string;
  total_results: number;
  page: number;
  limit: number;
  best_deals: Product[];
  products: Product[];
}

export interface Region {
  code: string;
  name: string;
} 