import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Load Razorpay script
declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load subscription info on component mount
  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      try {
        const response = await axios.get('/api/subscriptions/status');
        setSubscriptionInfo(response.data.subscription);
      } catch (error) {
        console.error('Error fetching subscription info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionInfo();
  }, []);

  // Verify payment and update subscription
  const verifyPayment = async (paymentResponse: any, plan: any) => {
    try {
      const verifyResponse = await axios.post('/api/subscriptions/verify-payment', {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        planId: plan.id
      });

      if (verifyResponse.data.success) {
        // Refresh subscription info
        const response = await axios.get('/api/subscriptions/status');
        setSubscriptionInfo(response.data.subscription);
        alert('Payment successful! Your subscription has been activated.');
      } else {
        alert('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Error verifying payment. Please contact support.');
    }
  };

  // Handle Razorpay payment
  const handlePayment = async (plan: any) => {
    // Load Razorpay script if not already loaded
    const res = await loadRazorpayScript();

    if (!res) {
      alert('Failed to load Razorpay. Please check your internet connection.');
      return;
    }

    // Get order details from backend
    try {
      const orderResponse = await axios.post('/api/subscriptions/create-order', {
        planId: plan.id,
        amount: plan.amount
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key_here',
        amount: orderResponse.data.amount,
        currency: 'INR',
        name: 'StudyLib',
        description: `Subscription for ${plan.name}`,
        order_id: orderResponse.data.id,
        handler: async function (response: any) {
          await verifyPayment(response, plan);
        },
        prefill: {
          name: user?.username || '',
          email: '',
          contact: ''
        },
        notes: {
          plan_id: plan.id
        },
        theme: {
          color: '#6366f1'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      alert('Error initiating payment. Please try again.');
    }
  };

  // Calculate end date based on plan
  const calculateEndDate = (planId: string) => {
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

  // Consider a plan current only if still active and not expired
  const isPlanActive = (planId: string) => {
    if (!subscriptionInfo || subscriptionInfo.plan !== planId) return false;
    const end = subscriptionInfo.endDate ? new Date(subscriptionInfo.endDate) : null;
    const now = new Date();
    return Boolean(subscriptionInfo.isActive) && !!end && end.getTime() > now.getTime();
  };

  // Subscription plans data
  const plans = [
    {
      id: 'free_trial',
      name: 'Free Trial Plan',
      description: 'Kickstart Your Journey – 7 Days Free',
      price: '₹0',
      amount: 0,
      features: [
        'Full access to all features',
        'Manage unlimited students',
        'Track attendance',
        'Generate reports'
      ],
      cta: 'Current Plan',
      isCurrent: isPlanActive('free_trial'),
      disabled: true
    },
    {
      id: '1_month',
      name: '1-Month Plan',
      description: 'One Month to Build a Routine',
      price: '₹300',
      amount: 30000, // Amount in paise (₹300 = 30000 paise)
      features: [
        'Unlimited student addition',
        'All library management features',
        'Priority support',
        'No restrictions'
      ],
      cta: 'Start My Focus Journey',
      isCurrent: isPlanActive('1_month'),
      disabled: false
    },
    {
      id: '3_month',
      name: '3-Month Plan',
      description: 'Stay Focused for 90 Days',
      price: '₹850',
      amount: 85000, // Amount in paise (₹850 = 85000 paise)
      features: [
        'Unlimited students',
        'All features included',
        'Discounted rate',
        'Priority support'
      ],
      cta: "I'm In – Let's Go",
      isCurrent: isPlanActive('3_month'),
      disabled: false
    },
    {
      id: '6_month',
      name: '6-Month Plan',
      description: 'Make This Your Growth Phase',
      price: '₹1600',
      amount: 160000, // Amount in paise (₹1600 = 160000 paise)
      features: [
        'Great value package',
        'All premium features',
        'Extended support',
        'Best for growing libraries'
      ],
      cta: 'Fuel My Discipline',
      isCurrent: isPlanActive('6_month'),
      disabled: false
    },
    {
      id: '12_month',
      name: '12-Month Plan',
      description: 'All In for the Year',
      price: '₹3000',
      amount: 300000, // Amount in paise (₹3000 = 300000 paise)
      features: [
        'Best ;-) value',
        'All features unlocked',
        '24/7 priority support',
        'Focus for the long term'
      ],
      cta: 'Commit to Success',
      isCurrent: isPlanActive('12_month'),
      disabled: false
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Subscription Plans</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose a plan that fits your library's growth journey
          </p>
        </div>

        {/* Trial status banner */}
        {user?.is_trial && subscriptionInfo?.daysLeft !== null && subscriptionInfo?.daysLeft > 0 && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-8 text-center">
            <p className="font-bold">🟢 7-Day Free Trial Active – {subscriptionInfo.daysLeft} Days Left</p>
          </div>
        )}

        {/* Motivational section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-10 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Most people don't finish what they start. Not you.</h2>
          <p className="text-gray-600">
            This subscription isn't just a payment — it's your decision to run things smarter.
            And it starts now.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${
                plan.isCurrent ? 'border-purple-500' : 'border-gray-200'
              }`}
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="text-3xl font-bold text-purple-600 mb-4">{plan.price}</div>
                
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handlePayment(plan)}
                  disabled={plan.disabled || plan.isCurrent}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    plan.isCurrent
                      ? 'bg-gray-200 text-gray-700 cursor-default'
                      : plan.disabled
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-green-500 text-white hover:from-blue-600 hover:to-green-600'
                  }`}
                >
                  {plan.isCurrent ? 'Current Plan' : plan.cta}
                </button>
              </div>
            </div>
          ))}
          
          {/* Additional plan for 9-month option */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">9-Month Plan</h3>
              <p className="text-gray-600 mb-4">The Transformation Period</p>
              <div className="text-3xl font-bold text-purple-600 mb-4">₹2200</div>
              
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">All premium features</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Best value for serious libraries</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Extended support period</span>
                </li>
              </ul>
              
              {(() => {
                const current = isPlanActive('9_month');
                return (
                  <button
                    onClick={() => handlePayment({ id: '9_month', name: '9-Month Plan', amount: 220000 })}
                    disabled={current}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      current
                        ? 'bg-gray-200 text-gray-700 cursor-default'
                        : 'bg-gradient-to-r from-blue-500 to-green-500 text-white hover:from-blue-600 hover:to-green-600'
                    }`}
                  >
                    {current ? 'Current Plan' : 'Transform My Library'}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Motivational microtext */}
        <div className="mt-10 text-center">
          <p className="text-gray-600 mb-2">"Just ₹10/day to manage your study space professionally."</p>
          <p className="text-gray-600">"Join 300+ libraries building distraction-free environments."</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
