// Test the subscription routes directly to see what error is occurring
const { createSubscriptionRouter } = require('./routes/subscriptions');
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

// Mock pool for testing
const mockPool = {
  query: async (sql, params) => {
    console.log('Mock query called with:', sql, params);
    return { rows: [] };
  }
};

// Create the router
const subscriptionRouter = createSubscriptionRouter(mockPool);

console.log('Subscription router created successfully');
console.log('Available routes:');
console.log('- GET /status');
console.log('- POST /subscribe');
console.log('- POST /create-order');
console.log('- POST /verify-payment');
console.log('- POST /webhook');

// Test if Razorpay is properly configured
console.log('\\nTesting Razorpay configuration:');
const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

console.log('RAZORPAY_KEY_ID set:', !!key_id);
console.log('RAZORPAY_KEY_SECRET set:', !!key_secret);

if (!key_id || !key_secret) {
  console.log('❌ Razorpay credentials are missing!');
  console.log('Please create a .env file with your actual Razorpay credentials.');
} else if (key_id === 'rzp_test_your_key_id_here' || key_secret === 'your_key_secret_here') {
  console.log('❌ Razorpay credentials are still using placeholder values!');
  console.log('Please update your .env file with actual Razorpay credentials.');
} else {
  console.log('✅ Razorpay credentials appear to be set properly.');
}
