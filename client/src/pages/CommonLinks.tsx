import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  School,
  Payment,
  Assignment,
  Description,
  Event,
  Person,
  Settings,
  Assessment,
  LibraryBooks,
  Home,
  Public,
  Security,
  Support,
  BookOnline,
  Quiz,
  Grade,
  Schedule,
} from '@mui/icons-material';

interface LinkCategory {
  id: string;
  title: string;
  icon: React.ReactElement;
  color: string;
  links: LinkItem[];
}

interface LinkItem {
  id: string;
  name: string;
  url: string;
  icon: React.ReactElement;
  description: string;
  isExternal?: boolean;
}

const CommonLinks: React.FC = () => {
  const linkCategories: LinkCategory[] = [
    {
      id: 'academic',
      title: '學務系統',
      icon: <School />,
      color: '#1976d2',
      links: [
        {
          id: 'classroom',
          name: 'Google Classroom',
          url: 'https://classroom.google.com',
          icon: <Assignment />,
          description: '作業繳交與課程資料',
          isExternal: true,
        },
        {
          id: 'schedule',
          name: '課程表查詢',
          url: 'https://schedule.example.com',
          icon: <Schedule />,
          description: '個人課程表與教室安排',
          isExternal: true,
        },
        {
          id: 'grades',
          name: '成績查詢系統',
          url: 'https://grades.example.com',
          icon: <Grade />,
          description: '學期成績與評量結果',
          isExternal: true,
        },
        {
          id: 'library',
          name: '圖書館系統',
          url: 'https://library.example.com',
          icon: <LibraryBooks />,
          description: '圖書借閱與資料查詢',
          isExternal: true,
        },
      ],
    },
    {
      id: 'financial',
      title: '財務系統',
      icon: <Payment />,
      color: '#388e3c',
      links: [
        {
          id: 'payment',
          name: '學費繳費系統',
          url: 'https://payment.example.com',
          icon: <Payment />,
          description: '線上繳費平台',
          isExternal: true,
        },
        {
          id: 'scholarship',
          name: '獎學金申請',
          url: 'https://scholarship.example.com',
          icon: <Assessment />,
          description: '各類獎學金申請與查詢',
          isExternal: true,
        },
        {
          id: 'financial-aid',
          name: '助學金系統',
          url: 'https://aid.example.com',
          icon: <Support />,
          description: '助學金申請與管理',
          isExternal: true,
        },
      ],
    },
    {
      id: 'examination',
      title: '考試系統',
      icon: <Quiz />,
      color: '#f57c00',
      links: [
        {
          id: 'exam-system',
          name: '線上考試系統',
          url: 'https://exam.example.com',
          icon: <Quiz />,
          description: '線上考試與成績查詢',
          isExternal: true,
        },
        {
          id: 'exam-schedule',
          name: '考試時間表',
          url: 'https://examschedule.example.com',
          icon: <Event />,
          description: '各類考試時間安排',
          isExternal: true,
        },
        {
          id: 'makeup-exam',
          name: '補考申請',
          url: 'https://makeup.example.com',
          icon: <Description />,
          description: '補考申請與安排',
          isExternal: true,
        },
      ],
    },
    {
      id: 'student-services',
      title: '學生服務',
      icon: <Person />,
      color: '#7b1fa2',
      links: [
        {
          id: 'student-portal',
          name: '學生資訊系統',
          url: 'https://student.example.com',
          icon: <Person />,
          description: '個人資料與學籍管理',
          isExternal: true,
        },
        {
          id: 'dormitory',
          name: '宿舍管理系統',
          url: 'https://dorm.example.com',
          icon: <Home />,
          description: '住宿申請與管理',
          isExternal: true,
        },
        {
          id: 'counseling',
          name: '諮商輔導系統',
          url: 'https://counseling.example.com',
          icon: <Support />,
          description: '心理諮商預約與服務',
          isExternal: true,
        },
        {
          id: 'activities',
          name: '社團活動系統',
          url: 'https://activities.example.com',
          icon: <Event />,
          description: '社團活動報名與管理',
          isExternal: true,
        },
      ],
    },
    {
      id: 'administration',
      title: '行政服務',
      icon: <Settings />,
      color: '#5d4037',
      links: [
        {
          id: 'certificates',
          name: '證明文件申請',
          url: 'https://certificates.example.com',
          icon: <Description />,
          description: '在學證明、成績單等文件申請',
          isExternal: true,
        },
        {
          id: 'registration',
          name: '註冊選課系統',
          url: 'https://registration.example.com',
          icon: <BookOnline />,
          description: '課程註冊與選課服務',
          isExternal: true,
        },
        {
          id: 'graduation',
          name: '畢業審核系統',
          url: 'https://graduation.example.com',
          icon: <School />,
          description: '畢業資格審核與申請',
          isExternal: true,
        },
      ],
    },
    {
      id: 'technology',
      title: '資訊服務',
      icon: <Public />,
      color: '#455a64',
      links: [
        {
          id: 'email',
          name: '學校信箱',
          url: 'https://mail.example.com',
          icon: <Public />,
          description: '學校電子郵件服務',
          isExternal: true,
        },
        {
          id: 'vpn',
          name: 'VPN 連線服務',
          url: 'https://vpn.example.com',
          icon: <Security />,
          description: '校外連線學校網路',
          isExternal: true,
        },
        {
          id: 'helpdesk',
          name: '資訊服務台',
          url: 'https://helpdesk.example.com',
          icon: <Support />,
          description: '技術支援與問題回報',
          isExternal: true,
        },
      ],
    },
  ];

  const handleLinkClick = (url: string, isExternal: boolean = true) => {
    if (isExternal) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.open(url, '_self');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 標題區域 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          常用連結
        </Typography>
        <Typography variant="body1" color="text.secondary">
          快速存取各類行政系統與服務平台
        </Typography>
      </Box>

      {/* 分類網格 */}
      <Grid container spacing={3}>
        {linkCategories.map((category) => (
          <Grid item xs={12} sm={6} lg={4} key={category.id}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 3,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease-in-out',
                },
              }}
            >
              {/* 分類標題 */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: category.color,
                  color: 'white',
                  borderRadius: '12px 12px 0 0',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {category.icon}
                  <Typography variant="h6" fontWeight="bold">
                    {category.title}
                  </Typography>
                </Box>
              </Box>

              {/* 連結列表 */}
              <CardContent sx={{ p: 0 }}>
                {category.links.map((link) => (
                  <CardActionArea
                    key={link.id}
                    onClick={() => handleLinkClick(link.url, link.isExternal)}
                    sx={{
                      p: 2,
                      borderBottom: '1px solid',
                      borderBottomColor: 'divider',
                      '&:last-child': {
                        borderBottom: 'none',
                        borderRadius: '0 0 12px 12px',
                      },
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: 'grey.100',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {link.icon}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="subtitle1" 
                          fontWeight="medium"
                          sx={{ 
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {link.name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: '0.875rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {link.description}
                        </Typography>
                      </Box>
                      {link.isExternal && (
                        <Tooltip title="外部連結">
                          <IconButton size="small" sx={{ ml: 1 }}>
                            <Public fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </CardActionArea>
                ))}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 底部說明 */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          💡 提示：點擊任何連結都會在新分頁中開啟，方便您同時使用多個系統
        </Typography>
      </Box>
    </Container>
  );
};

export default CommonLinks;
