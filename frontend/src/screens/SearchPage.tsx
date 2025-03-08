import React, { useState, useContext, useEffect } from 'react';
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
  IconButton,
  Switch,
  FormControlLabel,
  Divider,
  Badge,
  Drawer,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Rating,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Paper
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Favorite as FavoriteIcon, 
  FavoriteBorder as FavoriteBorderIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  LocalOffer as LocalOfferIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Speed as SpeedIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Product, SearchParams, SearchFilters, SearchResults, SearchHistory, Region, Store, Facets } from '../types';
import api from '../utils/api';
import { LanguageContext } from '../App';
import { getTranslation } from '../utils/translations';
import ProductCard from '../components/product/ProductCard';

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
    sort_by: 'relevance',
    page: 1,
    limit: 20,
    advanced_matching: true,
    use_openai: true,
    natural_language: true,
    filters: {}
  });
  
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<number>(0);
  const [advancedModeOpen, setAdvancedModeOpen] = useState<boolean>(false);
  
  // Load regions and stores on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [regionsData, storesData] = await Promise.all([
          api.getRegions(),
          api.getStores()
        ]);
        setRegions(regionsData);
        setStores(storesData);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    loadData();
  }, []);
  
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
        setTimeout(() => reject(new Error('Search request timed out')), 30000)
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
      
      // Calculate the number of active filters
      countActiveFilters(params.filters);
      
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
    setSearchParams(prev => ({ 
      ...prev, 
      sort_by: e.target.value as SearchParams['sort_by'],
      page: 1 // Reset to page 1 when sort changes
    }));
    
    // Automatically re-search if we have results
    if (results) {
      setTimeout(handleSearch, 100);
    }
  };
  
  const handlePriceRangeChange = (_event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as [number, number]);
  };
  
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
    setTimeout(handleSearch, 100);
  };
  
  const handleFreeShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        free_shipping: e.target.checked
      }
    }));
  };
  
  const handleMinRatingChange = (_event: Event, value: number | number[]) => {
    setSearchParams(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        min_rating: value as number
      }
    }));
  };
  
  const handleSourceChange = (source: string) => {
    setSearchParams(prev => {
      const currentSources = prev.filters?.sources || [];
      const newSources = currentSources.includes(source)
        ? currentSources.filter(s => s !== source)
        : [...currentSources, source];
        
      return {
        ...prev,
        filters: {
          ...prev.filters,
          sources: newSources.length > 0 ? newSources : undefined
        }
      };
    });
  };
  
  const handleBrandChange = (brand: string) => {
    setSearchParams(prev => {
      const currentBrands = prev.filters?.brands || [];
      const newBrands = currentBrands.includes(brand)
        ? currentBrands.filter(b => b !== brand)
        : [...currentBrands, brand];
        
      return {
        ...prev,
        filters: {
          ...prev.filters,
          brands: newBrands.length > 0 ? newBrands : undefined
        }
      };
    });
  };
  
  const handleCategoryChange = (category: string) => {
    setSearchParams(prev => {
      const currentCategories = prev.filters?.categories || [];
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter(c => c !== category)
        : [...currentCategories, category];
        
      return {
        ...prev,
        filters: {
          ...prev.filters,
          categories: newCategories.length > 0 ? newCategories : undefined
        }
      };
    });
  };
  
  const handleAdvancedOptionChange = (option: 'advanced_matching' | 'use_openai' | 'natural_language') => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchParams(prev => ({
        ...prev,
        [option]: e.target.checked
      }));
    };
  
  const countActiveFilters = (filters?: SearchFilters) => {
    if (!filters) {
      setActiveFilters(0);
      return;
    }
    
    let count = 0;
    if (filters.brands && filters.brands.length > 0) count += 1;
    if (filters.categories && filters.categories.length > 0) count += 1;
    if (filters.sources && filters.sources.length > 0) count += 1;
    if (filters.min_rating && filters.min_rating > 0) count += 1;
    if (filters.free_shipping) count += 1;
    if (filters.min_deal_score) count += 1;
    if (filters.price_range) {
      if (filters.price_range.min && filters.price_range.min > 0) count += 1;
      if (filters.price_range.max && filters.price_range.max < 2000) count += 1;
    }
    
    setActiveFilters(count);
  };
  
  const clearAllFilters = () => {
    setSearchParams(prev => ({
      ...prev,
      filters: {}
    }));
    setPriceRange([0, 2000]);
    setActiveFilters(0);
  };
  
  const isFavorite = (product: Product): boolean => {
    return favorites.some(fav => fav.id === product.id);
  };
  
  const handleFavoriteToggle = (product: Product) => {
    if (!isFavorite(product)) {
      addToFavorites(product);
    }
  };

  const renderFacetFilters = () => {
    const facets = results?.facets;
    if (!facets) return null;
    
    return (
      <Box>
        {/* Brands filter */}
        {facets.brands && facets.brands.length > 0 && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>Brands</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                {facets.brands.map((brand) => (
                  <ListItem key={brand.name} disablePadding>
                    <ListItemText 
                      primary={
                        <FormControlLabel
                          control={
                            <Checkbox 
                              checked={searchParams.filters?.brands?.includes(brand.name) || false}
                              onChange={() => handleBrandChange(brand.name)}
                              size="small"
                            />
                          }
                          label={
                            <Typography variant="body2">
                              {brand.name} <Typography component="span" variant="caption" color="text.secondary">({brand.count})</Typography>
                            </Typography>
                          }
                        />
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}
        
        {/* Categories filter */}
        {facets.categories && facets.categories.length > 0 && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>Categories</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                {facets.categories.map((category) => (
                  <ListItem key={category.name} disablePadding>
                    <ListItemText 
                      primary={
                        <FormControlLabel
                          control={
                            <Checkbox 
                              checked={searchParams.filters?.categories?.includes(category.name) || false}
                              onChange={() => handleCategoryChange(category.name)}
                              size="small"
                            />
                          }
                          label={
                            <Typography variant="body2">
                              {category.name} <Typography component="span" variant="caption" color="text.secondary">({category.count})</Typography>
                            </Typography>
                          }
                        />
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}
        
        {/* Sources (Stores) filter */}
        {facets.sources && facets.sources.length > 0 && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>Stores</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                {facets.sources.map((source) => (
                  <ListItem key={source.name} disablePadding>
                    <ListItemText 
                      primary={
                        <FormControlLabel
                          control={
                            <Checkbox 
                              checked={searchParams.filters?.sources?.includes(source.name) || false}
                              onChange={() => handleSourceChange(source.name)}
                              size="small"
                            />
                          }
                          label={
                            <Typography variant="body2">
                              {source.name} <Typography component="span" variant="caption" color="text.secondary">({source.count})</Typography>
                            </Typography>
                          }
                        />
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}
        
        {/* Rating filter */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>Rating</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ px: 2, pt: 1 }}>
              <Rating 
                value={searchParams.filters?.min_rating || 0}
                onChange={(_, value) => handleMinRatingChange(null as any, value || 0)}
                precision={1}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Minimum rating: {searchParams.filters?.min_rating || 'Any'}
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
        
        {/* Free Shipping filter */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>Shipping</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControlLabel
              control={
                <Switch
                  checked={searchParams.filters?.free_shipping || false}
                  onChange={handleFreeShippingChange}
                />
              }
              label="Free shipping only"
            />
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };
  
  const renderAdvancedOptions = () => (
    <Card sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Advanced Search Options</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={searchParams.advanced_matching}
                onChange={handleAdvancedOptionChange('advanced_matching')}
              />
            }
            label={
              <Box>
                <Typography>Product Matching</Typography>
                <Typography variant="caption" color="text.secondary">
                  Match identical products across different sites
                </Typography>
              </Box>
            }
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={searchParams.use_openai}
                onChange={handleAdvancedOptionChange('use_openai')}
              />
            }
            label={
              <Box>
                <Typography>AI Product Analysis</Typography>
                <Typography variant="caption" color="text.secondary">
                  Use AI to analyze and enhance search results
                </Typography>
              </Box>
            }
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={searchParams.natural_language}
                onChange={handleAdvancedOptionChange('natural_language')}
              />
            }
            label={
              <Box>
                <Typography>Natural Language Processing</Typography>
                <Typography variant="caption" color="text.secondary">
                  Process queries like "best laptop under $1000"
                </Typography>
              </Box>
            }
          />
        </Grid>
      </Grid>
    </Card>
  );
  
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
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
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
                value={searchParams.sort_by || 'relevance'}
                label={getTranslation('sortBy', language)}
                onChange={handleSortChange}
              >
                <MenuItem value="relevance">Relevance</MenuItem>
                <MenuItem value="price_asc">Price: Low to High</MenuItem>
                <MenuItem value="price_desc">Price: High to Low</MenuItem>
                <MenuItem value="rating">Highest Rating</MenuItem>
                <MenuItem value="discount">Biggest Discount</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Typography gutterBottom>Price Range</Typography>
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
          
          <Grid item xs={12} container spacing={1} alignItems="center">
            <Grid item xs>
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
            <Grid item>
              <Tooltip title="Advanced Search Options">
                <IconButton 
                  onClick={() => setAdvancedModeOpen(!advancedModeOpen)}
                  color={advancedModeOpen ? "primary" : "default"}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item>
              <Tooltip title="Filters">
                <IconButton 
                  onClick={() => setDrawerOpen(true)}
                  color={activeFilters > 0 ? "primary" : "default"}
                >
                  <Badge badgeContent={activeFilters} color="error">
                    <FilterListIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Grid>
      </Card>
      
      {advancedModeOpen && renderAdvancedOptions()}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Results section */}
      {results && (
        <>
          {/* Query information */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {results.total_results} results for "{results.query}"
              {results.processed_query && results.processed_query !== results.query && (
                <Typography component="span" color="text.secondary" variant="body2" sx={{ ml: 1 }}>
                  (interpreted as "{results.processed_query}")
                </Typography>
              )}
            </Typography>
            
            {results.execution_time && (
              <Typography variant="body2" color="text.secondary">
                Search completed in {results.execution_time} seconds
              </Typography>
            )}
            
            {/* Active filters summary */}
            {activeFilters > 0 && (
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {searchParams.filters?.brands?.map(brand => (
                  <Chip 
                    key={`brand-${brand}`}
                    label={`Brand: ${brand}`}
                    onDelete={() => handleBrandChange(brand)}
                    size="small"
                  />
                ))}
                
                {searchParams.filters?.categories?.map(category => (
                  <Chip 
                    key={`category-${category}`}
                    label={`Category: ${category}`}
                    onDelete={() => handleCategoryChange(category)}
                    size="small"
                  />
                ))}
                
                {searchParams.filters?.sources?.map(source => (
                  <Chip 
                    key={`source-${source}`}
                    label={`Store: ${source}`}
                    onDelete={() => handleSourceChange(source)}
                    size="small"
                  />
                ))}
                
                {searchParams.filters?.min_rating && (
                  <Chip 
                    key="rating"
                    label={`Rating: ≥${searchParams.filters.min_rating}★`}
                    onDelete={() => handleMinRatingChange(null as any, 0)}
                    size="small"
                  />
                )}
                
                {searchParams.filters?.free_shipping && (
                  <Chip 
                    key="shipping"
                    label="Free shipping only"
                    onDelete={() => handleFreeShippingChange({ target: { checked: false }} as any)}
                    size="small"
                  />
                )}
                
                {activeFilters > 0 && (
                  <Chip 
                    label="Clear all filters"
                    onClick={clearAllFilters}
                    color="primary"
                    size="small"
                  />
                )}
              </Box>
            )}
          </Box>
          
          {/* Best deals section */}
          {results.best_deals && results.best_deals.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <LocalOfferIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
                Best Deals
              </Typography>
              
              <Grid container spacing={2}>
                {results.best_deals.map(product => (
                  <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
                    <ProductCard 
                      product={product} 
                      isFavorite={isFavorite(product)}
                      onFavoriteToggle={() => handleFavoriteToggle(product)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          
          {/* Main results */}
          <Grid container spacing={3}>
            {/* Products grid */}
            <Grid item xs={12}>
              {results.products.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No products found matching your criteria. Try adjusting your filters or search terms.
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {results.products.map(product => (
                    <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
                      <ProductCard 
                        product={product} 
                        isFavorite={isFavorite(product)}
                        onFavoriteToggle={() => handleFavoriteToggle(product)}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>
          </Grid>
          
          {/* Pagination */}
          {results.total_results > 0 && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Pagination 
                count={Math.ceil(results.total_results / results.limit)} 
                page={results.page} 
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
      
      {/* Filters drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 350 }, p: 2 }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Filters</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        {activeFilters > 0 && (
          <Button 
            variant="outlined" 
            fullWidth 
            onClick={clearAllFilters}
            sx={{ mb: 2 }}
          >
            Clear All Filters
          </Button>
        )}
        
        <Divider sx={{ mb: 2 }} />
        
        {renderFacetFilters()}
      </Drawer>
    </Box>
  );
};

export default SearchPage; 