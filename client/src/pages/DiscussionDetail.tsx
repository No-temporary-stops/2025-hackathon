import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Chip,
  Divider,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Alert,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack,
  Reply,
  Edit,
  Delete,
  MoreVert,
  Lock,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface Discussion {
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
  updatedAt: string;
  views: number;
  replies: Reply[];
  isPinned: boolean;
  isClosed: boolean;
  semester: {
    _id: string;
    name: string;
    schoolYear: string;
  };
}

interface Reply {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ReplyFormData {
  content: string;
}

const DiscussionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReplyFormData>();

  // Fetch discussion details
  const { data: discussion, isLoading } = useQuery(
    ['discussion', id],
    async () => {
      const response = await api.get(`/discussions/${id}`);
      return response.data.discussion;
    },
    {
      enabled: !!id,
    }
  );

  // Create reply mutation
  const createReplyMutation = useMutation(
    async (data: ReplyFormData) => {
      const response = await api.post(`/discussions/${id}/replies`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['discussion', id]);
        reset();
        toast.success('回覆發表成功！');
      },
      onError: () => {
        toast.error('回覆發表失敗');
      },
    }
  );

  const handleReply = async (data: ReplyFormData) => {
    await createReplyMutation.mutateAsync(data);
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
    return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhTW });
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!discussion) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          討論串不存在或已被刪除
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Back Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate('/discussions')}
          sx={{ mr: 2 }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" fontWeight="bold">
          討論詳情
        </Typography>
      </Box>

      {/* Main Discussion */}
      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Discussion Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h4" fontWeight="bold" sx={{ flex: 1 }}>
                {discussion.title}
              </Typography>
              {discussion.isClosed && (
                <Lock color="error" />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip
                label={getCategoryText(discussion.category)}
                color={getCategoryColor(discussion.category) as any}
                size="small"
              />
              {discussion.isClosed && (
                <Chip
                  label="已關閉"
                  color="error"
                  size="small"
                />
              )}
            </Box>
          </Box>
          
          <IconButton>
            <MoreVert />
          </IconButton>
        </Box>

        {/* Author Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar src={discussion.author.avatar}>
            {discussion.author.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="medium">
              {discussion.author.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              發表於 {formatDate(discussion.createdAt)}
              {discussion.updatedAt !== discussion.createdAt && (
                <span> • 最後編輯於 {formatDate(discussion.updatedAt)}</span>
              )}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Discussion Content */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {discussion.content}
          </Typography>
        </Box>

        {/* Tags */}
        {discussion.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {discussion.tags.map((tag: string) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        )}

        {/* Discussion Stats */}
        <Box sx={{ display: 'flex', gap: 3, color: 'text.secondary' }}>
          <Typography variant="body2">
            瀏覽次數: {discussion.views}
          </Typography>
          <Typography variant="body2">
            回覆數: {discussion.replies.length}
          </Typography>
        </Box>
      </Paper>

      {/* Replies Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          回覆 ({discussion.replies.length})
        </Typography>
        
        {discussion.replies.length > 0 ? (
          <List>
            {discussion.replies.map((reply: Reply, index: number) => (
              <React.Fragment key={reply._id}>
                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar src={reply.author.avatar}>
                      {reply.author.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {reply.author.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(reply.createdAt)}
                          {reply.updatedAt !== reply.createdAt && ' (已編輯)'}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography 
                        variant="body2" 
                        sx={{ mt: 1, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
                      >
                        {reply.content}
                      </Typography>
                    }
                  />
                  <IconButton size="small">
                    <MoreVert />
                  </IconButton>
                </ListItem>
                {index < discussion.replies.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Alert severity="info">
            目前還沒有回覆，成為第一個回覆的人吧！
          </Alert>
        )}
      </Paper>

      {/* Reply Form */}
      {!discussion.isClosed && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              發表回覆
            </Typography>
            <form onSubmit={handleSubmit(handleReply)}>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="輸入您的回覆..."
                {...register('content', {
                  required: '請輸入回覆內容',
                  minLength: {
                    value: 5,
                    message: '回覆內容至少需要5個字符',
                  },
                })}
                error={!!errors.content}
                helperText={errors.content?.message}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Reply />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '發表中...' : '發表回覆'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      )}

      {discussion.isClosed && (
        <Alert severity="warning">
          此討論串已關閉，無法發表新回覆
        </Alert>
      )}
    </Container>
  );
};

export default DiscussionDetail;