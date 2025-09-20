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
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Notifications,
  Message,
  Forum,
  ExitToApp,
  School,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { useSemester } from '../contexts/SemesterContext';
import { api } from '../services/api';

const Navbar: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const { selectedSemester, setSelectedSemester, semesters } = useSemester();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch unread message count
  const { data: conversationsData } = useQuery(
    ['conversations', selectedSemester],
    async () => {
      if (!selectedSemester) return [];
      const response = await api.get(`/messages/conversations/${selectedSemester}`);
      return response.data.conversations;
    },
    {
      enabled: !!selectedSemester,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const unreadCount = conversationsData?.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0) || 0;

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

  return (
    <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
      <Toolbar>
        <Button
          color="inherit"
          onClick={() => handleNavigation('/dashboard')}
          sx={{ 
            flexGrow: 1, 
            fontWeight: 'bold',
            fontSize: '1.25rem',
            justifyContent: 'flex-start',
            textTransform: 'none',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          師生通訊軟體
        </Button>

        {/* Desktop Navigation */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={
              <Badge badgeContent={unreadCount > 0 ? unreadCount : null} color="error" max={99}>
                <Message />
              </Badge>
            }
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
      >
        <MenuItem disabled>
          <Typography variant="body2" color="text.secondary">
            {user?.name} ({getRoleText(user?.role || '')})
          </Typography>
        </MenuItem>
        
        {/* Semester Selection */}
        {semesters && semesters.length > 0 && (
          <>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                選擇學期
              </Typography>
            </MenuItem>
            {semesters.map((semester: any) => (
              <MenuItem 
                key={semester._id} 
                onClick={() => {
                  setSelectedSemester(semester._id);
                  handleMenuClose();
                }}
                sx={{ 
                  bgcolor: selectedSemester === semester._id ? 'action.selected' : 'transparent',
                  pl: 4
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <School fontSize="small" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">
                      {semester.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {semester.schoolYear}
                    </Typography>
                  </Box>
                  {semester.isCurrentlyActive && (
                    <Chip
                      label="活躍"
                      size="small"
                      color="success"
                    />
                  )}
                </Box>
              </MenuItem>
            ))}
          </>
        )}
        
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
      >
        <MenuItem onClick={() => handleNavigation('/messages')}>
          <Badge badgeContent={unreadCount > 0 ? unreadCount : null} color="error" max={99} sx={{ mr: 1 }}>
            <Message />
          </Badge>
          訊息
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/discussions')}>
          <Forum sx={{ mr: 1 }} />
          討論區
        </MenuItem>
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
