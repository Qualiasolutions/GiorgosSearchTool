# Giorgos' Power Search Tool

A powerful product search tool that finds the best deals across multiple e-commerce websites worldwide. The tool uses Scraper API for web scraping capabilities and OpenAI API for intelligent processing of the scraped data.

## Features

- Global product search across major e-commerce websites
- Intelligent deal analysis using OpenAI
- Advanced filtering options (price range, ratings, etc.)
- Search history and favorites system
- Greek language support
- Clean, modern user interface
- Personalized welcome for Giorgos

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   └── services/
│   │       ├── __init__.py
│   │       └── search_service.py
│   ├── app.py
│   ├── requirements.txt
│   └── .env
└── frontend/
    └── src/
        ├── components/
        │   └── layout/
        │       └── AppLayout.tsx
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

## API Endpoints

- `POST /api/search`: Search for products
  - Parameters:
    - `query`: Search term
    - `region`: Region code (default: "global")
    - `max_price`: Maximum price filter (optional)
    - `min_price`: Minimum price filter (optional)
    - `sort_by`: Sorting method (default: "price_asc")
    - `page`: Page number (default: 1)
    - `limit`: Results per page (default: 20)

- `GET /api/regions`: Get available regions

## Language Support

The application supports both English and Greek languages. You can easily toggle between the two using the language selector in the top navigation bar.

The Greek translation is specially tailored for Giorgos with a personalized welcome message.

## Technologies Used

- **Backend**: Python, Flask, Requests, OpenAI API
- **Frontend**: React, TypeScript, Material UI, Axios
- **External APIs**: Scraper API, OpenAI API

## Future Enhancements

- Email notifications for price drops
- Product comparison feature
- More language options
- Mobile app version
- Browser extension

## License

MIT 