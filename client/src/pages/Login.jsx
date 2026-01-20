import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const Login = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  console.log(process.env.REACT_APP_GOOGLE_CLIENT_ID);
  const googleClientId = useMemo(() => process.env.REACT_APP_GOOGLE_CLIENT_ID, []);


  useEffect(() => {
    // Render Google button via Google Identity Services (GIS)
    if (!googleClientId) {
      setError('Missing REACT_APP_GOOGLE_CLIENT_ID');
      return;
    }

    if (!window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response) => {
        try {
          setSubmitting(true);
          setError(null);
          const idToken = response.credential;
          const data = await loginWithGoogle(idToken);

          // If profile is incomplete, backend will still return user; routing decision is in App
          navigate('/');
          return data;
        } catch (e) {
          setError(e.message || 'Login failed');
        } finally {
          setSubmitting(false);
        }
      },
    });

    window.google.accounts.id.renderButton(document.getElementById('googleSignInDiv'), {
      theme: 'outline',
      size: 'large',
      width: 360,
      text: 'continue_with',
      shape: 'pill',
    });
  }, [googleClientId, loginWithGoogle, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to continue to Refer and Earn
          </p>
        </div>
        
        <div className="mt-8">
          <div className="flex flex-col items-center gap-4">
            <div id="googleSignInDiv" />
            {submitting && <p className="text-sm text-gray-600">Signing you in…</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
