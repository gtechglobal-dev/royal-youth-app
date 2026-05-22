import { Spinner } from "./Loaders";

function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = "Delete", cancelLabel = "Cancel", loading = false, iconType = "delete", confirmColor = "red" }) {
  if (!open) return null;

  const iconBg = confirmColor === "amber" ? "bg-amber-100" : "bg-red-100";
  const iconColor = confirmColor === "amber" ? "text-amber-500" : "text-red-500";
  const btnColor = confirmColor === "amber" ? "bg-amber-500 hover:bg-amber-600" : "bg-red-500 hover:bg-red-600";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onCancel}>
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center text-center">
            <div className={`w-14 h-14 rounded-full ${iconBg} flex items-center justify-center mb-4`}>
              {iconType === "unpin" ? (
                <svg className={`w-7 h-7 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              ) : (
                <svg className={`w-7 h-7 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 px-4 py-2.5 ${btnColor} text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {loading && (
                  <Spinner size="sm" />
                )}
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConfirmModal;
