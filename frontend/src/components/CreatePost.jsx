import { useState, useRef } from "react";
import API from "../services/api";
import siteLogo from "../assets/gdev logo.svg";

const PLACARD_COLORS = [
  "#000000",
  "#1a1a2e",
  "#16213e",
  "#0f3460",
  "#533483",
  "#6a0572",
  "#9b2226",
  "#bb3e03",
  "#ca6702",
  "#ee9b00",
  "#2d6a4f",
  "#1b4332",
  "#005f73",
  "#0a9396",
  "#264653",
  "#2a9d8f",
  "#8ecae6",
  "#4a4e69",
  "#6c584c",
  "#7f5539",
];

function CreatePost({ onPostCreated }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [placardColor, setPlacardColor] = useState("#000000");
  const [posting, setPosting] = useState(false);
  const fileRef = useRef(null);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("Image must be under 3MB");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      alert("Only jpg, png, webp allowed");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !image) return;

    setPosting(true);
    try {
      const form = new FormData();
      form.append("text", text.trim());
      form.append("placardColor", placardColor);
      if (image) form.append("image", image);

      const res = await API.post("/posts", form);
      setText("");
      setImage(null);
      setPreview(null);
      setPlacardColor("#000000");
      if (onPostCreated) onPostCreated(res.data);
    } catch (err) {
      console.error("Create post error:", err);
      alert("Failed to create post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share something with the community..."
          rows={3}
          maxLength={2000}
          className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
        />
        {preview && (
          <div className="relative mt-2 inline-block">
            <img src={preview} alt="Preview" className="h-32 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => { setImage(null); setPreview(null); }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          </div>
        )}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
          !image && text.trim().length > 0 ? "max-h-48 opacity-100 mt-3" : "max-h-0 opacity-0"
        }`}>
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Placard background</p>
            <div className="flex flex-wrap gap-2">
              {PLACARD_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setPlacardColor(color)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    placardColor === color
                      ? "ring-2 ring-purple-500 ring-offset-2 scale-110"
                      : "hover:scale-110"
                  }`}
                  title={color}
                >
                  <span
                    className="w-full h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs text-gray-400">Preview:</span>
              <div
                className="rounded-lg px-4 py-3 flex items-center gap-2 min-h-[48px]"
                style={{ backgroundColor: placardColor }}
              >
                <img src={siteLogo} alt="" className="w-5 h-5 opacity-30" />
                <span className="text-white text-xs font-bold opacity-60">Aa</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 text-gray-500 hover:text-purple-600 text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Photo
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} className="hidden" />
          <button
            type="submit"
            disabled={posting || (!text.trim() && !image)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePost;
