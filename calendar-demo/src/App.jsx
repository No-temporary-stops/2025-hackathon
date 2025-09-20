import React, { useState } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "moment/locale/zh-tw";
import "react-big-calendar/lib/css/react-big-calendar.css";

moment.locale('zh-tw');
const localizer = momentLocalizer(moment);

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
  showMore: total => `還有 ${total} 個事件`,
};

// 自定義時間選擇器組件（手動輸入版本）
const TimeSelector = ({ label, value, onChange, required }) => {
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');

  // 只在初始化時設定一次值，避免跳針
  React.useEffect(() => {
    if (value && (!date && !hour && !minute)) {
      const d = new Date(value);
      setDate(d.toISOString().split('T')[0]);
      setHour(String(d.getHours()).padStart(2, '0'));
      setMinute(String(d.getMinutes()).padStart(2, '0'));
    }
  }, [value, date, hour, minute]);

  const handleChange = () => {
    if (date && hour && minute) {
      const newDateTime = `${date}T${hour}:${minute}`;
      onChange(newDateTime);
    }
  };

  // 手動觸發更新，而不是自動
  React.useEffect(() => {
    handleChange();
  }, [date, hour, minute]);

  return (
    <div>
      <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
        {label} {required && <span style={{ color: "#e53e3e" }}>*</span>}
      </label>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            flex: 2,
            padding: "12px",
            border: "2px solid #e5e7eb",
            borderRadius: "10px",
            fontSize: "14px",
            outline: "none",
            transition: "border-color 0.2s ease"
          }}
          onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
          onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
          required={required}
        />
        <select
          value={hour}
          onChange={(e) => setHour(e.target.value)}
          style={{
            flex: 1,
            padding: "12px",
            border: "2px solid #e5e7eb",
            borderRadius: "10px",
            fontSize: "14px",
            outline: "none"
          }}
        >
          {Array.from({length: 24}, (_, i) => (
            <option key={i} value={String(i).padStart(2, '0')}>
              {String(i).padStart(2, '0')}時
            </option>
          ))}
        </select>
        <select
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
          style={{
            flex: 1,
            padding: "12px",
            border: "2px solid #e5e7eb",
            borderRadius: "10px",
            fontSize: "14px",
            outline: "none"
          }}
        >
          {Array.from({length: 60}, (_, i) => (
            <option key={i} value={String(i).padStart(2, '0')}>
              {String(i).padStart(2, '0')}分
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

const MyCalendar = () => {
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "繳交數學作業",
      start: new Date(2025, 8, 20, 10, 0),
      end: new Date(2025, 8, 20, 12, 0),
      isCompleted: false,
      priority: "高",
      type: "todo"
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
      type: "todo"
    }
  ]);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(Views.MONTH);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    start: "",
    end: "",
    priority: "中",
    type: "todo"
  });

  // 導航功能
  const handleNavigate = (newDate) => setCurrentDate(newDate);
  const handleViewChange = (view) => setCurrentView(view);
  const handleToday = () => setCurrentDate(new Date());

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

  // 新增待辦事項
  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.start || !newEvent.end) {
      alert("請完整輸入所有欄位！");
      return;
    }
    
    const startDate = new Date(newEvent.start);
    const endDate = new Date(newEvent.end);
    
    if (endDate <= startDate) {
      alert("結束時間必須晚於開始時間！");
      return;
    }

    const newId = Math.max(...events.map(e => e.id), 0) + 1;
    setEvents([...events, {
      id: newId,
      title: newEvent.title,
      start: startDate,
      end: endDate,
      isCompleted: false,
      priority: newEvent.priority,
      type: "todo"
    }]);
    
    setNewEvent({ title: "", start: "", end: "", priority: "中", type: "todo" });
    setShowForm(false);
  };

  // 切換待辦事項完成狀態
  const toggleTodoComplete = (eventId) => {
    setEvents(events.map(event => 
      event.id === eventId 
        ? { ...event, isCompleted: !event.isCompleted }
        : event
    ));
  };

  // 刪除事件
  const handleDeleteEvent = (eventId) => {
    if (window.confirm("確定要刪除此事件嗎？")) {
      setEvents(events.filter(event => event.id !== eventId));
      setSelectedEvent(null);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* 頂部導航欄 */}
      <nav style={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        padding: "15px 0",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        borderBottom: "1px solid rgba(0,0,0,0.1)"
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 20px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <h1 style={{ 
                margin: 0, 
                fontSize: "24px", 
                fontWeight: "700", 
                color: "#2d3748",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                � 校園待辦事項系統
              </h1>
              <span style={{
                fontSize: "12px",
                color: "#666",
                backgroundColor: "#f0f0f0",
                padding: "4px 8px",
                borderRadius: "12px"
              }}>
                梅竹黑客松 Demo
              </span>
            </div>
            <button
              onClick={() => {
                if (!showForm) {
                  const defaults = getDefaultTimes();
                  setNewEvent({ title: "", start: defaults.start, end: defaults.end, priority: "中", type: "todo" });
                }
                setShowForm(!showForm);
              }}
              style={{
                padding: "10px 20px",
                background: showForm ? "linear-gradient(135deg, #e53e3e, #ff6b6b)" : "linear-gradient(135deg, #4299e1, #667eea)",
                color: "white",
                border: "none",
                borderRadius: "25px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                transition: "all 0.3s ease"
              }}
            >
              {showForm ? "✕ 取消新增" : "➕ 新增待辦事項"}
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "30px 20px" }}>
        {/* 控制面板 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
          padding: "20px 25px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
          border: "1px solid rgba(255,255,255,0.2)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button onClick={handleToday} style={{
              padding: "10px 18px", 
              background: "linear-gradient(135deg, #48bb78, #38a169)", 
              color: "white",
              border: "none", 
              borderRadius: "25px", 
              cursor: "pointer", 
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: "0 4px 12px rgba(72, 187, 120, 0.3)",
              transition: "all 0.3s ease"
            }}>📍 今天</button>
            
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => handleNavigate(moment(currentDate).subtract(1, currentView).toDate())} style={{
                padding: "8px 12px", 
                background: "linear-gradient(135deg, #718096, #4a5568)", 
                color: "white",
                border: "none", 
                borderRadius: "50%", 
                cursor: "pointer", 
                fontSize: "16px",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(113, 128, 150, 0.3)"
              }}>←</button>
              
              <button onClick={() => handleNavigate(moment(currentDate).add(1, currentView).toDate())} style={{
                padding: "8px 12px", 
                background: "linear-gradient(135deg, #718096, #4a5568)", 
                color: "white",
                border: "none", 
                borderRadius: "50%", 
                cursor: "pointer", 
                fontSize: "16px",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(113, 128, 150, 0.3)"
              }}>→</button>
            </div>
          </div>
          
          <div style={{ 
            fontSize: "22px", 
            fontWeight: "700", 
            color: "#2d3748",
            textAlign: "center",
            padding: "8px 20px",
            background: "rgba(102, 126, 234, 0.1)",
            borderRadius: "15px"
          }}>
            {moment(currentDate).format('YYYY年MM月')}
          </div>
          
          <div style={{ display: "flex", gap: "8px" }}>
            {[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA].map((view) => (
              <button 
                key={view} 
                onClick={() => handleViewChange(view)} 
                style={{
                  padding: "8px 16px",
                  background: currentView === view ? "linear-gradient(135deg, #4299e1, #667eea)" : "rgba(247, 250, 252, 0.8)",
                  color: currentView === view ? "white" : "#4a5568",
                  border: currentView === view ? "none" : "1px solid rgba(226, 232, 240, 0.8)",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  boxShadow: currentView === view ? "0 4px 15px rgba(66, 153, 225, 0.4)" : "none",
                  transition: "all 0.3s ease"
                }}
              >
                {view === Views.MONTH && '📅 月視圖'}
                {view === Views.WEEK && '📆 週視圖'}
                {view === Views.DAY && '📋 日視圖'}
                {view === Views.AGENDA && '📝 待辦事項'}
              </button>
            ))}
          </div>
        </div>

        {/* 主要內容區 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: (showForm || selectedEvent) ? "2fr 1fr" : "1fr",
          gap: "25px",
          alignItems: "start"
        }}>
          {/* 日曆主體 */}
          <div style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            padding: "25px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
            minHeight: "600px"
          }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 550 }}
              messages={messages}
              date={currentDate}
              view={currentView}
              onNavigate={handleNavigate}
              onView={handleViewChange}
              onSelectEvent={setSelectedEvent}
              toolbar={false}
              popup
              eventPropGetter={(event) => {
                let backgroundColor, textDecoration;
                
                if (event.isCompleted) {
                  backgroundColor = "linear-gradient(135deg, #10b981, #059669)";
                  textDecoration = "line-through";
                } else {
                  switch(event.priority) {
                    case "高":
                      backgroundColor = "linear-gradient(135deg, #e53e3e, #dc2626)";
                      break;
                    case "中":
                      backgroundColor = "linear-gradient(135deg, #f59e0b, #d97706)";
                      break;
                    case "低":
                      backgroundColor = "linear-gradient(135deg, #4299e1, #667eea)";
                      break;
                    default:
                      backgroundColor = "linear-gradient(135deg, #4299e1, #667eea)";
                  }
                  textDecoration = "none";
                }
                
                return {
                  style: {
                    background: backgroundColor,
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "500",
                    textDecoration: textDecoration,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                  }
                };
              }}
            />
          </div>

          {/* 側邊欄 */}
          {(showForm || selectedEvent) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* 事件詳情 */}
              {selectedEvent && (
                <div style={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "20px",
                  padding: "25px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                  border: "2px solid rgba(66, 153, 225, 0.3)"
                }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    marginBottom: "20px" 
                  }}>
                    <h3 style={{ 
                      margin: 0, 
                      color: "#2d3748", 
                      fontSize: "18px", 
                      fontWeight: "600" 
                    }}>
                      � 待辦事項詳情
                    </h3>
                    <button 
                      onClick={() => setSelectedEvent(null)} 
                      style={{
                        padding: "6px 10px", 
                        backgroundColor: "#e5e7eb", 
                        color: "#374151",
                        border: "none", 
                        borderRadius: "8px", 
                        cursor: "pointer", 
                        fontSize: "12px"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                    <div style={{ marginBottom: "12px" }}>
                      <span style={{ fontWeight: "600", color: "#374151" }}>標題：</span>
                      <span style={{ marginLeft: "8px", color: "#6b7280" }}>{selectedEvent.title}</span>
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      <span style={{ fontWeight: "600", color: "#374151" }}>狀態：</span>
                      <span style={{ 
                        marginLeft: "8px", 
                        color: selectedEvent.isCompleted ? "#10b981" : "#f59e0b",
                        fontWeight: "600"
                      }}>
                        {selectedEvent.isCompleted ? "✅ 已完成" : "⏰ 待完成"}
                      </span>
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      <span style={{ fontWeight: "600", color: "#374151" }}>優先級：</span>
                      <span style={{ 
                        marginLeft: "8px", 
                        color: selectedEvent.priority === "高" ? "#e53e3e" : 
                              selectedEvent.priority === "中" ? "#f59e0b" : "#10b981",
                        fontWeight: "600"
                      }}>
                        {selectedEvent.priority === "高" && "🔴 高"}
                        {selectedEvent.priority === "中" && "🟡 中"}  
                        {selectedEvent.priority === "低" && "🟢 低"}
                      </span>
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      <span style={{ fontWeight: "600", color: "#374151" }}>開始：</span>
                      <span style={{ marginLeft: "8px", color: "#6b7280" }}>
                        {moment(selectedEvent.start).format('YYYY年MM月DD日 HH:mm')}
                      </span>
                    </div>
                    <div style={{ marginBottom: "20px" }}>
                      <span style={{ fontWeight: "600", color: "#374151" }}>結束：</span>
                      <span style={{ marginLeft: "8px", color: "#6b7280" }}>
                        {moment(selectedEvent.end).format('YYYY年MM月DD日 HH:mm')}
                      </span>
                    </div>
                    
                    <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                      <button
                        onClick={() => toggleTodoComplete(selectedEvent.id)}
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: selectedEvent.isCompleted 
                            ? "linear-gradient(135deg, #f59e0b, #d97706)" 
                            : "linear-gradient(135deg, #10b981, #059669)",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                        }}
                      >
                        {selectedEvent.isCompleted ? "↩️ 標記未完成" : "✅ 標記完成"}
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: "linear-gradient(135deg, #e53e3e, #dc2626)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                        transition: "all 0.3s ease"
                      }}
                    >
                      🗑️ 刪除待辦事項
                    </button>
                  </div>
                </div>
              )}

              {/* 新增表單 */}
              {showForm && (
                <div style={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "20px",
                  padding: "25px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                  border: "1px solid rgba(255,255,255,0.2)"
                }}>
                  <h3 style={{ 
                    margin: "0 0 20px 0", 
                    color: "#2d3748",
                    fontSize: "18px",
                    fontWeight: "600"
                  }}>
                    ➕ 新增待辦事項
                  </h3>
                  
                  <form onSubmit={handleAddEvent}>
                    <div style={{ marginBottom: "20px" }}>
                      <label style={{ 
                        display: "block", 
                        marginBottom: "8px", 
                        fontSize: "14px", 
                        fontWeight: "600",
                        color: "#374151"
                      }}>
                        待辦事項標題 <span style={{ color: "#e53e3e" }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="例：繳交數學作業"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "2px solid #e5e7eb",
                          borderRadius: "10px",
                          fontSize: "14px",
                          outline: "none",
                          transition: "border-color 0.2s ease",
                          boxSizing: "border-box"
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                        onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                        required
                      />
                    </div>
                    
                    <div style={{ marginBottom: "20px" }}>
                      <label style={{ 
                        display: "block", 
                        marginBottom: "8px", 
                        fontSize: "14px", 
                        fontWeight: "600",
                        color: "#374151"
                      }}>
                        優先級 <span style={{ color: "#e53e3e" }}>*</span>
                      </label>
                      <select
                        value={newEvent.priority}
                        onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "2px solid #e5e7eb",
                          borderRadius: "10px",
                          fontSize: "14px",
                          outline: "none",
                          transition: "border-color 0.2s ease",
                          boxSizing: "border-box"
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                        onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                        required
                      >
                        <option value="高">🔴 高優先級</option>
                        <option value="中">🟡 中優先級</option>
                        <option value="低">🟢 低優先級</option>
                      </select>
                    </div>
                    
                    <div style={{ marginBottom: "20px" }}>
                      <TimeSelector
                        label="開始時間"
                        value={newEvent.start}
                        onChange={(value) => setNewEvent({ ...newEvent, start: value })}
                        required
                      />
                    </div>
                    
                    <div style={{ marginBottom: "25px" }}>
                      <TimeSelector
                        label="結束時間"
                        value={newEvent.end}
                        onChange={(value) => setNewEvent({ ...newEvent, end: value })}
                        required
                      />
                    </div>
                    
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button 
                        type="submit" 
                        style={{
                          flex: 1,
                          padding: "12px",
                          background: "linear-gradient(135deg, #48bb78, #38a169)",
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "600",
                          boxShadow: "0 4px 12px rgba(72, 187, 120, 0.3)"
                        }}
                      >
                        ✅ 確認新增
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setNewEvent({ title: "", start: "", end: "", priority: "中", type: "todo" });
                        }}
                        style={{
                          flex: 1,
                          padding: "12px",
                          background: "linear-gradient(135deg, #6b7280, #4b5563)",
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "600",
                          boxShadow: "0 4px 12px rgba(107, 114, 128, 0.3)"
                        }}
                      >
                        ❌ 取消
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyCalendar;
