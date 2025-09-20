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
  ChevronRight,
  NavigateBefore,
  NavigateNext,
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
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch user's semesters
  const { data: semestersData, isLoading: semestersLoading } = useQuery(
    'semesters',
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
        // If no active semester, select the first one
        setSelectedSemester(semestersData[0]._id);
      }
    }
  }, [semestersData, selectedSemester]);

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

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      currentDate.getFullYear() === today.getFullYear() &&
      currentDate.getMonth() === today.getMonth() &&
      day === today.getDate()
    );
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

      {/* Current Semester Display */}
      {currentSemester && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" color="primary" fontWeight="medium">
            當前學期：{currentSemester.name} ({currentSemester.schoolYear})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDate(currentSemester.startDate)} 至 {formatDate(currentSemester.endDate)}
            {currentSemester.isCurrentlyActive && (
              <Chip 
                size="small" 
                label="進行中" 
                color="success" 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
      )}

      <Grid container spacing={3}>
            {/* Left Column */}
            <Grid item xs={12} md={7}>
              <Grid container spacing={3}>
                {/* Recent Conversations */}
                <Grid item xs={12}>
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
                <Grid item xs={12}>
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
              </Grid>
            </Grid>

            {/* Right Column - Calendar */}
            <Grid item xs={12} md={5}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">行事曆</Typography>
                    <Button
                      size="small"
                      endIcon={<ChevronRight />}
                      onClick={() => navigate('/calendar')}
                    >
                      查看全部
                    </Button>
                  </Box>
                  
                  {/* Calendar Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Button size="small" onClick={() => navigateMonth('prev')}>
                      <NavigateBefore />
                    </Button>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {currentDate.toLocaleDateString('zh-TW', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </Typography>
                    <Button size="small" onClick={() => navigateMonth('next')}>
                      <NavigateNext />
                    </Button>
                  </Box>

                  {/* Calendar Grid */}
                  <Box sx={{ mb: 3 }}>
                    {/* Week days header */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
                      {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                        <Box key={day} sx={{ textAlign: 'center', py: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="medium">
                            {day}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    
                    {/* Calendar days */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                      {/* Empty cells for days before month start */}
                      {Array.from({ length: getFirstDayOfMonth(currentDate) }, (_, i) => (
                        <Box key={`empty-${i}`} sx={{ height: 32 }} />
                      ))}
                      
                      {/* Days of the month */}
                      {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => {
                        const day = i + 1;
                        return (
                          <Box
                            key={day}
                            sx={{
                              height: 32,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              borderRadius: 1,
                              bgcolor: isToday(day) ? 'primary.main' : 'transparent',
                              color: isToday(day) ? 'white' : 'text.primary',
                              fontWeight: isToday(day) ? 'bold' : 'normal',
                              '&:hover': {
                                bgcolor: isToday(day) ? 'primary.dark' : 'action.hover',
                              }
                            }}
                          >
                            <Typography variant="body2">
                              {day}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>

                  {/* Upcoming Events */}
                  <Typography variant="subtitle2" gutterBottom>
                    近期活動
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Box sx={{ width: 8, height: 8, bgcolor: 'success.main', borderRadius: '50%' }} />
                      <Box>
                        <Typography variant="body2">數學期中考</Typography>
                        <Typography variant="caption" color="text.secondary">9月25日 09:00</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Box sx={{ width: 8, height: 8, bgcolor: 'warning.main', borderRadius: '50%' }} />
                      <Box>
                        <Typography variant="body2">家長會</Typography>
                        <Typography variant="caption" color="text.secondary">9月28日 14:00</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Box sx={{ width: 8, height: 8, bgcolor: 'info.main', borderRadius: '50%' }} />
                      <Box>
                        <Typography variant="body2">班級活動</Typography>
                        <Typography variant="caption" color="text.secondary">10月1日 10:00</Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/calendar')}
                    size="small"
                  >
                    查看完整行事曆
                  </Button>
                </CardContent>
              </Card>
            </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
