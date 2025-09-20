import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Box,
  Grid,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Person,
  Email,
  School,
  ChildCare,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ProfileFormData {
  name: string;
  email: string;
  avatar?: string;
}

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      avatar: user?.avatar || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      const success = await updateProfile(data);
      if (success) {
        setIsEditing(false);
      }
    } catch (error) {
      toast.error('更新個人資料失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'teacher': return '老師';
      case 'parent': return '家長';
      case 'student': return '學生';
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'teacher': return <School />;
      case 'parent': return <ChildCare />;
      case 'student': return <Person />;
      default: return <Person />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher': return 'primary';
      case 'parent': return 'secondary';
      case 'student': return 'success';
      default: return 'default';
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">無法載入用戶資訊</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        個人資料
      </Typography>

      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
          <Avatar
            src={user.avatar}
            sx={{ width: 100, height: 100, fontSize: 40 }}
          >
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom>
              {user.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={getRoleIcon(user.role)}
                label={getRoleText(user.role)}
                color={getRoleColor(user.role) as any}
                variant="filled"
              />
              <Typography variant="body2" color="text.secondary">
                註冊時間：{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('zh-TW') : '未知'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="姓名"
                disabled={!isEditing}
                {...register('name', {
                  required: '請輸入姓名',
                  minLength: {
                    value: 2,
                    message: '姓名至少需要2個字符',
                  },
                })}
                error={!!errors.name}
                helperText={errors.name?.message}
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="電子郵件"
                type="email"
                disabled={!isEditing}
                {...register('email', {
                  required: '請輸入電子郵件',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '請輸入有效的電子郵件格式',
                  },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="頭像網址 (可選)"
                disabled={!isEditing}
                placeholder="https://example.com/avatar.jpg"
                {...register('avatar')}
                helperText="請輸入有效的圖片網址"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {isEditing ? (
                  <>
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      <Cancel sx={{ mr: 1 }} />
                      取消
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isLoading}
                    >
                      <Save sx={{ mr: 1 }} />
                      {isLoading ? '儲存中...' : '儲存'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit sx={{ mr: 1 }} />
                    編輯個人資料
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </form>

        {/* Additional User Information */}
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h6" gutterBottom>
          帳戶資訊
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                用戶角色
              </Typography>
              <Chip
                icon={getRoleIcon(user.role)}
                label={getRoleText(user.role)}
                color={getRoleColor(user.role) as any}
                variant="outlined"
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                最後登入
              </Typography>
              <Typography variant="body1">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleString('zh-TW') : '未知'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Role-specific Information */}
        {user.role === 'student' && (
          <>
            <Divider sx={{ my: 4 }} />
            <Typography variant="h6" gutterBottom>
              學生資訊
            </Typography>
            <Alert severity="info">
              學生相關資訊由學校管理員維護，如需修改請聯繫老師或管理員。
            </Alert>
          </>
        )}

        {user.role === 'parent' && (
          <>
            <Divider sx={{ my: 4 }} />
            <Typography variant="h6" gutterBottom>
              家長資訊
            </Typography>
            <Alert severity="info">
              家長相關資訊由學校管理員維護，如需修改請聯繫老師或管理員。
            </Alert>
          </>
        )}

        {user.role === 'teacher' && (
          <>
            <Divider sx={{ my: 4 }} />
            <Typography variant="h6" gutterBottom>
              老師資訊
            </Typography>
            <Alert severity="info">
              老師相關資訊由學校管理員維護，如需修改請聯繫管理員。
            </Alert>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default Profile;
