import React, { useState, useContext } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Typography, 
  Slider, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress,
  Chip,
  Pagination,
  SelectChangeEvent,
  Alert,
  useTheme,
  IconButton
} from '@mui/material';
import { Search as SearchIcon, Favorite as FavoriteIcon, FavoriteBorder as FavoriteBorderIcon } from '@mui/icons-material';
import { Product, SearchParams, SearchResults, SearchHistory, Region } from '../types';
import api from '../utils/api';
import { LanguageContext } from '../App';
import { getTranslation } from '../utils/translations';

interface SearchPageProps {
  addToFavorites: (product: Product) => void;
  favorites: Product[];
  addToSearchHistory: (historyItem: SearchHistory) => void;
}

const SearchPage: React.FC<SearchPageProps> = ({ 
  addToFavorites, 
  favorites, 
  addToSearchHistory 
}) => {
  const { language } = useContext(LanguageContext);
  const theme = useTheme();
  
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: '',
    region: 'global',
    min_price: undefined,
    max_price: undefined,
    sort_by: 'price_asc',
    page: 1,
    limit: 20
  });
  
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [regions] = useState<Region[]>([
    { code: 'global', name: 'Global' },
    { code: 'us', name: 'United States' },
    { code: 'eu', name: 'Europe' },
    { code: 'cn', name: 'China' },
    { code: 'ar', name: 'Argentina' },
    { code: 'gr', name: 'Greece' }
  ]);
  
  const handleSearch = async () => {
    if (!searchParams.query.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Apply price range
      const params = {
        ...searchParams,
        min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
        max_price: priceRange[1] < 2000 ? priceRange[1] : undefined
      };
      
      // Add a timeout for the request
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Search request timed out')), 20000)
      );
      
      // Race between actual request and timeout
      const response = await Promise.race([
        api.search(params),
        timeoutPromise
      ]) as SearchResults;
      
      // Validate response
      if (!response || !response.products) {
        throw new Error('Invalid response from search API');
      }
      
      setResults(response);
      
      // Add to search history if successful
      addToSearchHistory({
        ...params,
        timestamp: new Date().toISOString(),
        results_count: response.total_results
      });
      
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to fetch search results. Please try again. ' + (err instanceof Error ? err.message : ''));
      // Set empty results to avoid white screen
      setResults({
        query: searchParams.query,
        total_results: 0,
        page: searchParams.page || 1,
        limit: searchParams.limit || 20,
        best_deals: [],
        products: []
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams(prev => ({ ...prev, query: e.target.value }));
  };
  
  const handleRegionChange = (e: SelectChangeEvent<string>) => {
    setSearchParams(prev => ({ ...prev, region: e.target.value }));
  };
  
  const handleSortChange = (e: SelectChangeEvent<string>) => {
    setSearchParams(prev => ({ ...prev, sort_by: e.target.value as SearchParams['sort_by'] }));
  };
  
  const handlePriceRangeChange = (_event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as [number, number]);
  };
  
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
    handleSearch();
  };
  
  const isFavorite = (product: Product): boolean => {
    return favorites.some(fav => fav.id === product.id);
  };
  
  const handleFavoriteToggle = (product: Product) => {
    if (!isFavorite(product)) {
      addToFavorites(product);
    }
  };
  
  return (
    <Box>
      <Card sx={{ mb: 4, p: 3, boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={getTranslation('searchPlaceholder', language)}
              variant="outlined"
              value={searchParams.query}
              onChange={handleQueryChange}
              InputProps={{
                endAdornment: loading ? <CircularProgress size={24} /> : null
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>{getTranslation('region', language)}</InputLabel>
              <Select
                value={searchParams.region || 'global'}
                label={getTranslation('region', language)}
                onChange={handleRegionChange}
              >
                {regions.map(region => (
                  <MenuItem key={region.code} value={region.code}>
                    {region.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>{getTranslation('sortBy', language)}</InputLabel>
              <Select
                value={searchParams.sort_by || 'price_asc'}
                label={getTranslation('sortBy', language)}
                onChange={handleSortChange}
              >
                <MenuItem value="price_asc">Price: Low to High</MenuItem>
                <MenuItem value="price_desc">Price: High to Low</MenuItem>
                <MenuItem value="rating">Highest Rating</MenuItem>
                <MenuItem value="value_score">Best Value</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Typography gutterBottom>{getTranslation('priceRange', language)}</Typography>
            <Slider
              value={priceRange}
              onChange={handlePriceRangeChange}
              valueLabelDisplay="auto"
              min={0}
              max={2000}
              step={10}
              sx={{
                color: theme.palette.primary.main,
                '& .MuiSlider-thumb': {
                  height: 24,
                  width: 24,
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">${priceRange[0]}</Typography>
              <Typography variant="body2">${priceRange[1] === 2000 ? '2000+' : priceRange[1]}</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              startIcon={<SearchIcon />} 
              onClick={handleSearch}
              disabled={loading}
              size="large"
              fullWidth
              sx={{ py: 1.5 }}
            >
              {loading ? 'Searching...' : getTranslation('findBestDeals', language)}
            </Button>
          </Grid>
        </Grid>
      </Card>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {results && results.best_deals.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <Box component="span" sx={{ 
              width: 4, 
              height: 24, 
              bgcolor: theme.palette.primary.main, 
              display: 'inline-block',
              mr: 2,
              borderRadius: 1
            }}/>
            {getTranslation('bestDealsFound', language)}
          </Typography>
          <Grid container spacing={3}>
            {results.best_deals.map(deal => (
              <Grid item xs={12} sm={6} md={4} key={deal.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px'
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={deal.image}
                    alt={deal.title}
                    sx={{ objectFit: 'contain', p: 2 }}
                  />
                  <IconButton
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={() => handleFavoriteToggle(deal)}
                    color="primary"
                  >
                    {isFavorite(deal) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  </IconButton>
                  {deal.deal_quality && (
                    <Chip 
                      label={deal.deal_quality.toUpperCase()} 
                      color={
                        deal.deal_quality === 'excellent' ? 'success' :
                        deal.deal_quality === 'good' ? 'primary' :
                        'default'
                      }
                      sx={{ position: 'absolute', top: 8, left: 8 }}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div" noWrap>
                      {deal.normalized_title || deal.title}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h5" color="primary">
                        ${deal.price}
                      </Typography>
                      {deal.original_price && (
                        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                          ${deal.original_price}
                        </Typography>
                      )}
                    </Box>
                    {deal.discount_percentage && (
                      <Chip 
                        label={`${deal.discount_percentage}% OFF`}
                        color="secondary"
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    )}
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {getTranslation('rating', language)}: {deal.rating?.toFixed(1) || 'N/A'} ({deal.review_count || 0} {getTranslation('reviews', language)})
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Chip label={deal.site.toUpperCase()} size="small" />
                      {deal.shipping_cost === 0 ? (
                        <Chip label={getTranslation('freeShipping', language)} size="small" color="success" />
                      ) : (
                        <Typography variant="body2">
                          {getTranslation('shipping', language)}: ${deal.shipping_cost}
                        </Typography>
                      )}
                    </Box>
                    {deal.ai_summary && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        {deal.ai_summary}
                      </Typography>
                    )}
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button 
                      variant="outlined" 
                      fullWidth
                      href={deal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!deal.url || !deal.url.startsWith('http')) {
                          e.preventDefault();
                          alert('Invalid product URL. Please try another product.');
                        }
                      }}
                    >
                      {getTranslation('viewDeal', language)}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      
      {results && results.products.length > 0 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <Box component="span" sx={{ 
              width: 4, 
              height: 24, 
              bgcolor: theme.palette.primary.main, 
              display: 'inline-block',
              mr: 2,
              borderRadius: 1
            }}/>
            {getTranslation('allProducts', language)} ({results.total_results})
          </Typography>
          <Grid container spacing={3}>
            {results.products.map(product => (
              <Grid item xs={12} sm={6} md={3} key={product.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px'
                  }
                }}>
                  <CardMedia
                    component="img"
                    height="160"
                    image={product.image}
                    alt={product.title}
                    sx={{ objectFit: 'contain', p: 2 }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="body1" component="div" noWrap>
                      {product.title}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" color="primary">
                        ${product.price}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleFavoriteToggle(product)}
                        color="primary"
                      >
                        {isFavorite(product) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      </IconButton>
                    </Box>
                    <Chip label={product.site.toUpperCase()} size="small" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination 
              count={Math.ceil(results.total_results / results.limit)} 
              page={results.page} 
              onChange={handlePageChange}
              color="primary"
              size="large"
            />
          </Box>
        </Box>
      )}
      
      {results && results.products.length === 0 && !loading && (
        <Alert severity="info">
          {getTranslation('noResults', language)}
        </Alert>
      )}
    </Box>
  );
};

export default SearchPage; 