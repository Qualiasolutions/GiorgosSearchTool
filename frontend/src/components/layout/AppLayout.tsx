import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Divider,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  History as HistoryIcon,
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Translate as TranslateIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  VerifiedUser as LogoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { LanguageContext } from '../../App';
import { getTranslation } from '../../utils/translations';

// Drawer width for desktop
const DRAWER_WIDTH = 240;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { language, setLanguage } = useContext(LanguageContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleLanguageChange = (e: SelectChangeEvent<string>) => {
    setLanguage(e.target.value as 'en' | 'el');
  };
  
  const handleCloseDrawer = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Getting current page title
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/favorites':
        return getTranslation('favorites', language);
      case '/history':
        return getTranslation('history', language);
      default:
        return getTranslation('search', language);
    }
  };
  
  const drawer = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      bgcolor: theme.palette.primary.main,
      color: 'white'
    }}>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LogoIcon sx={{ fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold">
            Giorgos Search
          </Typography>
        </Box>
        {isMobile && (
          <IconButton 
            onClick={handleDrawerToggle} 
            sx={{ color: 'white' }}
            edge="end"
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      
      <List sx={{ flexGrow: 1, pt: 2 }}>
        {[
          { text: getTranslation('search', language), icon: <SearchIcon />, path: '/' },
          { text: getTranslation('favorites', language), icon: <FavoriteIcon />, path: '/favorites' },
          { text: getTranslation('history', language), icon: <HistoryIcon />, path: '/history' },
        ].map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                component={Link} 
                to={item.path}
                selected={isActive}
                onClick={handleCloseDrawer}
                sx={{
                  py: 1.5,
                  borderRadius: '0 24px 24px 0',
                  ml: 1,
                  mr: 2,
                  mb: 1,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(255,255,255,0.15)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.25)',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 45 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TranslateIcon sx={{ mr: 1, opacity: 0.7 }} />
          <Select
            value={language}
            onChange={handleLanguageChange}
            variant="standard"
            size="small"
            sx={{ 
              color: 'white',
              '& .MuiSelect-select': { py: 0 },
              '& .MuiInput-underline:before': { borderColor: 'rgba(255,255,255,0.3)' },
              '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderColor: 'rgba(255,255,255,0.5)' },
              '& .MuiSvgIcon-root': { color: 'white' }
            }}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="el">Ελληνικά</MenuItem>
          </Select>
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            &copy; 2025 Qualia Solutions
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App bar - shown only on mobile */}
      {isMobile && (
        <AppBar 
          position="fixed" 
          sx={{ 
            width: '100%',
            zIndex: theme.zIndex.drawer + 1,
            bgcolor: theme.palette.primary.main,
            boxShadow: 3
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {getPageTitle()}
            </Typography>
            
            {/* Language selector for mobile */}
            <Tooltip title={language === 'en' ? 'Change to Greek' : 'Αλλαγή στα Αγγλικά'}>
              <IconButton 
                color="inherit"
                onClick={() => setLanguage(language === 'en' ? 'el' : 'en')}
                size="small"
              >
                <TranslateIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar - persistent on desktop, temporary on mobile */}
      <Box
        component="nav"
        sx={{ 
          width: { md: DRAWER_WIDTH }, 
          flexShrink: { md: 0 } 
        }}
      >
        {/* Mobile drawer */}
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better mobile performance
            }}
            PaperProps={{
              sx: {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH,
                borderRadius: 0, // Override theme for mobile
              }
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          // Desktop drawer
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: DRAWER_WIDTH,
                borderRight: 'none',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          height: '100vh',
          overflow: 'auto',
          bgcolor: theme.palette.background.default,
          pt: { xs: 8, md: 3 },
          pb: 4,
          px: { xs: 2, sm: 3, md: 4 }
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AppLayout; 