import React from 'react';

function statusBadge(status) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
  switch ((status || '').toUpperCase()) {
    case 'COMPLETED':
      return `${base} bg-green-100 text-green-800`;
    case 'PENDING':
      return `${base} bg-yellow-100 text-yellow-800`;
    case 'ACCEPTED':
      return `${base} bg-blue-100 text-blue-800`;
    case 'REJECTED':
      return `${base} bg-red-100 text-red-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
}

function paymentStatusBadge(status) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
  switch ((status || '').toUpperCase()) {
    case 'PAID':
      return `${base} bg-green-100 text-green-800`;
    case 'UNPAID':
      return `${base} bg-yellow-100 text-yellow-800`;
    case 'RELEASED':
      return `${base} bg-blue-100 text-blue-800`;
    case 'REFUNDED':
      return `${base} bg-gray-100 text-gray-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
}

function statusLabel(s) {
  const u = (s || '').toUpperCase();
  if (u === 'COMPLETED') return 'Completed';
  if (u === 'PENDING') return 'Pending';
  if (u === 'ACCEPTED') return 'Accepted';
  if (u === 'REJECTED') return 'Rejected';
  return s || '—';
}

/**
 * Card-style referral for requester. Summary, email, dates, and actions
 * are in the expanded section. One expanded at a time (parent-controlled).
 */
export default function MyReferralRow({
  request: r,
  isExpanded,
  onToggleExpand,
  onPayNow,
  onRefund,
  onReview,
  onHelp,
  isProcessingPayment,
  isProcessingRefund,
}) {
  const statusUpper = (r?.status || '').toUpperCase();
  const isCompleted = statusUpper === 'COMPLETED';
  const ticketOpen = (r?.support_ticket_status || '').toUpperCase() === 'OPEN';
  const showRefund =
    r?.payment_status === 'PAID' && statusUpper !== 'ACCEPTED' && statusUpper !== 'COMPLETED';
  const showReview = isCompleted && !ticketOpen && !r?.has_review;
  const showHelp = isCompleted && !ticketOpen;
  const showUnderReview = isCompleted && ticketOpen;

  const priceStr = r?.price_agreed != null ? `₹${Number(r.price_agreed)}` : '—';

  return (
    <article
      className="border border-gray-200 rounded-lg bg-white p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-shadow"
      role="article"
    >
      {/* Top: provider (left), status + payment + date (right) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="font-medium text-gray-900 truncate" title={r?.provider_name}>
          {r?.provider_name || '—'}
        </span>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className={statusBadge(r?.status)}>{statusLabel(r?.status)}</span>
          {r?.payment_status && (
            <span className={paymentStatusBadge(r.payment_status)}>{r.payment_status}</span>
          )}
          <span className="text-gray-500 text-sm">
            {r?.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
          </span>
        </div>
      </div>

      {/* Middle: company, job title, job ID, price — inline with · */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 mb-3">
        <span className="truncate" title={r?.company_name}>
          {r?.company_name || 'N/A'}
        </span>
        <span className="text-gray-400">·</span>
        <span className="truncate" title={r?.job_title}>
          {r?.job_title || '—'}
        </span>
        <span className="text-gray-400">·</span>
        <span>Job ID: {r?.job_id || '—'}</span>
        <span className="text-gray-400">·</span>
        <span>{priceStr}</span>
      </div>

      {/* Bottom: Read more (left) + Actions (right) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100">
        <div>
          <button
            type="button"
            onClick={onToggleExpand}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {r?.payment_status === 'UNPAID' && (
            <button
              type="button"
              onClick={() => onPayNow(r?.id)}
              disabled={isProcessingPayment}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessingPayment ? 'Processing...' : 'Pay Now'}
            </button>
          )}
          {showRefund && (
            <button
              type="button"
              onClick={() => onRefund(r?.id)}
              disabled={isProcessingRefund}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessingRefund ? 'Processing...' : 'Request Refund'}
            </button>
          )}
          {showUnderReview && (
            <div>
              <span className="text-sm text-amber-700 font-medium">Under Review</span>
              <p className="text-xs text-gray-500">Your concern has been submitted</p>
            </div>
          )}
          {showReview && (
            <button
              type="button"
              onClick={() => onReview(r)}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              Review & Rate
            </button>
          )}
          {showHelp && (
            <button
              type="button"
              onClick={() => onHelp(r)}
              className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Help / Raise a Concern
            </button>
          )}
          {!isCompleted && r?.payment_status !== 'UNPAID' && (
            <p className="text-xs text-gray-500">Waiting for provider to complete</p>
          )}
        </div>
      </div>

      {/* Expanded: summary, email, dates */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200" role="region" aria-label="Referral details">
          {r?.referral_summary && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Your Referral Summary:</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {r.referral_summary}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
            {r?.provider_email && (
              <div>
                <strong>Provider Email:</strong>{' '}
                <a href={`mailto:${r.provider_email}`} className="text-indigo-600 hover:underline">
                  {r.provider_email}
                </a>
              </div>
            )}
            <div>
              <strong>Requested on:</strong>{' '}
              {r?.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
            </div>
            {r?.completed_at && (
              <div>
                <strong>Completed on:</strong> {new Date(r.completed_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
