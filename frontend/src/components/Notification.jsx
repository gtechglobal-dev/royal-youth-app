import { useEffect } from "react";

export default function Notification({ type, message, isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isSuccess = type === "success";
  const isError = type === "error";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xs p-6 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col items-center text-center">
          {isSuccess && (
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {isError && (
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}

          <p className={`text-base font-semibold ${isSuccess ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>

          <button
            onClick={onClose}
            className={`mt-4 px-5 py-2 rounded-lg text-white text-sm ${
              isSuccess ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
            }`}
          >
            OK
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}