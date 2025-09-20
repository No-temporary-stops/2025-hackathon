import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Grid,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  CalendarMonth,
  Add,
  CheckCircle,
  RadioButtonUnchecked,
  ArrowBack,
  ArrowForward,
  Close,
  Edit,
  Delete,
} from '@mui/icons-material';

interface EventItem {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  completed: boolean;
  department: '教務處' | '學務處' | '總務處' | '輔導處' | '人事處' | '會計處';
}

interface CalendarProps {
  semesterId?: string;
}

const Calendar: React.FC<CalendarProps> = ({ semesterId }) => {
  const [viewMode, setViewMode] = useState<'todo' | 'calendar'>('todo');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    department: '教務處' as '教務處' | '學務處' | '總務處' | '輔導處' | '人事處' | '會計處'
  });

  // 輔助函數：將Date物件轉換為YYYY-MM-DD格式的本地日期字串
  const formatDateToString = (date: Date) => {
    return date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
  };

  // 獲取當前日期和相關日期（使用本地時間）
  const today = new Date();
  const todayString = formatDateToString(today);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowString = formatDateToString(tomorrow);
  
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(today.getDate() + 2);
  const dayAfterTomorrowString = formatDateToString(dayAfterTomorrow);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const nextWeekString = formatDateToString(nextWeek);

  // Mock data
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: '1',
      title: '提交作業報告',
      description: '完成數學作業報告並提交',
      startDate: todayString,
      endDate: todayString,
      completed: false,
      department: '教務處',
    },
    {
      id: '2',
      title: '準備考試',
      description: '複習英語考試內容',
      startDate: todayString,
      endDate: todayString,
      completed: false,
      department: '學務處',
    },
    {
      id: '3',
      title: '家長會議',
      description: '與家長討論學生學習狀況',
      startDate: tomorrowString,
      endDate: tomorrowString,
      completed: false,
      department: '輔導處',
    },
    {
      id: '4',
      title: '班級活動',
      description: '組織班級戶外活動',
      startDate: dayAfterTomorrowString,
      endDate: dayAfterTomorrowString,
      completed: false,
      department: '總務處',
    },
    {
      id: '5',
      title: '重要會議',
      description: '參加學校行政會議',
      startDate: todayString,
      endDate: todayString,
      completed: false,
      department: '人事處',
    },
    {
      id: '6',
      title: '課程規劃',
      description: '制定下學期課程計劃',
      startDate: tomorrowString,
      endDate: dayAfterTomorrowString,
      completed: false,
      department: '教務處',
    },
    {
      id: '7',
      title: '學生輔導',
      description: '個別學生學習輔導',
      startDate: nextWeekString,
      endDate: nextWeekString,
      completed: false,
      department: '輔導處',
    },
  ]);

  const toggleEvent = (id: string) => {
    setEvents(events.map(event => 
      event.id === id ? { ...event, completed: !event.completed } : event
    ));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateString = formatDateToString(date);
    setNewEvent(prev => ({
      ...prev,
      startDate: dateString,
      endDate: dateString
    }));
    setIsDateDialogOpen(true);
  };

  const handleAddEvent = () => {
    if (newEvent.title.trim()) {
      const event: EventItem = {
        id: Date.now().toString(),
        title: newEvent.title,
        description: newEvent.description,
        startDate: newEvent.startDate || undefined,
        endDate: newEvent.endDate || undefined,
        completed: false,
        department: newEvent.department
      };
      setEvents([...events, event]);
      setNewEvent({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        department: '教務處'
      });
      setIsDateDialogOpen(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDateDialogOpen(false);
    setSelectedDate(null);
    setNewEvent({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      department: '教務處'
    });
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case '教務處': return 'primary';
      case '學務處': return 'secondary';
      case '總務處': return 'warning';
      case '輔導處': return 'info';
      case '人事處': return 'success';
      case '會計處': return 'error';
      default: return 'default';
    }
  };

  const handleEditEvent = (event: EventItem) => {
    setEditingEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id));
  };

  const handleSaveEdit = () => {
    if (editingEvent && editingEvent.title.trim()) {
      setEvents(events.map(event => 
        event.id === editingEvent.id ? editingEvent : event
      ));
      setIsEditDialogOpen(false);
      setEditingEvent(null);
    }
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingEvent(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateString = formatDateToString(date);
    return events.filter(event => {
      const startDate = event.startDate || '';
      const endDate = event.endDate || '';
      
      if (!startDate && !endDate) return false;
      if (startDate && !endDate) return startDate === dateString;
      if (!startDate && endDate) return endDate === dateString;
      return dateString >= startDate && dateString <= endDate;
    });
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

  const isTodayEvent = (event: EventItem) => {
    const today = new Date();
    const todayString = formatDateToString(today);
    return event.startDate === todayString || event.endDate === todayString;
  };

  const sortedEvents = [...events].sort((a, b) => {
    const aIsToday = isTodayEvent(a);
    const bIsToday = isTodayEvent(b);
    
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;
    
    const aStartDate = a.startDate || '';
    const bStartDate = b.startDate || '';
    return new Date(aStartDate).getTime() - new Date(bStartDate).getTime();
  });

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6">
              {viewMode === 'todo' ? '事件' : '行事曆'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              今日：{today.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={viewMode === 'todo' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('todo')}
            >
              事件
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('calendar')}
            >
              日曆
            </Button>
            <IconButton size="small">
              <Add />
            </IconButton>
          </Box>
        </Box>

        {viewMode === 'todo' ? (
          <Box>
            {sortedEvents.length > 0 ? (
              <List>
                {sortedEvents.map((event, index) => (
                  <React.Fragment key={event.id}>
                    <ListItem sx={{ 
                      px: 0,
                      bgcolor: isTodayEvent(event) ? 'warning.light' : 'transparent',
                      borderRadius: isTodayEvent(event) ? 1 : 0,
                      mb: isTodayEvent(event) ? 1 : 0,
                      border: isTodayEvent(event) ? '2px solid' : 'none',
                      borderColor: isTodayEvent(event) ? 'warning.main' : 'transparent'
                    }}>
                      <IconButton
                        onClick={() => toggleEvent(event.id)}
                        sx={{ mr: 1 }}
                      >
                        {event.completed ? (
                          <CheckCircle color="success" />
                        ) : (
                          <RadioButtonUnchecked />
                        )}
                      </IconButton>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              sx={{
                                textDecoration: event.completed ? 'line-through' : 'none',
                                color: event.completed ? 'text.secondary' : 'text.primary',
                                fontWeight: isTodayEvent(event) ? 'bold' : 'normal',
                              }}
                            >
                              {event.title}
                            </Typography>
                            <Chip
                              label={event.department}
                              size="small"
                              color={getDepartmentColor(event.department) as any}
                              variant="outlined"
                            />
                            {isTodayEvent(event) && (
                              <Chip
                                label="今日"
                                size="small"
                                color="warning"
                                variant="filled"
                                sx={{ fontWeight: 'bold' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {event.startDate && event.endDate ? 
                                `${formatDate(event.startDate)} - ${formatDate(event.endDate)}` :
                                event.startDate ? 
                                  `開始：${formatDate(event.startDate)}` :
                                  event.endDate ?
                                    `結束：${formatDate(event.endDate)}` :
                                    '未設定日期'
                              }
                            </Typography>
                            {event.description && (
                              <Typography variant="body2" color="text.secondary">
                                {event.description}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          size="small" 
                          sx={{ mr: 1 }}
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < sortedEvents.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CalendarMonth sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  暫無事件
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigateMonth('prev')}
                size="small"
              >
                上個月
              </Button>
              <Typography variant="h6">
                {currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })}
              </Typography>
              <Button
                endIcon={<ArrowForward />}
                onClick={() => navigateMonth('next')}
                size="small"
              >
                下個月
              </Button>
            </Box>

            <Grid container spacing={0}>
              {weekDays.map(day => (
                <Grid item xs={12/7} key={day}>
                  <Paper
                    sx={{
                      p: 1,
                      textAlign: 'center',
                      bgcolor: 'grey.100',
                      minHeight: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" fontWeight="bold">
                      {day}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
              
              {getDaysInMonth(currentDate).map((date, index) => {
                const dayEvents = date ? getEventsForDate(date) : [];
                const today = new Date();
                const todayString = formatDateToString(today);
                const dateString = date ? formatDateToString(date) : '';
                const isToday = date && dateString === todayString;
                console.log(dateString, todayString);
                
                return (
                  <Grid item xs={12/7} key={index}>
                    <Paper
                      onClick={() => date && handleDateClick(date)}
                      sx={{
                        p: 1,
                        minHeight: 100,
                        bgcolor: isToday ? 'warning.light' : 'transparent',
                        border: isToday ? 3 : 1,
                        borderColor: isToday ? 'warning.main' : 'grey.300',
                        position: 'relative',
                        cursor: date ? 'pointer' : 'default',
                        '&:hover': date ? {
                          bgcolor: isToday ? 'warning.main' : 'action.hover',
                          '& .MuiTypography-root': {
                            color: isToday ? 'warning.contrastText' : 'text.primary'
                          }
                        } : {},
                      }}
                    >
                      {date && (
                        <>
                          <Typography variant="caption" sx={{ fontWeight: isToday ? 'bold' : 'normal' }}>
                            {date.getDate()}
                            {isToday && (
                              <Typography component="span" variant="caption" sx={{
                                color: 'warning.dark',
                                fontWeight: 'bold',
                                ml: 0.5
                              }}>
                                今日
                              </Typography>
                            )}
                          </Typography>
                          {dayEvents.length > 0 && (
                            <Box sx={{ mt: 0.5 }}>
                              {dayEvents.slice(0, 3).map(event => (
                                <Chip
                                  key={event.id}
                                  label={event.title}
                                  size="small"
                                  color={getDepartmentColor(event.department) as any}
                                  sx={{
                                    fontSize: '0.6rem',
                                    height: 18,
                                    display: 'block',
                                    mb: 0.5,
                                    fontWeight: isToday ? 'bold' : 'normal',
                                  }}
                                />
                              ))}
                              {dayEvents.length > 3 && (
                                <Typography variant="caption" color="text.secondary">
                                  +{dayEvents.length - 3} 更多
                                </Typography>
                              )}
                            </Box>
                          )}
                        </>
                      )}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        <Dialog open={isDateDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                {selectedDate && selectedDate.toLocaleDateString('zh-TW', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </Typography>
              <IconButton onClick={handleCloseDialog}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent>
            {selectedDate && getEventsForDate(selectedDate).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  當日事件
                </Typography>
                <List>
                  {getEventsForDate(selectedDate).map((event) => (
                    <ListItem key={event.id} sx={{ px: 0 }}>
                      <IconButton
                        onClick={() => toggleEvent(event.id)}
                        sx={{ mr: 1 }}
                      >
                        {event.completed ? (
                          <CheckCircle color="success" />
                        ) : (
                          <RadioButtonUnchecked />
                        )}
                      </IconButton>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              sx={{
                                textDecoration: event.completed ? 'line-through' : 'none',
                                color: event.completed ? 'text.secondary' : 'text.primary',
                              }}
                            >
                              {event.title}
                            </Typography>
                            <Chip
                              label={event.department}
                              size="small"
                              color={getDepartmentColor(event.department) as any}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={event.description}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          size="small" 
                          sx={{ mr: 1 }}
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              新增事件
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="標題"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                size="small"
              />
              <TextField
                fullWidth
                label="描述"
                multiline
                rows={2}
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                size="small"
              />
              <TextField
                fullWidth
                label="開始日期"
                type="date"
                value={newEvent.startDate}
                onChange={(e) => setNewEvent(prev => ({ ...prev, startDate: e.target.value }))}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="結束日期"
                type="date"
                value={newEvent.endDate}
                onChange={(e) => setNewEvent(prev => ({ ...prev, endDate: e.target.value }))}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth size="small">
                <InputLabel>行政處室</InputLabel>
                <Select
                  value={newEvent.department}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, department: e.target.value as '教務處' | '學務處' | '總務處' | '輔導處' | '人事處' | '會計處' }))}
                  label="行政處室"
                >
                  <MenuItem value="教務處">教務處</MenuItem>
                  <MenuItem value="學務處">學務處</MenuItem>
                  <MenuItem value="總務處">總務處</MenuItem>
                  <MenuItem value="輔導處">輔導處</MenuItem>
                  <MenuItem value="人事處">人事處</MenuItem>
                  <MenuItem value="會計處">會計處</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseDialog}>
              取消
            </Button>
            <Button onClick={handleAddEvent} variant="contained" disabled={!newEvent.title.trim()}>
              新增
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={isEditDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">編輯事件</Typography>
              <IconButton onClick={handleCloseEditDialog}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                fullWidth
                label="標題"
                value={editingEvent?.title || ''}
                onChange={(e) => setEditingEvent(prev => prev ? { ...prev, title: e.target.value } : null)}
                size="small"
              />
              <TextField
                fullWidth
                label="描述"
                multiline
                rows={2}
                value={editingEvent?.description || ''}
                onChange={(e) => setEditingEvent(prev => prev ? { ...prev, description: e.target.value } : null)}
                size="small"
              />
              <TextField
                fullWidth
                label="開始日期"
                type="date"
                value={editingEvent?.startDate || ''}
                onChange={(e) => setEditingEvent(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="結束日期"
                type="date"
                value={editingEvent?.endDate || ''}
                onChange={(e) => setEditingEvent(prev => prev ? { ...prev, endDate: e.target.value } : null)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth size="small">
                <InputLabel>行政處室</InputLabel>
                <Select
                  value={editingEvent?.department || '教務處'}
                  onChange={(e) => setEditingEvent(prev => prev ? { ...prev, department: e.target.value as '教務處' | '學務處' | '總務處' | '輔導處' | '人事處' | '會計處' } : null)}
                  label="行政處室"
                >
                  <MenuItem value="教務處">教務處</MenuItem>
                  <MenuItem value="學務處">學務處</MenuItem>
                  <MenuItem value="總務處">總務處</MenuItem>
                  <MenuItem value="輔導處">輔導處</MenuItem>
                  <MenuItem value="人事處">人事處</MenuItem>
                  <MenuItem value="會計處">會計處</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseEditDialog}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} variant="contained" disabled={!editingEvent?.title.trim()}>
              儲存
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default Calendar;
