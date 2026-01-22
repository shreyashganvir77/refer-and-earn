import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const statusBadge = (status) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch (status?.toUpperCase()) {
    case 'COMPLETED':
      return `${base} bg-green-100 text-green-800`;
    case 'PENDING':
      return `${base} bg-yellow-100 text-yellow-800`;
    case 'ACCEPTED':
      return `${base} bg-blue-100 text-blue-800`;
    case 'REJECTED':
      return `${base} bg-red-100 text-red-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
};

const paymentStatusBadge = (status) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch (status?.toUpperCase()) {
    case 'PAID':
      return `${base} bg-green-100 text-green-800`;
    case 'UNPAID':
      return `${base} bg-yellow-100 text-yellow-800`;
    case 'RELEASED':
      return `${base} bg-blue-100 text-blue-800`;
    case 'REFUNDED':
      return `${base} bg-gray-100 text-gray-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
};

const MyReferrals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [processingRefund, setProcessingRefund] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadReferrals() {
      try {
        setLoading(true);
        const data = await api.requestedReferrals();
        if (!mounted) return;
        setReferrals(data.referrals || []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load referrals');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    loadReferrals();
    return () => {
      mounted = false;
    };
  }, []);

  const handlePayNow = async (referralId) => {
    setProcessingPayment(referralId);
    try {
      const orderData = await api.createPaymentOrder(referralId);
      
      const options = {
        key: orderData.key || process.env.REACT_APP_RAZORPAY_KEY,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        order_id: orderData.orderId,
        name: 'Refer & Earn',
        description: `Payment for referral request #${referralId}`,
        handler: async (response) => {
          try {
            await api.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            alert('Payment successful!');
            // Reload referrals
            const data = await api.requestedReferrals();
            setReferrals(data.referrals || []);
          } catch (error) {
            const errorMsg = error.data?.error || error.message || 'Payment verification failed';
            alert(`Payment verification failed: ${errorMsg}`);
          } finally {
            setProcessingPayment(null);
          }
        },
        prefill: {
          name: user?.full_name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#4F46E5',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        alert(`Payment failed: ${response.error.description || 'Unknown error'}`);
        setProcessingPayment(null);
      });
      razorpay.open();
    } catch (error) {
      const errorMsg = error.data?.error || error.message || 'Failed to initialize payment';
      alert(`Payment failed: ${errorMsg}`);
      setProcessingPayment(null);
    }
  };

  const handleRefund = async (referralId) => {
    if (!window.confirm('Are you sure you want to request a refund? This action cannot be undone.')) {
      return;
    }

    setProcessingRefund(referralId);
    try {
      await api.refundPayment(referralId);
      alert('Refund request processed successfully!');
      // Reload referrals
      const data = await api.requestedReferrals();
      setReferrals(data.referrals || []);
    } catch (error) {
      const errorMsg = error.data?.error || error.message || 'Refund failed';
      alert(`Refund failed: ${errorMsg}`);
    } finally {
      setProcessingRefund(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <nav className="bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to Home
            </button>
            <h1 className="text-xl font-bold text-gray-900">My Referral Requests</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          {loading ? (
            <LoadingSpinner message="Loading your referrals..." />
          ) : error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 text-lg mb-4">You haven't requested any referrals yet.</p>
              <button
                onClick={() => navigate('/want-referral')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Request a Referral
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Referral Requests</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Track the status of your referral requests. You can rate providers once referrals are completed.
                </p>
              </div>

              <div className="grid gap-4">
                {referrals.map((ref) => {
                  const statusUpper = ref.status?.toUpperCase() || 'PENDING';
                  const isCompleted = statusUpper === 'COMPLETED';
                  return (
                    <div key={ref.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={statusBadge(ref.status)}>
                              {statusUpper === 'COMPLETED' ? 'Completed' : 
                               statusUpper === 'PENDING' ? 'Pending' : 
                               statusUpper === 'ACCEPTED' ? 'Accepted' : 
                               statusUpper === 'REJECTED' ? 'Rejected' : statusUpper}
                            </span>
                            {ref.payment_status && (
                              <span className={paymentStatusBadge(ref.payment_status)}>
                                Payment: {ref.payment_status}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              Requested on {new Date(ref.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <strong className="text-gray-700">Provider:</strong>{' '}
                              <span className="text-gray-900">{ref.provider_name}</span>
                            </div>
                            {ref.provider_email && (
                              <div>
                                <strong className="text-gray-700">Provider Email:</strong>{' '}
                                <a href={`mailto:${ref.provider_email}`} className="text-indigo-600 hover:underline">
                                  {ref.provider_email}
                                </a>
                              </div>
                            )}
                            <div>
                              <strong className="text-gray-700">Company:</strong>{' '}
                              <span className="text-gray-900">{ref.company_name || 'N/A'}</span>
                            </div>
                            {ref.job_id && (
                              <div>
                                <strong className="text-gray-700">Job ID:</strong>{' '}
                                <span className="text-gray-900">{ref.job_id}</span>
                              </div>
                            )}
                            {ref.job_title && (
                              <div>
                                <strong className="text-gray-700">Job Title:</strong>{' '}
                                <span className="text-gray-900">{ref.job_title}</span>
                              </div>
                            )}
                            {ref.price_agreed && (
                              <div>
                                <strong className="text-gray-700">Price Agreed:</strong>{' '}
                                <span className="text-gray-900">${ref.price_agreed}</span>
                              </div>
                            )}
                          </div>

                          {ref.referral_summary && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <strong className="text-gray-700 text-sm block mb-2">Your Referral Summary:</strong>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {ref.referral_summary}
                              </p>
                            </div>
                          )}

                          {ref.completed_at && (
                            <div className="text-xs text-gray-500">
                              Completed on {new Date(ref.completed_at).toLocaleString()}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          {ref.payment_status === 'UNPAID' && (
                            <button
                              onClick={() => handlePayNow(ref.id)}
                              disabled={processingPayment === ref.id}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {processingPayment === ref.id ? 'Processing...' : 'Pay Now'}
                            </button>
                          )}
                          {ref.payment_status === 'PAID' && statusUpper !== 'ACCEPTED' && statusUpper !== 'COMPLETED' && (
                            <button
                              onClick={() => handleRefund(ref.id)}
                              disabled={processingRefund === ref.id}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {processingRefund === ref.id ? 'Processing...' : 'Request Refund'}
                            </button>
                          )}
                          {isCompleted ? (
                            <div className="text-right">
                              <span className="text-sm text-green-700 font-medium block mb-2">✓ Completed</span>
                              <p className="text-xs text-gray-500">
                                You can now rate this provider
                              </p>
                            </div>
                          ) : (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                Waiting for provider to complete
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReferrals;
