import React from "react";

function statusBadge(status) {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  switch ((status || "").toUpperCase()) {
    case "COMPLETED":
      return `${base} bg-green-100 text-green-800`;
    case "PENDING":
      return `${base} bg-yellow-100 text-yellow-800`;
    case "ACCEPTED":
      return `${base} bg-blue-100 text-blue-800`;
    case "REJECTED":
      return `${base} bg-red-100 text-red-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
}

/**
 * Card-style referral request. Summary is lazy-rendered only when expanded.
 */
export default function ReferralRequestRow({
  request: req,
  isExpanded,
  onToggleExpand,
  onMarkCompleteClick,
  isCompleting,
}) {
  const isPending = (req?.status || "").toUpperCase() === "PENDING";
  const statusLabel =
    (req?.status || "").toUpperCase() === "COMPLETED"
      ? "Completed"
      : (req?.status || "").toUpperCase() === "PENDING"
        ? "Pending"
        : (req?.status || "").toUpperCase() === "ACCEPTED"
          ? "Accepted"
          : (req?.status || "").toUpperCase() === "REJECTED"
            ? "Rejected"
            : req?.status || "—";

  return (
    <article
      className="border border-gray-200 rounded-lg bg-white p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-shadow"
    >
      {/* Top: name (left), status + date (right) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span
          className="font-medium text-gray-900 truncate"
          title={req?.requester_name}
        >
          {req?.requester_name || "—"}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <span className={statusBadge(req?.status)}>{statusLabel}</span>
          <span className="text-gray-500 text-sm">
            {req?.created_at
              ? new Date(req.created_at).toLocaleDateString()
              : "—"}
          </span>
        </div>
      </div>

      {/* Middle: job title, job ID, resume — clean inline with separator */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 mb-3">
        <span className="truncate" title={req?.job_title}>
          {req?.job_title || "—"}
        </span>
        <span className="text-gray-400">·</span>
        <span>Job ID: {req?.job_id || "—"}</span>
        <span className="text-gray-400">·</span>
        {req?.resume_link ? (
          <a
            href={req?.resume_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded"
          >
            Resume
          </a>
        ) : (
          <span className="text-gray-400">No resume</span>
        )}
      </div>

      {/* Bottom: Read more + Action — aligned */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100">
        <div>
          {(req?.referral_summary || "").trim() ? (
            <button
              type="button"
              onClick={onToggleExpand}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded"
            >
              {isExpanded ? "Hide" : "Read: Why candidate is a good fit"}
            </button>
          ) : null}
        </div>
        <div>
          {isPending && (
            <button
              type="button"
              onClick={onMarkCompleteClick}
              disabled={isCompleting}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
            >
              {isCompleting ? "Updating…" : "Mark as Completed"}
            </button>
          )}
          {!isPending && (req?.status || "").toUpperCase() === "COMPLETED" && (
            <span className="text-green-700 text-sm font-medium">
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Expanded: Why you're a good fit. Lazy-rendered only when isExpanded. */}
      {isExpanded && (req?.referral_summary || "").trim() && (
        <div
          className="mt-4 pt-4 border-t border-gray-200"
          role="region"
          aria-label="Referral summary"
        >
          <p className="text-sm font-medium text-gray-700 mb-2">
            Why you're a good fit:
          </p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {req?.referral_summary}
          </p>
        </div>
      )}
    </article>
  );
}
