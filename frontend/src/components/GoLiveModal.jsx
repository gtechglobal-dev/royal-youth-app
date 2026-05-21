import { useState } from "react";
import { useLive } from "../contexts/LiveContext";

export default function GoLiveModal({ onClose }) {
  const { startLive } = useLive();
  const [type, setType] = useState("video");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const categories = ["General", "Prayer", "Discussion", "Announcement", "Worship", "Fellowship", "Testimony", "Q&A"];

  const handleStart = async () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }
    setStarting(true);
    setError("");
    try {
      await startLive({ title: title.trim(), description, category, type });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to start live");
    }
    setStarting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Go Live</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-3">
            <button
              onClick={() => setType("video")}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition ${
                type === "video"
                  ? "border-purple-600 bg-purple-50 text-purple-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video Live
            </button>
            <button
              onClick={() => setType("audio")}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition ${
                type === "audio"
                  ? "border-purple-600 bg-purple-50 text-purple-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Audio Only
            </button>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your broadcast a title..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this about?"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={2}
              maxLength={300}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <div className="p-5 pt-0">
          <button
            onClick={handleStart}
            disabled={starting}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-purple-600 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {starting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Starting...
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Go Live
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
