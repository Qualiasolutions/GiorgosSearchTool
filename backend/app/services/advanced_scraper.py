import requests
import logging
import json
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from fake_useragent import UserAgent

logger = logging.getLogger(__name__)

class AdvancedScraper:
    def __init__(self, api_key=None):
        self.api_key = api_key
        self.user_agent = UserAgent()
        self.session = requests.Session()
    
    def get_headers(self):
        """Generate random user agent headers to avoid detection"""
        return {
            'User-Agent': self.user_agent.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
    
    def scrape_with_api(self, url, country_code=None, render_js=True):
        """Scrape a URL using Scraper API with advanced options"""
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
            
        logger.info(f"Scraping via API: {url} (country: {country_code})")
        
        try:
            response = self.session.get(api_url, timeout=30)
            response.raise_for_status()
            return response.text
        except requests.exceptions.RequestException as e:
            logger.error(f"Error scraping {url}: {str(e)}")
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
    
    def parse_by_site(self, html, site):
        """Parse HTML based on which site it's from"""
        if not html:
            return []
        
        site_base = site.split('.')[0]  # Extract base domain
        
        if site_base == 'amazon' or site == 'amazon':
            return self.parse_amazon(html)
        elif site_base == 'ebay' or site == 'ebay':
            return self.parse_ebay(html)
        elif site == 'walmart':
            return self.parse_walmart(html)
        else:
            # Try generic parsing for other sites
            return self.parse_generic(html, site)
    
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