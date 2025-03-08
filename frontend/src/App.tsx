import React, { useState, createContext, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, Typography, Fade } from '@mui/material';
import SearchPage from './screens/SearchPage';
import FavoritesPage from './screens/FavoritesPage';
import HistoryPage from './screens/HistoryPage';
import { Product, SearchHistory } from './types';
import AppLayout from './components/layout/AppLayout';
import { Language } from './utils/translations';

// Create a language context
export const LanguageContext = createContext<{
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
}>({
  language: 'en',
  setLanguage: () => {},
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#2c3e50',
    },
    secondary: {
      main: '#e74c3c',
    },
    background: {
      default: '#ecf0f1',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
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
          backgroundColor: '#2c3e50',
          zIndex: 9999,
          color: 'white',
          textAlign: 'center',
          padding: 3
        }}
      >
        <Typography variant="h3" fontWeight="bold" sx={{ mb: 3 }}>
          Giorgos's Search Tool
        </Typography>
        
        <Box sx={{ mb: 4, maxWidth: 300 }}>
          <img 
            src="https://images.squarespace-cdn.com/content/v1/65bf52f873aac538961445c5/19d16cc5-aa83-437c-9c2a-61de5268d5bf/Untitled+design+-+2025-01-19T070746.544.png?format=1500w" 
            alt="Qualia Solutions" 
            style={{ width: '100%', height: 'auto' }}
          />
        </Box>
        
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Powered by Qualia Solutions
        </Typography>
      </Box>
    </Fade>
  );
};

const App: React.FC = () => {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [showSplash, setShowSplash] = useState(true);
  
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