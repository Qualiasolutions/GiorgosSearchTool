import React, { useState, ReactNode, useContext } from 'react';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Container, 
  useTheme,
  useMediaQuery,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  Paper
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Search as SearchIcon, 
  Favorite as FavoriteIcon, 
  History as HistoryIcon,
  Brightness4 as DarkModeIcon, 
  Brightness7 as LightModeIcon,
  Translate as TranslateIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { LanguageContext } from '../../App';
import { getTranslation } from '../../utils/translations';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { language, setLanguage } = useContext(LanguageContext);

  const menuItems = [
    { text: getTranslation('search', language), icon: <SearchIcon />, path: '/' },
    { text: getTranslation('favorites', language), icon: <FavoriteIcon />, path: '/favorites' },
    { text: getTranslation('history', language), icon: <HistoryIcon />, path: '/history' },
  ];

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const handleLanguageChange = (_event: React.MouseEvent<HTMLElement>, newLanguage: string | null) => {
    if (newLanguage) {
      setLanguage(newLanguage as 'en' | 'el');
    }
  };

  const getPageTitle = (): string => {
    switch (location.pathname) {
      case '/favorites':
        return getTranslation('favorites', language);
      case '/history':
        return getTranslation('history', language);
      default:
        return getTranslation('welcome', language);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Avatar 
            src="/logo.png" 
            alt="Logo"
            sx={{ width: 40, height: 40, mr: 2 }}
          >
            G
          </Avatar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            {getPageTitle()}
          </Typography>
          <ToggleButtonGroup
            value={language}
            exclusive
            onChange={handleLanguageChange}
            aria-label="language selector"
            size="small"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.15)', 
              borderRadius: 1,
              '& .MuiToggleButton-root': {
                color: 'white',
                border: 'none',
                '&.Mui-selected': {
                  bgcolor: 'rgba(255,255,255,0.25)',
                  color: 'white',
                }
              }
            }}
          >
            <ToggleButton value="en" aria-label="English">
              EN
            </ToggleButton>
            <ToggleButton value="el" aria-label="Greek">
              EL
            </ToggleButton>
          </ToggleButtonGroup>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', height: '100%', p: 2 }}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, 
              mb: 2, 
              borderRadius: 2, 
              bgcolor: theme.palette.primary.main,
              color: 'white'
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              {language === 'el' ? 'Γιώργος' : 'Giorgos'}
            </Typography>
            <Typography variant="body2">
              {language === 'el' ? 'Καλώς ήρθες!' : 'Welcome!'}
            </Typography>
          </Paper>
          <List>
            {menuItems.map((item) => (
              <ListItem 
                button 
                key={item.text} 
                onClick={() => handleNavigation(item.path)}
                selected={location.pathname === item.path}
                sx={{ 
                  borderRadius: 2, 
                  mb: 1,
                  '&.Mui-selected': {
                    bgcolor: `${theme.palette.primary.main}15`,
                    color: theme.palette.primary.main,
                    '& .MuiListItemIcon-root': {
                      color: theme.palette.primary.main
                    }
                  }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
            <TranslateIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {language === 'el' ? 'Ελληνικά' : 'English'}
            </Typography>
          </Box>
        </Box>
      </Drawer>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Container maxWidth="lg" sx={{ pt: 2 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default AppLayout; 