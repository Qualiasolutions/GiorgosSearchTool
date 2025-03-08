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
  Alert 
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Product } from '../types';

interface FavoritesPageProps {
  favorites: Product[];
  removeFromFavorites: (productId: string) => void;
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({ favorites, removeFromFavorites }) => {
  if (favorites.length === 0) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="info">
          You don't have any favorite products yet. Search for products and save them to see them here.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Your Favorite Products ({favorites.length})
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        {favorites.map(product => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <IconButton
                sx={{ position: 'absolute', top: 8, right: 8 }}
                onClick={() => removeFromFavorites(product.id)}
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
              
              <CardMedia
                component="img"
                height="200"
                image={product.image}
                alt={product.title}
                sx={{ objectFit: 'contain', p: 2 }}
              />
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="div" noWrap>
                  {product.normalized_title || product.title}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h5" color="primary">
                    ${product.price}
                  </Typography>
                  {product.original_price && (
                    <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                      ${product.original_price}
                    </Typography>
                  )}
                </Box>
                
                {product.discount_percentage && (
                  <Chip 
                    label={`${product.discount_percentage}% OFF`}
                    color="secondary"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                )}
                
                <Typography variant="body2" color="text.secondary">
                  Saved on: {new Date(product.saved_at || Date.now()).toLocaleDateString()}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Chip label={product.site.toUpperCase()} size="small" />
                  {product.shipping_cost === 0 ? (
                    <Chip label="FREE SHIPPING" size="small" color="success" />
                  ) : (
                    <Typography variant="body2">
                      Shipping: ${product.shipping_cost}
                    </Typography>
                  )}
                </Box>
              </CardContent>
              
              <Box sx={{ p: 2, pt: 0 }}>
                <Button 
                  variant="outlined" 
                  fullWidth
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
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