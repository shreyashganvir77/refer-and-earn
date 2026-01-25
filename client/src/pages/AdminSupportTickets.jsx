import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAdminToken } from '../services/adminHttp';
import { adminService } from '../services/adminService';
import LoadingSpinner from '../components/LoadingSpinner';

const statusClass = (s) => {
  const u = (s || '').toUpperCase();
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
  if (u === 'OPEN') return `${base} bg-amber-100 text-amber-800`;
  if (u === 'RESOLVED') return `${base} bg-green-100 text-green-800`;
  return `${base} bg-slate-100 text-slate-700`;
};

const AdminSupportTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!getAdminToken()) {
      navigate('/admin/login', { replace: true });
      return;
    }
    let mounted = true;
    adminService
      .getSupportTickets()
      .then((r) => {
        if (!mounted) return;
        setTickets(r.tickets || []);
      })
      .catch((e) => {
        if (!mounted) return;
        if (e.status === 401) {
          adminService.logout();
          navigate('/admin/login', { replace: true });
          return;
        }
        setError(e.message || 'Failed to load tickets');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [navigate]);

  const handleLogout = () => {
    adminService.logout();
    navigate('/admin/login', { replace: true });
  };

  if (!getAdminToken()) return null;

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <h1 className="text-lg font-bold text-slate-900">Admin — Support Requests</h1>
            <div className="flex items-center gap-3">
              <Link to="/" className="text-sm text-slate-600 hover:text-slate-900">← App</Link>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Loading support requests…" />
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No support requests yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Issue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Requester</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Referral / Provider</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tickets.map((t) => (
                    <tr key={t.ticket_id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900">#{t.ticket_id}</td>
                      <td className="px-4 py-3">
                        <span className={statusClass(t.status)}>{t.status || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-900">{t.issue_type || '—'}</div>
                        <div className="text-xs text-slate-600 max-w-xs truncate" title={t.description}>
                          {t.description || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>{t.requester_name || '—'}</div>
                        <a href={`mailto:${t.requester_email}`} className="text-indigo-600 hover:underline text-xs">
                          {t.requester_email}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <div>Ref #{(t.referral_request_id != null) ? t.referral_request_id : '—'}</div>
                        <div>{t.provider_name || '—'} · {t.company_name || '—'}</div>
                        {t.job_title && <div className="text-xs text-slate-500">{t.job_title}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {t.created_at ? new Date(t.created_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupportTickets;
