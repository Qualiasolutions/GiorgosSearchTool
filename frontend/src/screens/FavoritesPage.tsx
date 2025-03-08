import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Button, 
  IconButton, 
  Chip, 
  Divider,
  Alert,
  useTheme,
  Paper,
  Rating,
  CardActionArea
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon
} from '@mui/icons-material';
import { Product } from '../types';

interface FavoritesPageProps {
  favorites: Product[];
  removeFromFavorites: (productId: string) => void;
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({ favorites, removeFromFavorites }) => {
  const theme = useTheme();

  if (favorites.length === 0) {
    return (
      <Box sx={{ mt: 4, px: { xs: 2, sm: 0 } }}>
        <Paper 
          elevation={2}
          sx={{ 
            p: 4, 
            borderRadius: 2,
            backgroundColor: 'rgba(0, 164, 172, 0.05)',
            border: '1px solid',
            borderColor: 'rgba(0, 164, 172, 0.2)'
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
            No Favorites Found
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            You don't have any favorite products yet. Search for products and save them to see them here.
          </Alert>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 0 } }}>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          backgroundColor: 'rgba(0, 164, 172, 0.05)',
          borderLeft: '4px solid',
          borderColor: theme.palette.primary.main
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
          Your Favorite Products
        </Typography>
        <Chip 
          label={`${favorites.length} ${favorites.length === 1 ? 'item' : 'items'}`} 
          color="primary" 
          sx={{ mt: { xs: 1, sm: 0 } }}
        />
      </Paper>
      
      <Grid container spacing={3}>
        {favorites.map(product => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                position: 'relative',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                },
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <IconButton
                sx={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8,
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 1)',
                  }
                }}
                onClick={() => removeFromFavorites(product.id)}
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
              
              <CardActionArea href={product.url} target="_blank" rel="noopener noreferrer">
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.image}
                    alt={product.title}
                    sx={{ 
                      objectFit: 'contain', 
                      p: 2,
                      backgroundColor: '#f5f5f5' 
                    }}
                  />
                  
                  {product.discount_percentage && (
                    <Chip 
                      label={`${product.discount_percentage}% OFF`}
                      color="error"
                      size="small"
                      sx={{ 
                        position: 'absolute', 
                        bottom: 8, 
                        left: 8,
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                </Box>
              </CardActionArea>
              
              <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                <Typography 
                  gutterBottom 
                  variant="subtitle1" 
                  component="div" 
                  sx={{
                    fontWeight: 600,
                    height: '3em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {product.normalized_title || product.title}
                </Typography>
                
                {product.rating && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={product.rating} precision={0.5} size="small" readOnly />
                    {product.review_count && (
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        ({product.review_count})
                      </Typography>
                    )}
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                    ${product.price}
                  </Typography>
                  {product.original_price && (
                    <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                      ${product.original_price}
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    label={product.site.toUpperCase()} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(0, 164, 172, 0.1)', color: theme.palette.primary.dark }}
                  />
                  
                  {product.shipping_cost === 0 && (
                    <Chip 
                      icon={<LocalShippingIcon fontSize="small" />} 
                      label="FREE SHIPPING" 
                      size="small" 
                      color="success" 
                    />
                  )}
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Saved on: {new Date(product.saved_at || Date.now()).toLocaleDateString()}
                </Typography>
              </CardContent>
              
              <Box sx={{ p: 2, pt: 0 }}>
                <Button 
                  variant="contained" 
                  fullWidth
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<ShoppingCartIcon />}
                  sx={{ 
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  View Product
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FavoritesPage; 