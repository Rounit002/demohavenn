// Subscription management routes
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { authenticateOwner } = require('./ownerAuth');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id_here',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_key_secret_here'
});

// Check if Razorpay is properly configured
const isRazorpayConfigured = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  // Check if we're using real credentials or just placeholders
  return keyId && keySecret && 
         keyId !== 'rzp_test_your_key_id_here' && 
         keySecret !== 'your_key_secret_here';
};

const createSubscriptionRouter = (pool) => {
  const router = express.Router();

  // Get subscription status for the logged-in library owner
  router.get('/status', authenticateOwner, async (req, res) => {
    try {
      const libraryId = req.session.owner.id;
      
      const result = await pool.query(
        `SELECT subscription_plan, subscription_start_date, subscription_end_date, 
                is_trial, is_subscription_active FROM libraries WHERE id = $1`,
        [libraryId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Library not found' });
      }

      const subscription = result.rows[0];
      
      // Calculate days left in trial
      let daysLeft = null;
      if (subscription.is_trial && subscription.subscription_end_date) {
        const endDate = new Date(subscription.subscription_end_date);
        const currentDate = new Date();
        const timeDiff = endDate.getTime() - currentDate.getTime();
        daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
      }

      res.json({
        subscription: {
          plan: subscription.subscription_plan,
          startDate: subscription.subscription_start_date,
          endDate: subscription.subscription_end_date,
          isTrial: subscription.is_trial,
          isActive: subscription.is_subscription_active,
          daysLeft: daysLeft
        }
      });
    } catch (error) {
      console.error('[SUBSCRIPTION] Error fetching subscription status:', error);
      res.status(500).json({ message: 'Server error while fetching subscription status' });
    }
  });

  // Update subscription after successful payment
  router.post('/subscribe', authenticateOwner, async (req, res) => {
    try {
      const { plan, startDate, endDate } = req.body;
      const libraryId = req.session.owner.id;
      
      // Validate plan
      const validPlans = ['free_trial', '1_month', '3_month', '6_month', '12_month'];
      if (!validPlans.includes(plan)) {
        return res.status(400).json({ message: 'Invalid subscription plan' });
      }
      
      // Update subscription details
      const result = await pool.query(
        `UPDATE libraries 
         SET subscription_plan = $1, 
             subscription_start_date = $2, 
             subscription_end_date = $3, 
             is_trial = false, 
             is_subscription_active = true
         WHERE id = $4
         RETURNING subscription_plan, subscription_start_date, subscription_end_date, is_trial, is_subscription_active`,
        [plan, startDate, endDate, libraryId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Library not found' });
      }

      const subscription = result.rows[0];
      
      // Update session with new subscription info
      req.session.owner.subscription_plan = subscription.subscription_plan;
      req.session.owner.subscription_start_date = subscription.subscription_start_date;
      req.session.owner.subscription_end_date = subscription.subscription_end_date;
      req.session.owner.is_trial = subscription.is_trial;
      req.session.owner.is_subscription_active = subscription.is_subscription_active;

      res.json({
        message: 'Subscription updated successfully',
        subscription: {
          plan: subscription.subscription_plan,
          startDate: subscription.subscription_start_date,
          endDate: subscription.subscription_end_date,
          isTrial: subscription.is_trial,
          isActive: subscription.is_subscription_active
        }
      });
    } catch (error) {
      console.error('[SUBSCRIPTION] Error updating subscription:', error);
      res.status(500).json({ message: 'Server error while updating subscription' });
    }
  });

  // Razorpay webhook endpoint (to be implemented with actual Razorpay integration)
  router.post('/webhook', async (req, res) => {
    // This would handle Razorpay webhooks to confirm payments
    console.log('[SUBSCRIPTION] Razorpay webhook received:', req.body);
  
    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret_here';
    const signature = req.headers['x-razorpay-signature'];
  
    try {
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');
  
      if (digest !== signature) {
        return res.status(400).json({ message: 'Invalid signature' });
      }
  
      // Process the webhook event
      const event = req.body.event;
      const payload = req.body.payload;
  
      if (event === 'payment.captured') {
        // Payment was successful, update subscription status
        const libraryId = payload.payment.entity.notes.libraryId;
        const planId = payload.payment.entity.notes.planId;
        
        if (libraryId && planId) {
          // Update subscription in database
          await updateSubscriptionInDatabase(pool, libraryId, planId);
        }
      }
  
      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('[SUBSCRIPTION] Error processing webhook:', error);
      res.status(500).json({ message: 'Error processing webhook' });
    }
  });

  // Create order for Razorpay checkout
  router.post('/create-order', authenticateOwner, async (req, res) => {
    try {
      const { planId, amount } = req.body;
      const libraryId = req.session.owner.id;
  
      // Validate plan and amount
      const validPlans = ['1_month', '3_month', '6_month', '9_month', '12_month'];
      if (!validPlans.includes(planId)) {
        return res.status(400).json({ message: 'Invalid subscription plan' });
      }
  
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }
  
      // Check if Razorpay is properly configured
      if (!isRazorpayConfigured()) {
        return res.status(500).json({ 
          message: 'Payment gateway not configured. Please set up Razorpay credentials in environment variables.',
          code: 'RAZORPAY_NOT_CONFIGURED'
        });
      }
  
      // Create Razorpay order
      const options = {
        amount: amount, // Amount in paise
        currency: 'INR',
        receipt: `receipt_${libraryId}_${planId}`,
        notes: {
          libraryId: libraryId,
          planId: planId
        }
      };
  
      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error) {
      console.error('[SUBSCRIPTION] Error creating Razorpay order:', error);
      res.status(500).json({ message: 'Server error while creating order: ' + error.message });
    }
  });

  // Verify payment after checkout
  router.post('/verify-payment', authenticateOwner, async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
      const libraryId = req.session.owner.id;
      
      // Validate plan
      const validPlans = ['1_month', '3_month', '6_month', '9_month', '12_month'];
      if (!validPlans.includes(planId)) {
        return res.status(400).json({ success: false, message: 'Invalid subscription plan' });
      }
  
      // Verify payment signature
      const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_key_secret_here');
      shasum.update(razorpay_order_id + '|' + razorpay_payment_id);
      const digest = shasum.digest('hex');
  
      if (digest !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }
  
      // Update subscription in database
      const startDate = new Date();
      const endDate = calculateEndDate(planId);
  
      const result = await pool.query(
        `UPDATE libraries 
         SET subscription_plan = $1, 
             subscription_start_date = $2, 
             subscription_end_date = $3, 
             is_trial = false, 
             is_subscription_active = true
         WHERE id = $4
         RETURNING subscription_plan, subscription_start_date, subscription_end_date, is_trial, is_subscription_active`,
        [planId, startDate, endDate, libraryId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Library not found' });
      }

      const subscription = result.rows[0];
  
      // Update session with new subscription info
      req.session.owner.subscription_plan = subscription.subscription_plan;
      req.session.owner.subscription_start_date = subscription.subscription_start_date;
      req.session.owner.subscription_end_date = subscription.subscription_end_date;
      req.session.owner.is_trial = subscription.is_trial;
      req.session.owner.is_subscription_active = subscription.is_subscription_active;

      res.json({ success: true, message: 'Payment verified and subscription updated' });
    } catch (error) {
      console.error('[SUBSCRIPTION] Error verifying payment:', error);
      res.status(500).json({ success: false, message: 'Server error while verifying payment' });
    }
  });

  return router;
};

// Helper function to calculate end date based on plan
const calculateEndDate = (planId) => {
  const startDate = new Date();
  const endDate = new Date(startDate);
  
  switch(planId) {
    case '1_month':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case '3_month':
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case '6_month':
      endDate.setMonth(endDate.getMonth() + 6);
      break;
    case '9_month':
      endDate.setMonth(endDate.getMonth() + 9);
      break;
    case '12_month':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    default:
      endDate.setMonth(endDate.getMonth() + 1);
  }
  
  return endDate;
};

// Helper function to update subscription in database
const updateSubscriptionInDatabase = async (pool, libraryId, planId) => {
  const startDate = new Date();
  const endDate = calculateEndDate(planId);
  
  await pool.query(
    `UPDATE libraries 
     SET subscription_plan = $1, 
         subscription_start_date = $2, 
         subscription_end_date = $3, 
         is_trial = false, 
         is_subscription_active = true
     WHERE id = $4`,
    [planId, startDate, endDate, libraryId]
  );
};

module.exports = { createSubscriptionRouter };
