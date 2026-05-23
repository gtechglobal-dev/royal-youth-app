import { useState, useEffect, useRef } from "react";
import { useLive } from "../contexts/LiveContext";
import { Spinner } from "./Loaders";

export default function GoLiveModal({ onClose }) {
  const { startLive } = useLive();
  const [mode, setMode] = useState("browser");
  const [type, setType] = useState("video");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [streamInfo, setStreamInfo] = useState(null);
  const previewRef = useRef(null);
  const previewStreamRef = useRef(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const isOnRender = window.location.hostname.includes("onrender");

  const categories = ["General", "Prayer", "Discussion", "Announcement", "Worship", "Fellowship", "Testimony", "Q&A"];

  useEffect(() => {
    if (type !== "video" || mode !== "browser") return;
    let cancelled = false;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        previewStreamRef.current = stream;
        if (previewRef.current) previewRef.current.srcObject = stream;
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [type, mode]);

  const stopPreview = () => {
    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach((t) => t.stop());
      previewStreamRef.current = null;
    }
  };

  const handleClose = () => {
    stopPreview();
    onClose();
  };

  const handleStart = async () => {
    if (!title.trim()) { setError("Please enter a title"); return; }
    setStarting(true);
    setError("");
    try {
      const data = mode === "rtmp"
        ? { title: title.trim(), description, category, type: "video", source: "rtmp" }
        : { title: title.trim(), description, category, type };
      const res = await startLive(data, previewStreamRef.current);
      if (mode === "rtmp" && res?.streamKey) {
        stopPreview();
        setStreamInfo({ streamKey: res.streamKey, rtmpUrl: res.rtmpUrl });
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.message || "Failed to start live");
      setStarting(false);
    }
  };

  const copyToClipboard = (text, setter) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  if (streamInfo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] shadow-2xl flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-800">Stream Ready</h2>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-5 space-y-4 overflow-y-auto">
            <p className="text-sm text-gray-600">Configure your streaming software with these details:</p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">RTMP URL</label>
              <div className="flex items-center gap-2">
                <input id="rtmpUrl" name="rtmpUrl" readOnly value={streamInfo.rtmpUrl} className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 font-mono" />
                <button onClick={() => copyToClipboard(streamInfo.rtmpUrl, setCopiedUrl)} className="px-3 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 shrink-0">
                  {copiedUrl ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Stream Key</label>
              <div className="flex items-center gap-2">
                <input id="streamKey" name="streamKey" readOnly value={streamInfo.streamKey} className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 font-mono" />
                <button onClick={() => copyToClipboard(streamInfo.streamKey, setCopiedKey)} className="px-3 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 shrink-0">
                  {copiedKey ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Enter these in OBS, vMix, or any RTMP-compatible software. The stream will appear once the software starts sending.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] shadow-2xl flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Go Live</h2>
          <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto">
        <div className="flex p-5 pb-0 gap-2">
          <button onClick={() => { stopPreview(); setMode("browser"); }} className={`flex-1 py-2.5 rounded-xl font-semibold text-xs border-2 transition ${mode === "browser" ? "border-purple-600 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
            <svg className="w-4 h-4 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Browser
          </button>
          <button onClick={() => { stopPreview(); setMode("rtmp"); }} className={`flex-1 py-2.5 rounded-xl font-semibold text-xs border-2 transition ${mode === "rtmp" ? "border-purple-600 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
            <svg className="w-4 h-4 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            External Software
          </button>
        </div>

        {mode === "browser" && type === "video" && (
          <div className="relative bg-black h-48 mx-5 mt-4 rounded-xl overflow-hidden">
            <video ref={previewRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> PREVIEW
            </div>
          </div>
        )}

        {mode === "rtmp" && (
          <div className="px-5 pt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              <p className="font-semibold mb-1">📡 External Software Mode</p>
              <p>Connect OBS, vMix, or any RTMP-compatible software. After creating the stream, you'll get a server URL and stream key to enter in your software.</p>
              {isOnRender && (
                <p className="mt-1.5 text-amber-600">⚠️ Render hosting may block RTMP port 1935. For production RTMP, upgrade to a paid Render plan with TCP support or use a VPS. Browser WebRTC streaming is unaffected.</p>
              )}
            </div>
          </div>
        )}
        {mode === "browser" && (
          <div className="flex gap-3 p-5 pb-0">
            <button onClick={() => { stopPreview(); setType("video"); }} className={`flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition ${type === "video" ? "border-purple-600 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Video Live
            </button>
            <button onClick={() => { stopPreview(); setType("audio"); }} className={`flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition ${type === "audio" ? "border-purple-600 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              Audio Only
            </button>
          </div>
        )}

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
            <input type="text" id="liveTitle" name="liveTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your broadcast a title..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" maxLength={100} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description (optional)</label>
            <textarea id="liveDescription" name="liveDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this about?" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" rows={2} maxLength={300} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
            <select id="liveCategory" name="liveCategory" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        </div>
        <div className="p-5 pt-0 flex-shrink-0">
          <button onClick={handleStart} disabled={starting} className="w-full py-3 bg-gradient-to-r from-red-500 to-purple-600 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2">
            {starting ? (
              <><Spinner size="sm" color="white" /> {mode === "rtmp" ? "Creating Stream..." : "Starting..."}</>
            ) : (
              <><span className="w-2 h-2 bg-white rounded-full animate-pulse" /> {mode === "rtmp" ? "Create Stream" : "Go Live"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
