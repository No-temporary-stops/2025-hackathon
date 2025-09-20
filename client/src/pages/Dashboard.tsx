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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Menu,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  IconButton,
} from '@mui/material';
import {
  ChevronRight,
  NavigateBefore,
  NavigateNext,
  CalendarMonth,
  EventNote,
  Close,
  AccessTime,
  Category,
  Add,
  Edit,
  Delete,
  MoreVert,
  Save,
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

// Sample events data
const sampleEvents = [
    { 
      date: 20, 
      title: '班會', 
      color: 'info.main', 
      type: 'meeting',
      time: '08:00',
      location: '教室 A101',
      description: '討論本月班級事務，包括學習進度檢討和活動安排。',
      organizer: '班導師 王老師'
    },
    { 
      date: 22, 
      title: '英文小考', 
      color: 'warning.main', 
      type: 'test',
      time: '10:00',
      location: '教室 A101',
      description: '第三單元單字和文法測驗，範圍為 Unit 3 全部內容。',
      organizer: '英文老師 李老師'
    },
    { 
      date: 25, 
      title: '數學期中考', 
      color: 'error.main', 
      type: 'exam',
      time: '09:00',
      location: '考試大樓 B203',
      description: '期中考試，考試範圍涵蓋第1-6章，請準備計算機和文具。',
      organizer: '數學老師 張老師'
    },
    { 
      date: 26, 
      title: '體育課', 
      color: 'success.main', 
      type: 'class',
      time: '14:00',
      location: '體育館',
      description: '籃球基本技巧練習，請穿著運動服和運動鞋。',
      organizer: '體育老師 陳老師'
    },
    { 
      date: 28, 
      title: '家長會', 
      color: 'warning.main', 
      type: 'meeting',
      time: '14:00',
      location: '學校禮堂',
      description: '與家長討論學生學習狀況和未來規劃，歡迎家長踴躍參與。',
      organizer: '學務處'
    },
    { 
      date: 30, 
      title: '校外教學', 
      color: 'info.main', 
      type: 'activity',
      time: '08:30',
      location: '科學博物館',
      description: '參觀科學博物館，探索科學奧秘，請攜帶學習單和筆記本。',
      organizer: '自然老師 林老師'
    },
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'calendar' | 'events'>('calendar');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [dayEventsOpen, setDayEventsOpen] = useState(false);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{mouseX: number; mouseY: number; day: number} | null>(null);
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [isNewEvent, setIsNewEvent] = useState(false);
  const [events, setEvents] = useState(sampleEvents);

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

  const getEventsForDay = (day: number) => {
    return events.filter(event => event.date === day);
  };

  const handleDayClick = (day: number) => {
    const dayEvents = getEventsForDay(day);
    if (dayEvents.length > 0) {
      setSelectedDay(day);
      setDayEventsOpen(true);
    }
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setEventDetailOpen(true);
    setDayEventsOpen(false);
  };

  const handleCloseDayEvents = () => {
    setDayEventsOpen(false);
    setSelectedDay(null);
  };

  const handleCloseEventDetail = () => {
    setEventDetailOpen(false);
    setSelectedEvent(null);
  };

  const getEventTypeText = (type: string) => {
    switch (type) {
      case 'meeting': return '會議';
      case 'test': return '測驗';
      case 'exam': return '考試';
      case 'class': return '課程';
      case 'activity': return '活動';
      default: return type;
    }
  };

  const handleRightClick = (event: React.MouseEvent, day: number) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      day: day
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleAddEvent = () => {
    const newEvent = {
      date: contextMenu?.day || 1,
      title: '',
      color: 'info.main',
      type: 'meeting',
      time: '09:00',
      location: '',
      description: '',
      organizer: user?.name || ''
    };
    setEditingEvent(newEvent);
    setIsNewEvent(true);
    setEditEventOpen(true);
    handleContextMenuClose();
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent({...event});
    setIsNewEvent(false);
    setEditEventOpen(true);
    setEventDetailOpen(false);
  };

  const handleDeleteEvent = (eventToDelete: any) => {
    setEvents(prev => prev.filter(event => 
      !(event.date === eventToDelete.date && event.title === eventToDelete.title)
    ));
    setEventDetailOpen(false);
  };

  const handleSaveEvent = () => {
    if (isNewEvent) {
      setEvents(prev => [...prev, editingEvent]);
    } else {
      setEvents(prev => prev.map(event => 
        event.date === editingEvent.date && event.title === editingEvent.title 
          ? editingEvent 
          : event
      ));
    }
    setEditEventOpen(false);
    setEditingEvent(null);
  };

  const handleEditEventChange = (field: string, value: any) => {
    setEditingEvent((prev: any) => ({ ...prev, [field]: value }));
  };

  if (semestersLoading) {
    return <LoadingSpinner message="載入儀表板中..." />;
  }

  const currentSemester = semestersData?.find((s: Semester) => s._id === selectedSemester);

  return (
    <>
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
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">行事曆</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant={calendarView === 'calendar' ? 'contained' : 'outlined'}
                        startIcon={<CalendarMonth />}
                        onClick={() => setCalendarView('calendar')}
                      >
                        月曆
                      </Button>
                      <Button
                        size="small"
                        variant={calendarView === 'events' ? 'contained' : 'outlined'}
                        startIcon={<EventNote />}
                        onClick={() => setCalendarView('events')}
                      >
                        近期活動
                      </Button>
                    </Box>
                  </Box>

                  {/* Calendar View */}
                  {calendarView === 'calendar' && (
                    <>
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
                        <Box 
                          key={`empty-${i}`} 
                          sx={{ 
                            minHeight: 100,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            bgcolor: 'action.hover',
                            opacity: 0.3
                          }} 
                        />
                      ))}
                      
                      {/* Days of the month */}
                      {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => {
                        const day = i + 1;
                        const dayEvents = getEventsForDay(day);
                        return (
                          <Box
                            key={day}
                            onClick={() => handleDayClick(day)}
                            onContextMenu={(e) => handleRightClick(e, day)}
                            sx={{
                              minHeight: 100,
                              border: '1px solid',
                              borderColor: dayEvents.length > 0 ? 'primary.main' : 'divider',
                              borderRadius: 1,
                              cursor: 'pointer',
                              bgcolor: isToday(day) ? 'primary.light' : 'background.paper',
                              p: 0.5,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.5,
                              '&:hover': {
                                bgcolor: isToday(day) ? 'primary.main' : 'action.hover',
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {/* Date number */}
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'center',
                              alignItems: 'center',
                              minHeight: 20
                            }}>
                              <Typography 
                                variant="caption" 
                                fontWeight={isToday(day) ? 'bold' : 'normal'}
                                color={isToday(day) ? 'primary.main' : 'text.primary'}
                              >
                                {day}
                              </Typography>
                            </Box>
                            
                            {/* Events */}
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {dayEvents.slice(0, 2).map((event, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    p: 0.5,
                                    bgcolor: 'rgba(0,0,0,0.04)',
                                    borderRadius: 0.5,
                                    borderLeft: `3px solid`,
                                    borderLeftColor: event.color,
                                  }}
                                >
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      fontSize: '0.65rem',
                                      fontWeight: 500,
                                      lineHeight: 1.2,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {event.title}
                                  </Typography>
                                </Box>
                              ))}
                              {dayEvents.length > 2 && (
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  mt: 0.5
                                }}>
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{ fontSize: '0.6rem' }}
                                  >
                                    +{dayEvents.length - 2} 更多
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                    </>
                  )}

                  {/* Events View */}
                  {calendarView === 'events' && (
                    <Box>
                      {/* Upcoming Events */}
                      <Typography variant="subtitle2" gutterBottom>
                        近期活動
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        {events
                          .filter(event => event.date >= new Date().getDate())
                          .map((event, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1, bgcolor: 'primary.light', borderRadius: 1 }}>
                              <Box sx={{ width: 8, height: 8, bgcolor: event.color, borderRadius: '50%' }} />
                              <Box>
                                <Typography variant="body2" fontWeight="medium">{event.title}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  9月{event.date}日 {event.type === 'exam' ? '09:00' : event.type === 'meeting' ? '14:00' : '10:00'}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
      </Grid>
    </Container>

    {/* Dialogs */}
    <Dialog open={dayEventsOpen} onClose={handleCloseDayEvents} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          9月{selectedDay}日 活動
        </Typography>
        <Button onClick={handleCloseDayEvents} sx={{ minWidth: 'auto', p: 1 }}>
          <Close />
        </Button>
      </DialogTitle>
      <DialogContent>
        {selectedDay !== null ? events.filter(event => event.date === selectedDay).map((event, index) => (
          <Box
            key={index}
            onClick={() => handleEventClick(event)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              mb: 1,
              bgcolor: 'action.hover',
              borderRadius: 1,
              cursor: 'pointer',
              border: `2px solid transparent`,
              '&:hover': {
                bgcolor: 'primary.light',
                borderColor: 'primary.main'
              }
            }}
          >
            <Box sx={{ width: 12, height: 12, bgcolor: event.color, borderRadius: '50%' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight="medium">
                {event.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {event.time} • {event.location}
              </Typography>
            </Box>
            <ChevronRight color="action" />
          </Box>
        )) : null}
      </DialogContent>
    </Dialog>

    {/* Event Detail Dialog */}
    <Dialog open={eventDetailOpen} onClose={handleCloseEventDetail} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: selectedEvent?.color, borderRadius: '50%' }} />
          <Typography variant="h6">
            {selectedEvent?.title}
          </Typography>
        </Box>
        <Button onClick={handleCloseEventDetail} sx={{ minWidth: 'auto', p: 1 }}>
          <Close />
        </Button>
      </DialogTitle>
      <DialogContent>
        {selectedEvent && (
          <Box sx={{ py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Chip 
                label={getEventTypeText(selectedEvent.type)} 
                color="primary" 
                size="small" 
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AccessTime color="action" />
              <Typography variant="body2">
                9月{selectedEvent.date}日 {selectedEvent.time}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Category color="action" />
              <Typography variant="body2">
                {selectedEvent.location}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              活動描述
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {selectedEvent.description}
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              主辦者
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedEvent.organizer}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseEventDetail} color="primary">
          關閉
        </Button>
        <Button 
          onClick={() => handleEditEvent(selectedEvent)} 
          color="primary"
          startIcon={<Edit />}
        >
          編輯
        </Button>
        <Button 
          onClick={() => handleDeleteEvent(selectedEvent)} 
          color="error"
          startIcon={<Delete />}
        >
          刪除
        </Button>
        <Button variant="contained" color="primary">
          加入行事曆
        </Button>
      </DialogActions>
    </Dialog>

    {/* Context Menu */}
    <Menu
      open={contextMenu !== null}
      onClose={handleContextMenuClose}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu !== null
          ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
          : undefined
      }
    >
      <MenuItem onClick={handleAddEvent}>
        <Add sx={{ mr: 1 }} />
        新增活動
      </MenuItem>
    </Menu>

    {/* Edit Event Dialog */}
    <Dialog open={editEventOpen} onClose={() => setEditEventOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isNewEvent ? '新增活動' : '編輯活動'}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <TextField
          fullWidth
          label="活動標題"
          value={editingEvent?.title || ''}
          onChange={(e) => handleEditEventChange('title', e.target.value)}
          margin="normal"
        />
        
        <FormControl fullWidth margin="normal">
          <InputLabel>活動類型</InputLabel>
          <Select
            value={editingEvent?.type || 'meeting'}
            onChange={(e) => handleEditEventChange('type', e.target.value)}
          >
            <MenuItem value="meeting">會議</MenuItem>
            <MenuItem value="test">測驗</MenuItem>
            <MenuItem value="exam">考試</MenuItem>
            <MenuItem value="class">課程</MenuItem>
            <MenuItem value="activity">活動</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="時間"
          type="time"
          value={editingEvent?.time || '09:00'}
          onChange={(e) => handleEditEventChange('time', e.target.value)}
          margin="normal"
        />

        <TextField
          fullWidth
          label="地點"
          value={editingEvent?.location || ''}
          onChange={(e) => handleEditEventChange('location', e.target.value)}
          margin="normal"
        />

        <TextField
          fullWidth
          label="描述"
          multiline
          rows={3}
          value={editingEvent?.description || ''}
          onChange={(e) => handleEditEventChange('description', e.target.value)}
          margin="normal"
        />

        <TextField
          fullWidth
          label="主辦者"
          value={editingEvent?.organizer || ''}
          onChange={(e) => handleEditEventChange('organizer', e.target.value)}
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditEventOpen(false)}>
          取消
        </Button>
        <Button 
          onClick={handleSaveEvent} 
          variant="contained"
          startIcon={<Save />}
          disabled={!editingEvent?.title}
        >
          儲存
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default Dashboard;
