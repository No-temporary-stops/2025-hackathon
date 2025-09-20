// 演示數據腳本
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// 導入模型
const User = require('../models/User');
const Semester = require('../models/Semester');
const Discussion = require('../models/Discussion');
const Message = require('../models/Message');

// 連接到 MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher-student-app');

async function seedData() {
  try {
    console.log('開始創建演示數據...');

    // 清除現有數據
    await User.deleteMany({});
    await Semester.deleteMany({});
    await Discussion.deleteMany({});
    await Message.deleteMany({});

    // 創建用戶
    const teacher1 = new User({
      name: '張老師',
      email: 'teacher1@example.com',
      password: 'password123',
      role: 'teacher',
      subjects: ['數學', '物理'],
      avatar: ''
    });

    const teacher2 = new User({
      name: '李老師',
      email: 'teacher2@example.com',
      password: 'password123',
      role: 'teacher',
      subjects: ['國語', '英語'],
      avatar: ''
    });

    const student1 = new User({
      name: '王小明',
      email: 'student1@example.com',
      password: 'password123',
      role: 'student',
      studentId: 'S001',
      grade: '八年級',
      avatar: ''
    });

    const student2 = new User({
      name: '李小華',
      email: 'student2@example.com',
      password: 'password123',
      role: 'student',
      studentId: 'S002',
      grade: '八年級',
      avatar: ''
    });

    const parent1 = new User({
      name: '王大雄',
      email: 'parent1@example.com',
      password: 'password123',
      role: 'parent',
      childName: '王小明',
      avatar: ''
    });

    const parent2 = new User({
      name: '李大華',
      email: 'parent2@example.com',
      password: 'password123',
      role: 'parent',
      childName: '李小華',
      avatar: ''
    });

    // 保存用戶
    await teacher1.save();
    await teacher2.save();
    await student1.save();
    await student2.save();
    await parent1.save();
    await parent2.save();

    console.log('用戶創建完成');

    // 創建學期
    const currentDate = new Date();
    const semesterStart = new Date(currentDate.getFullYear(), 0, 1); // 1月1日
    const semesterEnd = new Date(currentDate.getFullYear(), 11, 31); // 12月31日

    const semester = new Semester({
      name: '2025學年度第一學期',
      startDate: semesterStart,
      endDate: semesterEnd,
      schoolYear: '2025',
      isActive: true,
      description: '2025學年度第一學期，包含八年級數學和國語課程',
      participants: [
        { user: teacher1._id, role: 'teacher' },
        { user: teacher2._id, role: 'teacher' },
        { user: student1._id, role: 'student', studentId: 'S001' },
        { user: student2._id, role: 'student', studentId: 'S002' },
        { user: parent1._id, role: 'parent', studentId: 'S001' },
        { user: parent2._id, role: 'parent', studentId: 'S002' }
      ],
      classes: [
        {
          name: '八年級數學',
          teacher: teacher1._id,
          students: [student1._id, student2._id]
        },
        {
          name: '八年級國語',
          teacher: teacher2._id,
          students: [student1._id, student2._id]
        }
      ]
    });

    await semester.save();
    console.log('學期創建完成');

    // 創建討論串
    const discussion1 = new Discussion({
      title: '數學作業問題討論',
      content: '請問第3章第5題的解法，有同學可以幫忙解釋嗎？',
      author: student1._id,
      semester: semester._id,
      category: 'homework',
      tags: ['數學', '作業', '問題'],
      isPinned: false,
      replies: [
        {
          author: teacher1._id,
          content: '這題需要用到二次函數的性質，我來詳細解釋一下...',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小時前
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      ],
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
      views: 15
    });

    const discussion2 = new Discussion({
      title: '期中考試時間公告',
      content: '期中考試將於下週一開始，請同學們做好準備。考試範圍包括第1-4章。',
      author: teacher1._id,
      semester: semester._id,
      category: 'announcement',
      tags: ['考試', '公告', '期中考'],
      isPinned: true,
      replies: [],
      lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1天前
      views: 45
    });

    const discussion3 = new Discussion({
      title: '班級活動討論',
      content: '下個月我們可以舉辦什麼班級活動？大家有什麼建議嗎？',
      author: student2._id,
      semester: semester._id,
      category: 'event',
      tags: ['活動', '班級', '建議'],
      isPinned: false,
      replies: [
        {
          author: student1._id,
          content: '我覺得可以舉辦班級聚餐！',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6小時前
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
        },
        {
          author: teacher2._id,
          content: '聚餐是個好主意，我們可以討論一下地點和時間。',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4小時前
          updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
        }
      ],
      lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000),
      views: 28
    });

    await discussion1.save();
    await discussion2.save();
    await discussion3.save();
    console.log('討論串創建完成');

    // 創建一些訊息
    const message1 = new Message({
      sender: parent1._id,
      recipient: teacher1._id,
      content: '老師您好，我想了解一下小明最近在數學課上的表現如何？',
      messageType: 'text',
      semester: semester._id,
      isRead: false
    });

    const message2 = new Message({
      sender: teacher1._id,
      recipient: parent1._id,
      content: '小明在數學方面表現很好，上課很認真，作業也完成得不錯。',
      messageType: 'text',
      semester: semester._id,
      isRead: true,
      readAt: new Date(Date.now() - 30 * 60 * 1000) // 30分鐘前
    });

    const message3 = new Message({
      sender: parent2._id,
      recipient: teacher2._id,
      content: '老師，小華的國語成績最近有所下降，請問有什麼建議嗎？',
      messageType: 'text',
      semester: semester._id,
      isRead: false
    });

    await message1.save();
    await message2.save();
    await message3.save();
    console.log('訊息創建完成');

    console.log('\n演示數據創建完成！');
    console.log('\n測試帳戶：');
    console.log('老師1: teacher1@example.com / password123');
    console.log('老師2: teacher2@example.com / password123');
    console.log('學生1: student1@example.com / password123');
    console.log('學生2: student2@example.com / password123');
    console.log('家長1: parent1@example.com / password123');
    console.log('家長2: parent2@example.com / password123');

  } catch (error) {
    console.error('創建演示數據時發生錯誤:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedData();
