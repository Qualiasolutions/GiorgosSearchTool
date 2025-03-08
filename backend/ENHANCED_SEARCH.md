# Enhanced Search Functionality for Giorgos' Power Search Tool

This document describes the advanced search capabilities that have been implemented to make the Power Search Tool more comprehensive, accurate, and powerful.

## Major Enhancements

### 1. Expanded E-commerce Site Coverage

The search system now includes parsers for the following e-commerce sites:

- **Global Sites**: Amazon, eBay, Walmart, AliExpress
- **US-Specific**: Best Buy, Target, Newegg, B&H, Costco, Home Depot
- **International**: Otto.de (Germany), JD.com (China), Rakuten (Japan), Skroutz.gr (Greece), Kotsovolos.gr (Greece)

Each site has a custom parser that extracts product information in a consistent format. The system uses region-appropriate settings to ensure relevant results.

### 2. Advanced Product Matching Algorithm

Products from different sites are now matched using:

- **Semantic Similarity**: Using sentence-transformers to identify similar products 
- **Brand & Model Extraction**: Identification of key product identifiers
- **Fuzzy Matching**: For titles with minor variations
- **Metadata Comparison**: Comparing product specifications

This significantly reduces duplicate listings and allows for better price comparison across sites.

### 3. Improved Search Relevance

Results are now ranked using a sophisticated algorithm that considers:

- **Query Term Matching**: How well the product title matches search terms
- **Deal Quality**: Discount percentage, ratings, and other factors
- **Data Completeness**: Products with more complete information rank higher
- **Multi-source Validation**: Products found on multiple sites get a boost

### 4. Natural Language Query Processing

The system now understands natural language queries like:
- "Best laptop under $1000"
- "Cheapest 4K TV with good reviews"
- "Headphones with noise cancellation for running"

This is powered by OpenAI's API to extract search intentions and parameters.

### 5. Faceted Search & Advanced Filtering

Results can be filtered by:
- Brand
- Category
- Price Range
- Rating
- Source Site
- Shipping Options
- Deal Quality

## Technical Implementation

### Core Components

1. **Modular Parser System**: Each e-commerce site has a dedicated parser function in `advanced_scraper.py`

2. **Multi-threaded Scraping**: Parallel processing of multiple sites simultaneously

3. **Enhanced Product Matching**: Implementation of semantic matching with fallback to fuzzy text matching

4. **OpenAI Integration**: For natural language processing and product analysis

5. **Facet Generation**: Automatic creation of filter options based on available data

### API Endpoints

- **POST `/api/search`**: Main search endpoint with advanced options
- **GET `/api/regions`**: Available regions for search
- **GET `/api/stores`**: Available e-commerce stores

### Search Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| query | Search query text | (required) |
| region | Region code for search | "global" |
| min_price | Minimum price filter | null |
| max_price | Maximum price filter | null |
| sort_by | Sort method (price_asc, price_desc, rating, relevance, discount) | "relevance" |
| page | Page number | 1 |
| limit | Results per page | 20 |
| advanced_matching | Enable product matching | true |
| use_openai | Use OpenAI for query processing | true |
| natural_language | Process query as natural language | true |
| filters | Object containing filter criteria | {} |

## Usage Examples

### Basic Search

```json
{
  "query": "samsung galaxy s23",
  "region": "us"
}
```

### Advanced Search with Filters

```json
{
  "query": "best gaming laptop under $1500",
  "region": "us",
  "sort_by": "relevance",
  "advanced_matching": true,
  "natural_language": true,
  "filters": {
    "min_rating": 4.0,
    "brands": ["Asus", "MSI", "Lenovo"],
    "free_shipping": true
  }
}
```

## Installation Requirements

The enhanced search functionality requires additional Python packages:
- sentence-transformers
- numpy
- scikit-learn
- difflib-sequences
- requests-cache
- cryptography

These are included in the updated requirements.txt file.

## Future Improvements

1. **Image-based Matching**: Use image similarity for product matching
2. **Historical Price Tracking**: Show price history and trends
3. **User Preferences**: Learn from user interactions to improve relevance
4. **More International Sites**: Add additional regional e-commerce platforms
5. **Market Basket Analysis**: Suggest complementary products 