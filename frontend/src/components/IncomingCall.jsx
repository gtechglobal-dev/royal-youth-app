import { useLive } from "../contexts/LiveContext";

export default function IncomingCall() {
  const { callState, acceptCall, declineCall } = useLive();

  if (callState.status !== "ringing") return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Incoming Call</h2>
          <p className="text-gray-500 text-sm mb-6">
            {callState.type === "video" ? "Video call" : "Audio call"}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={declineCall}
              className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200 transition"
            >
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={acceptCall}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition animate-bounce"
            >
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.128-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 5V5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
