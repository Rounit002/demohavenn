const axios = require('axios');

async function testFullSubscriptionFlow() {
  try {
    console.log('Testing full subscription flow...');
    
    // First, let's check if we can login as a library owner
    console.log('\\n1. Testing login:');
    let loginResponse;
    try {
      loginResponse = await axios.post('http://localhost:3000/api/owner/login', {
        library_code: 'TEST01',
        password: 'test123'
      }, {
        withCredentials: true
      });
      console.log('✅ Login successful');
    } catch (error) {
      console.log('❌ Login failed:', error.response?.status, error.response?.data?.message || error.message);
      console.log('Note: You may need to use actual library credentials');
      return;
    }
    
    // Now test the create-order endpoint with proper authentication
    console.log('\\n2. Testing create-order endpoint with authentication:');
    try {
      const orderResponse = await axios.post('http://localhost:3000/api/subscriptions/create-order', {
        planId: '1_month',
        amount: 10000 // 100 INR in paise
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      console.log('✅ Order creation successful:', orderResponse.data);
    } catch (error) {
      console.log('❌ Order creation failed:', error.response?.status);
      console.log('   Error message:', error.response?.data?.message || error.message);
      if (error.response?.data?.code) {
        console.log('   Error code:', error.response.data.code);
      }
      
      // Check if it's a Razorpay configuration issue
      if (error.response?.data?.code === 'RAZORPAY_NOT_CONFIGURED') {
        console.log('\\n🔧 SOLUTION REQUIRED:');
        console.log('   1. Create a .env file in the Backend directory');
        console.log('   2. Add your actual Razorpay credentials:');
        console.log('      RAZORPAY_KEY_ID=your_actual_key_id');
        console.log('      RAZORPAY_KEY_SECRET=your_actual_key_secret');
        console.log('   3. Restart your backend server');
        console.log('   4. Refer to SETUP_INSTRUCTIONS.md for detailed steps');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFullSubscriptionFlow();
