import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Badge,
  Divider,
  Chip,
  ListSubheader,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Notifications,
  Message,
  Forum,
  ExitToApp,
  Event,
  School,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface Semester {
  _id: string;
  name: string;
  schoolYear: string;
  startDate: string;
  endDate: string;
  isCurrentlyActive: boolean;
}

const Navbar: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch user's semesters
  const { data: semestersData } = useQuery(
    'navbar-semesters',
    async () => {
      const response = await api.get('/semesters/my-semesters');
      return response.data.semesters;
    }
  );

  // Auto-select current active semester
  useEffect(() => {
    if (semestersData && !selectedSemester) {
      const activeSemester = semestersData.find((semester: Semester) => semester.isCurrentlyActive);
      if (activeSemester) {
        setSelectedSemester(activeSemester._id);
      } else if (semestersData.length > 0) {
        setSelectedSemester(semestersData[0]._id);
      }
    }
  }, [semestersData, selectedSemester]);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  const isActive = (path: string) => location.pathname === path;

  const getRoleText = (role: string) => {
    switch (role) {
      case 'teacher': return '老師';
      case 'parent': return '家長';
      case 'student': return '學生';
      default: return role;
    }
  };

  const handleSemesterChange = (semesterId: string) => {
    setSelectedSemester(semesterId);
    handleMenuClose();
    // Refresh dashboard if on dashboard page
    if (location.pathname === '/dashboard') {
      window.location.reload();
    }
  };

  const currentSemester = semestersData?.find((semester: Semester) => semester._id === selectedSemester);


  return (
    <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          onClick={() => handleNavigation('/dashboard')}
          sx={{ 
            flexGrow: 1, 
            fontWeight: 'bold',
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 }
          }}
        >
          師生通訊軟體
        </Typography>

        {/* Desktop Navigation */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<Message />}
            onClick={() => handleNavigation('/messages')}
            sx={{ 
              bgcolor: isActive('/messages') ? 'rgba(255,255,255,0.1)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            訊息
          </Button>
          
          <Button
            color="inherit"
            startIcon={<Forum />}
            onClick={() => handleNavigation('/discussions')}
            sx={{ 
              bgcolor: isActive('/discussions') ? 'rgba(255,255,255,0.1)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            討論區
          </Button>

          <Button
            color="inherit"
            startIcon={<Event />}
            onClick={() => handleNavigation('/calendar')}
            sx={{ 
              bgcolor: isActive('/calendar') ? 'rgba(255,255,255,0.1)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            行事曆
          </Button>

          <Button
            color="inherit"
            startIcon={<LinkIcon />}
            onClick={() => navigate('/links')}
            sx={{ 
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            常用連結
          </Button>

          <IconButton color="inherit">
            <Badge badgeContent={0} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Box>

        {/* Mobile Menu Button */}
        <IconButton
          size="large"
          edge="end"
          color="inherit"
          aria-label="menu"
          onClick={handleMobileMenuOpen}
          sx={{ display: { xs: 'block', md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      {/* Desktop Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 280 }
        }}
      >
        <MenuItem disabled>
          <Typography variant="body2" color="text.secondary">
            {user?.name} ({getRoleText(user?.role || '')})
          </Typography>
        </MenuItem>
        
        <Divider />
        
        <ListSubheader sx={{ bgcolor: 'background.paper' }}>
          <School sx={{ mr: 1, fontSize: 16 }} />
          選擇學期
        </ListSubheader>
        
        {semestersData?.map((semester: Semester) => (
          <MenuItem 
            key={semester._id} 
            onClick={() => handleSemesterChange(semester._id)}
            sx={{ 
              pl: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box>
              <Typography variant="body2">
                {semester.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {semester.schoolYear}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {semester._id === selectedSemester && (
                <Chip size="small" label="已選" color="primary" />
              )}
              {semester.isCurrentlyActive && (
                <Chip size="small" label="當前" color="success" />
              )}
            </Box>
          </MenuItem>
        ))}
        
        <Divider />
        
        <MenuItem onClick={() => handleNavigation('/profile')}>
          <AccountCircle sx={{ mr: 1 }} />
          個人資料
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ExitToApp sx={{ mr: 1 }} />
          登出
        </MenuItem>
      </Menu>

      {/* Mobile Menu */}
      <Menu
        anchorEl={mobileMenuAnchor}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 280 }
        }}
      >
        <MenuItem onClick={() => handleNavigation('/messages')}>
          <Message sx={{ mr: 1 }} />
          訊息
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/discussions')}>
          <Forum sx={{ mr: 1 }} />
          討論區
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/calendar')}>
          <Event sx={{ mr: 1 }} />
          行事曆
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/links')}>
          <LinkIcon sx={{ mr: 1 }} />
          常用連結
        </MenuItem>
        
        <Divider />
        
        <ListSubheader sx={{ bgcolor: 'background.paper' }}>
          <School sx={{ mr: 1, fontSize: 16 }} />
          選擇學期
        </ListSubheader>
        
        {semestersData?.map((semester: Semester) => (
          <MenuItem 
            key={semester._id} 
            onClick={() => handleSemesterChange(semester._id)}
            sx={{ 
              pl: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box>
              <Typography variant="body2">
                {semester.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {semester.schoolYear}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {semester._id === selectedSemester && (
                <Chip size="small" label="已選" color="primary" />
              )}
              {semester.isCurrentlyActive && (
                <Chip size="small" label="當前" color="success" />
              )}
            </Box>
          </MenuItem>
        ))}
        
        <Divider />
        
        <MenuItem onClick={() => handleNavigation('/profile')}>
          <AccountCircle sx={{ mr: 1 }} />
          個人資料
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ExitToApp sx={{ mr: 1 }} />
          登出
        </MenuItem>
      </Menu>

    </AppBar>
  );
};

export default Navbar;
