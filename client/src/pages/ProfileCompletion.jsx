import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProfileCompletion = () => {
  const navigate = useNavigate();
  const { user, updateMe, isProfileComplete, loading: authLoading } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [companyEmail, setCompanyEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  const [form, setForm] = useState({
    company_id: user?.company_id ?? '',
    role_designation: user?.role_designation ?? '',
    years_experience: user?.years_experience ?? '',
    is_referral_provider: Boolean(user?.is_referral_provider),
    bio_description: user?.bio_description ?? '',
    price_per_referral: user?.price_per_referral ?? '',
  });

  useEffect(() => {
    setForm({
      company_id: user?.company_id ?? '',
      role_designation: user?.role_designation ?? '',
      years_experience: user?.years_experience ?? '',
      is_referral_provider: Boolean(user?.is_referral_provider),
      bio_description: user?.bio_description ?? '',
      price_per_referral: user?.price_per_referral ?? '',
    });
    // If user is already a provider, treat them as verified
    setOtpVerified(Boolean(user?.is_referral_provider));
  }, [user]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await api.companies();
        if (!mounted) return;
        setCompanies(data.companies || []);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Failed to load companies');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authLoading && user && isProfileComplete) {
      navigate('/');
    }
  }, [authLoading, user, isProfileComplete, navigate]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => {
      const next = { ...f, [name]: type === 'checkbox' ? checked : value };
      // Reset OTP state when toggling provider flag off
      if (name === 'is_referral_provider' && !checked) {
        setCompanyEmail('');
        setOtpCode('');
        setOtpSent(false);
        setOtpVerified(false);
        setOtpError(null);
      }
      return next;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.is_referral_provider && !otpVerified) {
      setError('Please verify your official company email via OTP before enabling referrals.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateMe({
        company_id: form.company_id ? form.company_id : null,
        role_designation: form.role_designation || null,
        years_experience: form.years_experience === '' ? null : Number(form.years_experience),
        is_referral_provider: Boolean(form.is_referral_provider),
        bio_description: form.bio_description || null,
        price_per_referral: form.price_per_referral === '' ? null : Number(form.price_per_referral),
      });
      navigate('/');
    } catch (e2) {
      setError(e2.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete your profile</h1>
          <p className="text-gray-600 mb-8">
            Add your company and role so we can match you with the right referrals.
          </p>

          {loading ? (
            <p className="text-gray-600">Loading…</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <select
                  name="company_id"
                  value={form.company_id}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                >
                  <option value="" disabled>Select your company</option>
                  {companies.map((c) => (
                    <option key={c.company_id} value={c.company_id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role / designation</label>
                <input
                  name="role_designation"
                  value={form.role_designation}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Senior Software Engineer"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of experience</label>
                <input
                  name="years_experience"
                  type="number"
                  min="0"
                  value={form.years_experience}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. 5"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="is_referral_provider"
                  name="is_referral_provider"
                  type="checkbox"
                  checked={form.is_referral_provider}
                  onChange={onChange}
                  className="h-4 w-4"
                />
                <label htmlFor="is_referral_provider" className="text-sm text-gray-700">
                  I want to provide paid referrals
                </label>
              </div>

              {form.is_referral_provider && (
                <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-700 font-medium">
                    Verify your company identity
                  </p>
                  <p className="text-xs text-gray-500">
                    To confirm you genuinely work at this company, enter your official company email.
                    We will send a one-time password (OTP) to that address for verification.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company official email
                    </label>
                    <input
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <button
                      type="button"
                      onClick={async () => {
                        setOtpError(null);
                        if (!companyEmail) {
                          setOtpError('Please enter your company email.');
                          return;
                        }
                        try {
                          setOtpSending(true);
                          await api.startReferralOtp(companyEmail);
                          setOtpSent(true);
                        } catch (err) {
                          setOtpError(err.message || 'Failed to send OTP');
                        } finally {
                          setOtpSending(false);
                        }
                      }}
                      disabled={otpSending || otpVerified}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-60"
                    >
                      {otpSending ? 'Sending OTP…' : otpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                    {otpVerified && (
                      <span className="text-sm text-green-600 font-medium">
                        Email verified
                      </span>
                    )}
                  </div>
                  {otpSent && !otpVerified && (
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Enter OTP sent to your company email"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          setOtpError(null);
                          if (!otpCode) {
                            setOtpError('Please enter the OTP from your email.');
                            return;
                          }
                          try {
                            setOtpVerifying(true);
                            await api.verifyReferralOtp(otpCode.trim());
                            setOtpVerified(true);
                          } catch (err) {
                            setOtpError(err.message || 'OTP verification failed');
                          } finally {
                            setOtpVerifying(false);
                          }
                        }}
                        disabled={otpVerifying}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-medium disabled:opacity-60"
                      >
                        {otpVerifying ? 'Verifying…' : 'Verify OTP'}
                      </button>
                    </div>
                  )}
                  {otpError && <p className="text-xs text-red-600">{otpError}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio / description</label>
                <textarea
                  name="bio_description"
                  value={form.bio_description}
                  onChange={onChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Short intro, experience, successes, etc."
                />
              </div>

              {form.is_referral_provider && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per referral (USD)</label>
                  <input
                    name="price_per_referral"
                    type="number"
                    min="0"
                    value={form.price_per_referral}
                    onChange={onChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. 150"
                    required
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save & Continue'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;

