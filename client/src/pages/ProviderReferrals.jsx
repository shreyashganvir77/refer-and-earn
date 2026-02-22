import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ReferralRequestRow from "../components/ReferralRequestRow";

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

const ProviderReferrals = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [error, setError] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [requestUpdateRef, setRequestUpdateRef] = useState(null);
  const [requestUpdateMessage, setRequestUpdateMessage] = useState("");
  const [requestUpdateSubmitting, setRequestUpdateSubmitting] = useState(false);
  const [requestUpdateError, setRequestUpdateError] = useState(null);

  const fetchReferrals = useMemo(
    () => async () => {
      try {
        setLoading(true);
        const data = await api.providerReferrals();
        setReferrals(data.referrals || []);
      } catch (err) {
        setError(err.message || "Failed to load referrals");
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
      setError(err.message || "Failed to complete referral");
    } finally {
      setCompletingId(null);
      setConfirmId(null);
    }
  };

  const handleOpenRequestUpdate = (ref) => {
    setRequestUpdateRef(ref);
    setRequestUpdateMessage("");
    setRequestUpdateError(null);
  };

  const handleCloseRequestUpdate = () => {
    setRequestUpdateRef(null);
    setRequestUpdateMessage("");
    setRequestUpdateError(null);
  };

  const handleSubmitRequestUpdate = async () => {
    if (!requestUpdateRef || !requestUpdateMessage.trim()) return;
    setRequestUpdateSubmitting(true);
    setRequestUpdateError(null);
    try {
      await api.requestReferralUpdate(
        requestUpdateRef.id,
        requestUpdateMessage.trim()
      );
      handleCloseRequestUpdate();
      await fetchReferrals();
    } catch (err) {
      setRequestUpdateError(err.message || "Failed to send update request");
    } finally {
      setRequestUpdateSubmitting(false);
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
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-indigo-600">
              Referral Requests
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
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
              <h2 className="text-2xl font-bold text-gray-900">
                Referral Requests
              </h2>
              <p className="text-gray-600 text-sm">
                Manage incoming referrals. Mark as completed once you’ve
                provided the referral.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
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

          {!loading && referrals.length === 0 && (
            <div className="text-center py-10 text-gray-600">
              No referral requests available.
            </div>
          )}

          {!loading && referrals.length > 0 && (
            <>
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
                    <ReferralRequestRow
                      key={ref.id}
                      request={ref}
                      isExpanded={expandedRequestId === ref.id}
                      onToggleExpand={() =>
                        setExpandedRequestId((prev) =>
                          prev === ref.id ? null : ref.id
                        )
                      }
                      onMarkCompleteClick={() => setConfirmId(ref.id)}
                      onRequestUpdateClick={() => handleOpenRequestUpdate(ref)}
                      isCompleting={completingId === ref.id}
                      isRequestingUpdate={
                        requestUpdateSubmitting &&
                        requestUpdateRef?.id === ref.id
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Request Update modal */}
      {requestUpdateRef && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Request Update
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Explain what needs to be corrected. The requester will be notified
              and must update before you can complete this referral.
            </p>
            <textarea
              value={requestUpdateMessage}
              onChange={(e) => setRequestUpdateMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y mb-4"
              placeholder="e.g. Please upload an updated resume. Job ID is missing."
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mb-4">
              {requestUpdateMessage.length}/2000 characters
            </p>
            {requestUpdateError && (
              <p className="text-sm text-red-600 mb-4">{requestUpdateError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCloseRequestUpdate}
                disabled={requestUpdateSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequestUpdate}
                disabled={
                  requestUpdateSubmitting || !requestUpdateMessage.trim()
                }
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {requestUpdateSubmitting ? "Sending…" : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Confirm completion
            </h3>
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
                {completingId === confirmId ? "Updating…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderReferrals;
