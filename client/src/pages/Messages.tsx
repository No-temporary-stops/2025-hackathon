import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  Search,
  MoreVert,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

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

// 優化的消息組件
const MessageItem = React.memo<{
  message: Message;
  isOwnMessage: boolean;
  formatTime: (date: string) => string;
}>(({ message, isOwnMessage, formatTime }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
      mb: 2,
      px: 1,
    }}
  >
    <Box
      sx={{
        maxWidth: '70%',
        minWidth: '120px',
        p: 2,
        borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        bgcolor: isOwnMessage ? 'primary.main' : 'grey.100',
        color: isOwnMessage ? 'white' : 'text.primary',
        position: 'relative',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        '&::before': isOwnMessage ? {
          content: '""',
          position: 'absolute',
          bottom: 0,
          right: -8,
          width: 0,
          height: 0,
          borderLeft: '8px solid',
          borderLeftColor: 'primary.main',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
        } : {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: -8,
          width: 0,
          height: 0,
          borderRight: '8px solid',
          borderRightColor: 'grey.100',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
        }
      }}
    >
      <Typography 
        variant="body1" 
        sx={{ 
          wordBreak: 'break-word',
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          hyphens: 'auto',
        }}
      >
        {message.content}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'text.secondary',
          display: 'block',
          mt: 0.5,
          textAlign: isOwnMessage ? 'right' : 'left',
          fontSize: '0.75rem',
        }}
      >
        {formatTime(message.createdAt)}
      </Typography>
    </Box>
  </Box>
));

