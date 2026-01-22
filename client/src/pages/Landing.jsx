import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.full_name || user?.name || 'User';
  const avatarUrl = user?.picture
    ? user.picture
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4F46E5&color=fff`;

  console.log("avatarUrl:", avatarUrl);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-indigo-600 cursor-pointer" onClick={() => navigate('/')}>
              Refer & Earn
            </h1>
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <button
                    onClick={() => navigate('/my-referrals')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    My Referrals
                  </button>
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-700">{displayName}</span>
                  </div>
                </>
              )}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12 space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Refer & Earn Platform
          </h1>
          <p className="text-xl text-gray-600">
            Get referrals or help others land their dream job
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Want a Referral Card */}
          <div
            onClick={() => navigate('/want-referral')}
            className="group cursor-pointer bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-indigo-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-indigo-200 transition-colors">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Want a Referral</h2>
              <p className="text-gray-600 mb-6">
                Browse companies and find referral providers who can help you get your dream job
              </p>
              <div className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium group-hover:bg-indigo-700 transition-colors">
                Get Started →
              </div>
            </div>
          </div>

          {/* Give a Referral Card */}
          <div
            onClick={() => navigate('/give-referral')}
            className="group cursor-pointer bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-indigo-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Give a Referral</h2>
              <p className="text-gray-600 mb-6">
                Help others by providing referrals and earn money for successful placements
              </p>
              <div className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium group-hover:bg-purple-700 transition-colors">
                Get Started →
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
