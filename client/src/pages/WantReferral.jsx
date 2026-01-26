import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CompanySelector from "../components/CompanySelector";
import ProviderCard from "../components/ProviderCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const WantReferral = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [error, setError] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [formData, setFormData] = useState({
    job_id: "",
    job_title: "",
    resume_link: "",
    phone_number: "",
    referral_summary: "",
  });
  const [wordCount, setWordCount] = useState(0);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const text = formData.referral_summary.trim();
    const words = text ? text.split(/\s+/).filter((w) => w.length > 0) : [];
    setWordCount(words.length);
  }, [formData.referral_summary]);

  useEffect(() => {
    if (!selectedCompany) {
      setProviders([]);
      setError(null);
      return;
    }
    let mounted = true;
    setLoadingProviders(true);
    setError(null);
    const companyId = selectedCompany.company_id ?? selectedCompany.id;
    api
      .providersByCompany(companyId)
      .then((data) => {
        if (!mounted) return;
        setProviders(data.providers || []);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e.message || "Failed to load providers");
        setProviders([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingProviders(false);
        requestAnimationFrame(() => {
          document
            .getElementById("providers-section")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    return () => {
      mounted = false;
    };
  }, [selectedCompany]);

  const handleRequestReferral = (provider) => {
    setSelectedProvider(provider);
    setFormData({
      job_id: "",
      job_title: "",
      resume_link: "",
      phone_number: "",
      referral_summary: "",
    });
    setFormErrors({});
    setShowResumeModal(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.job_id.trim()) {
      errors.job_id = "Job ID is required";
    }

    if (!formData.job_title.trim()) {
      errors.job_title = "Job title is required";
    }

    if (!formData.resume_link.trim()) {
      errors.resume_link = "Resume link is required";
    } else {
      try {
        new URL(formData.resume_link.trim());
      } catch {
        errors.resume_link = "Please enter a valid URL";
      }
    }

    if (!formData.phone_number.trim()) {
      errors.phone_number = "Phone number is required";
    } else if (formData.phone_number.trim().length < 10) {
      errors.phone_number = "Phone number must be at least 10 characters";
    }

    if (!formData.referral_summary.trim()) {
      errors.referral_summary = "Referral summary is required";
    } else if (wordCount < 150) {
      errors.referral_summary = `Referral summary must be at least 150 words (current: ${wordCount} words)`;
    } else if (wordCount > 300) {
      errors.referral_summary = `Referral summary must not exceed 300 words (current: ${wordCount} words)`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitReferral = async () => {
    if (!validateForm()) {
      return;
    }

    const providerUserId = selectedProvider?.user_id;
    const price = selectedProvider?.price_per_referral;

    if (!providerUserId) return;

    try {
      // Create referral request
      const referralResponse = await api.createReferral({
        provider_user_id: providerUserId,
        price_agreed: price ?? 0,
        job_id: formData.job_id.trim(),
        job_title: formData.job_title.trim(),
        resume_link: formData.resume_link.trim(),
        phone_number: formData.phone_number.trim(),
        referral_summary: formData.referral_summary.trim(),
      });

      const referralRequestId = referralResponse.referral_request?.request_id;
      if (!referralRequestId) {
        throw new Error("Failed to get referral request ID");
      }

      // Close modal first
      setShowResumeModal(false);
      setFormData({
        job_id: "",
        job_title: "",
        resume_link: "",
        phone_number: "",
        referral_summary: "",
      });
      setFormErrors({});
      setSelectedProvider(null);

      // Create payment order and open Razorpay checkout
      try {
        const orderData = await api.createPaymentOrder(referralRequestId);

        const options = {
          key: orderData.key || process.env.REACT_APP_RAZORPAY_KEY,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          order_id: orderData.orderId,
          name: "Refer & Earn",
          description: `Payment for referral request #${referralRequestId}`,
          handler: async (response) => {
            try {
              await api.verifyPayment(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature,
              );
              alert("Payment successful! Your referral request is now active.");
              navigate("/my-referrals");
            } catch (error) {
              const errorMsg =
                error.data?.error ||
                error.message ||
                "Payment verification failed";
              alert(`Payment verification failed: ${errorMsg}`);
            }
          },
          prefill: {
            name: user?.full_name || "",
            email: user?.email || "",
          },
          theme: {
            color: "#4F46E5",
          },
          modal: {
            ondismiss: () => {
              // User closed the payment modal
              // Referral is created but unpaid - they can pay later from My Referrals
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on("payment.failed", (response) => {
          alert(
            `Payment failed: ${response.error.description || "Unknown error"}`,
          );
        });
        razorpay.open();
      } catch (paymentError) {
        const errorMsg =
          paymentError.data?.error ||
          paymentError.message ||
          "Failed to initialize payment";
        alert(
          `Referral created but payment failed: ${errorMsg}. You can pay later from My Referrals.`,
        );
        navigate("/my-referrals");
      }
    } catch (e) {
      const errorMsg =
        e.data?.error || e.message || "Failed to create referral request";
      alert(errorMsg);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <nav className="bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate("/")}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to Home
            </button>
            <h1 className="text-xl font-bold text-gray-900">Want a Referral</h1>
            <div className="flex items-center gap-2">
              {user?.is_referral_provider && (
                <button
                  onClick={() => navigate("/provider/referrals")}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  Provider Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Select a Company
          </h2>
          <CompanySelector
            value={selectedCompany}
            onChange={setSelectedCompany}
            placeholder="Search or select a company"
          />
        </div>

        {!selectedCompany && (
          <div
            id="empty-state"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center"
          >
            <svg
              className="w-14 h-14 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-600 text-base">
              Search and select a company to view referral providers
            </p>
          </div>
        )}

        {selectedCompany && (
          <div id="providers-section" className="mb-12">
            {loadingProviders && (
              <div className="mb-6">
                <LoadingSpinner message="Loading referral providers…" />
              </div>
            )}

            {!loadingProviders && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    Referral Providers at{" "}
                    {selectedCompany.company_name ?? selectedCompany.name}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Choose a provider to request a referral
                  </p>
                </div>

                {error && (
                  <div className="bg-white rounded-lg p-4 mb-6 border border-red-200">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {!error && providers.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {providers.map((provider) => (
                      <ProviderCard
                        key={provider.user_id ?? provider.id}
                        provider={{
                          id: provider.user_id ?? provider.id,
                          user_id: provider.user_id ?? provider.id,
                          name: provider.full_name ?? provider.name,
                          role: provider.role_designation ?? provider.role,
                          rating:
                            provider.provider_rating ?? provider.rating ?? 0,
                          price:
                            provider.price_per_referral ?? provider.price ?? 0,
                          price_per_referral:
                            provider.price_per_referral ?? provider.price ?? 0,
                          description:
                            provider.bio_description ??
                            provider.description ??
                            "",
                        }}
                        onRequestReferral={handleRequestReferral}
                      />
                    ))}
                  </div>
                )}

                {!error && providers.length === 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <svg
                      className="w-14 h-14 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p className="text-gray-600 text-base">
                      No referral providers available for this company
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Referral Request Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Request Referral
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Please fill in all the required information to request a referral.
            </p>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Job ID */}
              <div>
                <label
                  htmlFor="job-id"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Job ID <span className="text-red-500">*</span>
                </label>
                <input
                  id="job-id"
                  type="text"
                  value={formData.job_id}
                  onChange={(e) => handleInputChange("job_id", e.target.value)}
                  placeholder="e.g., JOB-12345"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.job_id
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-indigo-500"
                  }`}
                />
                {formErrors.job_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.job_id}
                  </p>
                )}
              </div>

              {/* Job Title */}
              <div>
                <label
                  htmlFor="job-title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="job-title"
                  type="text"
                  value={formData.job_title}
                  onChange={(e) =>
                    handleInputChange("job_title", e.target.value)
                  }
                  placeholder="e.g., Software Engineer"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.job_title
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-indigo-500"
                  }`}
                />
                {formErrors.job_title && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.job_title}
                  </p>
                )}
              </div>

              {/* Resume Link */}
              <div>
                <label
                  htmlFor="resume-link"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Resume Link <span className="text-red-500">*</span>
                </label>
                <input
                  id="resume-link"
                  type="url"
                  value={formData.resume_link}
                  onChange={(e) =>
                    handleInputChange("resume_link", e.target.value)
                  }
                  placeholder="https://drive.google.com/..."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.resume_link
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-indigo-500"
                  }`}
                />
                {formErrors.resume_link && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.resume_link}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phone-number"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone-number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) =>
                    handleInputChange("phone_number", e.target.value)
                  }
                  placeholder="e.g., +1 (555) 123-4567"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.phone_number
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-indigo-500"
                  }`}
                />
                {formErrors.phone_number && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.phone_number}
                  </p>
                )}
              </div>

              {/* Referral Summary */}
              <div>
                <label
                  htmlFor="referral-summary"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Referral Summary <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    ({wordCount}/150-300 words)
                  </span>
                </label>
                <textarea
                  id="referral-summary"
                  value={formData.referral_summary}
                  onChange={(e) =>
                    handleInputChange("referral_summary", e.target.value)
                  }
                  placeholder="Write a detailed summary explaining why you need this referral, your background, and how you're a good fit for the role (150-300 words)..."
                  rows={8}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-y ${
                    formErrors.referral_summary
                      ? "border-red-300 focus:ring-red-500"
                      : wordCount < 150 || wordCount > 300
                        ? "border-yellow-300 focus:ring-yellow-500"
                        : "border-gray-300 focus:ring-indigo-500"
                  }`}
                />
                <div className="mt-1 flex items-center justify-between">
                  {formErrors.referral_summary ? (
                    <p className="text-sm text-red-600">
                      {formErrors.referral_summary}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      {wordCount < 150
                        ? `Minimum 150 words required (${150 - wordCount} more needed)`
                        : wordCount > 300
                          ? `Maximum 300 words allowed (${wordCount - 300} over limit)`
                          : "Word count is valid"}
                    </p>
                  )}
                  <span
                    className={`text-xs font-medium ${
                      wordCount < 150 || wordCount > 300
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {wordCount} words
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowResumeModal(false);
                  setFormData({
                    job_id: "",
                    job_title: "",
                    resume_link: "",
                    phone_number: "",
                    referral_summary: "",
                  });
                  setFormErrors({});
                  setSelectedProvider(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReferral}
                disabled={wordCount < 150 || wordCount > 300}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WantReferral;
