import React, { useState, createContext, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, Typography, Fade } from '@mui/material';
import SearchPage from './screens/SearchPage';
import FavoritesPage from './screens/FavoritesPage';
import HistoryPage from './screens/HistoryPage';
import { Product, SearchHistory } from './types';
import AppLayout from './components/layout/AppLayout';
import { Language } from './utils/translations';

// Local storage keys
const STORAGE_KEYS = {
  FAVORITES: 'giorgos_power_search_favorites',
  HISTORY: 'giorgos_power_search_history',
  LANGUAGE: 'giorgos_power_search_language'
};

// Create a language context
export const LanguageContext = createContext<{
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
}>({
  language: 'en',
  setLanguage: () => {},
});

// Create a theme with the new #00A4AC primary color
const theme = createTheme({
  palette: {
    primary: {
      main: '#00A4AC',
      light: '#4DD6DE',
      dark: '#00757C',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#e74c3c',
      light: '#ff7e61',
      dark: '#b0160a',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f0f5f5',
      paper: '#ffffff',
    },
    info: {
      main: '#00A4AC',
    },
    error: {
      main: '#e74c3c',
    },
    warning: {
      main: '#ff9800',
    },
    success: {
      main: '#4caf50',
    }
  },
  typography: {
    fontFamily: [
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,164,172,0.2)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          '&:hover': {
            backgroundColor: '#00B8C1',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,164,172,0.15)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
        colorPrimary: {
          backgroundColor: 'rgba(0,164,172,0.1)',
          color: '#00A4AC',
          '&:hover': {
            backgroundColor: 'rgba(0,164,172,0.2)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&.Mui-focused fieldset': {
              borderColor: '#00A4AC',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: '0 16px 16px 0',
        },
      },
    },
    MuiPagination: {
      styleOverrides: {
        root: {
          '& .MuiPaginationItem-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
});

// SplashScreen component
const SplashScreen: React.FC<{ onFinished: () => void }> = ({ onFinished }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinished();
    }, 3000); // Display splash screen for 3 seconds
    
    return () => clearTimeout(timer);
  }, [onFinished]);
  
  return (
    <Fade in={true} timeout={1000}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #00A4AC 0%, #005F62 100%)',
          zIndex: 9999,
          color: 'white',
          textAlign: 'center',
          padding: 3
        }}
      >
        <Typography variant="h3" fontWeight="bold" sx={{ mb: 3, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          Giorgos's Search Tool
        </Typography>
        
        <Box sx={{ mb: 4, maxWidth: 300, animation: 'pulse 2s infinite', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', borderRadius: '50%', p: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
          <img 
            src="https://images.squarespace-cdn.com/content/v1/65bf52f873aac538961445c5/19d16cc5-aa83-437c-9c2a-61de5268d5bf/Untitled+design+-+2025-01-19T070746.544.png?format=1500w" 
            alt="Qualia Solutions" 
            style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}
          />
        </Box>
        
        <Typography variant="subtitle1" sx={{ mt: 2, letterSpacing: 1, opacity: 0.9 }}>
          Powered by Qualia Solutions
        </Typography>

        <Box sx={{ 
          position: 'absolute', 
          bottom: 20, 
          left: 0, 
          width: '100%', 
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Box sx={{ 
            width: 40, 
            height: 4, 
            bgcolor: 'white', 
            borderRadius: 2,
            opacity: 0.7,
            animation: 'loading 2s infinite'
          }} />
        </Box>

        <style>
          {`
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
            @keyframes loading {
              0% { width: 40px; }
              50% { width: 80px; }
              100% { width: 40px; }
            }
          `}
        </style>
      </Box>
    </Fade>
  );
};

// Helper functions for local storage
const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

const saveToLocalStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
};

const App: React.FC = () => {
  // Initialize state from localStorage
  const [favorites, setFavorites] = useState<Product[]>(() => 
    loadFromLocalStorage<Product[]>(STORAGE_KEYS.FAVORITES, [])
  );
  
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>(() => 
    loadFromLocalStorage<SearchHistory[]>(STORAGE_KEYS.HISTORY, [])
  );
  
  const [language, setLanguage] = useState<Language>(() => 
    loadFromLocalStorage<Language>(STORAGE_KEYS.LANGUAGE, 'en')
  );
  
  const [showSplash, setShowSplash] = useState(true);
  
  // Save favorites to localStorage whenever they change
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.FAVORITES, favorites);
  }, [favorites]);
  
  // Save search history to localStorage whenever it changes
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.HISTORY, searchHistory);
  }, [searchHistory]);
  
  // Save language preference to localStorage whenever it changes
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.LANGUAGE, language);
  }, [language]);
  
  const addToFavorites = (product: Product) => {
    setFavorites(prev => {
      if (prev.some(p => p.id === product.id)) {
        return prev;
      }
      return [...prev, { ...product, saved_at: new Date().toISOString() }];
    });
  };
  
  const removeFromFavorites = (productId: string) => {
    setFavorites(prev => prev.filter(p => p.id !== productId));
  };
  
  const addToSearchHistory = (historyItem: SearchHistory) => {
    setSearchHistory(prev => [historyItem, ...prev]);
  };
  
  const clearSearchHistory = () => {
    setSearchHistory([]);
  };
  
  const handleSplashScreenFinished = () => {
    setShowSplash(false);
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        
        {showSplash && <SplashScreen onFinished={handleSplashScreenFinished} />}
        
        <Fade in={!showSplash}>
          <div>
            <AppLayout>
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <SearchPage 
                      addToFavorites={addToFavorites}
                      favorites={favorites}
                      addToSearchHistory={addToSearchHistory}
                    />
                  } 
                />
                <Route 
                  path="/favorites" 
                  element={
                    <FavoritesPage 
                      favorites={favorites}
                      removeFromFavorites={removeFromFavorites}
                    />
                  } 
                />
                <Route 
                  path="/history" 
                  element={
                    <HistoryPage 
                      searchHistory={searchHistory}
                      clearSearchHistory={clearSearchHistory}
                    />
                  } 
                />
              </Routes>
            </AppLayout>
          </div>
        </Fade>
      </ThemeProvider>
    </LanguageContext.Provider>
  );
};

export default App; 