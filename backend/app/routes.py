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
        sort_by = data.get('sort_by', 'price_asc')
        page = data.get('page', 1)
        limit = data.get('limit', 20)
        
        results = search_products(
            query=query,
            region=region,
            max_price=max_price,
            min_price=min_price,
            sort_by=sort_by,
            page=page,
            limit=limit
        )
        
        return jsonify(results)
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return jsonify({'error': f'Failed to process search: {str(e)}'}), 500

@main.route('/api/regions', methods=['GET'])
def get_regions():
    try:
        regions = [
            {'code': 'global', 'name': 'Global'},
            {'code': 'us', 'name': 'United States'},
            {'code': 'eu', 'name': 'Europe'},
            {'code': 'cn', 'name': 'China'},
            {'code': 'ar', 'name': 'Argentina'},
            {'code': 'in', 'name': 'India'},
            {'code': 'jp', 'name': 'Japan'},
            {'code': 'kr', 'name': 'South Korea'},
            {'code': 'br', 'name': 'Brazil'},
            {'code': 'ru', 'name': 'Russia'}
        ]
        return jsonify(regions)
    except Exception as e:
        logger.error(f"Get regions error: {str(e)}")
        return jsonify({'error': f'Failed to get regions: {str(e)}'}), 500 