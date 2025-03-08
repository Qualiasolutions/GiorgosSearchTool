import React, { useState, createContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
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

const App: React.FC = () => {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  
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
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
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
      </ThemeProvider>
    </LanguageContext.Provider>
  );
};

export default App; 