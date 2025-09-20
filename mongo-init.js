// MongoDB 初始化腳本
// 創建應用程式數據庫和用戶

db = db.getSiblingDB('teacher-student-app');

// 創建應用程式用戶
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'teacher-student-app'
    }
  ]
});

// 創建索引
db.users.createIndex({ email: 1 }, { unique: true });
db.messages.createIndex({ sender: 1, recipient: 1, createdAt: -1 });
db.messages.createIndex({ semester: 1, createdAt: -1 });
db.discussions.createIndex({ semester: 1, lastActivity: -1 });
db.discussions.createIndex({ title: 'text', content: 'text', tags: 'text' });
db.semesters.createIndex({ participants: 1 });

print('數據庫初始化完成！');
