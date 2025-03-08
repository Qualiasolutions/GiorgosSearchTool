import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Rating,
  Tooltip
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  LocalOffer as LocalOfferIcon,
  Store as StoreIcon,
  LocalShipping as ShippingIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isFavorite, onFavoriteToggle }) => {
  // Format price with currency symbol
  const formatPrice = (price: number, currency: string = 'USD') => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CNY: '¥',
      INR: '₹',
      RUB: '₽',
    };
    
    const symbol = currencySymbols[currency] || '$';
    return `${symbol}${price.toFixed(2)}`;
  };
  
  // Calculate deal badge color and text
  const getDealBadge = () => {
    if (!product.discount_percentage && !product.deal_score) return null;
    
    // Use discount percentage if available
    if (product.discount_percentage && product.discount_percentage > 0) {
      const color = product.discount_percentage > 20 ? 'error' : 'warning';
      return (
        <Chip 
          icon={<LocalOfferIcon />}
          label={`${Math.round(product.discount_percentage)}% OFF`} 
          color={color}
          size="small"
          sx={{ position: 'absolute', top: 8, left: 8 }}
        />
      );
    }
    
    // Otherwise use deal score if available
    if (product.deal_score && product.deal_score > 60) {
      let color: 'success' | 'warning' | 'default' = 'default';
      let label = 'Good deal';
      
      if (product.deal_score > 80) {
        color = 'success';
        label = 'Great deal';
      } else if (product.deal_score > 70) {
        color = 'warning';
        label = 'Good deal';
      }
      
      return (
        <Chip 
          icon={<LocalOfferIcon />}
          label={label}
          color={color}
          size="small"
          sx={{ position: 'absolute', top: 8, left: 8 }}
        />
      );
    }
    
    return null;
  };

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative',
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px'
      }
    }}>
      {/* Deal badge */}
      {getDealBadge()}
      
      {/* Favorite button */}
      <IconButton
        sx={{ position: 'absolute', top: 8, right: 8 }}
        onClick={onFavoriteToggle}
        color="primary"
      >
        {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
      </IconButton>
      
      {/* Main image */}
      <CardMedia
        component="img"
        height="180"
        image={product.image || 'https://via.placeholder.com/300x300?text=No+Image'}
        alt={product.title}
        sx={{ objectFit: 'contain', p: 2 }}
      />
      
      {/* Content */}
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Title */}
        <Tooltip title={product.title}>
          <Typography 
            gutterBottom 
            variant="subtitle1" 
            component="div" 
            sx={{
              height: '2.4em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              fontWeight: 500
            }}
          >
            {product.title}
          </Typography>
        </Tooltip>
        
        {/* Price section */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1, mt: 2 }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
            {formatPrice(product.price, product.currency)}
          </Typography>
          
          {product.original_price && product.original_price > product.price && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1, textDecoration: 'line-through' }}>
              {formatPrice(product.original_price, product.currency)}
            </Typography>
          )}
        </Box>
        
        {/* Rating */}
        {product.rating && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating 
              value={product.rating} 
              precision={0.1} 
              size="small" 
              readOnly 
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
              ({product.review_count || 0})
            </Typography>
          </Box>
        )}
        
        {/* Store and shipping badges */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
          <Chip 
            icon={<StoreIcon />} 
            label={product.site.charAt(0).toUpperCase() + product.site.slice(1)} 
            size="small" 
            variant="outlined"
          />
          
          {product.free_shipping && (
            <Chip 
              icon={<ShippingIcon />} 
              label="Free Shipping" 
              size="small" 
              color="success"
              variant="outlined"
            />
          )}
          
          {product.source_count && product.source_count > 1 && (
            <Tooltip title="Available on multiple sites">
              <Chip 
                icon={<VerifiedIcon />} 
                label={`${product.source_count} sources`}
                size="small"
                color="info"
                variant="outlined"
              />
            </Tooltip>
          )}
        </Box>
      </CardContent>
      
      {/* Action button */}
      <Box sx={{ p: 2, pt: 0 }}>
        <Button 
          variant="contained" 
          fullWidth
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          onClick={(e) => {
            // Verify URL before opening
            if (!product.url || !product.url.startsWith('http')) {
              e.preventDefault();
              alert('Invalid product URL');
            }
          }}
        >
          View Deal
        </Button>
      </Box>
    </Card>
  );
};

export default ProductCard; 