import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Message,
  Forum,
  School,
  TrendingUp,
  Notifications,
  Add,
  ChevronRight,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface Semester {
  _id: string;
  name: string;
  schoolYear: string;
  startDate: string;
  endDate: string;
  isCurrentlyActive: boolean;
  priority: string;
  participants: Array<{
    user: {
      _id: string;
      name: string;
      avatar: string;
      role: string;
    };
    role: string;
  }>;
}

interface Conversation {
  user: {
    _id: string;
    name: string;
    avatar: string;
    role: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
}

interface Discussion {
  _id: string;
  title: string;
  author: {
    name: string;
    avatar: string;
  };
  createdAt: string;
  replies: Array<{ author: { name: string } }>;
  isPinned: boolean;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

  // Fetch user's semesters
  const { data: semestersData, isLoading: semestersLoading } = useQuery(
    'semesters',
    async () => {
      const response = await api.get('/semesters/my-semesters');
      return response.data.semesters;
    }
  );

  // Fetch conversations for selected semester
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery(
    ['conversations', selectedSemester],
    async () => {
      if (!selectedSemester) return [];
      const response = await api.get(`/messages/conversations/${selectedSemester}`);
      return response.data.conversations;
    },
    {
      enabled: !!selectedSemester,
    }
  );

  // Fetch recent discussions for selected semester
  const { data: discussionsData, isLoading: discussionsLoading } = useQuery(
    ['discussions', selectedSemester],
    async () => {
      if (!selectedSemester) return [];
      const response = await api.get(`/discussions/semester/${selectedSemester}?limit=5`);
      return response.data.discussions;
    },
    {
      enabled: !!selectedSemester,
    }
  );

  // Set first active semester as default
  useEffect(() => {
    if (semestersData && !selectedSemester) {
      const activeSemester = semestersData.find((s: Semester) => s.isCurrentlyActive);
      if (activeSemester) {
        setSelectedSemester(activeSemester._id);
      } else if (semestersData.length > 0) {
        setSelectedSemester(semestersData[0]._id);
      }
    }
  }, [semestersData, selectedSemester]);

  const getRoleText = (role: string) => {
    switch (role) {
      case 'teacher': return '老師';
      case 'parent': return '家長';
      case 'student': return '學生';
      default: return role;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (semestersLoading) {
    return <LoadingSpinner message="載入儀表板中..." />;
  }

  const currentSemester = semestersData?.find((s: Semester) => s._id === selectedSemester);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        歡迎回來，{user?.name}！
      </Typography>

      <Grid container spacing={3}>
        {/* Semester Selection */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                選擇學期
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {semestersData?.map((semester: Semester) => (
                  <Chip
                    key={semester._id}
                    label={`${semester.name} (${semester.schoolYear})`}
                    color={semester._id === selectedSemester ? 'primary' : 'default'}
                    variant={semester._id === selectedSemester ? 'filled' : 'outlined'}
                    onClick={() => setSelectedSemester(semester._id)}
                    sx={{
                      bgcolor: semester.isCurrentlyActive ? 'success.light' : undefined,
                      color: semester.isCurrentlyActive ? 'success.contrastText' : undefined,
                    }}
                  />
                ))}
              </Box>
              {currentSemester && (
                <Alert severity={currentSemester.isCurrentlyActive ? 'success' : 'info'}>
                  {currentSemester.isCurrentlyActive ? '當前活躍學期' : '已結束學期'} - 
                  {formatDate(currentSemester.startDate)} 至 {formatDate(currentSemester.endDate)}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {!selectedSemester ? (
          <Grid item xs={12}>
            <Alert severity="info">
              請先選擇一個學期以查看相關資訊
            </Alert>
          </Grid>
        ) : (
          <>
            {/* Quick Stats */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Message color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">未讀訊息</Typography>
                  </Box>
                  <Typography variant="h3" color="primary">
                    {conversationsData?.reduce((sum: number, conv: Conversation) => sum + conv.unreadCount, 0) || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Forum color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">討論串</Typography>
                  </Box>
                  <Typography variant="h3" color="secondary">
                    {discussionsData?.length || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <School color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">參與者</Typography>
                  </Box>
                  <Typography variant="h3" color="success.main">
                    {currentSemester?.participants.length || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUp color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">活躍度</Typography>
                  </Box>
                  <Typography variant="h3" color="warning.main">
                    {currentSemester?.isCurrentlyActive ? '高' : '低'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Conversations */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">最近對話</Typography>
                    <Button
                      size="small"
                      endIcon={<ChevronRight />}
                      onClick={() => navigate('/messages')}
                    >
                      查看全部
                    </Button>
                  </Box>
                  {conversationsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : conversationsData?.length > 0 ? (
                    <List>
                      {conversationsData.slice(0, 5).map((conversation: Conversation) => (
                        <ListItem
                          key={conversation.user._id}
                          button
                          onClick={() => navigate(`/messages?user=${conversation.user._id}`)}
                          sx={{
                            borderRadius: 1,
                            mb: 1,
                            bgcolor: conversation.unreadCount > 0 ? 'action.hover' : 'transparent',
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar src={conversation.user.avatar}>
                              {conversation.user.name.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2">
                                  {conversation.user.name}
                                </Typography>
                                <Chip
                                  label={getRoleText(conversation.user.role)}
                                  size="small"
                                  variant="outlined"
                                />
                                {conversation.unreadCount > 0 && (
                                  <Chip
                                    label={conversation.unreadCount}
                                    size="small"
                                    color="error"
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {conversation.lastMessage.content}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatTime(conversation.lastMessage.createdAt)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info">暫無對話記錄</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Discussions */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">最新討論</Typography>
                    <Button
                      size="small"
                      endIcon={<ChevronRight />}
                      onClick={() => navigate('/discussions')}
                    >
                      查看全部
                    </Button>
                  </Box>
                  {discussionsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : discussionsData?.length > 0 ? (
                    <List>
                      {discussionsData.map((discussion: Discussion) => (
                        <ListItem
                          key={discussion._id}
                          button
                          onClick={() => navigate(`/discussions/${discussion._id}`)}
                          sx={{ borderRadius: 1, mb: 1 }}
                        >
                          <ListItemAvatar>
                            <Avatar src={discussion.author.avatar}>
                              {discussion.author.name.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2">
                                  {discussion.title}
                                </Typography>
                                {discussion.isPinned && (
                                  <Chip
                                    label="置頂"
                                    size="small"
                                    color="primary"
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  by {discussion.author.name} • {discussion.replies.length} 回覆
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatTime(discussion.createdAt)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info">暫無討論記錄</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    快速操作
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<Message />}
                      onClick={() => navigate('/messages')}
                    >
                      發送訊息
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Forum />}
                      onClick={() => navigate('/discussions')}
                    >
                      創建討論
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => navigate('/discussions')}
                    >
                      查看所有討論
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard;
