# Giorgos' Power Search Tool

A powerful product search tool that finds the best deals across multiple e-commerce websites worldwide. The tool uses Scraper API for web scraping capabilities and OpenAI API for intelligent processing of the scraped data.

## Features

- **Enhanced Global Search**: Search across 15+ e-commerce sites worldwide
- **Advanced Product Matching**: Identifies identical products across different sites
- **Natural Language Processing**: Understands queries like "best laptop under $1000"
- **AI-Powered Analysis**: Uses OpenAI to enhance search results and provide insights
- **Faceted Search**: Filter by brand, category, price, rating, and more
- **Deal Detection**: Sophisticated algorithm identifies genuinely good deals
- **Multiple Region Support**: Optimized for international shopping
- **Advanced UI**: Modern, responsive interface with real-time filters
- **Search history and favorites system**
- **Greek language support**

## Enhanced E-commerce Site Coverage

- **Global Sites**: Amazon, eBay, Walmart, AliExpress
- **US-Specific**: Best Buy, Target, Newegg, B&H, Costco, Home Depot
- **International**: Otto.de (Germany), JD.com (China), Rakuten (Japan), Skroutz.gr (Greece), Kotsovolos.gr (Greece)

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── search_service.py
│   │       └── advanced_scraper.py
│   ├── app.py
│   ├── requirements.txt
│   ├── ENHANCED_SEARCH.md
│   └── .env
└── frontend/
    └── src/
        ├── components/
        │   ├── layout/
        │   │   └── AppLayout.tsx
        │   └── product/
        │       └── ProductCard.tsx
        ├── screens/
        │   ├── SearchPage.tsx
        │   ├── FavoritesPage.tsx
        │   └── HistoryPage.tsx
        ├── utils/
        │   ├── api.ts
        │   └── translations.ts
        ├── types.ts
        └── App.tsx
```

## Quick Start

The simplest way to get started is to use the provided batch file:

```
run.bat
```

This will install all dependencies and start both the backend and frontend servers.

## Manual Setup

### Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Configure environment variables:
   - Edit `.env` file and add your Scraper API and OpenAI API keys

6. Run the Flask server:
   ```
   python app.py
   ```

### Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Using the Enhanced Search Interface

1. **Basic Search**: Enter your query in the search box and click "Find Best Deals"
2. **Filtering Results**:
   - Click the filter icon to open the filter drawer
   - Filter by brand, category, store, rating, and shipping options
   - Use the price slider to set a price range
3. **Advanced Options**:
   - Click the settings icon to access advanced search options
   - Toggle product matching, AI analysis, and natural language processing
4. **Sort Options**: Use the sort dropdown to order results by relevance, price, rating, or discount
5. **Managing Results**:
   - Click the heart icon to save products to your favorites
   - Click the "View Deal" button to visit the product page
   - Use pagination to navigate through results

## API Endpoints

- `POST /api/search`: Search for products
  - Parameters:
    - `query`: Search term
    - `region`: Region code (default: "global")
    - `max_price`: Maximum price filter (optional)
    - `min_price`: Minimum price filter (optional)
    - `sort_by`: Sorting method (default: "relevance")
    - `page`: Page number (default: 1)
    - `limit`: Results per page (default: 20)
    - `advanced_matching`: Enable product matching (default: true)
    - `use_openai`: Use OpenAI for query processing (default: true)
    - `natural_language`: Process query as natural language (default: true)
    - `filters`: Object containing filter criteria (default: {})

- `GET /api/regions`: Get available regions
- `GET /api/stores`: Get available e-commerce stores

## Language Support

The application supports both English and Greek languages. You can easily toggle between the two using the language selector in the top navigation bar.

The Greek translation is specially tailored for Giorgos with a personalized welcome message.

## Technologies Used

- **Backend**: Python, Flask, BeautifulSoup, Sentence-Transformers, OpenAI API
- **Frontend**: React, TypeScript, Material UI, Axios
- **External APIs**: Scraper API, OpenAI API

## Technical Implementation Details

For detailed information about the enhanced search capabilities, see [ENHANCED_SEARCH.md](backend/ENHANCED_SEARCH.md).

## Future Enhancements

- Image-based product matching
- Historical price tracking
- User preference learning
- Additional international sites
- Mobile app with barcode scanning
- Browser extension for real-time price comparisons
- Email notifications for price drops

## Production Build

To build the application for production use:

1. Run the production build script:
   ```
   production_build.bat
   ```
   
   This will:
   - Build an optimized version of the React frontend
   - Set up the backend environment
   - Prepare everything for production use

2. After building, start the application in production mode:
   ```
   run_production.bat
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

The production build serves the React frontend directly from the Flask backend, so you only need to run one server.

## Deployment

To deploy the application to a web server:

1. Run `production_build.bat` to create the production build
2. Copy the entire project directory to your server
3. Configure your web server (Apache, Nginx) to proxy requests to the Flask application
4. Set up a WSGI server like Gunicorn or uWSGI to run the application:
   ```
   cd backend
   gunicorn wsgi:app
   ```

## Manual Production Setup

If you prefer to build manually:

1. Build the React frontend:
   ```
   cd frontend
   npm install
   npm run build
   ```

2. Set up the Flask backend to serve the frontend:
   ```
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```

## License

MIT 