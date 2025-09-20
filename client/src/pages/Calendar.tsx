import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/zh-tw';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css';
// 設置中文本地化
moment.locale('zh-tw');
const localizer = momentLocalizer(moment);

// 日曆中文化
const messages = {
  allDay: '全天',
  previous: '上一個',
  next: '下一個',
  today: '今天',
  month: '月',
  week: '週',
  day: '日',
  agenda: '議程',
  date: '日期',
  time: '時間',
  event: '事件',
  noEventsInRange: '此時間範圍內沒有事件',
  showMore: (total: number) => `還有 ${total} 個事件`,
};

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  isCompleted: boolean;
  priority: '高' | '中' | '低';
  type: 'todo' | 'event';
  description?: string;
}

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: 1,
      title: "繳交數學作業",
      start: new Date(2025, 8, 20, 10, 0),
      end: new Date(2025, 8, 20, 12, 0),
      isCompleted: false,
      priority: "高",
      type: "todo",
      description: "完成第三章習題"
    },
    {
      id: 2,
      title: "行政繳費截止",
      start: new Date(2025, 8, 22, 23, 59),
      end: new Date(2025, 8, 22, 23, 59),
      isCompleted: false,
      priority: "中",
      type: "todo"
    },
    {
      id: 3,
      title: "班親會",
      start: new Date(2025, 8, 25, 18, 30),
      end: new Date(2025, 8, 25, 20, 30),
      isCompleted: false,
      priority: "低",
      type: "event",
      description: "討論班級事務"
    }
  ]);

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<typeof Views[keyof typeof Views]>(Views.MONTH);
  const [showForm, setShowForm] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    start: "",
    end: "",
    priority: "中" as "高" | "中" | "低",
    type: "todo" as "todo" | "event",
    description: ""
  });

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

  // 重置表單
  const resetForm = () => {
    const defaults = getDefaultTimes();
    setNewEvent({
      title: "",
      start: defaults.start,
      end: defaults.end,
      priority: "中",
      type: "todo",
      description: ""
    });
  };

  // 新增事件
  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) {
      alert("請完整輸入所有必填欄位！");
      return;
    }
    
    const startDate = new Date(newEvent.start);
    const endDate = new Date(newEvent.end);
    
    if (endDate <= startDate) {
      alert("結束時間必須晚於開始時間！");
      return;
    }

    const newId = Math.max(...events.map(e => e.id), 0) + 1;
    const event: CalendarEvent = {
      id: newId,
      title: newEvent.title,
      start: startDate,
      end: endDate,
      isCompleted: false,
      priority: newEvent.priority,
      type: newEvent.type,
      description: newEvent.description
    };
    
    setEvents([...events, event]);
    setShowForm(false);
    resetForm();
  };

  // 切換完成狀態
  const toggleComplete = (eventId: number) => {
    setEvents(events.map(event => 
      event.id === eventId 
        ? { ...event, isCompleted: !event.isCompleted }
        : event
    ));
  };

  // 刪除事件
  const deleteEvent = (eventId: number) => {
    setEvents(events.filter(event => event.id !== eventId));
    setShowEventDetail(false);
    setSelectedEvent(null);
  };

  // 事件樣式
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor;
    
    if (event.isCompleted) {
      backgroundColor = '#4caf50';
    } else {
      switch(event.priority) {
        case "高":
          backgroundColor = '#f44336';
          break;
        case "中":
          backgroundColor = '#ff9800';
          break;
        case "低":
          backgroundColor = '#2196f3';
          break;
        default:
          backgroundColor = '#2196f3';
      }
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: event.isCompleted ? 0.7 : 1,
        color: 'white',
        border: 'none',
        display: 'block'
      }
    };
  };

  // 處理事件點擊
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          sx={{ borderRadius: 3 }}
        >
          新增事項
        </Button>
      </Box>

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
              onClick={() => {
                const unit = currentView === Views.MONTH ? 'month' : 
                           currentView === Views.WEEK ? 'week' : 'day';
                setCurrentDate(moment(currentDate).subtract(1, unit).toDate());
              }}
              sx={{ bgcolor: 'grey.100' }}
            >
              <NavigateBefore />
            </IconButton>
            <IconButton
              onClick={() => {
                const unit = currentView === Views.MONTH ? 'month' : 
                           currentView === Views.WEEK ? 'week' : 'day';
                setCurrentDate(moment(currentDate).add(1, unit).toDate());
              }}
              sx={{ bgcolor: 'grey.100' }}
            >
              <NavigateNext />
            </IconButton>
          </Box>
          
          <Typography variant="h6" fontWeight="bold" color="primary">
            {moment(currentDate).format('YYYY年MM月')}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA].map((view) => (
              <Button
                key={view}
                variant={currentView === view ? 'contained' : 'outlined'}
                onClick={() => setCurrentView(view)}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                {view === Views.MONTH && '月'}
                {view === Views.WEEK && '週'}
                {view === Views.DAY && '日'}
                {view === Views.AGENDA && '清單'}
              </Button>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* 日曆主體 */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3, minHeight: 600 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 550 }}
          messages={messages}
          date={currentDate}
          view={currentView}
          onNavigate={setCurrentDate}
          onView={setCurrentView}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          toolbar={false}
          popup
        />
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
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowForm(false)} color="inherit">
            取消
          </Button>
          <Button onClick={handleAddEvent} variant="contained">
            新增
          </Button>
        </DialogActions>
      </Dialog>

      {/* 事件詳情對話框 */}
      <Dialog open={showEventDetail} onClose={() => setShowEventDetail(false)} maxWidth="sm" fullWidth>
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
                    <strong>開始時間：</strong>{moment(selectedEvent.start).format('YYYY年MM月DD日 HH:mm')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>結束時間：</strong>{moment(selectedEvent.end).format('YYYY年MM月DD日 HH:mm')}
                  </Typography>
                  
                  {selectedEvent.description && (
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      <strong>描述：</strong>{selectedEvent.description}
                    </Typography>
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