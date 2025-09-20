import React, { useState } from 'react';
import {
  Container,
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
  Divider,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack,
  Send,
  Reply,
  PushPin,
  Visibility,
  Comment,
  MoreVert,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface DiscussionDetail {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar: string;
    role: string;
  };
  category: string;
  tags: string[];
  createdAt: string;
  views: number;
  replies: Array<{
    _id: string;
    author: {
      _id: string;
      name: string;
      avatar: string;
      role: string;
    };
    content: string;
    createdAt: string;
    updatedAt: string;
    isEdited: boolean;
  }>;
  isPinned: boolean;
  isClosed: boolean;
}

const DiscussionDetail: React.FC = () => {
  const { discussionId } = useParams<{ discussionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Fetch discussion details
  const { data: discussionData, isLoading: discussionLoading, error: discussionError } = useQuery(
    ['discussion', discussionId],
    async () => {
      const response = await api.get(`/discussions/${discussionId}`);
      return response.data.discussion;
    },
    {
      enabled: !!discussionId,
      refetchInterval: 10000, // Refetch every 10 seconds
    }
  );

  // Add reply mutation
  const addReplyMutation = useMutation(
    async (content: string) => {
      const response = await api.post(`/discussions/${discussionId}/reply`, { content });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['discussion', discussionId]);
        setReplyContent('');
        setIsSubmittingReply(false);
        toast.success('回覆添加成功！');
      },
      onError: () => {
        setIsSubmittingReply(false);
        toast.error('回覆添加失敗');
      },
    }
  );

  const handleAddReply = async () => {
    if (!replyContent.trim()) {
      toast.error('請輸入回覆內容');
      return;
    }

    setIsSubmittingReply(true);
    await addReplyMutation.mutateAsync(replyContent.trim());
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'teacher': return '老師';
      case 'parent': return '家長';
      case 'student': return '學生';
      default: return role;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'general': return '一般討論';
      case 'homework': return '作業相關';
      case 'announcement': return '公告';
      case 'question': return '問題求助';
      case 'event': return '活動';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general': return 'default';
      case 'homework': return 'primary';
      case 'announcement': return 'warning';
      case 'question': return 'info';
      case 'event': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy/MM/dd HH:mm');
  };

  if (discussionLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (discussionError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          無法載入討論串內容
        </Alert>
      </Container>
    );
  }

  if (!discussionData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          討論串不存在
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/discussions')}
          sx={{ textDecoration: 'none' }}
        >
          討論區
        </Link>
        <Typography color="text.primary">{discussionData.title}</Typography>
      </Breadcrumbs>

      {/* Discussion Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton onClick={() => navigate('/discussions')}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h4" component="h1" sx={{ flex: 1 }}>
                {discussionData.title}
              </Typography>
              {discussionData.isPinned && (
                <PushPin color="primary" />
              )}
              <IconButton>
                <MoreVert />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip
                label={getCategoryText(discussionData.category)}
                size="small"
                color={getCategoryColor(discussionData.category) as any}
              />
              {discussionData.isClosed && (
                <Chip
                  label="已關閉"
                  size="small"
                  color="error"
                />
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Visibility fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {discussionData.views}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Comment fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {discussionData.replies.length}
                </Typography>
              </Box>
            </Box>
            {discussionData.tags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {discussionData.tags.map((tag: string) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Author Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar src={discussionData.author.avatar}>
            {discussionData.author.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {discussionData.author.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={getRoleText(discussionData.author.role)}
                size="small"
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                {formatDate(discussionData.createdAt)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Discussion Content */}
        <Typography variant="body1" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {discussionData.content}
        </Typography>
      </Paper>

      {/* Replies */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          回覆 ({discussionData.replies.length})
        </Typography>

        {discussionData.replies.length > 0 ? (
          <List>
            {discussionData.replies.map((reply: any, index: number) => (
              <React.Fragment key={reply._id}>
                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar src={reply.author.avatar}>
                      {reply.author.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {reply.author.name}
                        </Typography>
                        <Chip
                          label={getRoleText(reply.author.role)}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(reply.createdAt)}
                        </Typography>
                        {reply.isEdited && (
                          <Typography variant="caption" color="text.secondary">
                            (已編輯)
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {reply.content}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < discussionData.replies.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Alert severity="info">
            暫無回覆，成為第一個回覆的人吧！
          </Alert>
        )}

        {/* Add Reply Form */}
        {!discussionData.isClosed && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Avatar src={user?.avatar}>
                {user?.name?.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="輸入您的回覆..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          color="primary"
                          onClick={handleAddReply}
                          disabled={!replyContent.trim() || isSubmittingReply}
                        >
                          <Send />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
          </>
        )}

        {discussionData.isClosed && (
          <Alert severity="info" sx={{ mt: 2 }}>
            此討論串已關閉，無法添加新回覆
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default DiscussionDetail;