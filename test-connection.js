// 測試連接腳本
const mongoose = require('mongoose');
require('dotenv').config();

// 導入模型
const User = require('./models/User');
const Semester = require('./models/Semester');

async function testConnection() {
  try {
    console.log('正在連接 MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher-student-app');
    console.log('MongoDB 連接成功！');

    // 檢查用戶
    const users = await User.find({});
    console.log(`找到 ${users.length} 個用戶:`);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role}`);
    });

    // 檢查學期
    const semesters = await Semester.find({}).populate('participants.user', 'name email role');
    console.log(`\n找到 ${semesters.length} 個學期:`);
    semesters.forEach(semester => {
      console.log(`- ${semester.name} (${semester.schoolYear})`);
      console.log(`  參與者:`);
      semester.participants.forEach(participant => {
        console.log(`    - ${participant.user.name} (${participant.role})`);
      });
    });

    // 測試特定用戶
    const teacher1 = await User.findOne({ email: 'teacher1@example.com' });
    if (teacher1) {
      console.log(`\n測試用戶: ${teacher1.name} (ID: ${teacher1._id})`);
      
      const userSemesters = await Semester.find({
        'participants.user': teacher1._id
      });
      console.log(`用戶參與的學期數量: ${userSemesters.length}`);
    }

  } catch (error) {
    console.error('測試失敗:', error);
  } finally {
    mongoose.connection.close();
  }
}

testConnection();
