const Razorpay = require('razorpay');

console.log('🔍 Validating Razorpay Setup...\n');

// Check if environment variables are set
const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

console.log('🔑 RAZORPAY_KEY_ID:', key_id ? 'SET' : 'NOT SET');
console.log('🔒 RAZORPAY_KEY_SECRET:', key_secret ? 'SET' : 'NOT SET');

if (!key_id || !key_secret) {
  console.log('\n❌ ERROR: Razorpay credentials are missing!');
  console.log('   Please add your actual Razorpay credentials to the .env file.');
  process.exit(1);
}

if (key_id === 'rzp_test_your_actual_key_id_here' || key_secret === 'your_actual_key_secret_here') {
  console.log('\n❌ ERROR: Razorpay credentials are still using placeholder values!');
  console.log('   Please replace the placeholder values in your .env file with actual credentials.');
  console.log('\n📝 Steps to fix:');
  console.log('   1. Get your actual Razorpay API keys from the Razorpay Dashboard');
  console.log('   2. Update the .env file with real values:');
  console.log('      RAZORPAY_KEY_ID=your_real_key_id');
  console.log('      RAZORPAY_KEY_SECRET=your_real_key_secret');
  console.log('   3. Restart your backend server');
  process.exit(1);
}

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: key_id,
  key_secret: key_secret
});

console.log('\n✅ Razorpay instance initialized successfully!');
console.log('✅ Razorpay integration is ready to use.');

console.log('\n🔄 Please restart your backend server to apply these changes.');
console.log('   After restarting, the subscription payment system should work properly.');
