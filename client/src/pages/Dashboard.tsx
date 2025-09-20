import React from 'react';
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
  ChevronRight,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSemester, Semester } from '../contexts/SemesterContext';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Calendar from '../components/Calendar';



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

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    avatar: string;
    role: string;
  };
  recipient: {
    _id: string;
    name: string;
    avatar: string;
    role: string;
  };
  content: string;
  createdAt: string;
  isRead: boolean;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedSemester, semesters, loading: semestersLoading } = useSemester();
  const navigate = useNavigate();


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

  // Fetch recent messages for selected semester
  const { data: messagesData, isLoading: messagesLoading } = useQuery(
    ['recent-messages', selectedSemester],
    async () => {
      if (!selectedSemester) return [];
      const response = await api.get(`/messages/recent/${selectedSemester}?limit=5`);
      return response.data.messages;
    },
    {
      enabled: !!selectedSemester,
    }
  );


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

  const currentSemester = semesters?.find((s: Semester) => s._id === selectedSemester);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          歡迎回來，{user?.name}！
        </Typography>
        {currentSemester && (
          <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
            當前學期：{currentSemester.name} ({currentSemester.schoolYear})
            {currentSemester.isCurrentlyActive && (
              <Chip 
                label="進行中" 
                size="small" 
                color="success" 
                sx={{ ml: 1 }} 
              />
            )}
          </Typography>
        )}
      </Box>

      <Grid container spacing={3}>
        {!selectedSemester ? (
          <Grid item xs={12}>
            <Alert severity="info">
              請先選擇一個學期以查看相關資訊
            </Alert>
          </Grid>
        ) : (
          <>
            {/* Left Column - Messages and Discussions */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={3}>
                {/* Recent Messages */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">最新訊息</Typography>
                        <Button
                          size="small"
                          endIcon={<ChevronRight />}
                          onClick={() => navigate('/messages')}
                        >
                          查看全部
                        </Button>
                      </Box>
                      {messagesLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : messagesData?.length > 0 ? (
                        <List>
                          {messagesData.map((message: Message) => (
                            <ListItem
                              key={message._id}
                              button
                              onClick={() => navigate(`/messages?user=${message.sender._id}`)}
                              sx={{ borderRadius: 1, mb: 1 }}
                            >
                              <ListItemAvatar>
                                <Avatar src={message.sender.avatar}>
                                  {message.sender.name.charAt(0)}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2">
                                      {message.sender.name}
                                    </Typography>
                                    <Chip
                                      label={getRoleText(message.sender.role)}
                                      size="small"
                                      variant="outlined"
                                    />
                                    {!message.isRead && (
                                      <Chip
                                        label="未讀"
                                        size="small"
                                        color="error"
                                      />
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="text.secondary" noWrap>
                                      {message.content}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {formatTime(message.createdAt)}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Alert severity="info">暫無訊息記錄</Alert>
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
            <Grid item xs={12} md={6}>
              <Calendar semesterId={selectedSemester || undefined} />
            </Grid>

          </>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard;
