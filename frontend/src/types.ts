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
  brand?: string;
  category?: string;
  all_sources?: string[];
  source_count?: number;
  free_shipping?: boolean;
  confidence?: number;
  relevance_score?: number;
  deal_score?: number;
  metadata?: Record<string, any>;
  key_specifications?: string[];
  ai_deal_assessment?: 'good' | 'average' | 'poor';
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
  sort_by?: 'price_asc' | 'price_desc' | 'rating' | 'relevance' | 'discount';
  page?: number;
  limit?: number;
  advanced_matching?: boolean;
  use_openai?: boolean;
  natural_language?: boolean;
  filters?: SearchFilters;
}

export interface SearchFilters {
  brands?: string[];
  categories?: string[];
  price_range?: {
    min?: number;
    max?: number;
  };
  min_rating?: number;
  sources?: string[];
  free_shipping?: boolean;
  min_deal_score?: number;
}

export interface SearchHistory extends SearchParams {
  timestamp: string;
  results_count?: number;
}

export interface SearchResults {
  query: string;
  processed_query?: string;
  total_results: number;
  page: number;
  limit: number;
  execution_time?: number;
  best_deals: Product[];
  products: Product[];
  search_context?: Record<string, any>;
  facets?: Facets;
}

export interface Facets {
  brands?: Array<{name: string, count: number}>;
  categories?: Array<{name: string, count: number}>;
  price_ranges?: Array<{range: string, count: number}>;
  sources?: Array<{name: string, count: number}>;
  ratings?: Array<{label: string, count: number}>;
}

export interface Region {
  code: string;
  name: string;
}

export interface Store {
  code: string;
  name: string;
  regions: string[];
} 