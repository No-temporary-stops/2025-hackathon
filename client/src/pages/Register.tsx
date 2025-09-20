import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  School,
  ChildCare,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'teacher' | 'parent' | 'student';
  studentId?: string;
  childName?: string;
  grade?: string;
  subjects?: string[];
}

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: {
      role: 'student',
      subjects: [],
    },
  });

  const watchedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    
    if (data.password !== data.confirmPassword) {
      setError('密碼確認不一致');
      return;
    }

    const userData = {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      ...(data.role === 'student' && { studentId: data.studentId, grade: data.grade }),
      ...(data.role === 'parent' && { childName: data.childName }),
      ...(data.role === 'teacher' && { subjects: data.subjects || [] }),
    };

    const success = await registerUser(userData);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'teacher': return <School />;
      case 'parent': return <ChildCare />;
      case 'student': return <Person />;
      default: return <Person />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'teacher': return '老師';
      case 'parent': return '家長';
      case 'student': return '學生';
      default: return role;
    }
  };

  const gradeOptions = [
    '一年級', '二年級', '三年級', '四年級', '五年級', '六年級',
    '七年級', '八年級', '九年級', '十年級', '十一年級', '十二年級'
  ];

  const subjectOptions = [
    '國語', '數學', '英語', '自然科學', '社會', '體育',
    '音樂', '美術', '電腦', '健康教育', '生活', '綜合活動'
  ];

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 3,
            }}
          >
            <School sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography component="h1" variant="h4" fontWeight="bold">
              師生通訊軟體
            </Typography>
          </Box>

          <Typography component="h2" variant="h5" gutterBottom>
            創建新帳戶
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ width: '100%' }}
          >
            <TextField
              margin="normal"
              fullWidth
              id="name"
              label="姓名"
              autoComplete="name"
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
              }}
              {...register('name', {
                required: '請輸入姓名',
                minLength: {
                  value: 2,
                  message: '姓名至少需要2個字符',
                },
              })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />

            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="電子郵件"
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
              {...register('email', {
                required: '請輸入電子郵件',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '請輸入有效的電子郵件格式',
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">身份</InputLabel>
              <Controller
                name="role"
                control={control}
                rules={{ required: '請選擇您的身份' }}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="role-label"
                    label="身份"
                    startAdornment={
                      <InputAdornment position="start">
                        {getRoleIcon(field.value)}
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="student">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person />
                        學生
                      </Box>
                    </MenuItem>
                    <MenuItem value="parent">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ChildCare />
                        家長
                      </Box>
                    </MenuItem>
                    <MenuItem value="teacher">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <School />
                        老師
                      </Box>
                    </MenuItem>
                  </Select>
                )}
              />
            </FormControl>

            {watchedRole === 'student' && (
              <>
                <TextField
                  margin="normal"
                  fullWidth
                  id="studentId"
                  label="學號"
                  {...register('studentId', {
                    required: '請輸入學號',
                  })}
                  error={!!errors.studentId}
                  helperText={errors.studentId?.message}
                />

                <FormControl fullWidth margin="normal">
                  <InputLabel id="grade-label">年級</InputLabel>
                  <Controller
                    name="grade"
                    control={control}
                    rules={{ required: '請選擇年級' }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        labelId="grade-label"
                        label="年級"
                      >
                        {gradeOptions.map((grade) => (
                          <MenuItem key={grade} value={grade}>
                            {grade}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </>
            )}

            {watchedRole === 'parent' && (
              <TextField
                margin="normal"
                fullWidth
                id="childName"
                label="子女姓名"
                {...register('childName', {
                  required: '請輸入子女姓名',
                })}
                error={!!errors.childName}
                helperText={errors.childName?.message}
              />
            )}

            {watchedRole === 'teacher' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  教學科目 (可多選)
                </Typography>
                <Controller
                  name="subjects"
                  control={control}
                  render={({ field }) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {subjectOptions.map((subject) => (
                        <Chip
                          key={subject}
                          label={subject}
                          onClick={() => {
                            const currentSubjects = field.value || [];
                            const newSubjects = currentSubjects.includes(subject)
                              ? currentSubjects.filter((s) => s !== subject)
                              : [...currentSubjects, subject];
                            field.onChange(newSubjects);
                          }}
                          color={field.value?.includes(subject) ? 'primary' : 'default'}
                          variant={field.value?.includes(subject) ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Box>
                  )}
                />
              </Box>
            )}

            <TextField
              margin="normal"
              fullWidth
              label="密碼"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              {...register('password', {
                required: '請輸入密碼',
                minLength: {
                  value: 6,
                  message: '密碼至少需要6個字符',
                },
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <TextField
              margin="normal"
              fullWidth
              label="確認密碼"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleToggleConfirmPasswordVisibility}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              {...register('confirmPassword', {
                required: '請確認密碼',
              })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? '註冊中...' : '註冊'}
            </Button>

            <Box textAlign="center">
              <Typography variant="body2">
                已經有帳戶？{' '}
                <Link component={RouterLink} to="/login">
                  立即登入
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
