import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Button, 
  Paper, 
  Divider, 
  Chip, 
  IconButton,
  Alert
} from '@mui/material';
import { Search as SearchIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { SearchHistory } from '../types';
import { useNavigate } from 'react-router-dom';

interface HistoryPageProps {
  searchHistory: SearchHistory[];
  clearSearchHistory: () => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ searchHistory, clearSearchHistory }) => {
  const navigate = useNavigate();

  const handleRepeatSearch = (historyItem: SearchHistory) => {
    // In a real implementation, this would set the search parameters and navigate to the search page
    navigate('/', { state: { searchParams: historyItem } });
  };

  if (searchHistory.length === 0) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="info">
          Your search history is empty. Start searching for products to see your history.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Your Search History
        </Typography>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={clearSearchHistory}
          startIcon={<DeleteIcon />}
        >
          Clear History
        </Button>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <List component={Paper} sx={{ bgcolor: 'background.paper' }}>
        {searchHistory.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <Divider />}
            <ListItem
              secondaryAction={
                <IconButton 
                  edge="end" 
                  aria-label="repeat search" 
                  onClick={() => handleRepeatSearch(item)}
                  color="primary"
                >
                  <SearchIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body1" fontWeight="bold">
                      {item.query}
                    </Typography>
                    {item.region && item.region !== 'global' && (
                      <Chip size="small" label={`Region: ${item.region}`} />
                    )}
                    {(item.min_price || item.max_price) && (
                      <Chip 
                        size="small" 
                        label={`Price: ${item.min_price || '0'} - ${item.max_price || '∞'}`} 
                      />
                    )}
                    {item.sort_by && (
                      <Chip size="small" label={`Sort: ${item.sort_by}`} />
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(item.timestamp).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.results_count !== undefined ? `${item.results_count} results` : 'Results unknown'}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default HistoryPage; 