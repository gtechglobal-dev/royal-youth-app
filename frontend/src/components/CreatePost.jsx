import { useState, useRef } from "react";
import API from "../services/api";
import siteLogo from "../assets/gdev logo.svg";
import EmojiPicker from "./EmojiPicker";

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

function CreatePost({ onPostCreated, placeholder = "Share something with the community..." }) {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [placardColor, setPlacardColor] = useState("#000000");
  const [posting, setPosting] = useState(false);
  const fileRef = useRef(null);

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    const valid = files.filter((f) => {
      if (f.size > 200 * 1024) { alert(`"${f.name}" exceeds 200KB limit`); return false; }
      if (!allowed.includes(f.type)) { alert(`"${f.name}" must be jpg, png, or webp`); return false; }
      return true;
    });

    const total = images.length + valid.length;
    if (total > 5) { alert("Maximum 5 images allowed"); return; }

    setImages((prev) => [...prev, ...valid]);
    setPreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && images.length === 0) return;

    setPosting(true);
    try {
      const form = new FormData();
      form.append("text", text.trim());
      form.append("placardColor", placardColor);
      images.forEach((img) => form.append("images", img));

      const res = await API.post("/posts", form);
      setText("");
      setImages([]);
      setPreviews([]);
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
    <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-4 mb-6 w-full">
      <form onSubmit={handleSubmit} className="w-full">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={2000}
          className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
        />
        {previews.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {previews.map((p, i) => (
              <div key={i} className="relative">
                <img src={p} alt="" className="h-20 w-20 rounded-lg object-cover border" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
          images.length === 0 && text.trim().length > 0 ? "max-h-48 opacity-100 mt-3" : "max-h-0 opacity-0"
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
          <div className="flex items-center gap-2">
            <EmojiPicker onEmojiSelect={(emoji) => setText((prev) => prev + emoji)} />
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
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImages} multiple className="hidden" />
          <button
            type="submit"
            disabled={posting || (!text.trim() && images.length === 0)}
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
