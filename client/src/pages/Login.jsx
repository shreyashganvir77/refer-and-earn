import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginFooter from "../components/LoginFooter";

const Login = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const buttonRenderedRef = useRef(false);

  const googleClientId = useMemo(
    () => process.env.REACT_APP_GOOGLE_CLIENT_ID,
    [],
  );

  // Wait for Google Identity Services script (async defer) to load
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setGoogleReady(true);
      return;
    }
    const maxAttempts = 50;
    let attempts = 0;
    const id = setInterval(() => {
      attempts += 1;
      if (window.google?.accounts?.id) {
        setGoogleReady(true);
        clearInterval(id);
      } else if (attempts >= maxAttempts) {
        clearInterval(id);
      }
    }, 200);
    return () => clearInterval(id);
  }, []);

  // Initialize and render Google button once script is ready
  useEffect(() => {
    if (!googleClientId) {
      setError("Missing REACT_APP_GOOGLE_CLIENT_ID");
      return;
    }
    if (!googleReady) return;
    if (buttonRenderedRef.current) return;

    const el = document.getElementById("googleSignInDiv");
    if (!el) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response) => {
        try {
          setSubmitting(true);
          setError(null);
          const idToken = response.credential;
          const data = await loginWithGoogle(idToken);
          navigate("/");
          return data;
        } catch (e) {
          setError(e.message || "Login failed");
        } finally {
          setSubmitting(false);
        }
      },
    });

    window.google.accounts.id.renderButton(el, {
      theme: "outline",
      size: "large",
      width: 360,
      text: "continue_with",
      shape: "pill",
    });
    buttonRenderedRef.current = true;
  }, [googleReady, googleClientId, loginWithGoogle, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 pb-[60px]">
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
            {submitting && (
              <p className="text-sm text-gray-600">Signing you in…</p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>
      </div>
      <LoginFooter />
    </div>
  );
};

export default Login;
