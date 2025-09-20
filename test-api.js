// 測試 API 連接
const axios = require('axios');

async function testAPI() {
  try {
    console.log('測試服務器連接...');
    
    // 測試服務器是否運行
    const response = await axios.get('http://localhost:5000/api/auth/me', {
      timeout: 5000
    });
    
    console.log('服務器連接成功！');
    console.log('響應:', response.status);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ 服務器未運行，請先啟動服務器');
    } else if (error.response?.status === 401) {
      console.log('✅ 服務器正在運行（需要認證）');
    } else {
      console.log('服務器響應:', error.response?.status || error.message);
    }
  }
}

testAPI();
