import requests
import logging
import json
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, quote
from fake_useragent import UserAgent
from typing import Dict, List, Optional, Any, Tuple
import concurrent.futures
from functools import lru_cache
import time
import hashlib
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

@dataclass
class ScraperResult:
    """Standardized result from any parser"""
    products: List[Dict[str, Any]] = field(default_factory=list)
    success: bool = True
    error_message: Optional[str] = None
    total_products: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)

class AdvancedScraper:
    def __init__(self, api_key=None):
        self.api_key = api_key
        self.user_agent = UserAgent()
        self.session = requests.Session()
        self._parser_registry = {}
        
        # Register built-in parsers
        self.register_parser('amazon', self.parse_amazon)
        self.register_parser('ebay', self.parse_ebay)
        self.register_parser('walmart', self.parse_walmart)
        self.register_parser('aliexpress', self.parse_aliexpress)
        self.register_parser('bestbuy', self.parse_bestbuy)
        self.register_parser('target', self.parse_target)
        self.register_parser('newegg', self.parse_newegg)
        self.register_parser('bh', self.parse_bh)
        self.register_parser('costco', self.parse_costco)
        self.register_parser('homedepot', self.parse_homedepot)
        self.register_parser('otto', self.parse_otto)
        self.register_parser('jd', self.parse_jd)
        self.register_parser('rakuten', self.parse_rakuten)
        self.register_parser('skroutz', self.parse_skroutz)
        self.register_parser('kotsovolos', self.parse_kotsovolos)
    
    def register_parser(self, site_name, parser_function):
        """Register a parser function for a specific site"""
        self._parser_registry[site_name.lower()] = parser_function
        logger.info(f"Registered parser for {site_name}")
    
    def get_parser(self, site_name):
        """Get the parser function for a specific site"""
        site_key = site_name.lower().split('.')[0]  # Handle subdomains like amazon.de
        parser = self._parser_registry.get(site_key)
        if parser:
            return parser
        logger.warning(f"No specific parser found for {site_name}, using generic parser")
        return self.parse_generic
    
    def get_headers(self):
        """Generate random user agent headers to avoid detection"""
        return {
            'User-Agent': self.user_agent.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
    
    def scrape_with_api(self, url, country_code=None, render_js=True, retry_count=2, timeout=30, 
                      premium=False, session_id=None, device_type='desktop'):
        """
        Scrape a URL using Scraper API with advanced options
        
        Args:
            url: The target URL to scrape
            country_code: Country IP to use (e.g., 'us', 'gb', 'de')
            render_js: Whether to render JavaScript
            retry_count: Number of automatic retries
            timeout: Request timeout in seconds
            premium: Whether to use premium proxy features
            session_id: Session ID for maintaining the same IP
            device_type: Device type ('desktop', 'mobile', 'tablet')
            
        Returns:
            HTML content string or None if failed
        """
        if not self.api_key:
            logger.error("No Scraper API key provided")
            return None
            
        # Base Scraper API URL
        api_url = f"http://api.scraperapi.com?api_key={self.api_key}&url={url}"
        
        # Add additional options
        if country_code:
            api_url += f"&country_code={country_code}"
        if render_js:
            api_url += "&render=true"
        if premium:
            api_url += "&premium=true"
        if session_id:
            # Create a consistent session ID if needed
            if session_id is True:
                session_hash = hashlib.md5(url.encode()).hexdigest()[:10]
                api_url += f"&session_number={session_hash}"
            else:
                api_url += f"&session_number={session_id}"
        if device_type != 'desktop':
            api_url += f"&device_type={device_type}"
        
        # Add retry logic
        retry_attempts = 0
        max_retries = retry_count
        
        logger.info(f"Scraping via API: {url} (country: {country_code})")
        
        while retry_attempts <= max_retries:
            try:
                response = self.session.get(api_url, timeout=timeout)
                response.raise_for_status()
                
                # Check if we received an actual HTML response
                if response.text and ("<html" in response.text.lower() or "<!doctype html" in response.text.lower()):
                    return response.text
                else:
                    logger.warning(f"Received non-HTML response from API for {url}")
                    if retry_attempts < max_retries:
                        retry_attempts += 1
                        time.sleep(2 * retry_attempts)  # Exponential backoff
                        logger.info(f"Retrying {url} (attempt {retry_attempts}/{max_retries})")
                        continue
                    return None
                
            except requests.exceptions.RequestException as e:
                logger.error(f"Error scraping {url}: {str(e)}")
                if retry_attempts < max_retries:
                    retry_attempts += 1
                    time.sleep(2 * retry_attempts)  # Exponential backoff
                    logger.info(f"Retrying {url} (attempt {retry_attempts}/{max_retries})")
                    continue
                return None
        
        return None
    
    def scrape_direct(self, url):
        """Fallback: Attempt to scrape directly without API (not recommended for production)"""
        logger.warning(f"Attempting direct scrape (without API) of: {url}")
        try:
            response = self.session.get(url, headers=self.get_headers(), timeout=10)
            response.raise_for_status()
            return response.text
        except requests.exceptions.RequestException as e:
            logger.error(f"Error direct scraping {url}: {str(e)}")
            return None
    
    def scrape_multiple_sites(self, query, sites, region=None, min_price=None, max_price=None, 
                             max_workers=5, timeout=30):
        """
        Scrape multiple sites in parallel
        
        Args:
            query: Search query string
            sites: List of site names to search
            region: Region code for geolocation
            min_price: Minimum price filter
            max_price: Maximum price filter
            max_workers: Maximum number of parallel workers
            timeout: Timeout for each request in seconds
            
        Returns:
            Dict mapping site names to lists of product dictionaries
        """
        results = {}
        encoded_query = quote(query)
        
        # Map sites to country codes based on region or site-specific needs
        country_codes = self._get_country_codes_for_sites(sites, region)
        
        # Generate URLs for each site
        site_urls = self._generate_site_urls(sites, encoded_query, min_price, max_price)
        
        # Set up parallel execution
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_site = {}
            
            # Submit all scraping jobs
            for site, url in site_urls.items():
                country_code = country_codes.get(site)
                future = executor.submit(
                    self._scrape_and_parse_site, 
                    site, 
                    url, 
                    country_code,
                    timeout
                )
                future_to_site[future] = site
            
            # Process results as they complete
            for future in concurrent.futures.as_completed(future_to_site):
                site = future_to_site[future]
                try:
                    site_results = future.result()
                    if site_results and site_results.products:
                        results[site] = site_results.products
                        logger.info(f"Successfully scraped {len(site_results.products)} products from {site}")
                    else:
                        logger.warning(f"No products found or error for {site}")
                        results[site] = []
                except Exception as exc:
                    logger.error(f"{site} generated an exception: {exc}")
                    results[site] = []
        
        return results
    
    def _scrape_and_parse_site(self, site, url, country_code=None, timeout=30):
        """Helper method to scrape and parse a site in one operation"""
        try:
            html = self.scrape_with_api(url, country_code=country_code, timeout=timeout)
            if not html:
                return ScraperResult(success=False, error_message=f"Failed to retrieve HTML for {site}")
            
            parser = self.get_parser(site)
            if parser:
                products = parser(html)
                
                # Add site identifier to each product
                for product in products:
                    if 'site' not in product:
                        product['site'] = site
                
                return ScraperResult(products=products, total_products=len(products))
            return ScraperResult(success=False, error_message=f"No parser available for {site}")
        except Exception as e:
            logger.error(f"Error in _scrape_and_parse_site for {site}: {str(e)}")
            return ScraperResult(success=False, error_message=str(e))
    
    def _get_country_codes_for_sites(self, sites, region=None):
        """Map sites to appropriate country codes based on site and region"""
        country_codes = {}
        
        region_map = {
            'us': 'us',
            'uk': 'gb',
            'gb': 'gb',
            'de': 'de',
            'fr': 'fr',
            'it': 'it',
            'es': 'es',
            'jp': 'jp',
            'ca': 'ca',
            'in': 'in',
            'br': 'br',
            'au': 'au',
            'ru': 'ru',
            'gr': 'gr',
            'cn': 'cn'
        }
        
        # Default region code
        default_code = region_map.get(region, 'us')
        
        for site in sites:
            site_lower = site.lower()
            
            # Handle special cases and international sites
            if 'amazon' in site_lower:
                if '.co.uk' in site_lower:
                    country_codes[site] = 'gb'
                elif '.de' in site_lower:
                    country_codes[site] = 'de'
                elif '.fr' in site_lower:
                    country_codes[site] = 'fr'
                elif '.it' in site_lower:
                    country_codes[site] = 'it'
                elif '.es' in site_lower:
                    country_codes[site] = 'es'
                elif '.co.jp' in site_lower:
                    country_codes[site] = 'jp'
                elif '.ca' in site_lower:
                    country_codes[site] = 'ca'
                elif '.in' in site_lower:
                    country_codes[site] = 'in'
                elif '.com.br' in site_lower:
                    country_codes[site] = 'br'
                elif '.com.au' in site_lower:
                    country_codes[site] = 'au'
                else:
                    country_codes[site] = default_code
            elif 'ebay' in site_lower:
                if '.co.uk' in site_lower:
                    country_codes[site] = 'gb'
                elif '.de' in site_lower:
                    country_codes[site] = 'de'
                elif '.fr' in site_lower:
                    country_codes[site] = 'fr'
                elif '.it' in site_lower:
                    country_codes[site] = 'it'
                else:
                    country_codes[site] = default_code
            elif site_lower in ['bestbuy', 'target', 'walmart', 'homedepot', 'costco', 'newegg', 'bh']:
                country_codes[site] = 'us'
            elif site_lower in ['skroutz', 'kotsovolos', 'public.gr']:
                country_codes[site] = 'gr'
            elif site_lower == 'otto':
                country_codes[site] = 'de'
            elif site_lower == 'rakuten':
                country_codes[site] = 'jp'
            elif site_lower == 'jd':
                country_codes[site] = 'cn'
            elif site_lower == 'aliexpress':
                # AliExpress shows different results based on location
                country_codes[site] = default_code
            else:
                country_codes[site] = default_code
                
        return country_codes
    
    def _generate_site_urls(self, sites, encoded_query, min_price=None, max_price=None, page=1):
        """Generate search URLs for each site"""
        urls = {}
        
        for site in sites:
            site_lower = site.lower()
            base_url = f"https://www.{site_lower}.com"
            
            # Handle special domains
            if '.' in site_lower:
                base_url = f"https://www.{site_lower}"
            
            # Generate site-specific URLs
            if 'amazon' in site_lower:
                url = f"{base_url}/s?k={encoded_query}&page={page}"
                if min_price and max_price:
                    url += f"&rh=p_36%3A{int(min_price)}00-{int(max_price)}00"
            elif 'ebay' in site_lower:
                url = f"{base_url}/sch/i.html?_nkw={encoded_query}&_pgn={page}"
                if min_price and max_price:
                    url += f"&_udlo={min_price}&_udhi={max_price}"
            elif site_lower == 'walmart':
                url = f"{base_url}/search?q={encoded_query}&page={page}"
                if min_price and max_price:
                    url += f"&min_price={min_price}&max_price={max_price}"
            elif site_lower == 'aliexpress':
                url = f"https://www.aliexpress.com/wholesale?SearchText={encoded_query}&page={page}"
                if min_price and max_price:
                    url += f"&minPrice={min_price}&maxPrice={max_price}"
            elif site_lower == 'bestbuy':
                url = f"{base_url}/site/searchpage.jsp?st={encoded_query}&cp={page}"
                if min_price and max_price:
                    url += f"&sp=-currentprice%20skuidsaas&seeAll=&qp=currentprice_facet%3DPrice~{min_price}%20to%20{max_price}"
            elif site_lower == 'target':
                url = f"{base_url}/s?searchTerm={encoded_query}&pageNumber={page}"
                if min_price and max_price:
                    url += f"&minPrice={min_price}&maxPrice={max_price}"
            elif site_lower == 'newegg':
                url = f"{base_url}/p/pl?d={encoded_query}&Page={page}"
                if min_price and max_price:
                    url += f"&N=4131&LeftPriceRange={min_price}+{max_price}"
            elif site_lower == 'bh' or site_lower == 'bhphotovideo':
                site_lower = 'bhphotovideo'
                url = f"https://www.{site_lower}.com/c/search?q={encoded_query}&page={page}"
                if min_price and max_price:
                    url += f"&price={min_price}-{max_price}"
            elif site_lower == 'costco':
                url = f"{base_url}/CatalogSearch?dept=All&keyword={encoded_query}&pageSize=24&page={page}"
                # Costco doesn't support price filtering in URL
            elif site_lower == 'homedepot':
                url = f"{base_url}/s/{encoded_query}/page/{page}"
                if min_price and max_price:
                    url += f"?price={min_price}-{max_price}"
            elif site_lower == 'otto':
                url = f"{base_url}/suche/{encoded_query}/?page={page}"
                if min_price and max_price:
                    url += f"&pricemin={min_price}&pricemax={max_price}"
            elif site_lower == 'jd':
                url = f"https://search.jd.com/Search?keyword={encoded_query}&page={2*page-1}"
                # JD.com doesn't support price filtering in URL
            elif site_lower == 'rakuten':
                url = f"https://search.rakuten.co.jp/search/mall/{encoded_query}/?p={page}"
                if min_price and max_price:
                    url += f"&min={min_price}&max={max_price}"
            elif site_lower == 'skroutz':
                url = f"https://www.skroutz.gr/search?keyphrase={encoded_query}&page={page}"
                if min_price and max_price:
                    url += f"&price_min={min_price}&price_max={max_price}"
            elif site_lower == 'kotsovolos':
                url = f"https://www.kotsovolos.gr/SearchDisplay?searchTerm={encoded_query}&pageNumber={page}"
                # Kotsovolos doesn't support price filtering in URL
            else:
                # Generic URL format for other sites
                url = f"{base_url}/search?q={encoded_query}"
            
            urls[site] = url
            
        return urls
    
    def parse_by_site(self, html, site):
        """Parse HTML content based on site name"""
        parser = self.get_parser(site)
        return parser(html)
    
    def parse_amazon(self, html):
        """Parse Amazon product listings"""
        products = []
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Find all product containers
            results = soup.select('div[data-component-type="s-search-result"]')
            logger.info(f"Found {len(results)} Amazon products")
            
            for item in results:
                try:
                    # Extract core product data
                    asin = item.get('data-asin', '')
                    
                    # Title
                    title_element = item.select_one('h2 a span')
                    title = title_element.text.strip() if title_element else "Unknown Product"
                    
                    # URL
                    link_element = item.select_one('h2 a')
                    url = "https://www.amazon.com" + link_element.get('href', '') if link_element else ""
                    
                    # Image
                    img_element = item.select_one('img.s-image')
                    img_url = img_element.get('src', '') if img_element else ""
                    
                    # Prices
                    price_element = item.select_one('.a-price .a-offscreen')
                    price_text = price_element.text.strip() if price_element else ""
                    price = float(re.sub(r'[^\d.]', '', price_text)) if price_text and re.search(r'\d', price_text) else 0
                    
                    original_price_element = item.select_one('.a-price.a-text-price .a-offscreen')
                    original_price_text = original_price_element.text.strip() if original_price_element else ""
                    original_price = float(re.sub(r'[^\d.]', '', original_price_text)) if original_price_text and re.search(r'\d', original_price_text) else None
                    
                    # Ratings
                    rating_element = item.select_one('i.a-icon-star-small')
                    rating_text = rating_element.text.strip() if rating_element else ""
                    rating = float(rating_text.split(' ')[0]) if rating_text and ' ' in rating_text else None
                    
                    review_count_element = item.select_one('span.a-size-base.s-underline-text')
                    review_count_text = review_count_element.text.strip() if review_count_element else ""
                    review_count = int(re.sub(r'[^\d]', '', review_count_text)) if review_count_text and re.search(r'\d', review_count_text) else 0
                    
                    # Prime/Free shipping
                    prime_element = item.select_one('i.a-icon-prime')
                    free_shipping = True if prime_element else False
                    
                    # Calculate discount
                    discount_percentage = None
                    if original_price and price and original_price > price:
                        discount_percentage = round(((original_price - price) / original_price) * 100, 1)
                    
                    product = {
                        'id': f"amazon_{asin}",
                        'title': title,
                        'url': url,
                        'image': img_url,
                        'price': price,
                        'currency': 'USD',  # Default, could be extracted from page
                        'original_price': original_price,
                        'discount_percentage': discount_percentage,
                        'rating': rating,
                        'review_count': review_count,
                        'free_shipping': free_shipping,
                        'site': 'amazon',
                        'in_stock': price > 0,
                        'seller': 'Amazon' if free_shipping else None
                    }
                    
                    products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing Amazon product: {str(e)}")
                    continue
            
        except Exception as e:
            logger.error(f"Error parsing Amazon page: {str(e)}")
            
        return products
    
    def parse_ebay(self, html):
        """Parse eBay product listings"""
        products = []
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Find all product items
            results = soup.select('li.s-item')
            logger.info(f"Found {len(results)} eBay products")
            
            for item in results:
                try:
                    # Skip "More items like this" header
                    if item.select_one('.s-item__title--tagblock'):
                        continue
                    
                    # Title
                    title_element = item.select_one('.s-item__title')
                    title = title_element.text.strip() if title_element else "Unknown Product"
                    
                    # Skip "Shop on eBay" items
                    if title == 'Shop on eBay':
                        continue
                    
                    # ID - extract from data attribute or URL
                    link_element = item.select_one('a.s-item__link')
                    url = link_element.get('href', '') if link_element else ""
                    item_id = url.split('itm/')[1].split('?')[0] if 'itm/' in url else ""
                    
                    # Image
                    img_element = item.select_one('.s-item__image-img')
                    img_url = img_element.get('src', '') if img_element else ""
                    
                    # Prices
                    price_element = item.select_one('.s-item__price')
                    price_text = price_element.text.strip() if price_element else ""
                    
                    # Handle price ranges like "$10.99 to $24.99"
                    if ' to ' in price_text:
                        price_text = price_text.split(' to ')[0]
                    
                    try:
                        price = float(re.sub(r'[^\d.]', '', price_text))
                    except ValueError:
                        price = 0
                    
                    # Original/strike price
                    original_price_element = item.select_one('.s-item__price--strike')
                    original_price_text = original_price_element.text.strip() if original_price_element else ""
                    original_price = float(re.sub(r'[^\d.]', '', original_price_text)) if original_price_text and re.search(r'\d', original_price_text) else None
                    
                    # Shipping
                    shipping_element = item.select_one('.s-item__shipping')
                    shipping_text = shipping_element.text.strip() if shipping_element else ""
                    free_shipping = 'Free' in shipping_text if shipping_text else False
                    
                    # Ratings
                    rating_element = item.select_one('.x-star-rating')
                    rating = None
                    if rating_element:
                        rating_match = re.search(r'(\d+(\.\d+)?)', rating_element.text)
                        rating = float(rating_match.group(1)) if rating_match else None
                    
                    # Calculate discount
                    discount_percentage = None
                    if original_price and price and original_price > price:
                        discount_percentage = round(((original_price - price) / original_price) * 100, 1)
                    
                    product = {
                        'id': f"ebay_{item_id}",
                        'title': title,
                        'url': url,
                        'image': img_url,
                        'price': price,
                        'currency': 'USD',  # Default, could be extracted from page
                        'original_price': original_price,
                        'discount_percentage': discount_percentage,
                        'rating': rating,
                        'review_count': None,  # eBay doesn't show review counts in search
                        'free_shipping': free_shipping,
                        'site': 'ebay',
                        'in_stock': True  # Assume in stock, eBay usually doesn't show out of stock items
                    }
                    
                    products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing eBay product: {str(e)}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error parsing eBay page: {str(e)}")
            
        return products
    
    def parse_walmart(self, html):
        """Parse Walmart product listings"""
        products = []
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Find all product items
            results = soup.select('div[data-item-id]')
            logger.info(f"Found {len(results)} Walmart products")
            
            for item in results:
                try:
                    # ID
                    item_id = item.get('data-item-id', '')
                    
                    # Title
                    title_element = item.select_one('[data-automation-id="product-title"]')
                    title = title_element.text.strip() if title_element else "Unknown Product"
                    
                    # URL
                    link_element = item.select_one('a[link-identifier="linkText"]')
                    path = link_element.get('href', '') if link_element else ""
                    url = urljoin('https://www.walmart.com', path)
                    
                    # Image
                    img_element = item.select_one('img[data-automation-id="image"]')
                    img_url = img_element.get('src', '') if img_element else ""
                    
                    # Price
                    price_element = item.select_one('[data-automation-id="product-price"]')
                    price_text = price_element.text.strip() if price_element else ""
                    price = float(re.sub(r'[^\d.]', '', price_text)) if price_text and re.search(r'\d', price_text) else 0
                    
                    # Original price
                    original_price_element = item.select_one('[data-automation-id="product-was-price"]')
                    original_price_text = original_price_element.text.strip() if original_price_element else ""
                    original_price = float(re.sub(r'[^\d.]', '', original_price_text)) if original_price_text and re.search(r'\d', original_price_text) else None
                    
                    # Shipping and fulfillment
                    shipping_element = item.select_one('[data-automation-id="fulfillment-shipping"]')
                    shipping_text = shipping_element.text.strip() if shipping_element else ""
                    free_shipping = 'free' in shipping_text.lower() if shipping_text else False
                    
                    # Ratings
                    rating_element = item.select_one('[data-automation-id="product-stars"]')
                    rating_text = rating_element.get('aria-label', '') if rating_element else ""
                    rating_match = re.search(r'(\d+(\.\d+)?)', rating_text)
                    rating = float(rating_match.group(1)) if rating_match else None
                    
                    # Review count
                    review_element = item.select_one('[data-automation-id="product-review-count"]')
                    review_text = review_element.text.strip() if review_element else ""
                    review_count = int(re.sub(r'[^\d]', '', review_text)) if review_text and re.search(r'\d', review_text) else None
                    
                    # Calculate discount
                    discount_percentage = None
                    if original_price and price and original_price > price:
                        discount_percentage = round(((original_price - price) / original_price) * 100, 1)
                    
                    product = {
                        'id': f"walmart_{item_id}",
                        'title': title,
                        'url': url,
                        'image': img_url,
                        'price': price,
                        'currency': 'USD',
                        'original_price': original_price,
                        'discount_percentage': discount_percentage,
                        'rating': rating,
                        'review_count': review_count,
                        'free_shipping': free_shipping,
                        'site': 'walmart',
                        'in_stock': True
                    }
                    
                    products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing Walmart product: {str(e)}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error parsing Walmart page: {str(e)}")
            
        return products
    
    def parse_bestbuy(self, html):
        """Parse BestBuy product listings"""
        products = []
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Find all product containers
            results = soup.select('li.sku-item') or soup.select('.list-item')
            logger.info(f"Found {len(results)} BestBuy products")
            
            for item in results:
                try:
                    # Extract product data
                    
                    # SKU/ID
                    sku = item.get('data-sku-id') or item.get('data-sku') or ""
                    
                    # Title
                    title_element = item.select_one('h4.sku-title a') or item.select_one('h4.sku-header a') or item.select_one('.sku-title')
                    title = title_element.get_text().strip() if title_element else "Unknown Product"
                    
                    # URL
                    url = ""
                    if title_element and title_element.name == 'a':
                        url = title_element.get('href', '')
                    else:
                        link_element = item.select_one('a.image-link') or item.select_one('a.sku-link')
                        if link_element:
                            url = link_element.get('href', '')
                    
                    # Make URL absolute if relative
                    if url and not url.startswith('http'):
                        url = f"https://www.bestbuy.com{url}"
                    
                    # Image
                    img_element = item.select_one('.product-image img') or item.select_one('img.product-image')
                    img_url = img_element.get('src') if img_element else ""
                    if not img_url and img_element:
                        img_url = img_element.get('data-src', '')
                    
                    # Prices
                    price_element = item.select_one('.priceView-customer-price span') or item.select_one('.pricing-price .priceView-purchase-price')
                    price = 0
                    
                    if price_element:
                        price_text = price_element.get_text().strip()
                        price_match = re.search(r'(\d+\.\d+|\d+)', price_text)
                        if price_match:
                            price = float(price_match.group(1))
                    
                    # Original price
                    original_price_element = item.select_one('.pricing-price .priceView-was-price') or item.select_one('.price-was')
                    original_price = None
                    
                    if original_price_element:
                        original_price_text = original_price_element.get_text().strip()
                        original_price_match = re.search(r'(\d+\.\d+|\d+)', original_price_text)
                        if original_price_match:
                            original_price = float(original_price_match.group(1))
                    
                    # Calculate discount
                    discount_percentage = None
                    if original_price and price and original_price > price:
                        discount_percentage = round(((original_price - price) / original_price) * 100, 1)
                    
                    # Rating - BestBuy uses a 5-star rating system
                    rating_element = item.select_one('.c-reviews') or item.select_one('.customer-rating')
                    rating = None
                    review_count = 0
                    
                    if rating_element:
                        # Rating value
                        rating_value = rating_element.get('aria-label') or rating_element.get_text()
                        if rating_value:
                            rating_match = re.search(r'(\d+(\.\d+)?)', rating_value)
                            rating = float(rating_match.group(1)) if rating_match else None
                        
                        # Review count
                        review_count_element = rating_element.select_one('.c-reviews-v4 .c-reviews-v4_count') or item.select_one('.rating-count')
                        if review_count_element:
                            review_text = review_count_element.get_text().strip()
                            review_match = re.search(r'(\d+)', review_text)
                            review_count = int(review_match.group(1)) if review_match else 0
                    
                    # Available for pickup/shipping
                    pickup_available = False
                    shipping_available = False
                    
                    pickup_element = item.select_one('.fulfillment-fulfillment-message')
                    if pickup_element:
                        pickup_text = pickup_element.get_text().lower()
                        pickup_available = 'pickup' in pickup_text and 'not' not in pickup_text
                        shipping_available = 'shipping' in pickup_text and 'not' not in pickup_text
                    
                    product = {
                        'id': f"bestbuy_{sku}" if sku else f"bestbuy_{hashlib.md5(title.encode()).hexdigest()[:10]}",
                        'title': title,
                        'url': url,
                        'image': img_url,
                        'price': price,
                        'currency': 'USD',
                        'original_price': original_price,
                        'discount_percentage': discount_percentage,
                        'rating': rating,
                        'review_count': review_count,
                        'free_shipping': shipping_available,
                        'site': 'bestbuy',
                        'in_stock': price > 0,
                        'metadata': {
                            'pickup_available': pickup_available,
                            'sku': sku
                        }
                    }
                    
                    products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing BestBuy product: {str(e)}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error parsing BestBuy page: {str(e)}")
            
        return products
    
    def parse_target(self, html):
        """Parse Target product listings"""
        products = []
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Find all product containers
            results = soup.select('[data-test="product-list-item"]') or soup.select('.styles__StyledCol-sc-fw90uk-0')
            logger.info(f"Found {len(results)} Target products")
            
            for item in results:
                try:
                    # Extract product data
                    
                    # Extract TCIN (Target's product ID)
                    tcin = ""
                    tcin_element = item.select_one('[data-test="product-card"]')
                    if tcin_element:
                        tcin = tcin_element.get('data-tcin', '')
                    
                    # Title
                    title_element = item.select_one('[data-test="product-title"]') or item.select_one('.Heading__StyledHeading-sc-1mp23s9-0')
                    title = title_element.get_text().strip() if title_element else "Unknown Product"
                    
                    # URL
                    url = ""
                    link_element = item.select_one('a[href*="/p/"]')
                    if link_element:
                        url = link_element.get('href', '')
                        # Make URL absolute if relative
                        if url and url.startswith('/'):
                            url = f"https://www.target.com{url}"
                    
                    # Image
                    img_element = item.select_one('[data-test="product-image"] img') or item.select_one('img')
                    img_url = ""
                    if img_element:
                        img_url = img_element.get('src') or img_element.get('srcset', '').split(' ')[0]
                    
                    # Price
                    price_element = item.select_one('[data-test="product-price"]') or item.select_one('.styles__PriceFontSize-sc-x06r9i-0')
                    price = 0
                    
                    if price_element:
                        price_text = price_element.get_text().strip()
                        # Handle price ranges like "$10.99 - $24.99"
                        if ' - ' in price_text:
                            price_text = price_text.split(' - ')[0]
                        
                        price_match = re.search(r'(\d+\.\d+|\d+)', price_text)
                        if price_match:
                            price = float(price_match.group(1))
                    
                    # Original/sale price
                    original_price = None
                    sale_element = item.select_one('[data-test="product-price-was"]') or item.select_one('.h-text-strikethrough')
                    
                    if sale_element:
                        original_price_text = sale_element.get_text().strip()
                        original_price_match = re.search(r'(\d+\.\d+|\d+)', original_price_text)
                        if original_price_match:
                            original_price = float(original_price_match.group(1))
                    
                    # Calculate discount
                    discount_percentage = None
                    if original_price and price and original_price > price:
                        discount_percentage = round(((original_price - price) / original_price) * 100, 1)
                    
                    # Rating
                    rating = None
                    review_count = 0
                    
                    rating_element = item.select_one('[data-test="ratings"]') or item.select_one('.RatingsReviewsAggregate')
                    if rating_element:
                        # Extract rating
                        rating_text = rating_element.get_text().strip()
                        rating_match = re.search(r'(\d+(\.\d+)?)', rating_text)
                        if rating_match:
                            rating = float(rating_match.group(1))
                        
                        # Extract review count
                        review_match = re.search(r'\((\d+)\)', rating_text)
                        if review_match:
                            review_count = int(review_match.group(1))
                    
                    # Shipping/delivery options
                    shipping_element = item.select_one('[data-test="product-shipping"]') or item.select_one('.h-text-green')
                    free_shipping = False
                    if shipping_element:
                        shipping_text = shipping_element.get_text().lower()
                        free_shipping = 'free shipping' in shipping_text
                    
                    # Availability (pickup/delivery)
                    pickup_available = False
                    delivery_available = False
                    
                    availability_elements = item.select('[data-test="product-fulfillment"]') or item.select('.styles__StyledAvailabilityMessage-sc-1c8asc4-0')
                    for avail_elem in availability_elements:
                        avail_text = avail_elem.get_text().lower()
                        if 'pick up' in avail_text or 'pickup' in avail_text:
                            pickup_available = 'not' not in avail_text
                        if 'delivery' in avail_text or 'ship' in avail_text:
                            delivery_available = 'not' not in avail_text
                    
                    product = {
                        'id': f"target_{tcin}" if tcin else f"target_{hashlib.md5(title.encode()).hexdigest()[:10]}",
                        'title': title,
                        'url': url,
                        'image': img_url,
                        'price': price,
                        'currency': 'USD',
                        'original_price': original_price,
                        'discount_percentage': discount_percentage,
                        'rating': rating,
                        'review_count': review_count,
                        'free_shipping': free_shipping,
                        'site': 'target',
                        'in_stock': price > 0,
                        'metadata': {
                            'pickup_available': pickup_available,
                            'delivery_available': delivery_available,
                            'tcin': tcin
                        }
                    }
                    
                    products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing Target product: {str(e)}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error parsing Target page: {str(e)}")
            
        return products
    
    def parse_newegg(self, html):
        """Parse Newegg product listings"""
        products = []
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Find all product containers
            results = soup.select('div.item-container')
            logger.info(f"Found {len(results)} Newegg products")
            
            for item in results:
                try:
                    # Extract core product data
                    asin = item.get('data-sku', '')
                    
                    # Title
                    title_element = item.select_one('a.item-title')
                    title = title_element.text.strip() if title_element else "Unknown Product"
                    
                    # URL
                    link_element = item.select_one('a.item-title')
                    url = link_element.get('href', '') if link_element else ""
                    
                    # Image
                    img_element = item.select_one('img.item-image')
                    img_url = img_element.get('src', '') if img_element else ""
                    
                    # Prices
                    price_element = item.select_one('.price-current')
                    price_text = price_element.text.strip() if price_element else ""
                    price = float(re.sub(r'[^\d.]', '', price_text)) if price_text and re.search(r'\d', price_text) else 0
                    
                    # Original price
                    original_price_element = item.select_one('.price-was')
                    original_price_text = original_price_element.text.strip() if original_price_element else ""
                    original_price = float(re.sub(r'[^\d.]', '', original_price_text)) if original_price_text and re.search(r'\d', original_price_text) else None
                    
                    # Ratings
                    rating_element = item.select_one('.item-rating')
                    rating_text = rating_element.text.strip() if rating_element else ""
                    rating = float(rating_text.split(' ')[0]) if rating_text and ' ' in rating_text else None
                    
                    # Review count
                    review_count_element = item.select_one('.item-reviews')
                    review_count_text = review_count_element.text.strip() if review_count_element else ""
                    review_count = int(re.sub(r'[^\d]', '', review_count_text)) if review_count_text and re.search(r'\d', review_count_text) else None
                    
                    # Prime/Free shipping
                    prime_element = item.select_one('.item-badge')
                    free_shipping = True if prime_element else False
                    
                    # Calculate discount
                    discount_percentage = None
                    if original_price and price and original_price > price:
                        discount_percentage = round(((original_price - price) / original_price) * 100, 1)
                    
                    product = {
                        'id': f"newegg_{asin}",
                        'title': title,
                        'url': url,
                        'image': img_url,
                        'price': price,
                        'currency': 'USD',  # Default, could be extracted from page
                        'original_price': original_price,
                        'discount_percentage': discount_percentage,
                        'rating': rating,
                        'review_count': review_count,
                        'free_shipping': free_shipping,
                        'site': 'newegg',
                        'in_stock': price > 0,
                        'seller': 'Newegg' if free_shipping else None
                    }
                    
                    products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing Newegg product: {str(e)}")
                    continue
            
        except Exception as e:
            logger.error(f"Error parsing Newegg page: {str(e)}")
            
        return products
    
    def parse_bh(self, html):
        """Parse BH product listings"""
        products = []
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Find all product containers
            results = soup.select('div.product-item')
            logger.info(f"Found {len(results)} BH products")
            
            for item in results:
                try:
                    # Extract core product data
                    asin = item.get('data-sku', '')
                    
                    # Title
                    title_element = item.select_one('h2.product-title')
                    title = title_element.text.strip() if title_element else "Unknown Product"
                    
                    # URL
                    link_element = item.select_one('a.product-title')
                    url = link_element.get('href', '') if link_element else ""
                    
                    # Image
                    img_element = item.select_one('img.item-image')
                    img_url = img_element.get('src', '') if img_element else ""
                    
                    # Prices
                    price_element = item.select_one('.price-current')
                    price_text = price_element.text.strip() if price_element else ""
                    price = float(re.sub(r'[^\d.]', '', price_text)) if price_text and re.search(r'\d', price_text) else 0
                    
                    # Original price
                    original_price_element = item.select_one('.original-price')
                    original_price_text = original_price_element.text.strip() if original_price_element else ""
                    original_price = float(re.sub(r'[^\d.]', '', original_price_text)) if original_price_text and re.search(r'\d', original_price_text) else None
                    
                    # Ratings
                    rating_element = item.select_one('.item-rating')
                    rating_text = rating_element.text.strip() if rating_element else ""
                    rating = float(rating_text.split(' ')[0]) if rating_text and ' ' in rating_text else None
                    
                    # Review count
                    review_count_element = item.select_one('.item-reviews')
                    review_count_text = review_count_element.text.strip() if review_count_element else ""
                    review_count = int(re.sub(r'[^\d]', '', review_count_text)) if review_count_text and re.search(r'\d', review_count_text) else None
                    
                    # Prime/Free shipping
                    prime_element = item.select_one('.item-badge')
                    free_shipping = True if prime_element else False
                    
                    # Calculate discount
                    discount_percentage = None
                    if original_price and price and original_price > price:
                        discount_percentage = round(((original_price - price) / original_price) * 100, 1)
                    
                    product = {
                        'id': f"bh_{asin}",
                        'title': title,
                        'url': url,
                        'image': img_url,
                        'price': price,
                        'currency': 'USD',  # Default, could be extracted from page
                        'original_price': original_price,
                        'discount_percentage': discount_percentage,
                        'rating': rating,
                        'review_count': review_count,
                        'free_shipping': free_shipping,
                        'site': 'bh',
                        'in_stock': price > 0,
                        'seller': 'BH' if free_shipping else None
                    }
                    
                    products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing BH product: {str(e)}")
                    continue
            
        except Exception as e:
            logger.error(f"Error parsing BH page: {str(e)}")
            
        return products
    
    def parse_costco(self, html):
        """Parse Costco product listings"""
        products = []
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Find all product containers
            results = soup.select('div.product-item')
            logger.info(f"Found {len(results)} Costco products")
            
            for item in results:
                try:
                    # Extract core product data
                    asin = item.get('data-sku', '')
                    
                    # Title
                    title_element = item.select_one('h2.product-title')
                    title = title_element.text.strip() if title_element else "Unknown Product"
                    
                    # URL
                    link_element = item.select_one('a.product-title')
                    url = link_element.get('href', '') if link_element else ""
                    
                    # Image
                    img_element = item.select_one('img.item-image')
                    img_url = img_element.get('src', '') if img_element else ""
                    
                    # Prices
                    price_element = item.select_one('.price-current')
                    price_text = price_element.text.strip() if price_element else ""
                    price = float(re.sub(r'[^\d.]', '', price_text)) if price_text and re.search(r'\d', price_text) else 0
                    
                    # Original price
                    original_price_element = item.select_one('.original-price')
                    original_price_text = original_price_element.text.strip() if original_price_element else ""
                    original_price = float(re.sub(r'[^\d.]', '', original_price_text)) if original_price_text and re.search(r'\d', original_price_text) else None
                    
                    # Ratings
                    rating_element = item.select_one('.item-rating')
                    rating_text = rating_element.text.strip() if rating_element else ""
                    rating = float(rating_text.split(' ')[0]) if rating_text and ' ' in rating_text else None
                    
                    # Review count
                    review_count_element = item.select_one('.item-reviews')
                    review_count_text = review_count_element.text.strip() if review_count_element else ""
                    review_count = int(re.sub(r'[^\d]', '', review_count_text)) if review_count_text and re.search(r'\d', review_count_text) else None
                    
                    # Prime/Free shipping
                    prime_element = item.select_one('.item-badge')
                    free_shipping = True if prime_element else False
                    
                    # Calculate discount
                    discount_percentage = None
                    if original_price and price and original_price > price:
                        discount_percentage = round(((original_price - price) / original_price) * 100, 1)
                    
                    product = {
                        'id': f"costco_{asin}",
                        'title': title,
                        'url': url,
                        'image': img_url,
                        'price': price,
                        'currency': 'USD',  # Default, could be extracted from page
                        'original_price': original_price,
                        'discount_percentage': discount_percentage,
                        'rating': rating,
                        'review_count': review_count,
                        'free_shipping': free_shipping,
                        'site': 'costco',
                        'in_stock': price > 0,
                        'seller': 'Costco' if free_shipping else None
                    }
                    
                    products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing Costco product: {str(e)}")
                    continue
            
        except Exception as e:
            logger.error(f"Error parsing Costco page: {str(e)}")
            
        return products
    
    def parse_homedepot(self, html):
        """Parse Home Depot product listings"""
        products = []
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Find all product containers
            results = soup.select('div.product-item')
            logger.info(f"Found {len(results)} Home Depot products")
            
            for item in results:
                try:
                    # Extract core product data
                    asin = item.get('data-sku', '')
                    
                    # Title
                    title_element = item.select_one('h2.product-title')
                    title = title_element.text.strip() if title_element else "Unknown Product"
                    
                    # URL
                    link_element = item.select_one('a.product-title')
                    url = link_element.get('href', '') if link_element else ""
                    
                    # Image
                    img_element = item.select_one('img.item-image')
                    img_url = img_element.get('src', '') if img_element else ""
                    
                    # Prices
                    price_element = item.select_one('.price-current')
                    price_text = price_element.text.strip() if price_element else ""
                    price = float(re.sub(r'[^\d.]', '', price_text)) if price_text and re.search(r'\d', price_text) else 0
                    
                    # Original price
                    original_price_element = item.select_one('.original-price')
                    original_price_text = original_price_element.text.strip() if original_price_element else ""
                    original_price = float(re.sub(r'[^\d.]', '', original_price_text)) if original_price_text and re.search(r'\d', original_price_text) else None
                    
                    # Ratings
                    rating_element = item.select_one('.item-rating')
                    rating_text = rating_element.text.strip() if rating_element else ""
                    rating = float(rating_text.split(' ')[0]) if rating_text and ' ' in rating_text else None
                    
                    # Review count
                    review_count_element = item.select_one('.item-reviews')
                    review_count_text = review_count_element.text.strip() if review_count_element else ""
                    review_count = int(re.sub(r'[^\d]', '', review_count_text)) if review_count_text and re.search(r'\d', review_count_text) else None
                    
                    # Prime/Free shipping
                    prime_element = item.select_one('.item-badge')
                    free_shipping = True if prime_element else False
                    
                    # Calculate discount
                    discount_percentage = None
                    if original_price and price and original_price > price:
                        discount_percentage = round(((original_price - price) / original_price) * 100, 1)
                    
                    product = {
                        'id': f"homedepot_{asin}",
                        'title': title,
                        'url': url,
                        'image': img_url,
                        'price': price,
                        'currency': 'USD',  # Default, could be extracted from page
                        'original_price': original_price,
                        'discount_percentage': discount_percentage,
                        'rating': rating,
                        'review_count': review_count,
                        'free_shipping': free_shipping,
                        'site': 'homedepot',
                        'in_stock': price > 0,
                        'seller': 'Home Depot' if free_shipping else None
                    }
                    
                    products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing Home Depot product: {str(e)}")
                    continue
            
        except Exception as e:
            logger.error(f"Error parsing Home Depot page: {str(e)}")
            
        return products
    
    def parse_otto(self, html):
        """Parse Otto product listings"""
        products = []
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Find all product containers
            results = soup.select('div.product-item')
            logger.info(f"Found {len(results)} Otto products")
            
            for item in results:
                try:
                    # Extract core product data
                    asin = item.get('data-sku', '')
                    
                    # Title
                    title_element = item.select_one('h2.product-title')
                    title = title_element.text.strip() if title_element else "Unknown Product"
                    
                    # URL
                    link_element = item.select_one('a.product-title')
                    url = link_element.get('href', '') if link_element else ""
                    
                    # Image
                    img_element = item.select_one('img.item-image')
                    img_url = img_element.get('src', '') if img_element else ""
                    
                    # Prices
                    price_element = item.select_one('.price-current')
                    price_text = price_element.text.strip() if price_element else ""
                    price = float(re.sub(r'[^\d.]', '', price_text)) if price_text and re.search(r'\d', price_text) else 0
                    
                    # Original price
                    original_price_element = item.select_one('.original-price')
                    original_price_text = original_price_element.text.strip() if original_price_element else ""
                    original_price = float(re.sub(r'[^\d.]', '', original_price_text)) if original_price_text and re.search(r'\d', original_price_text) else None
                    
                    # Ratings
                    rating_element = item.select_one('.item-rating')
                    rating_text = rating_element.text.strip() if rating_element else ""
                    rating = float(rating_text.split(' ')[0]) if rating_text and ' ' in rating_text else None
                    
                    # Review count
                    review_count_element = item.select_one('.item-reviews')
                    review_count_text = review_count_element.text.strip() if review_count_element else ""
                    review_count = int(re.sub(r'[^\d]', '', review_count_text)) if review_count_text and re.search(r'\d', review_count_text) else None
                    
                    # Prime/Free shipping
                    prime_element = item.select_one('.item-badge')
                    free_shipping = True if prime_element else False
                    
                    # Calculate discount
                    discount_percentage = None
                    if original_price and price and original_price > price:
                        discount_percentage = round(((original_price - price) / original_price) * 100, 1)
                    
                    product = {
                        'id': f"otto_{asin}",
                        'title': title,
                        'url': url,
                        'image': img_url,
                        'price': price,
                        'currency': 'USD',  # Default, could be extracted from page
                        'original_price': original_price,
                        'discount_percentage': discount_percentage,
                        'rating': rating,
                        'review_count': review_count,
                        'free_shipping': free_shipping,
                        'site': 'otto',
                        'in_stock': price > 0,
                        'seller': 'Otto' if free_shipping else None
                    }
                    
                    products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing Otto product: {str(e)}")
                    continue
            
        except Exception as e:
            logger.error(f"Error parsing Otto page: {str(e)}")
            
        return products
    
    def parse_jd(self, html):
        """Parse JD product listings"""
        products = []
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Find all product containers
            results = soup.select('div.product-item')
            logger.info(f"Found {len(results)} JD products")
            
            for item in results:
                try:
                    # Extract core product data
                    asin = item.get('data-sku', '')
                    
                    # Title
                    title_element = item.select_one('h2.product-title')
                    title = title_element.text.strip() if title_element else "Unknown Product"
                    
                    # URL
                    link_element = item.select_one('a.product-title')
                    url = link_element.get('href', '') if link_element else ""
                    
                    # Image
                    img_element = item.select_one('img.item-image')
                    img_url = img_element.get('src', '') if img_element else ""
                    
                    # Prices
                    price_element = item.select_one('.price-current')
                    price_text = price_element.text.strip() if price_element else ""
                    price = float(re.sub(r'[^\d.]', '', price_text)) if price_text and re.search(r'\d', price_text) else 0
                    
                    # Original price
                    original_price_element = item.select_one('.original-price')
                    original_price_text = original_price_element.text.strip() if original_price_element else ""
                    original_price = float(re.sub(r'[^\d.]', '', original_price_text)) if original_price_text and re.search(r'\d', original_price_text) else None
                    
                    # Ratings
                    rating_element = item.select_one('.item-rating')
                    rating_text = rating_element.text.strip() if rating_element else ""
                    rating = float(rating_text.split(' ')[0]) if rating_text and ' ' in rating_text else None
                    
                    # Review count
                    review_count_element = item.select_one('.item-reviews')
                    review_count_text = review_count_element.text.strip() if review_count_element else ""
                    review_count = int(re.sub(r'[^\d]', '', review_count_text)) if review_count_text and re.search(r'\d', review_count_text) else None
                    
                    # Prime/Free shipping
                    prime_element = item.select_one('.item-badge')
                    free_shipping = True if prime_element else False
                    
                    # Calculate discount
                    discount_percentage = None
                    if original_price and price and original_price > price:
                        discount_percentage = round(((original_price - price) / original_price) * 100, 1)
                    
                    product = {
                        'id': f"jd_{asin}",
                        'title': title,
                        'url': url,
                        'image': img_url,
                        'price': price,
                        'currency': 'USD',  # Default, could be extracted from page
                        'original_price': original_price,
                        'discount_percentage': discount_percentage,
                        'rating': rating,
                        'review_count': review_count,
                        'free_shipping': free_shipping,
                        'site': 'jd',
                        'in_stock': price > 0,
                        'seller': 'JD' if free_shipping else None
                    }
                    
                    products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing JD product: {str(e)}")
                    continue
            
        except Exception as e:
            logger.error(f"Error parsing JD page: {str(e)}")
            
        return products
    
    def parse_rakuten(self, html):
        """Parse Rakuten product listings"""
        products = []
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Find all product containers
            results = soup.select('div.product-item')
            logger.info(f"Found {len(results)} Rakuten products")
            
            for item in results:
                try:
                    # Extract core product data
                    asin = item.get('data-sku', '')
                    
                    # Title
                    title_element = item.select_one('h2.product-title')
                    title = title_element.text.strip() if title_element else "Unknown Product"
                    
                    # URL
                    link_element = item.select_one('a.product-title')
                    url = link_element.get('href', '') if link_element else ""
                    
                    # Image
                    img_element = item.select_one('img.item-image')
                    img_url = img_element.get('src', '') if img_element else ""
                    
                    # Prices
                    price_element = item.select_one('.price-current')
                    price_text = price_element.text.strip() if price_element else ""
                    price = float(re.sub(r'[^\d.]', '', price_text)) if price_text and re.search(r'\d', price_text) else 0
                    
                    # Original price
                    original_price_element = item.select_one('.original-price')
                    original_price_text = original_price_element.text.strip() if original_price_element else ""
                    original_price = float(re.sub(r'[^\d.]', '', original_price_text)) if original_price_text and re.search(r'\d', original_price_text) else None
                    
                    # Ratings
                    rating_element = item.select_one('.item-rating')
                    rating_text = rating_element.text.strip() if rating_element else ""
                    rating = float(rating_text.split(' ')[0]) if rating_text and ' ' in rating_text else None
                    
                    # Review count
                    review_count_element = item.select_one('.item-reviews')
                    review_count_text = review_count_element.text.strip() if review_count_element else ""
                    review_count = int(re.sub(r'[^\d]', '', review_count_text)) if review_count_text and re.search(r'\d', review_count_text) else None
                    
                    # Prime/Free shipping
                    prime_element = item.select_one('.item-badge')
                    free_shipping = True if prime_element else False
                    
                    # Calculate discount
                    discount_percentage = None
                    if original_price and price and original_price > price:
                        discount_percentage = round(((original_price - price) / original_price) * 100, 1)
                    
                    product = {
                        'id': f"rakuten_{asin}",
                        'title': title,
                        'url': url,
                        'image': img_url,
                        'price': price,
                        'currency': 'USD',  # Default, could be extracted from page
                        'original_price': original_price,
                        'discount_percentage': discount_percentage,
                        'rating': rating,
                        'review_count': review_count,
                        'free_shipping': free_shipping,
                        'site': 'rakuten',
                        'in_stock': price > 0,
                        'seller': 'Rakuten' if free_shipping else None
                    }
                    
                    products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing Rakuten product: {str(e)}")
                    continue
            
        except Exception as e:
            logger.error(f"Error parsing Rakuten page: {str(e)}")
            
        return products
    
    def parse_skroutz(self, html):
        """Parse Skroutz product listings"""
        products = []
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Find all product containers
            results = soup.select('div.product-item')
            logger.info(f"Found {len(results)} Skroutz products")
            
            for item in results:
                try:
                    # Extract core product data
                    asin = item.get('data-sku', '')
                    
                    # Title
                    title_element = item.select_one('h2.product-title')
                    title = title_element.text.strip() if title_element else "Unknown Product"
                    
                    # URL
                    link_element = item.select_one('a.product-title')
                    url = link_element.get('href', '') if link_element else ""
                    
                    # Image
                    img_element = item.select_one('img.item-image')
                    img_url = img_element.get('src', '') if img_element else ""
                    
                    # Prices
                    price_element = item.select_one('.price-current')
                    price_text = price_element.text.strip() if price_element else ""
                    price = float(re.sub(r'[^\d.]', '', price_text)) if price_text and re.search(r'\d', price_text) else 0
                    
                    # Original price
                    original_price_element = item.select_one('.original-price')
                    original_price_text = original_price_element.text.strip() if original_price_element else ""
                    original_price = float(re.sub(r'[^\d.]', '', original_price_text)) if original_price_text and re.search(r'\d', original_price_text) else None
                    
                    # Ratings
                    rating_element = item.select_one('.item-rating')
                    rating_text = rating_element.text.strip() if rating_element else ""
                    rating = float(rating_text.split(' ')[0]) if rating_text and ' ' in rating_text else None
                    
                    # Review count
                    review_count_element = item.select_one('.item-reviews')
                    review_count_text = review_count_element.text.strip() if review_count_element else ""
                    review_count = int(re.sub(r'[^\d]', '', review_count_text)) if review_count_text and re.search(r'\d', review_count_text) else None
                    
                    # Prime/Free shipping
                    prime_element = item.select_one('.item-badge')
                    free_shipping = True if prime_element else False
                    
                    # Calculate discount
                    discount_percentage = None
                    if original_price and price and original_price > price:
                        discount_percentage = round(((original_price - price) / original_price) * 100, 1)
                    
                    product = {
                        'id': f"skroutz_{asin}",
                        'title': title,
                        'url': url,
                        'image': img_url,
                        'price': price,
                        'currency': 'USD',  # Default, could be extracted from page
                        'original_price': original_price,
                        'discount_percentage': discount_percentage,
                        'rating': rating,
                        'review_count': review_count,
                        'free_shipping': free_shipping,
                        'site': 'skroutz',
                        'in_stock': price > 0,
                        'seller': 'Skroutz' if free_shipping else None
                    }
                    
                    products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing Skroutz product: {str(e)}")
                    continue
            
        except Exception as e:
            logger.error(f"Error parsing Skroutz page: {str(e)}")
            
        return products
    
    def parse_kotsovolos(self, html):
        """Parse Kotsovolos product listings"""
        products = []
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Find all product containers
            results = soup.select('div.product-item')
            logger.info(f"Found {len(results)} Kotsovolos products")
            
            for item in results:
                try:
                    # Extract core product data
                    asin = item.get('data-sku', '')
                    
                    # Title
                    title_element = item.select_one('h2.product-title')
                    title = title_element.text.strip() if title_element else "Unknown Product"
                    
                    # URL
                    link_element = item.select_one('a.product-title')
                    url = link_element.get('href', '') if link_element else ""
                    
                    # Image
                    img_element = item.select_one('img.item-image')
                    img_url = img_element.get('src', '') if img_element else ""
                    
                    # Prices
                    price_element = item.select_one('.price-current')
                    price_text = price_element.text.strip() if price_element else ""
                    price = float(re.sub(r'[^\d.]', '', price_text)) if price_text and re.search(r'\d', price_text) else 0
                    
                    # Original price
                    original_price_element = item.select_one('.original-price')
                    original_price_text = original_price_element.text.strip() if original_price_element else ""
                    original_price = float(re.sub(r'[^\d.]', '', original_price_text)) if original_price_text and re.search(r'\d', original_price_text) else None
                    
                    # Ratings
                    rating_element = item.select_one('.item-rating')
                    rating_text = rating_element.text.strip() if rating_element else ""
                    rating = float(rating_text.split(' ')[0]) if rating_text and ' ' in rating_text else None
                    
                    # Review count
                    review_count_element = item.select_one('.item-reviews')
                    review_count_text = review_count_element.text.strip() if review_count_element else ""
                    review_count = int(re.sub(r'[^\d]', '', review_count_text)) if review_count_text and re.search(r'\d', review_count_text) else None
                    
                    # Prime/Free shipping
                    prime_element = item.select_one('.item-badge')
                    free_shipping = True if prime_element else False
                    
                    # Calculate discount
                    discount_percentage = None
                    if original_price and price and original_price > price:
                        discount_percentage = round(((original_price - price) / original_price) * 100, 1)
                    
                    product = {
                        'id': f"kotsovolos_{asin}",
                        'title': title,
                        'url': url,
                        'image': img_url,
                        'price': price,
                        'currency': 'USD',  # Default, could be extracted from page
                        'original_price': original_price,
                        'discount_percentage': discount_percentage,
                        'rating': rating,
                        'review_count': review_count,
                        'free_shipping': free_shipping,
                        'site': 'kotsovolos',
                        'in_stock': price > 0,
                        'seller': 'Kotsovolos' if free_shipping else None
                    }
                    
                    products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing Kotsovolos product: {str(e)}")
                    continue
            
        except Exception as e:
            logger.error(f"Error parsing Kotsovolos page: {str(e)}")
            
        return products
    
    def parse_aliexpress(self, html):
        """Parse AliExpress product listings"""
        products = []
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Find all product containers - AliExpress uses multiple possible layouts
            results = soup.select('.list--gallery--C2f2tvm') or soup.select('.product-card') or soup.select('.JIIxO')
            logger.info(f"Found {len(results)} AliExpress products")
            
            for item in results:
                try:
                    # Extract product URL and ID
                    link_element = item.select_one('a[href*="/item/"]') or item.select_one('a.manhattan--container--1lP57Ag')
                    url = ""
                    item_id = ""
                    
                    if link_element and link_element.get('href'):
                        url = link_element.get('href')
                        if not url.startswith('http'):
                            url = f"https:{url}" if url.startswith('//') else f"https://www.aliexpress.com{url}"
                        
                        # Extract ID from URL
                        id_match = re.search(r'/item/(\d+)\.html', url)
                        if id_match:
                            item_id = id_match.group(1)
                    
                    # Title
                    title_element = item.select_one('.manhattan--titleText--WccSjUS') or item.select_one('.product-title') or item.select_one('a.manhattan--container--1lP57Ag')
                    title = title_element.get_text().strip() if title_element else "Unknown Product"
                    
                    # Image
                    img_element = item.select_one('img.manhattan--img--36QXbtQ') or item.select_one('img.product-img') or item.select_one('img')
                    img_url = ""
                    if img_element:
                        img_url = img_element.get('src') or img_element.get('data-src') or ""
                        if img_url and img_url.startswith('//'):
                            img_url = f"https:{img_url}"
                    
                    # Price
                    price_element = item.select_one('.manhattan--price-sale--1CCSZfK') or item.select_one('.product-price') or item.select_one('.manhattan--price--3T6qm4R')
                    price = 0
                    currency = 'USD'
                    
                    if price_element:
                        price_text = price_element.get_text().strip()
                        currency_match = re.search(r'([£€$₽¥₹]|USD|EUR|GBP|RUB|JPY|CNY)', price_text)
                        if currency_match:
                            currency_symbol = currency_match.group(1)
                            if currency_symbol == '$':
                                currency = 'USD'
                            elif currency_symbol == '€':
                                currency = 'EUR'
                            elif currency_symbol == '£':
                                currency = 'GBP'
                            elif currency_symbol == '₽':
                                currency = 'RUB'
                            elif currency_symbol == '¥':
                                currency = 'JPY'
                            elif currency_symbol == '₹':
                                currency = 'INR'
                        
                        # Extract price value
                        price_value = re.search(r'[\d,]+\.\d+|\d+', price_text)
                        if price_value:
                            price = float(price_value.group(0).replace(',', ''))
                    
                    # Original price
                    original_price_element = item.select_one('.manhattan--price-original--3T6qm4R') or item.select_one('.product-price-original')
                    original_price = None
                    
                    if original_price_element:
                        original_price_text = original_price_element.get_text().strip()
                        original_price_value = re.search(r'[\d,]+\.\d+|\d+', original_price_text)
                        if original_price_value:
                            original_price = float(original_price_value.group(0).replace(',', ''))
                    
                    # Calculate discount
                    discount_percentage = None
                    if original_price and price and original_price > price:
                        discount_percentage = round(((original_price - price) / original_price) * 100, 1)
                    
                    # Rating
                    rating_element = item.select_one('.manhattan--evaluation--3cSMNl3') or item.select_one('.product-rating')
                    rating = None
                    if rating_element:
                        rating_match = re.search(r'(\d+(\.\d+)?)', rating_element.get_text().strip())
                        rating = float(rating_match.group(1)) if rating_match else None
                    
                    # Reviews
                    review_element = item.select_one('.manhattan--trade--2PeJIEB') or item.select_one('.product-reviews')
                    review_count = 0
                    if review_element:
                        review_match = re.search(r'(\d+)', review_element.get_text().strip())
                        review_count = int(review_match.group(1)) if review_match else 0
                    
                    # Shipping
                    shipping_element = item.select_one('.manhattan--trade--2QoLtRn') or item.select_one('.product-shipping')
                    free_shipping = False
                    if shipping_element:
                        free_shipping = 'free' in shipping_element.get_text().lower() or 'free shipping' in shipping_element.get_text().lower()
                    
                    product = {
                        'id': f"aliexpress_{item_id}" if item_id else f"aliexpress_{hashlib.md5(title.encode()).hexdigest()[:10]}",
                        'title': title,
                        'url': url,
                        'image': img_url,
                        'price': price,
                        'currency': currency,
                        'original_price': original_price,
                        'discount_percentage': discount_percentage,
                        'rating': rating,
                        'review_count': review_count,
                        'free_shipping': free_shipping,
                        'site': 'aliexpress',
                        'in_stock': price > 0
                    }
                    
                    products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing AliExpress product: {str(e)}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error parsing AliExpress page: {str(e)}")
            
        return products
    
    def parse_generic(self, html, site):
        """Generic parser for other e-commerce sites"""
        products = []
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Try different product container selectors
            potential_product_selectors = [
                'div.product', 'div.item', 'li.product', 'li.item', 
                'div[class*="product"]', 'div[class*="item"]',
                'div[data-product]', 'div[data-item]'
            ]
            
            # Find all product elements
            product_elements = []
            for selector in potential_product_selectors:
                elements = soup.select(selector)
                if elements:
                    product_elements = elements
                    logger.info(f"Found {len(elements)} products with selector '{selector}' for site {site}")
                    break
            
            if not product_elements:
                logger.warning(f"No product elements found for {site}")
                
                # Extract some basic info from the page as fallback
                title_element = soup.select_one('title')
                title_text = title_element.text if title_element else f"Content from {site}"
                
                # Create a single fallback product with page info
                products.append({
                    'id': f"{site}_generic_{hash(title_text) % 10000}",
                    'title': title_text,
                    'url': f"https://www.{site}.com",
                    'image': f"https://via.placeholder.com/150?text={site}",
                    'price': 0,
                    'currency': 'USD',
                    'site': site,
                    'in_stock': False
                })
                
                return products
            
            # Process product elements
            for element in product_elements[:10]:  # Limit to first 10
                try:
                    # Generate a unique ID based on content
                    element_text = element.text[:100]
                    item_id = f"{site}_{hash(element_text) % 100000}"
                    
                    # Title - try different selectors
                    title_element = (
                        element.select_one('.product-title, .item-title, .title, .name, h2, h3, h4') or
                        element.select_one('[class*="title"], [class*="name"]')
                    )
                    title = title_element.text.strip() if title_element else f"Product from {site}"
                    
                    # URL
                    link_element = element.select_one('a')
                    path = link_element.get('href', '') if link_element else ""
                    url = path if path.startswith('http') else urljoin(f"https://www.{site}.com", path)
                    
                    # Image
                    img_element = element.select_one('img')
                    img_url = img_element.get('src', '') if img_element else ""
                    if img_url and not img_url.startswith('http'):
                        img_url = urljoin(f"https://www.{site}.com", img_url)
                    
                    # Price - try different selectors
                    price_element = (
                        element.select_one('.price, .current-price, [class*="price"]') or
                        element.select_one('span:contains($), span:contains(€)')
                    )
                    price_text = price_element.text.strip() if price_element else ""
                    price_match = re.search(r'(\d+(\.\d+)?)', price_text)
                    price = float(price_match.group(1)) if price_match else 0
                    
                    # Try to extract currency
                    currency_match = re.search(r'(\$|€|£|¥)', price_text)
                    currency = currency_match.group(1) if currency_match else 'USD'
                    currency_map = {'$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY'}
                    currency = currency_map.get(currency, 'USD')
                    
                    product = {
                        'id': item_id,
                        'title': title,
                        'url': url,
                        'image': img_url,
                        'price': price,
                        'currency': currency,
                        'site': site,
                        'in_stock': True if price > 0 else False
                    }
                    
                    products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing generic product from {site}: {str(e)}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error parsing generic page from {site}: {str(e)}")
            
        return products 