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
  Alert,
  useTheme,
  Tooltip,
  Card,
  CardContent,
  Stack,
  Skeleton
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Delete as DeleteIcon, 
  History as HistoryIcon,
  AccessTime as AccessTimeIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { SearchHistory } from '../types';
import { useNavigate } from 'react-router-dom';

interface HistoryPageProps {
  searchHistory: SearchHistory[];
  clearSearchHistory: () => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ searchHistory, clearSearchHistory }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleRepeatSearch = (historyItem: SearchHistory) => {
    // In a real implementation, this would set the search parameters and navigate to the search page
    navigate('/', { state: { searchParams: historyItem } });
  };

  if (searchHistory.length === 0) {
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <HistoryIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
            <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
              Search History
            </Typography>
          </Box>
          <Alert severity="info">
            Your search history is empty. Start searching for products to see your history.
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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HistoryIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
            Search History
          </Typography>
        </Box>
        
        <Button 
          variant="outlined" 
          color="error" 
          onClick={clearSearchHistory}
          startIcon={<DeleteIcon />}
          sx={{ 
            mt: { xs: 2, sm: 0 },
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          Clear History
        </Button>
      </Paper>
      
      <Stack spacing={2}>
        {searchHistory.map((item, index) => (
          <Card 
            key={index}
            sx={{ 
              borderRadius: 2,
              overflow: 'visible',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: 3
              }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                mb: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Tooltip title="Search query">
                    <SearchIcon color="primary" sx={{ mr: 1.5 }} />
                  </Tooltip>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: { xs: '240px', sm: '350px', md: '500px' }
                    }}
                  >
                    {item.query}
                  </Typography>
                </Box>
                
                <Button 
                  variant="contained" 
                  size="small" 
                  onClick={() => handleRepeatSearch(item)}
                  startIcon={<SearchIcon />}
                  sx={{ 
                    ml: { sm: 2 }, 
                    mt: { xs: 1, sm: 0 },
                    borderRadius: 2,
                    textTransform: 'none',
                    alignSelf: { xs: 'flex-end', sm: 'center' }
                  }}
                >
                  Search Again
                </Button>
              </Box>
              
              <Divider sx={{ my: 1.5 }} />
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: { xs: 'flex-start', sm: 'flex-start' }
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  mr: { sm: 2 },
                  mb: { xs: 1, sm: 0 }
                }}>
                  <Tooltip title="Search time">
                    <AccessTimeIcon fontSize="small" sx={{ color: theme.palette.text.secondary, mr: 0.5 }} />
                  </Tooltip>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(item.timestamp).toLocaleString()}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  flexGrow: 1
                }}>
                  <Tooltip title="Results found">
                    <FilterListIcon fontSize="small" sx={{ color: theme.palette.text.secondary, mr: 0.5 }} />
                  </Tooltip>
                  <Typography variant="body2" color="text.secondary">
                    {item.results_count !== undefined ? `${item.results_count} results` : 'Results unknown'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {item.region && item.region !== 'global' && (
                  <Chip 
                    size="small" 
                    label={`Region: ${item.region}`} 
                    sx={{ bgcolor: 'rgba(0, 164, 172, 0.1)', color: theme.palette.primary.dark }}
                  />
                )}
                
                {(item.min_price || item.max_price) && (
                  <Chip 
                    size="small" 
                    label={`Price: ${item.min_price || '0'} - ${item.max_price || '∞'}`} 
                    sx={{ bgcolor: 'rgba(0, 164, 172, 0.1)', color: theme.palette.primary.dark }}
                  />
                )}
                
                {item.sort_by && (
                  <Chip 
                    size="small" 
                    label={`Sort: ${item.sort_by.replace('_', ' ')}`} 
                    sx={{ bgcolor: 'rgba(0, 164, 172, 0.1)', color: theme.palette.primary.dark }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default HistoryPage; 