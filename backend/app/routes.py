from flask import Blueprint, request, jsonify, make_response
from .services.search_service import search_products
import logging
import traceback
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

main = Blueprint('main', __name__)

@main.route('/api/search', methods=['POST', 'OPTIONS'])
def search():
    """
    API route for searching products across multiple e-commerce platforms.
    
    Accepts:
        - query: Search query string
        - region: Region to search in (default: 'global')
        - sort: Sorting method (default: 'relevance')
        - page: Page number (default: 1)
        - limit: Results per page (default: 20)
        - min_price: Minimum price filter
        - max_price: Maximum price filter
        
    Returns:
        - JSON response with search results
    """
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'https://giorgospowersearch-web.onrender.com')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
        
    try:
        start_time = time.time()
        data = request.get_json()
        
        # Extract search parameters
        query = data.get('query', '')
        region = data.get('region', 'global')
        sort = data.get('sort', 'relevance')
        page = int(data.get('page', 1))
        limit = int(data.get('limit', 20))
        min_price = data.get('min_price')
        max_price = data.get('max_price')
        
        # Log search request
        logger.info(f"Search request: {query} (region: {region}, sort: {sort})")
        
        if not query:
            response = jsonify({
                'success': False,
                'error': 'Query is required',
                'products': [],
                'total_results': 0
            })
            response.headers.add('Access-Control-Allow-Origin', 'https://giorgospowersearch-web.onrender.com')
            return response, 400
            
        # Execute search with error handling
        results = search_products(
            query=query,
            region=region,
            sort_by=sort,
            page=page,
            limit=limit,
            min_price=min_price,
            max_price=max_price
        )
        
        # Check if the search had an error
        if 'error' in results:
            response_data = {
                'success': False,
                'error': results['error'],
                'products': results.get('products', []),
                'total_results': results.get('total_results', 0),
                'search_time': results.get('search_time', 0),
                'query': results.get('query', query),
            }
            response = jsonify(response_data)
            response.headers.add('Access-Control-Allow-Origin', 'https://giorgospowersearch-web.onrender.com')
            return response, 200
        
        # Create successful response
        response_data = {
            'success': True,
            'products': results.get('products', []),
            'total_results': results.get('total_results', 0),
            'page': page,
            'limit': limit,
            'search_time': results.get('search_time', round(time.time() - start_time, 2)),
            'query': results.get('query', query)
        }
        
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', 'https://giorgospowersearch-web.onrender.com')
        return response, 200
    except Exception as e:
        logger.error(f"Search API error: {str(e)}")
        logger.error(traceback.format_exc())
        response = jsonify({
            'success': False,
            'error': f"Search failed: {str(e)}",
            'products': [],
            'total_results': 0
        })
        response.headers.add('Access-Control-Allow-Origin', 'https://giorgospowersearch-web.onrender.com')
        return response, 500

def apply_filters(products, filters):
    """Apply filters to product results"""
    filtered = products
    
    # Brand filter
    if 'brands' in filters and filters['brands']:
        brands = [b.lower() for b in filters['brands']]
        filtered = [p for p in filtered if p.get('brand', '').lower() in brands]
    
    # Category filter
    if 'categories' in filters and filters['categories']:
        categories = [c.lower() for c in filters['categories']]
        filtered = [p for p in filtered if p.get('category', '').lower() in categories]
    
    # Price range filter
    if 'price_range' in filters:
        price_range = filters['price_range']
        if isinstance(price_range, dict):
            min_price = price_range.get('min')
            max_price = price_range.get('max')
            
            if min_price is not None:
                filtered = [p for p in filtered if p.get('price', 0) >= min_price]
            if max_price is not None:
                filtered = [p for p in filtered if p.get('price', 0) <= max_price]
    
    # Rating filter
    if 'min_rating' in filters and filters['min_rating'] is not None:
        min_rating = float(filters['min_rating'])
        filtered = [p for p in filtered if p.get('rating', 0) >= min_rating]
    
    # Source (site) filter
    if 'sources' in filters and filters['sources']:
        sources = [s.lower() for s in filters['sources']]
        filtered = [p for p in filtered if p.get('site', '').lower() in sources]
    
    # Free shipping filter
    if 'free_shipping' in filters and filters['free_shipping'] is True:
        filtered = [p for p in filtered if p.get('free_shipping', False)]
    
    # Deal score filter
    if 'min_deal_score' in filters and filters['min_deal_score'] is not None:
        min_score = float(filters['min_deal_score'])
        filtered = [p for p in filtered if p.get('deal_score', 0) >= min_score]
    
    return filtered

