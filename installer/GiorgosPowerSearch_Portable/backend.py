from flask import Flask, request, jsonify, send_from_directory
import os
import json

app = Flask(__name__)

@app.route('/api/search', methods=['POST'])
def search():
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        # This is a simplified demo version that returns dummy results
        dummy_products = [
            {
                "id": "1",
                "title": f"{query} - Sample Product 1",
                "price": 99.99,
                "currency": "USD",
                "url": "https://www.example.com/product1",
                "image": "https://via.placeholder.com/300",
                "site": "Amazon",
                "in_stock": True
            },
            {
                "id": "2",
                "title": f"{query} - Premium Product",
                "price": 199.99,
                "currency": "USD",
                "url": "https://www.example.com/product2",
                "image": "https://via.placeholder.com/300",
                "site": "eBay",
                "in_stock": True
            }
        ]
        
        return jsonify({
            "success": True,
            "query": query,
            "products": dummy_products,
            "total_results": len(dummy_products),
            "page": 1,
            "limit": 10
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "products": [],
            "total_results": 0
        }), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend')
    
    # If path is empty, serve index.html
    if path == '':
        return send_from_directory(frontend_dir, 'index.html')
    
    # Check if the file exists in frontend directory
    if os.path.exists(os.path.join(frontend_dir, path)):
        return send_from_directory(frontend_dir, path)
    
    # Default to index.html for client-side routing
    return send_from_directory(frontend_dir, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
