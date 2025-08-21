# Razorpay Integration Setup Instructions

## Step 1: Create your .env file
Create a file named `.env` in the Backend directory with the following content:

```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=library_management
DB_PASSWORD=your_db_password
DB_PORT=5432

# Razorpay Configuration - Replace with your actual credentials
RAZORPAY_KEY_ID=your_actual_razorpay_key_id
RAZORPAY_KEY_SECRET=your_actual_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_actual_razorpay_webhook_secret

# Email Configuration (Brevo/Sendinblue) - Optional
BREVO_API_KEY=your_brevo_api_key
BREVO_TEMPLATE_ID=your_brevo_template_id

# Cloudinary Configuration - Optional
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Server Configuration
PORT=3000
SESSION_SECRET=your_session_secret
```

## Step 2: Get Razorpay Credentials
1. Sign up at [https://razorpay.com](https://razorpay.com)
2. Go to Dashboard > Settings > API Keys
3. Generate a new API key pair
4. Copy the Key ID and Key Secret to your `.env` file

## Step 3: Restart the Backend Server
After creating the `.env` file with your actual credentials, restart your backend server:

```bash
# If running with nodemon
npx nodemon server.js

# Or with node directly
node server.js
```

## Step 4: Test the Subscription Flow
1. Refresh your frontend application
2. Navigate to the Subscription Plans page
3. Click on any subscription plan (1 month, 3 months, etc.)
4. The payment flow should now work properly

## Troubleshooting
If you still encounter issues:
1. Check that all environment variables in your `.env` file have been replaced with actual values
2. Verify that the Razorpay credentials are correct
3. Ensure the backend server was restarted after creating the `.env` file
4. Check the backend console logs for any error messages