@main.route('/api/regions', methods=['GET'])
def get_regions():
    try:
        regions = [
            {'code': 'global', 'name': 'Global'},
            {'code': 'us', 'name': 'United States'},
            {'code': 'eu', 'name': 'Europe'},
            {'code': 'uk', 'name': 'United Kingdom'},
            {'code': 'de', 'name': 'Germany'},
            {'code': 'fr', 'name': 'France'},
            {'code': 'cn', 'name': 'China'},
            {'code': 'jp', 'name': 'Japan'},
            {'code': 'au', 'name': 'Australia'},
            {'code': 'ar', 'name': 'Argentina'},
            {'code': 'in', 'name': 'India'},
            {'code': 'kr', 'name': 'South Korea'},
            {'code': 'br', 'name': 'Brazil'},
            {'code': 'ru', 'name': 'Russia'},
            {'code': 'gr', 'name': 'Greece'}
        ]
        return jsonify(regions)
    except Exception as e:
        logger.error(f"Get regions error: {str(e)}")
        return jsonify({'error': f'Failed to get regions: {str(e)}'}), 500

@main.route('/api/stores', methods=['GET', 'OPTIONS'])
def get_stores():
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'https://giorgospowersearch-web.onrender.com')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response
        
    try:
        stores = [
            {'code': 'amazon', 'name': 'Amazon', 'regions': ['global', 'us', 'uk', 'de', 'fr', 'jp']},
            {'code': 'ebay', 'name': 'eBay', 'regions': ['global', 'us', 'uk', 'de']},
            {'code': 'walmart', 'name': 'Walmart', 'regions': ['us']},
            {'code': 'bestbuy', 'name': 'Best Buy', 'regions': ['us', 'ca']},
            {'code': 'target', 'name': 'Target', 'regions': ['us']},
            {'code': 'newegg', 'name': 'Newegg', 'regions': ['us', 'ca']},
            {'code': 'bh', 'name': 'B&H Photo', 'regions': ['us', 'global']},
            {'code': 'costco', 'name': 'Costco', 'regions': ['us', 'ca', 'uk']},
            {'code': 'homedepot', 'name': 'Home Depot', 'regions': ['us', 'ca']},
            {'code': 'aliexpress', 'name': 'AliExpress', 'regions': ['global']},
            {'code': 'rakuten', 'name': 'Rakuten', 'regions': ['jp']},
            {'code': 'otto', 'name': 'Otto', 'regions': ['de']},
            {'code': 'jd', 'name': 'JD.com', 'regions': ['cn']},
            {'code': 'skroutz', 'name': 'Skroutz', 'regions': ['gr']},
            {'code': 'kotsovolos', 'name': 'Kotsovolos', 'regions': ['gr']}
        ]
        response = jsonify(stores)
        response.headers.add('Access-Control-Allow-Origin', 'https://giorgospowersearch-web.onrender.com')
        return response
    except Exception as e:
        logger.error(f"Get stores error: {str(e)}")
        response = jsonify({'error': f'Failed to get stores: {str(e)}'})
        response.headers.add('Access-Control-Allow-Origin', 'https://giorgospowersearch-web.onrender.com')
        return response, 500

@main.route('/api/health', methods=['GET', 'OPTIONS'])
def health_check():
    """Simple health check endpoint"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'https://giorgospowersearch-web.onrender.com')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response
        
    response = jsonify({'status': 'healthy', 'message': 'API is running'})
    response.headers.add('Access-Control-Allow-Origin', 'https://giorgospowersearch-web.onrender.com')
    return response, 200 