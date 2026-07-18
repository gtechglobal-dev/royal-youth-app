import { useState } from "react";
import { usePWA } from "../hooks/usePWA";

const DISMISS_KEY = "ryh_install_dismissed";

export default function InstallPrompt() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  });

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
    setDismissed(true);
  };

  if (!canInstall || isInstalled || dismissed) return null;

  if (isIOS) {
    return (
      <div className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-4 animate-slide-down">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-800">Add to Home Screen</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Tap the Share button <span className="inline-block">⎙</span> then "Add to Home Screen"
              </p>
              <button onClick={() => dismiss()} className="mt-3 text-purple-600 text-xs font-semibold hover:text-purple-700">
                Got it
              </button>
            </div>
            <button onClick={() => dismiss()} className="text-gray-300 hover:text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-4 animate-slide-down">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800">Install Royal Youth Hub</p>
            <p className="text-xs text-gray-500 mt-0.5">Get the app for a better experience</p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={promptInstall}
                className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-700"
              >
                Install
              </button>
              <button
                onClick={() => dismiss()}
                className="text-gray-400 text-xs hover:text-gray-600"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={() => dismiss()}
            className="text-gray-300 hover:text-gray-500"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
      `}</style>
    </div>
  );
}