const Messages: React.FC = () => {
  const { user } = useAuth();
  const { joinRoom, leaveRoom, sendMessage, onMessage, onTyping, emitTyping } = useSocket();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Get user ID from URL params
  useEffect(() => {
    const userId = searchParams.get('user');
    if (userId) {
      setSelectedUserId(userId);
    }
  }, [searchParams]);

  // Fetch user's semesters
  const { data: semestersData } = useQuery(
    'semesters',
    async () => {
      const response = await api.get('/semesters/my-semesters');
      return response.data.semesters;
    }
  );

  // Set first active semester as default
  useEffect(() => {
    if (semestersData && !selectedSemester) {
      console.log('Available semesters:', semestersData);
      const activeSemester = semestersData.find((s: any) => s.isCurrentlyActive);
      if (activeSemester) {
        console.log('Selected active semester:', activeSemester._id);
        setSelectedSemester(activeSemester._id);
      } else if (semestersData.length > 0) {
        console.log('Selected first semester:', semestersData[0]._id);
        setSelectedSemester(semestersData[0]._id);
      }
    }
  }, [semestersData, selectedSemester]);

  // Fetch conversations for selected semester
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery(
    ['conversations', selectedSemester],
    async () => {
      if (!selectedSemester) return [];
      console.log('Fetching conversations for semester:', selectedSemester);
      try {
        const response = await api.get(`/messages/conversations/${selectedSemester}`);
        console.log('Conversations response:', response.data);
        return response.data.conversations;
      } catch (error) {
        console.error('Error fetching conversations:', error);
        // Fallback: get semester participants directly
        try {
          const semesterResponse = await api.get(`/semesters/${selectedSemester}`);
          const semester = semesterResponse.data.semester;
          console.log('Fallback: Using semester participants:', semester.participants);
          
          // Convert participants to conversation format
          const fallbackConversations = semester.participants
            .filter((p: any) => p.user._id !== user?.id) // Exclude current user
            .map((participant: any) => ({
              user: participant.user,
              lastMessage: {
                content: '開始對話',
                createdAt: new Date().toISOString()
              },
              unreadCount: 0
            }));
          
          console.log('Fallback conversations:', fallbackConversations);
          return fallbackConversations;
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          return [];
        }
      }
    },
    {
      enabled: !!selectedSemester,
    }
  );

  // Fetch messages for selected user and semester
  const { data: messagesData, isLoading: messagesLoading } = useQuery(
    ['messages', selectedUserId, selectedSemester],
    async () => {
      if (!selectedUserId || !selectedSemester) return [];
      const response = await api.get(`/messages/conversation/${selectedUserId}/${selectedSemester}`);
      return response.data.messages;
    },
    {
      enabled: !!selectedUserId && !!selectedSemester,
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    async (messageData: { recipientId: string; content: string; semesterId: string }) => {
      const response = await api.post('/messages/send', messageData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['messages', selectedUserId, selectedSemester]);
        queryClient.invalidateQueries(['conversations', selectedSemester]);
      },
    }
  );

  // Mark conversation as read mutation
  const markAsReadMutation = useMutation(
    async ({ userId, semesterId }: { userId: string; semesterId: string }) => {
      const response = await api.put(`/messages/read-conversation/${userId}/${semesterId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['conversations', selectedSemester]);
        queryClient.invalidateQueries(['messages', selectedUserId, selectedSemester]);
      },
      onError: (error: any) => {
        console.error('Mark as read error:', error);
      }
    }
  );

  // Join room when user is selected
  useEffect(() => {
    if (selectedUserId && selectedSemester) {
      const roomId = `${selectedUserId}-${selectedSemester}`;
      joinRoom(roomId);
      
      // Mark conversation as read when user opens it
      markAsReadMutation.mutate({
        userId: selectedUserId,
        semesterId: selectedSemester
      });
      
      return () => leaveRoom(roomId);
    }
  }, [selectedUserId, selectedSemester, joinRoom, leaveRoom, markAsReadMutation]);

  // Listen for new messages
  const handleNewMessage = useCallback((data: any) => {
    if (data.senderId !== user?.id) {
      queryClient.invalidateQueries(['messages', selectedUserId, selectedSemester]);
      queryClient.invalidateQueries(['conversations', selectedSemester]);
    }
  }, [user?.id, selectedUserId, selectedSemester, queryClient]);

  useEffect(() => {
    onMessage(handleNewMessage);
  }, [onMessage, handleNewMessage]);

  // Listen for typing indicators
  const handleTyping = useCallback((data: any) => {
    if (data.userId !== user?.id) {
      setTypingUser(data.userName);
      setIsTyping(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        setTypingUser(null);
      }, 3000);
    }
  }, [user?.id]);

  useEffect(() => {
    onTyping(handleTyping);
  }, [onTyping, handleTyping]);

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messagesData, scrollToBottom]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || !selectedSemester) return;

    try {
      await sendMessageMutation.mutateAsync({
        recipientId: selectedUserId,
        content: newMessage.trim(),
        semesterId: selectedSemester,
      });

      // Emit message via socket
      sendMessage({
        roomId: `${selectedUserId}-${selectedSemester}`,
        senderId: user?.id,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
      });

      setNewMessage('');
    } catch (error) {
      toast.error('發送訊息失敗');
    }
  };

  const handleTypingStart = () => {
    if (selectedUserId && selectedSemester) {
      emitTyping({
        roomId: `${selectedUserId}-${selectedSemester}`,
        userId: user?.id,
        userName: user?.name,
      });
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

  const formatMessageTime = useCallback((dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  }, []);

  const filteredConversations = useMemo(() => 
    conversationsData?.filter((conv: Conversation) =>
      conv.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [], [conversationsData, searchTerm]
  );


  const selectedUser = useMemo(() => 
    conversationsData?.find((conv: Conversation) => 
      conv.user._id === selectedUserId
    )?.user, [conversationsData, selectedUserId]
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        訊息中心
      </Typography>

      {/* Semester Selector */}
      {semestersData && semestersData.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small" sx={{ maxWidth: 300 }}>
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
        </Box>
      )}

      <Grid container spacing={2} sx={{ height: 'calc(100vh - 200px)' }}>
        {/* Conversations List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                placeholder="搜尋對話..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {conversationsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredConversations.length > 0 ? (
                <List>
                  {filteredConversations.map((conversation: Conversation) => (
                    <ListItem
                      key={conversation.user._id}
                      button
                      selected={conversation.user._id === selectedUserId}
                      onClick={() => setSelectedUserId(conversation.user._id)}
                      sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
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
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              noWrap
                              sx={{ 
                                fontStyle: conversation.lastMessage.content === '開始對話' ? 'italic' : 'normal',
                                opacity: conversation.lastMessage.content === '開始對話' ? 0.7 : 1
                              }}
                            >
                              {conversation.lastMessage.content}
                            </Typography>
                            {conversation.lastMessage.content !== '開始對話' && (
                              <Typography variant="caption" color="text.secondary">
                                {formatMessageTime(conversation.lastMessage.createdAt)}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info" sx={{ m: 2 }}>
                  {selectedSemester ? '此學期暫無其他用戶可以聊天' : '請先選擇學期'}
                </Alert>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={selectedUser.avatar}>
                      {selectedUser.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">
                        {selectedUser.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getRoleText(selectedUser.role)}
                      </Typography>
                    </Box>
                    <IconButton>
                      <MoreVert />
                    </IconButton>
                  </Box>
                </Box>

                {/* Messages */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                  {messagesLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : messagesData?.length > 0 ? (
                    <>
                      {messagesData.map((message: Message) => {
                        const isOwnMessage = message.sender._id === user?.id;
                        return (
                          <MessageItem
                            key={message._id}
                            message={message}
                            isOwnMessage={isOwnMessage}
                            formatTime={formatMessageTime}
                          />
                        );
                      })}
                      {isTyping && typingUser && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2, px: 1 }}>
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: '18px 18px 18px 4px',
                              bgcolor: 'grey.100',
                              position: 'relative',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                bottom: 0,
                                left: -8,
                                width: 0,
                                height: 0,
                                borderRight: '8px solid',
                                borderRightColor: 'grey.100',
                                borderTop: '8px solid transparent',
                                borderBottom: '8px solid transparent',
                              }
                            }}
                          >
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              {typingUser} 正在輸入...
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  ) : (
                    <Alert severity="info">
                      開始與 {selectedUser.name} 的對話
                    </Alert>
                  )}
                </Box>

                {/* Message Input */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      placeholder="輸入訊息..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      onInput={handleTypingStart}
                      multiline
                      maxRows={4}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small">
                              <EmojiEmotions />
                            </IconButton>
                            <IconButton size="small">
                              <AttachFile />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isLoading}
                      sx={{ minWidth: 'auto', px: 2 }}
                    >
                      <Send />
                    </Button>
                  </Box>
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Alert severity="info">
                  請選擇一個對話開始聊天
                </Alert>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Messages;
