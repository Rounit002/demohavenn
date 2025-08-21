// Test to check if environment variables are properly loaded
require('dotenv').config();

console.log('Testing environment variables...');
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET);
console.log('RAZORPAY_WEBHOOK_SECRET:', process.env.RAZORPAY_WEBHOOK_SECRET);

// Test if they are properly set (not using placeholder values)
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'rzp_test_your_key_id_here') {
  console.log('✅ RAZORPAY_KEY_ID is properly set');
} else {
  console.log('❌ RAZORPAY_KEY_ID is missing or using placeholder');
}

if (process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== 'your_key_secret_here') {
  console.log('✅ RAZORPAY_KEY_SECRET is properly set');
} else {
  console.log('❌ RAZORPAY_KEY_SECRET is missing or using placeholder');
}
