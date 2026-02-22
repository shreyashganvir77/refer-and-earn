import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import MyReferralRow from "../components/MyReferralRow";

const ISSUE_TYPES = [
  "Referral not provided",
  "Poor communication",
  "Misleading referral",
  "Other",
];
const SKELETON_COUNT = 5;

function SkeletonCard() {
  return (
    <div
      className="border border-gray-200 rounded-lg bg-white p-4 shadow-sm"
      aria-hidden
    >
      <div className="flex justify-between gap-2 mb-3">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-14 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="flex justify-between pt-3 border-t border-gray-100">
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

const MyReferrals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [processingRefund, setProcessingRefund] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  const [reviewModalRef, setReviewModalRef] = useState(null);
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  const [helpModalRef, setHelpModalRef] = useState(null);
  const [helpIssueType, setHelpIssueType] = useState("");
  const [helpDescription, setHelpDescription] = useState("");
  const [helpSubmitting, setHelpSubmitting] = useState(false);
  const [helpError, setHelpError] = useState(null);
  const [helpConfirming, setHelpConfirming] = useState(false);

  const [editModalRef, setEditModalRef] = useState(null);
  const [editFormData, setEditFormData] = useState({
    resume_link: "",
    job_id: "",
    job_title: "",
    referral_summary: "",
  });
  const [editFormErrors, setEditFormErrors] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);
  const [messagesByReferralId, setMessagesByReferralId] = useState({});

  const loadReferrals = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.requestedReferrals();
      setReferrals(data.referrals || []);
    } catch (err) {
      setError(err.message || "Failed to load referrals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  const handleOpenReviewModal = (ref) => {
    setReviewModalRef(ref);
    setReviewStars(0);
    setReviewText("");
    setReviewError(null);
  };

  const handleCloseReviewModal = () => {
    setReviewModalRef(null);
    setReviewStars(0);
    setReviewText("");
    setReviewError(null);
  };

  const handleSubmitReview = async () => {
    if (!reviewModalRef || reviewStars < 1 || reviewStars > 5) return;
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      await api.submitProviderReview(reviewModalRef.id, {
        stars: reviewStars,
        review_text: reviewText || null,
      });
      handleCloseReviewModal();
      await loadReferrals();
    } catch (err) {
      setReviewError(err.message || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleOpenHelpModal = (ref) => {
    setHelpModalRef(ref);
    setHelpIssueType("");
    setHelpDescription("");
    setHelpError(null);
    setHelpConfirming(false);
  };

  const handleCloseHelpModal = () => {
    setHelpModalRef(null);
    setHelpIssueType("");
    setHelpDescription("");
    setHelpError(null);
    setHelpConfirming(false);
  };

  const handleHelpConfirm = () => {
    if (!helpIssueType || !helpDescription.trim()) {
      setHelpError("Please select an issue type and provide a description.");
      return;
    }
    setHelpConfirming(true);
  };

  const handleOpenEditModal = (ref) => {
    setEditModalRef(ref);
    setEditFormData({
      resume_link: ref.resume_link || "",
      job_id: ref.job_id || "",
      job_title: ref.job_title || "",
      referral_summary: ref.referral_summary || "",
    });
    setEditFormErrors({});
    setEditError(null);
  };

  const handleCloseEditModal = () => {
    setEditModalRef(null);
    setEditFormData({
      resume_link: "",
      job_id: "",
      job_title: "",
      referral_summary: "",
    });
    setEditFormErrors({});
    setEditError(null);
  };

  const handleLoadMessages = async (referralId) => {
    try {
      const { messages } = await api.getReferralMessages(referralId);
      setMessagesByReferralId((prev) => ({
        ...prev,
        [referralId]: messages || [],
      }));
    } catch (err) {
      console.error("Failed to load messages:", err);
      setMessagesByReferralId((prev) => ({ ...prev, [referralId]: [] }));
    }
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editFormData.resume_link?.trim())
      errors.resume_link = "Resume link is required";
    else {
      try {
        new URL(editFormData.resume_link.trim());
      } catch {
        errors.resume_link = "Please enter a valid URL";
      }
    }
    if (!editFormData.job_id?.trim()) errors.job_id = "Job ID is required";
    if (!editFormData.job_title?.trim())
      errors.job_title = "Job title is required";
    const words = (editFormData.referral_summary || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (words.length < 150 || words.length > 300) {
      errors.referral_summary = `Referral summary must be 150–300 words (current: ${words.length})`;
    }
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitEdit = async () => {
    if (!editModalRef || !validateEditForm()) return;
    setEditSubmitting(true);
    setEditError(null);
    try {
      await api.updateReferralDetails(editModalRef.id, {
        resume_link: editFormData.resume_link.trim(),
        job_id: editFormData.job_id.trim(),
        job_title: editFormData.job_title.trim(),
        referral_summary: editFormData.referral_summary.trim(),
      });
      handleCloseEditModal();
      await loadReferrals();
    } catch (err) {
      setEditError(err.message || "Failed to update referral");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleSubmitHelp = async () => {
    if (!helpModalRef || !helpIssueType || !helpDescription.trim()) return;
    setHelpSubmitting(true);
    setHelpError(null);
    try {
      await api.createSupportTicket(helpModalRef.id, {
        issue_type: helpIssueType,
        description: helpDescription.trim(),
      });
      handleCloseHelpModal();
      await loadReferrals();
    } catch (err) {
      setHelpError(err.message || "Failed to submit");
    } finally {
      setHelpSubmitting(false);
    }
  };

  const handlePayNow = async (referralId) => {
    setProcessingPayment(referralId);
    try {
      const orderData = await api.createPaymentOrder(referralId);

      const options = {
        key: orderData.key || process.env.REACT_APP_RAZORPAY_KEY,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        order_id: orderData.orderId,
        name: "Refer & Earn",
        description: `Payment for referral request #${referralId}`,
        handler: async (response) => {
          try {
            await api.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            alert("Payment successful!");
            // Reload referrals
            const data = await api.requestedReferrals();
            setReferrals(data.referrals || []);
          } catch (error) {
            const errorMsg =
              error.data?.error ||
              error.message ||
              "Payment verification failed";
            alert(`Payment verification failed: ${errorMsg}`);
          } finally {
            setProcessingPayment(null);
          }
        },
        prefill: {
          name: user?.full_name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#4F46E5",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (response) => {
        alert(
          `Payment failed: ${response.error.description || "Unknown error"}`
        );
        setProcessingPayment(null);
      });
      razorpay.open();
    } catch (error) {
      const errorMsg =
        error.data?.error || error.message || "Failed to initialize payment";
      alert(`Payment failed: ${errorMsg}`);
      setProcessingPayment(null);
    }
  };

  const handleRefund = async (referralId) => {
    if (
      !window.confirm(
        "Are you sure you want to request a refund? This action cannot be undone."
      )
    ) {
      return;
    }

    setProcessingRefund(referralId);
    try {
      await api.refundPayment(referralId);
      alert("Refund request processed successfully!");
      // Reload referrals
      const data = await api.requestedReferrals();
      setReferrals(data.referrals || []);
    } catch (error) {
      const errorMsg = error.data?.error || error.message || "Refund failed";
      alert(`Refund failed: ${errorMsg}`);
    } finally {
      setProcessingRefund(null);
    }
  };

  // Filter logic
  const filteredReferrals = referrals.filter((req) => {
    const status = (req.status || "").toUpperCase();
    if (statusFilter === "ACTIVE") {
      return (
        status === "PENDING" ||
        status === "ACCEPTED" ||
        status === "NEEDS_UPDATE"
      );
    }
    if (statusFilter === "COMPLETED") {
      return status === "COMPLETED";
    }
    if (statusFilter === "REJECTED") {
      return status === "REJECTED";
    }
    return false;
  });

  // Calculate counts
  const activeCount = referrals.filter((req) => {
    const status = (req.status || "").toUpperCase();
    return (
      status === "PENDING" || status === "ACCEPTED" || status === "NEEDS_UPDATE"
    );
  }).length;
  const completedCount = referrals.filter(
    (req) => (req.status || "").toUpperCase() === "COMPLETED"
  ).length;
  const rejectedCount = referrals.filter(
    (req) => (req.status || "").toUpperCase() === "REJECTED"
  ).length;

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
            <h1 className="text-xl font-bold text-gray-900">
              My Referral Requests
            </h1>
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          {!loading && error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          {loading && (
            <div className="grid gap-4" role="status" aria-label="Loading">
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {!loading && !error && referrals.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600 text-lg mb-4">
                You have not made any referral requests yet.
              </p>
              <button
                onClick={() => navigate("/want-referral")}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Request a Referral
              </button>
            </div>
          )}

          {!loading && !error && referrals.length > 0 && (
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Your Referral Requests
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Track the status of your referral requests. You can rate
                  providers once referrals are completed.
                </p>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <button
                  onClick={() => setStatusFilter("ACTIVE")}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    statusFilter === "ACTIVE"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter("COMPLETED")}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    statusFilter === "COMPLETED"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Completed ({completedCount})
                </button>
                {rejectedCount > 0 && (
                  <button
                    onClick={() => setStatusFilter("REJECTED")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      statusFilter === "REJECTED"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Rejected ({rejectedCount})
                  </button>
                )}
              </div>

              {/* Filtered Results */}
              {filteredReferrals.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-600 text-lg">
                    {statusFilter === "ACTIVE" && "No active referral requests"}
                    {statusFilter === "COMPLETED" &&
                      "No completed referral requests"}
                    {statusFilter === "REJECTED" &&
                      "No rejected referral requests"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4" role="list">
                  {filteredReferrals.map((ref) => (
                    <MyReferralRow
                      key={ref.id}
                      request={ref}
                      isExpanded={expandedId === ref.id}
                      onToggleExpand={() =>
                        setExpandedId((prev) =>
                          prev === ref.id ? null : ref.id
                        )
                      }
                      onPayNow={handlePayNow}
                      onRefund={handleRefund}
                      onReview={handleOpenReviewModal}
                      onHelp={handleOpenHelpModal}
                      onEditReferral={handleOpenEditModal}
                      messages={messagesByReferralId[ref.id]}
                      onLoadMessages={handleLoadMessages}
                      isProcessingPayment={processingPayment === ref.id}
                      isProcessingRefund={processingRefund === ref.id}
                      isUpdatingReferral={
                        editSubmitting && editModalRef?.id === ref.id
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review & Rate modal */}
      {reviewModalRef && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Review & Rate
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Rate {reviewModalRef.provider_name} for this completed referral.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewStars(n)}
                      className={`w-10 h-10 rounded-lg text-lg transition-colors ${
                        reviewStars >= n
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  1 = Poor, 5 = Excellent
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review (optional)
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
                  placeholder="Share your experience..."
                />
              </div>
            </div>
            {reviewError && (
              <p className="mt-2 text-sm text-red-600">{reviewError}</p>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleCloseReviewModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={
                  reviewSubmitting || reviewStars < 1 || reviewStars > 5
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reviewSubmitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Referral modal (when NEEDS_UPDATE) */}
      {editModalRef && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 my-8">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Edit Referral Details
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              The provider requested changes. Update the details below and
              resubmit.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resume Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={editFormData.resume_link}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      resume_link: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="https://..."
                />
                {editFormErrors.resume_link && (
                  <p className="mt-1 text-sm text-red-600">
                    {editFormErrors.resume_link}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.job_id}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      job_id: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. 12345"
                />
                {editFormErrors.job_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {editFormErrors.job_id}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.job_title}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      job_title: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Software Engineer"
                />
                {editFormErrors.job_title && (
                  <p className="mt-1 text-sm text-red-600">
                    {editFormErrors.job_title}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referral Summary (150–300 words){" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editFormData.referral_summary}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      referral_summary: e.target.value,
                    }))
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
                  placeholder="Why you're a good fit for this role..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  {editFormData.referral_summary
                    ?.trim()
                    .split(/\s+/)
                    .filter(Boolean).length || 0}{" "}
                  / 150–300 words
                </p>
                {editFormErrors.referral_summary && (
                  <p className="mt-1 text-sm text-red-600">
                    {editFormErrors.referral_summary}
                  </p>
                )}
              </div>
            </div>
            {editError && (
              <p className="mt-2 text-sm text-red-600">{editError}</p>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleCloseEditModal}
                disabled={editSubmitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEdit}
                disabled={editSubmitting}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editSubmitting ? "Updating…" : "Submit Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help / Raise Concern modal */}
      {helpModalRef && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Help / Raise a Concern
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Describe the issue with this completed referral. Our team will
              review it.
            </p>
            {!helpConfirming ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={helpIssueType}
                    onChange={(e) => setHelpIssueType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select…</option>
                    {ISSUE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={helpDescription}
                    onChange={(e) => setHelpDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
                    placeholder="Please describe your concern in detail..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Issue:</strong> {helpIssueType}
                </p>
                <p>
                  <strong>Description:</strong>
                </p>
                <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                  {helpDescription}
                </p>
                <p className="text-amber-700">
                  Are you sure you want to submit this concern?
                </p>
              </div>
            )}
            {helpError && (
              <p className="mt-2 text-sm text-red-600">{helpError}</p>
            )}
            <div className="flex justify-end gap-2 mt-6">
              {!helpConfirming ? (
                <>
                  <button
                    onClick={handleCloseHelpModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleHelpConfirm}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
                  >
                    Raise concern
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setHelpConfirming(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmitHelp}
                    disabled={helpSubmitting}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {helpSubmitting ? "Submitting…" : "Submit"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReferrals;
