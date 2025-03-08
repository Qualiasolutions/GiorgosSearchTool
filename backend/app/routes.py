from flask import Blueprint, request, jsonify
from .services.search_service import search_products
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

main = Blueprint('main', __name__)

@main.route('/api/search', methods=['POST'])
def search():
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'error': 'Query parameter is required'}), 400
        
        query = data['query']
        region = data.get('region', 'global')
        max_price = data.get('max_price')
        min_price = data.get('min_price')
        sort_by = data.get('sort_by', 'relevance')
        page = data.get('page', 1)
        limit = data.get('limit', 20)
        
        # Advanced search parameters
        advanced_matching = data.get('advanced_matching', True)
        use_openai = data.get('use_openai', True)
        natural_language = data.get('natural_language', True)
        
        # Faceted search filters
        filters = data.get('filters', {})
        
        logger.info(f"Search request: {query} (region: {region}, sort: {sort_by})")
        
        results = search_products(
            query=query,
            region=region,
            max_price=max_price,
            min_price=min_price,
            sort_by=sort_by,
            page=page,
            limit=limit,
            advanced_matching=advanced_matching,
            use_openai=use_openai,
            natural_language=natural_language
        )
        
        # Apply post-search filters
        if filters and results['products']:
            filtered_products = apply_filters(results['products'], filters)
            # Update results with filtered products
            results['products'] = filtered_products
            results['total_results'] = len(filtered_products)
        
        return jsonify(results)
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return jsonify({'error': f'Failed to process search: {str(e)}'}), 500

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

@main.route('/api/stores', methods=['GET'])
def get_stores():
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
        return jsonify(stores)
    except Exception as e:
        logger.error(f"Get stores error: {str(e)}")
        return jsonify({'error': f'Failed to get stores: {str(e)}'}), 500 