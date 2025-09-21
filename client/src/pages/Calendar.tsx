import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  Today as TodayIcon,
  NavigateBefore,
  NavigateNext,
  Close as CloseIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  AccessTime,
  CalendarMonth,
  EventNote,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
// 日曆輔助函數
const getDaysInMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const getFirstDayOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

const navigateMonth = (currentDate: Date, direction: 'prev' | 'next') => {
  const newDate = new Date(currentDate);
  if (direction === 'prev') {
    newDate.setMonth(currentDate.getMonth() - 1);
  } else {
    newDate.setMonth(currentDate.getMonth() + 1);
  }
  return newDate;
};

const isToday = (day: number, currentDate: Date) => {
  const today = new Date();
  return (
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth() &&
    day === today.getDate()
  );
};

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

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'calendar' | 'events'>('calendar');
  const [showForm, setShowForm] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dayEventsOpen, setDayEventsOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
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

  // 獲取用戶的學期
  const { data: semestersData, isLoading: semestersLoading } = useQuery(
    'semesters',
    async () => {
      const response = await api.get('/semesters/my-semesters');
      return response.data.semesters;
    }
  );

  // 獲取日曆事件
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

  // 自動選擇當前活躍學期
  useEffect(() => {
    if (semestersData && !selectedSemester) {
      const activeSemester = semestersData.find((semester: any) => semester.isCurrentlyActive);
      if (activeSemester) {
        setSelectedSemester(activeSemester._id);
      } else if (semestersData.length > 0) {
        setSelectedSemester(semestersData[0]._id);
      }
    }
  }, [semestersData, selectedSemester]);

  // 新增事件 mutation
  const createEventMutation = useMutation(
    async (eventData: any) => {
      const response = await api.post('/calendar/events', eventData);
      return response.data.event;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['calendar-events', selectedSemester, currentDate]);
        setShowForm(false);
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
    async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/calendar/events/${id}`, data);
      return response.data.event;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['calendar-events', selectedSemester, currentDate]);
      },
      onError: (error: any) => {
        console.error('更新事件失敗:', error);
        alert(error.response?.data?.message || '更新事件失敗');
      }
    }
  );

  // 刪除事件 mutation
  const deleteEventMutation = useMutation(
    async (id: string) => {
      await api.delete(`/calendar/events/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['calendar-events', selectedSemester, currentDate]);
        setShowEventDetail(false);
        setSelectedEvent(null);
      },
      onError: (error: any) => {
        console.error('刪除事件失敗:', error);
        alert(error.response?.data?.message || '刪除事件失敗');
      }
    }
  );

  // 切換完成狀態 mutation
  const toggleCompleteMutation = useMutation(
    async (id: string) => {
      const response = await api.patch(`/calendar/events/${id}/toggle-complete`);
      return response.data.event;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['calendar-events', selectedSemester, currentDate]);
      },
      onError: (error: any) => {
        console.error('更新事件狀態失敗:', error);
        alert(error.response?.data?.message || '更新事件狀態失敗');
      }
    }
  );

  // 獲取預設時間
  const getDefaultTimes = () => {
    const now = new Date();
    const start = new Date(now);
    start.setMinutes(0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    
    return {
      start: start.toISOString().slice(0, 16),
      end: end.toISOString().slice(0, 16)
    };
  };

  // 獲取某天的事件
  const getEventsForDay = (day: number) => {
    const dayEvents = events.filter(event => 
      event.start.getDate() === day && 
      event.start.getMonth() === currentDate.getMonth() && 
      event.start.getFullYear() === currentDate.getFullYear()
    );
    console.log(`Events for day ${day}:`, dayEvents);
    return dayEvents;
  };

  // 處理日期點擊
  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setDayEventsOpen(true);
  };

  // 處理事件點擊
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
    setDayEventsOpen(false);
  };

  // 關閉日期事件對話框
  const handleCloseDayEvents = () => {
    setDayEventsOpen(false);
    setSelectedDay(null);
  };

  // 關閉事件詳情對話框
  const handleCloseEventDetail = () => {
    setShowEventDetail(false);
    setSelectedEvent(null);
  };

  // 重置表單
  const resetForm = () => {
    const defaults = getDefaultTimes();
    setNewEvent({
      title: "",
      start: defaults.start,
      end: defaults.end,
      priority: "中",
      type: "todo",
      description: "",
      link: "",
      linkText: "",
      semesterId: selectedSemester || ""
    });
  };

  // 新增事件
  const handleAddEvent = () => {
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

  // 切換完成狀態
  const toggleComplete = (eventId: string) => {
    toggleCompleteMutation.mutate(eventId);
  };

  // 刪除事件
  const deleteEvent = (eventId: string) => {
    if (window.confirm('確定要刪除這個事件嗎？')) {
      deleteEventMutation.mutate(eventId);
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

  // 獲取優先級顏色
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "高": return 'error';
      case "中": return 'warning';
      case "低": return 'info';
      default: return 'default';
    }
  };

  if (semestersLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 標題區域 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <EventIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            學習行事曆
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {semestersData && semestersData.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>選擇學期</InputLabel>
              <Select
                value={selectedSemester || ''}
                onChange={(e) => setSelectedSemester(e.target.value)}
                label="選擇學期"
              >
                {semestersData.map((semester: any) => (
                  <MenuItem key={semester._id} value={semester._id}>
                    {semester.name} {semester.isCurrentlyActive && '(進行中)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            disabled={!selectedSemester}
            sx={{ borderRadius: 3 }}
          >
            新增事項
          </Button>
        </Box>
      </Box>

      {!selectedSemester && (
        <Alert severity="info" sx={{ mb: 3 }}>
          請先選擇學期才能查看和創建事件
        </Alert>
      )}

      {/* 日曆控制區 */}
      <Paper elevation={2} sx={{ mb: 3, p: 2, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<TodayIcon />}
              onClick={() => setCurrentDate(new Date())}
              sx={{ borderRadius: 3 }}
            >
              今天
            </Button>
            <IconButton
              onClick={() => setCurrentDate(navigateMonth(currentDate, 'prev'))}
              sx={{ bgcolor: 'grey.100' }}
            >
              <NavigateBefore />
            </IconButton>
            <IconButton
              onClick={() => setCurrentDate(navigateMonth(currentDate, 'next'))}
              sx={{ bgcolor: 'grey.100' }}
            >
              <NavigateNext />
            </IconButton>
          </Box>
          
          <Typography variant="h6" fontWeight="bold" color="primary">
            {currentDate.toLocaleDateString('zh-TW', { 
              year: 'numeric', 
              month: 'long' 
            })}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={calendarView === 'calendar' ? 'contained' : 'outlined'}
              startIcon={<CalendarMonth />}
              onClick={() => setCalendarView('calendar')}
              size="small"
              sx={{ borderRadius: 2 }}
            >
              月曆
            </Button>
            <Button
              variant={calendarView === 'events' ? 'contained' : 'outlined'}
              startIcon={<EventNote />}
              onClick={() => setCalendarView('events')}
              size="small"
              sx={{ borderRadius: 2 }}
            >
              近期活動
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* 日曆主體 */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3, minHeight: 600 }}>
        {/* 月曆視圖 */}
        {calendarView === 'calendar' && (
          <>
            {/* 星期標題 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
              {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                <Box key={day} sx={{ textAlign: 'center', py: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="medium">
                    {day}
                  </Typography>
                </Box>
              ))}
            </Box>
            
            {/* 月曆網格 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
              {/* 月初前的空白格子 */}
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
              
              {/* 月份中的日期 */}
              {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDay(day);
                return (
                  <Box
                    key={day}
                    onClick={() => handleDayClick(day)}
                    sx={{
                      minHeight: 100,
                      border: '1px solid',
                      borderColor: dayEvents.length > 0 ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      bgcolor: isToday(day, currentDate) ? 'primary.light' : 'background.paper',
                      p: 0.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      '&:hover': {
                        bgcolor: isToday(day, currentDate) ? 'primary.main' : 'action.hover',
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* 日期數字 */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: 20
                    }}>
                      <Typography 
                        variant="caption" 
                        fontWeight={isToday(day, currentDate) ? 'bold' : 'normal'}
                        color={isToday(day, currentDate) ? 'primary.main' : 'text.primary'}
                      >
                        {day}
                      </Typography>
                    </Box>
                    
                    {/* 事件 */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {dayEvents.slice(0, 2).map((event, index) => (
                        <Box
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            p: 0.5,
                            bgcolor: 'rgba(0,0,0,0.04)',
                            borderRadius: 0.5,
                            borderLeft: `3px solid`,
                            borderLeftColor: getEventColor(event),
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'rgba(0,0,0,0.08)',
                            }
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
          </>
        )}

        {/* 事件列表視圖 */}
        {calendarView === 'events' && (
          <Box>
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
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="medium">{event.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {event.start.toLocaleDateString('zh-TW')} {event.start.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  </Box>
                ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* 新增事件對話框 */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">新增行事曆事項</Typography>
          <IconButton onClick={() => setShowForm(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="標題"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>學期</InputLabel>
                <Select
                  value={newEvent.semesterId}
                  onChange={(e) => setNewEvent({ ...newEvent, semesterId: e.target.value })}
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
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as 'todo' | 'event' })}
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
                  onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value as '高' | '中' | '低' })}
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
                onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
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
                onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
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
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="選填：詳細說明..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="連結網址"
                value={newEvent.link}
                onChange={(e) => setNewEvent({ ...newEvent, link: e.target.value })}
                placeholder="選填：https://example.com"
                type="url"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="連結文字"
                value={newEvent.linkText}
                onChange={(e) => setNewEvent({ ...newEvent, linkText: e.target.value })}
                placeholder="選填：連結顯示文字"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowForm(false)} color="inherit" disabled={createEventMutation.isLoading}>
            取消
          </Button>
          <Button 
            onClick={handleAddEvent} 
            variant="contained"
            disabled={createEventMutation.isLoading}
            startIcon={createEventMutation.isLoading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {createEventMutation.isLoading ? '創建中...' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 日期事件對話框 */}
      <Dialog open={dayEventsOpen} onClose={handleCloseDayEvents} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {currentDate.getMonth() + 1}月{selectedDay}日 活動
          </Typography>
          <Button onClick={handleCloseDayEvents} sx={{ minWidth: 'auto', p: 1 }}>
            <CloseIcon />
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
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight="medium">
                  {event.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {event.start.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
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
              if (selectedDay !== null) {
                resetForm();
                setNewEvent(prev => ({
                  ...prev,
                  start: new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay, 9, 0).toISOString().slice(0, 16),
                  end: new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay, 10, 0).toISOString().slice(0, 16)
                }));
                setShowForm(true);
              }
            }}
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
          >
            新增活動
          </Button>
        </DialogActions>
      </Dialog>

      {/* 事件詳情對話框 */}
      <Dialog open={showEventDetail} onClose={handleCloseEventDetail} maxWidth="sm" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">事項詳情</Typography>
              <IconButton onClick={() => setShowEventDetail(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Card elevation={0} sx={{ bgcolor: 'grey.50', mb: 2 }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {selectedEvent.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={selectedEvent.isCompleted ? '已完成' : '待完成'}
                        color={selectedEvent.isCompleted ? 'success' : 'default'}
                        icon={selectedEvent.isCompleted ? <CheckIcon /> : <AccessTime />}
                        size="small"
                      />
                      <Chip
                        label={selectedEvent.priority}
                        color={getPriorityColor(selectedEvent.priority)}
                        size="small"
                      />
                      <Chip
                        label={selectedEvent.type === 'todo' ? '待辦事項' : '活動事件'}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>開始時間：</strong>{selectedEvent.start.toLocaleDateString('zh-TW', { 
                      year: 'numeric', 
                      month: '2-digit', 
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>結束時間：</strong>{selectedEvent.end.toLocaleDateString('zh-TW', { 
                      year: 'numeric', 
                      month: '2-digit', 
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                  
                  {selectedEvent.description && (
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      <strong>描述：</strong>{selectedEvent.description}
                    </Typography>
                  )}
                  
                  {selectedEvent.link && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>相關連結：</strong>
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
                </CardContent>
              </Card>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1 }}>
              <Button
                onClick={() => toggleComplete(selectedEvent.id)}
                variant="contained"
                color={selectedEvent.isCompleted ? 'warning' : 'success'}
                startIcon={selectedEvent.isCompleted ? <AccessTime /> : <CheckIcon />}
              >
                {selectedEvent.isCompleted ? '標記未完成' : '標記完成'}
              </Button>
              <Button
                onClick={() => deleteEvent(selectedEvent.id)}
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
              >
                刪除
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default CalendarPage;