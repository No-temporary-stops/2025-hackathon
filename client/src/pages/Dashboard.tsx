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
import { useQuery, useMutation, useQueryClient } from 'react-query';
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

// Calendar event interface to match backend
interface CalendarEvent {
  _id: string;
  title: string;
  start: Date;
  end: Date;
  isCompleted: boolean;
  priority: '高' | '中' | '低';
  type: 'todo' | 'event';
  description?: string;
  link?: string;
  linkText?: string;
  semester: {
    _id: string;
    name: string;
    schoolYear: string;
  };
  createdBy: {
    _id: string;
    name: string;
    avatar: string;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'calendar' | 'events'>('calendar');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [dayEventsOpen, setDayEventsOpen] = useState(false);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{mouseX: number; mouseY: number; day: number} | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [isNewEvent, setIsNewEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    start: "",
    end: "",
    priority: "中" as "高" | "中" | "低",
    type: "todo" as "todo" | "event",
    description: "",
    link: "",
    linkText: "",
    semesterId: ""
  });

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

  // Fetch calendar events for selected semester
  const { data: eventsData, isLoading: eventsLoading } = useQuery(
    ['calendar-events', selectedSemester, currentDate],
    async () => {
      if (!selectedSemester) return [];
      
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await api.get('/calendar/events', {
        params: {
          semesterId: selectedSemester,
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString()
        }
      });
      
      // 轉換日期字符串為 Date 對象
      return response.data.events.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      }));
    },
    {
      enabled: !!selectedSemester,
      onSuccess: (data) => {
        setEvents(data);
      }
    }
  );

  // 新增事件 mutation
  const createEventMutation = useMutation(
    async (eventData: any) => {
      const response = await api.post('/calendar/events', eventData);
      return response.data.event;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['calendar-events', selectedSemester, currentDate]);
        setEditEventOpen(false);
        resetForm();
      },
      onError: (error: any) => {
        console.error('創建事件失敗:', error);
        alert(error.response?.data?.message || '創建事件失敗');
      }
    }
  );

  // 更新事件 mutation
  const updateEventMutation = useMutation(
    async ({ id, eventData }: { id: string, eventData: any }) => {
      const response = await api.put(`/calendar/events/${id}`, eventData);
      return response.data.event;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['calendar-events', selectedSemester, currentDate]);
        setEditEventOpen(false);
        setEventDetailOpen(false);
        resetForm();
        setEditingEvent(null);
      },
      onError: (error: any) => {
        console.error('更新事件失敗:', error);
        alert(error.response?.data?.message || '更新事件失敗');
      }
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
    return events.filter(event => 
      event.start.getDate() === day && 
      event.start.getMonth() === currentDate.getMonth() && 
      event.start.getFullYear() === currentDate.getFullYear()
    );
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setDayEventsOpen(true);
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
      case 'todo': return '待辦事項';
      case 'event': return '活動';
      case 'meeting': return '會議';
      case 'test': return '測驗';
      case 'exam': return '考試';
      case 'class': return '課程';
      case 'activity': return '活動';
      default: return type;
    }
  };

  // 獲取事件顏色
  const getEventColor = (event: CalendarEvent) => {
    if (event.isCompleted) {
      return '#4caf50';
    }
    switch(event.priority) {
      case "高":
        return '#f44336';
      case "中":
        return '#ff9800';
      case "低":
        return '#2196f3';
      default:
        return '#2196f3';
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

  // 重置表單
  const resetForm = () => {
    const now = new Date();
    const start = new Date(now);
    start.setMinutes(0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    
    setNewEvent({
      title: "",
      start: start.toISOString().slice(0, 16),
      end: end.toISOString().slice(0, 16),
      priority: "中",
      type: "todo",
      description: "",
      link: "",
      linkText: "",
      semesterId: selectedSemester || ""
    });
  };

  // 新增事件
  const handleAddEvent = (day?: number) => {
    resetForm();
    if (day) {
      const eventDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      setNewEvent(prev => ({
        ...prev,
        start: eventDate.toISOString().slice(0, 16),
        end: new Date(eventDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16)
      }));
    }
    setIsNewEvent(true);
    setEditEventOpen(true);
    handleContextMenuClose();
  };

  // 保存事件
  const handleSaveEvent = () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end || !newEvent.semesterId) {
      alert("請完整輸入所有必填欄位！");
      return;
    }
    
    const startDate = new Date(newEvent.start);
    const endDate = new Date(newEvent.end);
    
    if (endDate <= startDate) {
      alert("結束時間必須晚於開始時間！");
      return;
    }

    const eventData = {
      title: newEvent.title,
      description: newEvent.description,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      priority: newEvent.priority,
      type: newEvent.type,
      link: newEvent.link,
      linkText: newEvent.linkText,
      semesterId: newEvent.semesterId
    };
    
    createEventMutation.mutate(eventData);
  };

  // 處理表單變更
  const handleFormChange = (field: string, value: any) => {
    setNewEvent(prev => ({ ...prev, [field]: value }));
  };

  // 編輯事件
  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      start: event.start.toISOString().slice(0, 16),
      end: event.end.toISOString().slice(0, 16),
      priority: event.priority as "高" | "中" | "低",
      type: event.type as "todo" | "event",
      description: event.description || "",
      link: event.link || "",
      linkText: event.linkText || "",
      semesterId: event.semester.toString()
    });
    setIsNewEvent(false);
    setEditEventOpen(true);
    setEventDetailOpen(false);
  };

  // 保存編輯的事件
  const handleSaveEditEvent = () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end || !newEvent.semesterId) {
      alert("請完整輸入所有必填欄位！");
      return;
    }
    
    const startDate = new Date(newEvent.start);
    const endDate = new Date(newEvent.end);
    
    if (endDate <= startDate) {
      alert("結束時間必須晚於開始時間！");
      return;
    }

    const eventData = {
      title: newEvent.title,
      description: newEvent.description,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      priority: newEvent.priority,
      type: newEvent.type,
      link: newEvent.link,
      linkText: newEvent.linkText,
      semesterId: newEvent.semesterId
    };
    
    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent._id, eventData });
    }
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
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, mb: 1 }}>
                      {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                        <Box 
                          key={day} 
                          sx={{ 
                            textAlign: 'center', 
                            py: 1, 
                            border: '1px solid',
                            borderColor: 'divider',
                            borderTop: 'none',
                            borderLeft: index === 0 ? '1px solid' : 'none',
                            borderRight: 'none'
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" fontWeight="medium">
                            {day}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    
                    {/* Calendar days */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
                      {/* Empty cells for days before month start */}
                      {Array.from({ length: getFirstDayOfMonth(currentDate) }, (_, i) => (
                        <Box 
                          key={`empty-${i}`} 
                          sx={{ 
                            minHeight: 100,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderTop: 'none',
                            borderLeft: i === 0 ? '1px solid' : 'none',
                            borderRight: 'none',
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
                              borderTop: 'none',
                              borderLeft: (getFirstDayOfMonth(currentDate) + i) % 7 === 0 ? '1px solid' : 'none',
                              borderRight: 'none',
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
                                    borderLeftColor: getEventColor(event),
                                  }}
                                >
                                  <Typography 
                                    variant="caption" 
                                    title={event.title}
                                    sx={{ 
                                      fontSize: '0.65rem',
                                      fontWeight: 500,
                                      lineHeight: 1.2,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      maxWidth: '100%',
                                      display: 'block'
                                    }}
                                  >
                                    {event.title.length > 12 ? `${event.title.substring(0, 12)}...` : event.title}
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
                        .filter(event => event.start >= new Date())
                        .sort((a, b) => a.start.getTime() - b.start.getTime())
                        .map((event, index) => (
                            <Box 
                              key={index} 
                              onClick={() => handleEventClick(event)}
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                mb: 1, 
                                p: 1, 
                                bgcolor: 'primary.light', 
                                borderRadius: 1,
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: 'primary.main',
                                  color: 'primary.contrastText'
                                }
                              }}
                            >
                              <Box sx={{ width: 8, height: 8, bgcolor: getEventColor(event), borderRadius: '50%' }} />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography 
                                  variant="body2" 
                                  fontWeight="medium"
                                  title={event.title}
                                  sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {event.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {event.start.toLocaleDateString('zh-TW')} {event.start.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                              </Box>
                              <ChevronRight sx={{ opacity: 0.7 }} />
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
        {selectedDay !== null ? getEventsForDay(selectedDay).map((event, index) => (
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
            <Box sx={{ width: 12, height: 12, bgcolor: getEventColor(event), borderRadius: '50%' }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="subtitle2" 
                fontWeight="medium"
                title={event.title}
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {event.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {event.start.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
            <ChevronRight color="action" />
          </Box>
        )) : null}
        {selectedDay !== null && getEventsForDay(selectedDay).length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              這一天沒有活動
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDayEvents} color="primary">
          關閉
        </Button>
          <Button 
            onClick={() => {
              handleCloseDayEvents();
              handleAddEvent(selectedDay ?? undefined);
            }}
            variant="contained"
            color="primary"
            startIcon={<Add />}
          >
            新增活動
          </Button>
      </DialogActions>
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
                label={selectedEvent.isCompleted ? '已完成' : '待完成'} 
                color={selectedEvent.isCompleted ? 'success' : 'default'} 
                size="small" 
              />
              <Chip 
                label={selectedEvent.priority || '中'} 
                color={selectedEvent.priority === '高' ? 'error' : selectedEvent.priority === '中' ? 'warning' : 'info'} 
                size="small" 
              />
              <Chip 
                label={getEventTypeText(selectedEvent.type)} 
                color="primary" 
                size="small" 
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AccessTime color="action" />
              <Typography variant="body2">
                開始：{selectedEvent.start.toLocaleDateString('zh-TW')} {selectedEvent.start.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AccessTime color="action" />
              <Typography variant="body2">
                結束：{selectedEvent.end.toLocaleDateString('zh-TW')} {selectedEvent.end.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              活動描述
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {selectedEvent.description}
            </Typography>

            {selectedEvent.link && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  相關連結
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  href={selectedEvent.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ textTransform: 'none' }}
                >
                  {selectedEvent.linkText || selectedEvent.link}
                </Button>
              </Box>
            )}

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
        <Button onClick={handleCloseEventDetail} color="inherit">
          關閉
        </Button>
        <Button 
          onClick={() => selectedEvent && handleEditEvent(selectedEvent)} 
          color="primary"
          startIcon={<Edit />}
        >
          編輯事件
        </Button>
        <Button 
          onClick={() => navigate('/calendar')} 
          color="primary"
          variant="outlined"
          startIcon={<CalendarMonth />}
        >
          前往行事曆
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
      <MenuItem onClick={() => handleAddEvent(contextMenu?.day)}>
        <Add sx={{ mr: 1 }} />
        新增活動
      </MenuItem>
    </Menu>

    {/* Edit Event Dialog */}
    <Dialog open={editEventOpen} onClose={() => setEditEventOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{isNewEvent ? '新增活動' : '編輯活動'}</Typography>
        <Button onClick={() => setEditEventOpen(false)} sx={{ minWidth: 'auto', p: 1 }}>
          <Close />
        </Button>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="活動標題"
              value={newEvent.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>學期</InputLabel>
              <Select
                value={newEvent.semesterId}
                onChange={(e) => handleFormChange('semesterId', e.target.value)}
                label="學期"
                required
              >
                {semestersData?.map((semester: any) => (
                  <MenuItem key={semester._id} value={semester._id}>
                    {semester.name} ({semester.schoolYear})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>類型</InputLabel>
              <Select
                value={newEvent.type}
                onChange={(e) => handleFormChange('type', e.target.value)}
                label="類型"
              >
                <MenuItem value="todo">待辦事項</MenuItem>
                <MenuItem value="event">活動事件</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>優先級</InputLabel>
              <Select
                value={newEvent.priority}
                onChange={(e) => handleFormChange('priority', e.target.value)}
                label="優先級"
              >
                <MenuItem value="高">🔴 高優先級</MenuItem>
                <MenuItem value="中">🟡 中優先級</MenuItem>
                <MenuItem value="低">🟢 低優先級</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="開始時間"
              value={newEvent.start}
              onChange={(e) => handleFormChange('start', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="結束時間"
              value={newEvent.end}
              onChange={(e) => handleFormChange('end', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="描述"
              value={newEvent.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="選填：詳細說明..."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="連結網址"
              value={newEvent.link}
              onChange={(e) => handleFormChange('link', e.target.value)}
              placeholder="選填：https://example.com"
              type="url"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="連結文字"
              value={newEvent.linkText}
              onChange={(e) => handleFormChange('linkText', e.target.value)}
              placeholder="選填：連結顯示文字"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={() => setEditEventOpen(false)} color="inherit" disabled={createEventMutation.isLoading || updateEventMutation.isLoading}>
          取消
        </Button>
        <Button 
          onClick={isNewEvent ? handleSaveEvent : handleSaveEditEvent} 
          variant="contained"
          disabled={createEventMutation.isLoading || updateEventMutation.isLoading}
          startIcon={(createEventMutation.isLoading || updateEventMutation.isLoading) ? <CircularProgress size={20} /> : <Save />}
        >
          {(createEventMutation.isLoading || updateEventMutation.isLoading) ? 
            (isNewEvent ? '創建中...' : '更新中...') : 
            (isNewEvent ? '新增' : '更新')
          }
        </Button>
      </DialogActions>
    </Dialog>

    </>
  );
};

export default Dashboard;
