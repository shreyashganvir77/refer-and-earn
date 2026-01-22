import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

const ProviderReferrals = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [error, setError] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const fetchReferrals = useMemo(
    () => async () => {
      try {
        setLoading(true);
        const data = await api.providerReferrals();
        setReferrals(data.referrals || []);
      } catch (err) {
        setError(err.message || 'Failed to load referrals');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const handleComplete = async (id) => {
    try {
      setCompletingId(id);
      await api.completeReferral(id);
      await fetchReferrals();
    } catch (err) {
      setError(err.message || 'Failed to complete referral');
    } finally {
      setCompletingId(null);
      setConfirmId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-indigo-600">Referral Requests</h1>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Referral Requests</h2>
              <p className="text-gray-600 text-sm">
                Manage incoming referrals. Mark as completed once you’ve provided the referral.
              </p>
            </div>
            {loading && <span className="text-sm text-gray-500">Loading…</span>}
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && referrals.length === 0 && (
            <div className="text-center py-10 text-gray-600">No referral requests yet.</div>
          )}

          <div className="grid gap-4">
            {referrals.map((ref) => {
              const isPending = ref.status?.toUpperCase() === 'PENDING';
              const statusUpper = ref.status?.toUpperCase() || 'PENDING';
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
                        <span className="text-xs text-gray-500">
                          Requested on {new Date(ref.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <strong className="text-gray-700">Requester:</strong>{' '}
                          <span className="text-gray-900">{ref.requester_name}</span>
                        </div>
                        {ref.requester_email && (
                          <div>
                            <strong className="text-gray-700">Email:</strong>{' '}
                            <a href={`mailto:${ref.requester_email}`} className="text-indigo-600 hover:underline">
                              {ref.requester_email}
                            </a>
                          </div>
                        )}
                        {ref.phone_number && (
                          <div>
                            <strong className="text-gray-700">Phone:</strong>{' '}
                            <span className="text-gray-900">{ref.phone_number}</span>
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
                        {ref.requester_role && (
                          <div>
                            <strong className="text-gray-700">Requester Role:</strong>{' '}
                            <span className="text-gray-900">{ref.requester_role}</span>
                          </div>
                        )}
                      </div>

                      {ref.resume_link && (
                        <div className="text-sm">
                          <strong className="text-gray-700">Resume:</strong>{' '}
                          <a
                            href={ref.resume_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-700 underline"
                          >
                            View Resume →
                          </a>
                        </div>
                      )}

                      {ref.referral_summary && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <strong className="text-gray-700 text-sm block mb-2">Referral Summary:</strong>
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

                    <div className="flex items-center lg:flex-col lg:items-end gap-3">
                      {isPending ? (
                        <button
                          onClick={() => setConfirmId(ref.id)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-60 whitespace-nowrap"
                          disabled={completingId === ref.id}
                        >
                          {completingId === ref.id ? 'Updating…' : 'Mark as Completed'}
                        </button>
                      ) : statusUpper === 'COMPLETED' ? (
                        <span className="text-sm text-green-700 font-medium">✓ Completed</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Confirmation modal */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm completion</h3>
            <p className="text-sm text-gray-600 mb-6">
              Confirm that you have successfully provided the referral.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleComplete(confirmId)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
                disabled={completingId === confirmId}
              >
                {completingId === confirmId ? 'Updating…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderReferrals;

