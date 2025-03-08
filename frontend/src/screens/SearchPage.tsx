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
  AlertTitle,
  Collapse,
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
  Paper,
  CardActionArea,
  InputAdornment
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
  Close as CloseIcon,
  Clear as ClearIcon,
  ImageNotSupported as ImageNotSupportedIcon
} from '@mui/icons-material';
import { Product, SearchParams, SearchFilters, SearchResults, SearchHistory, Region, Store, Facets } from '../types';
import api, { SearchResponse } from '../utils/api';
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
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Load regions and stores on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Use hardcoded regions instead of api.getRegions
        const defaultRegions = [
          { code: 'global', name: 'Global' },
          { code: 'us', name: 'United States' },
          { code: 'eu', name: 'Europe' },
          { code: 'uk', name: 'United Kingdom' },
          { code: 'de', name: 'Germany' },
          { code: 'gr', name: 'Greece' }
        ];
        
        const storesData = await api.getStores();
        setRegions(defaultRegions);
        setStores(storesData.map(code => ({ 
          code, 
          name: code.charAt(0).toUpperCase() + code.slice(1),
          regions: ['global']
        })));
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
    setSearchError(null);
    
    try {
      // Apply price range
      const params = {
        ...searchParams,
        min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
        max_price: priceRange[1] < 2000 ? priceRange[1] : undefined
      };
      
      // Perform the search
      const response = await api.search(params);
      
      // Check for explicit error from backend
      if (!response.success && response.error) {
        setSearchError(response.error);
        setResults({
          ...response,
          products: []
        });
        return;
      }
      
      // Validate response
      if (!response || !response.products) {
        throw new Error('Invalid response from search API');
      }
      
      setResults(response);
      
      // Calculate the number of active filters
      countActiveFilters(params.filters);
      
      // Add to search history if successful
      addToSearchHistory(api.createSearchHistoryItem(searchParams.query, response));
    } catch (error) {
      console.error('Search failed:', error);
      setSearchError('Search request failed. Please try again later.');
      
      // Set empty results
      setResults({
        query: searchParams.query,
        processed_query: searchParams.query,
        products: [],
        total_results: 0,
        page: 1,
        limit: 20,
        best_deals: [],
        success: false
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
  
  // Add styling for the search box
  const searchBoxSx = {
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'row' },
    alignItems: { xs: 'stretch', sm: 'center' },
    gap: 2,
    p: { xs: 2, md: 3 },
    borderRadius: 3,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    background: 'linear-gradient(to right, rgba(0,164,172,0.04), rgba(0,164,172,0.08))',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0,164,172,0.1)',
    mb: 3
  };

  // Add styling for the search input
  const searchInputSx = {
    flex: 1,
    '& .MuiInputBase-root': {
      bgcolor: 'white',
      borderRadius: 2,
      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: '0 4px 10px rgba(0,164,172,0.15)',
      },
      '&.Mui-focused': {
        boxShadow: '0 4px 10px rgba(0,164,172,0.25)',
      }
    }
  };

  // Add animation keyframes for product cards
  const cardAnimationKeyframes = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  // Update the product card style
  const productCardSx = (index: number) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    animation: 'fadeIn 0.5s ease forwards',
    animationDelay: `${index * 0.05}s`,
    opacity: 0,
    transform: 'translateY(10px)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 24px rgba(0,164,172,0.15)',
      '& .MuiCardMedia-root': {
        transform: 'scale(1.03)',
      }
    }
  });

  // Add responsiveness to the product grid
  const productGridSx = {
    mt: 3,
    '& .MuiGrid-item': {
      width: '100%',
      display: 'flex'
    }
  };

  // Add style for price slider
  const priceSliderSx = {
    '& .MuiSlider-thumb': {
      width: 20,
      height: 20,
      '&:hover, &.Mui-focusVisible': {
        boxShadow: '0 0 0 8px rgba(0,164,172,0.16)',
      }
    },
    '& .MuiSlider-track': {
      height: 6,
      borderRadius: 3
    },
    '& .MuiSlider-rail': {
      height: 6,
      borderRadius: 3,
      opacity: 0.3
    }
  };

  return (
    <Box>
      <Card sx={{ mb: 4, p: 3, boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={searchBoxSx}>
              <TextField
                value={searchParams.query}
                onChange={handleQueryChange}
                placeholder={getTranslation('searchPlaceholder', language)}
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: searchParams.query ? (
                    <InputAdornment position="end">
                      <IconButton 
                        size="small" 
                        onClick={() => handleQueryChange({ target: { value: '' } } as any)}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
                sx={searchInputSx}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                gap: 1,
                width: { xs: '100%', sm: 'auto' } 
              }}>
                <FormControl 
                  variant="outlined" 
                  size="small" 
                  sx={{ 
                    minWidth: { xs: '100%', sm: 120 },
                    bgcolor: 'white',
                    borderRadius: 1,
                  }}
                >
                  <Select
                    value={searchParams.region}
                    onChange={handleRegionChange}
                    displayEmpty
                    sx={{ '& .MuiSelect-select': { py: 1.5 } }}
                  >
                    {regions.map((region) => (
                      <MenuItem key={region.code} value={region.code}>
                        {region.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSearch}
                  startIcon={<SearchIcon />}
                  disabled={loading || !searchParams.query.trim()}
                  sx={{ 
                    height: { sm: '100%' },
                    px: 3,
                    py: { xs: 1.5, sm: 1 },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  {getTranslation('search', language)}
                </Button>
              </Box>
            </Box>
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
              step={50}
              marks={[
                { value: 0, label: '$0' },
                { value: 500, label: '$500' },
                { value: 1000, label: '$1000' },
                { value: 1500, label: '$1500' },
                { value: 2000, label: '$2000+' }
              ]}
              sx={priceSliderSx}
              valueLabelFormat={(value) => `$${value}`}
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
          <Grid container spacing={3} sx={productGridSx}>
            {results?.products.map((product, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <Card sx={productCardSx(index)}>
                  <CardActionArea component="a" href={product.url} target="_blank" rel="noopener noreferrer">
                    <Box sx={{ 
                      height: 200, 
                      position: 'relative',
                      overflow: 'hidden',
                      bgcolor: 'rgba(0,0,0,0.04)'
                    }}>
                      {product.image ? (
                        <CardMedia
                          component="img"
                          height="200"
                          image={product.image}
                          alt={product.title}
                          sx={{ 
                            objectFit: 'contain',
                            p: 2,
                            transition: 'transform 0.3s ease',
                          }}
                        />
                      ) : (
                        <Box sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'text.secondary'
                        }}>
                          <ImageNotSupportedIcon />
                        </Box>
                      )}
                      
                      {/* Site badge */}
                      <Chip
                        label={product.site}
                        size="small"
                        sx={{ 
                          position: 'absolute', 
                          bottom: 8, 
                          right: 8,
                          bgcolor: 'rgba(255,255,255,0.85)',
                          fontWeight: 500,
                          backdropFilter: 'blur(4px)',
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                  </CardActionArea>
                  
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Tooltip title={product.title}>
                      <Typography 
                        variant="subtitle1" 
                        gutterBottom 
                        sx={{ 
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          minHeight: 48
                        }}
                      >
                        {product.title}
                      </Typography>
                    </Tooltip>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {product.rating ? (
                        <>
                          <Rating 
                            value={product.rating} 
                            precision={0.5} 
                            size="small" 
                            readOnly 
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                            ({product.review_count || 0})
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No ratings
                        </Typography>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <Box>
                        {product.original_price && product.original_price > product.price ? (
                          <>
                            <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              sx={{ 
                                textDecoration: 'line-through', 
                                display: 'block' 
                              }}
                            >
                              {product.currency}{product.original_price.toFixed(2)}
                            </Typography>
                            <Typography 
                              variant="body1" 
                              color="error.main" 
                              sx={{ fontWeight: 700 }}
                            >
                              {product.currency}{product.price.toFixed(2)}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body1" sx={{ fontWeight: 700 }}>
                            {product.price ? `${product.currency}${product.price.toFixed(2)}` : 'N/A'}
                          </Typography>
                        )}
                      </Box>
                      
                      <IconButton 
                        color={isFavorite(product) ? "primary" : "default"}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleFavoriteToggle(product);
                        }}
                        size="small"
                        sx={{ 
                          borderRadius: 1.5,
                          bgcolor: isFavorite(product) ? 'rgba(0,164,172,0.1)' : 'transparent'
                        }}
                        aria-label={isFavorite(product) ? "Remove from favorites" : "Add to favorites"}
                      >
                        {isFavorite(product) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
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
      
      {searchError && (
        <Collapse in={!!searchError}>
          <Alert 
            severity="error" 
            sx={{ mt: 2, mb: 2 }}
            onClose={() => setSearchError(null)}
          >
            <AlertTitle>Search Error</AlertTitle>
            {searchError}
          </Alert>
        </Collapse>
      )}
      
      {results?.products.length === 0 && !loading && (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            p: 3, 
            my: 2,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1
          }}
        >
          <InfoIcon color="info" sx={{ fontSize: 40, mb: 2 }} />
          {searchError ? (
            <Typography variant="body1" color="error">
              {searchError}
            </Typography>
          ) : (
            <>
              <Typography variant="h6">
                No products found matching your criteria
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search terms or filters
              </Typography>
            </>
          )}
        </Box>
      )}
      
      {/* Add this below the search components */}
      <style>{cardAnimationKeyframes}</style>
    </Box>
  );
};

export default SearchPage; 