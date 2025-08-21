const Razorpay = require('razorpay');

console.log('Testing Razorpay integration...');

// Check if environment variables are set
const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

console.log('RAZORPAY_KEY_ID:', key_id ? 'SET' : 'NOT SET');
console.log('RAZORPAY_KEY_SECRET:', key_secret ? 'SET' : 'NOT SET');

if (!key_id || !key_secret || key_id === 'rzp_test_your_key_id_here' || key_secret === 'your_key_secret_here') {
  console.log('❌ Razorpay credentials are not properly configured!');
  console.log('Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables.');
  console.log('You can create a .env file with these variables (copy from .env.example).');
  process.exit(1);
}

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: key_id,
  key_secret: key_secret
});

console.log('✅ Razorpay instance initialized successfully!');
console.log('Razorpay integration is ready to use.');
