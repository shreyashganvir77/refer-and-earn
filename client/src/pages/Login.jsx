import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
      width: 280,
      text: "continue_with",
      shape: "pill",
    });
    buttonRenderedRef.current = true;
  }, [googleReady, googleClientId, loginWithGoogle, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Content */}
      <main className="flex-1 flex items-center">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            {/* Left: Explanation */}
            <div className="flex-1 lg:max-w-lg">
              {/* Logo / Brand */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-indigo-600">
                  Refer & Earn
                </h1>
              </div>

              {/* Hero Section */}
              <section className="mb-6">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
                  Get Referrals.
                  <br />
                  Or Earn by Giving Them.
                </h2>
                <p className="text-base text-gray-600">
                  A trusted platform where professionals help each other with
                  referrals — securely and transparently.
                </p>
              </section>

              {/* How It Works */}
              <section className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  How It Works
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* For Requesters */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3.5 h-3.5 text-indigo-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-900 text-sm">
                        For Requesters
                      </span>
                    </div>
                    <ol className="space-y-1.5 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium">
                          1
                        </span>
                        <span>Post a referral request</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium">
                          2
                        </span>
                        <span>Pay securely</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium">
                          3
                        </span>
                        <span>Get referred by a verified professional</span>
                      </li>
                    </ol>
                  </div>

                  {/* For Providers */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3.5 h-3.5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-900 text-sm">
                        For Providers
                      </span>
                    </div>
                    <ol className="space-y-1.5 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
                          1
                        </span>
                        <span>Accept referral requests</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
                          2
                        </span>
                        <span>Share genuine referrals</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
                          3
                        </span>
                        <span>Get paid after completion</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </section>

              {/* Trust & Transparency */}
              <section className="hidden sm:block">
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  Trust & Transparency
                </h3>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-green-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Referrals only, no job promises</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-green-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Secure payments</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-green-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Payouts after completion</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-green-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Ratings & reviews</span>
                  </li>
                </ul>
              </section>
            </div>

            {/* Right: Login Card */}
            <div className="mt-8 lg:mt-0 w-full lg:w-auto flex-shrink-0">
              <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full lg:w-[340px]">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Get Started
                  </h3>
                  <p className="text-sm text-gray-500">
                    Join thousands of professionals
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div id="googleSignInDiv" />
                  {submitting && (
                    <p className="text-sm text-gray-600">Signing you in…</p>
                  )}
                  {error && <p className="text-sm text-red-600">{error}</p>}
                </div>

                <p className="mt-6 text-xs text-gray-500 text-center">
                  By continuing, you agree to our{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/terms-and-conditions")}
                    className="text-indigo-600 hover:underline focus:outline-none"
                  >
                    Terms
                  </button>{" "}
                  &{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/privacy")}
                    className="text-indigo-600 hover:underline focus:outline-none"
                  >
                    Privacy Policy
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-700">Refer & Earn</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/about")}
                className="hover:text-gray-700 hover:underline"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => navigate("/contact")}
                className="hover:text-gray-700 hover:underline"
              >
                Contact
              </button>
              <button
                type="button"
                onClick={() => navigate("/privacy")}
                className="hover:text-gray-700 hover:underline"
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={() => navigate("/terms-and-conditions")}
                className="hover:text-gray-700 hover:underline"
              >
                Terms
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
