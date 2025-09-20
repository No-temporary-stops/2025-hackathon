import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  PushPin,
  Visibility,
  Comment,
  FilterList,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm, Controller } from 'react-hook-form';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

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
  views: number;
  replies: Array<{
    author: { name: string };
  }>;
  isPinned: boolean;
  isClosed: boolean;
}

interface CreateDiscussionData {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

const Discussions: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateDiscussionData>({
    defaultValues: {
      category: 'general',
      tags: [],
    },
  });

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
      const activeSemester = semestersData.find((s: any) => s.isCurrentlyActive);
      if (activeSemester) {
        setSelectedSemester(activeSemester._id);
      } else if (semestersData.length > 0) {
        setSelectedSemester(semestersData[0]._id);
      }
    }
  }, [semestersData, selectedSemester]);

  // Fetch discussions for selected semester
  const { data: discussionsData, isLoading: discussionsLoading } = useQuery(
    ['discussions', selectedSemester, currentPage, selectedCategory, searchTerm],
    async () => {
      if (!selectedSemester) return { discussions: [], pagination: { total: 0, pages: 0 } };
      
      let url = `/discussions/semester/${selectedSemester}?page=${currentPage}&limit=10`;
      if (selectedCategory !== 'all') url += `&category=${selectedCategory}`;
      if (searchTerm) url += `&search=${searchTerm}`;
      
      const response = await api.get(url);
      return response.data;
    },
    {
      enabled: !!selectedSemester,
    }
  );

  // Create discussion mutation
  const createDiscussionMutation = useMutation(
    async (data: CreateDiscussionData & { semesterId: string }) => {
      const response = await api.post('/discussions/create', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['discussions', selectedSemester]);
        setCreateDialogOpen(false);
        reset();
        toast.success('討論串創建成功！');
      },
      onError: () => {
        toast.error('創建討論串失敗');
      },
    }
  );

  const handleCreateDiscussion = async (data: CreateDiscussionData) => {
    if (!selectedSemester) {
      toast.error('請先選擇學期');
      return;
    }

    await createDiscussionMutation.mutateAsync({
      ...data,
      semesterId: selectedSemester,
    });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
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
    return format(new Date(dateString), 'MM/dd HH:mm');
  };

  const currentSemester = semestersData?.find((s: any) => s._id === selectedSemester);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          討論區
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          創建討論
        </Button>
      </Box>

      {/* Semester Selection */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          選擇學期
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {semestersData?.map((semester: any) => (
            <Chip
              key={semester._id}
              label={`${semester.name} (${semester.schoolYear})`}
              color={semester._id === selectedSemester ? 'primary' : 'default'}
              variant={semester._id === selectedSemester ? 'filled' : 'outlined'}
              onClick={() => setSelectedSemester(semester._id)}
              sx={{
                bgcolor: semester.isCurrentlyActive ? 'success.light' : undefined,
                color: semester.isCurrentlyActive ? 'success.contrastText' : undefined,
              }}
            />
          ))}
        </Box>
      </Paper>

      {!selectedSemester ? (
        <Alert severity="info">
          請先選擇一個學期以查看討論區
        </Alert>
      ) : (
        <>
          {/* Search and Filter */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="搜尋討論串..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>分類</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="分類"
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    <MenuItem value="all">全部分類</MenuItem>
                    <MenuItem value="general">一般討論</MenuItem>
                    <MenuItem value="homework">作業相關</MenuItem>
                    <MenuItem value="announcement">公告</MenuItem>
                    <MenuItem value="question">問題求助</MenuItem>
                    <MenuItem value="event">活動</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Alert severity={currentSemester?.isCurrentlyActive ? 'success' : 'info'}>
                  {currentSemester?.isCurrentlyActive ? '當前活躍學期' : '已結束學期'}
                </Alert>
              </Grid>
            </Grid>
          </Paper>

          {/* Discussions List */}
          <Paper>
            {discussionsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : discussionsData?.discussions?.length > 0 ? (
              <>
                <List>
                  {discussionsData.discussions.map((discussion: Discussion) => (
                    <ListItem
                      key={discussion._id}
                      button
                      onClick={() => navigate(`/discussions/${discussion._id}`)}
                      sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        bgcolor: discussion.isPinned ? 'action.hover' : 'transparent',
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={discussion.author.avatar}>
                          {discussion.author.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h6" sx={{ flex: 1 }}>
                              {discussion.title}
                            </Typography>
                            {discussion.isPinned && (
                              <PushPin color="primary" />
                            )}
                            <Chip
                              label={getCategoryText(discussion.category)}
                              size="small"
                              color={getCategoryColor(discussion.category) as any}
                            />
                            {discussion.isClosed && (
                              <Chip
                                label="已關閉"
                                size="small"
                                color="error"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              by {discussion.author.name} • {formatDate(discussion.createdAt)}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Visibility fontSize="small" />
                                <Typography variant="caption">
                                  {discussion.views}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Comment fontSize="small" />
                                <Typography variant="caption">
                                  {discussion.replies.length}
                                </Typography>
                              </Box>
                            </Box>
                            {discussion.tags.length > 0 && (
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                                {discussion.tags.map((tag) => (
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
                        }
                      />
                      <IconButton>
                        <MoreVert />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>

                {/* Pagination */}
                {discussionsData.pagination.pages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <Pagination
                      count={discussionsData.pagination.pages}
                      page={currentPage}
                      onChange={(event, page) => setCurrentPage(page)}
                      color="primary"
                    />
                  </Box>
                )}
              </>
            ) : (
              <Alert severity="info" sx={{ m: 2 }}>
                暫無討論串，創建第一個討論串吧！
              </Alert>
            )}
          </Paper>
        </>
      )}

      {/* Create Discussion Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit(handleCreateDiscussion)}>
          <DialogTitle>創建新討論串</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="標題"
              margin="normal"
              {...register('title', {
                required: '請輸入討論串標題',
                minLength: {
                  value: 5,
                  message: '標題至少需要5個字符',
                },
              })}
              error={!!errors.title}
              helperText={errors.title?.message}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>分類</InputLabel>
              <Controller
                name="category"
                control={control}
                rules={{ required: '請選擇分類' }}
                render={({ field }) => (
                  <Select {...field} label="分類">
                    <MenuItem value="general">一般討論</MenuItem>
                    <MenuItem value="homework">作業相關</MenuItem>
                    <MenuItem value="announcement">公告</MenuItem>
                    <MenuItem value="question">問題求助</MenuItem>
                    <MenuItem value="event">活動</MenuItem>
                  </Select>
                )}
              />
            </FormControl>

            <TextField
              fullWidth
              label="內容"
              margin="normal"
              multiline
              rows={6}
              {...register('content', {
                required: '請輸入討論內容',
                minLength: {
                  value: 10,
                  message: '內容至少需要10個字符',
                },
              })}
              error={!!errors.content}
              helperText={errors.content?.message}
            />

            <TextField
              fullWidth
              label="標籤 (用逗號分隔)"
              margin="normal"
              placeholder="例如：數學, 作業, 問題"
              {...register('tags')}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? '創建中...' : '創建討論'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Discussions;
