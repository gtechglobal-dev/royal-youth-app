import { useState, useRef, useEffect } from "react";
import useEmojiFavorites from "../hooks/useEmojiFavorites";

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂",
  "😉", "😌", "😍", "🥰", "😘", "😗", "😋", "😛", "😜", "🤪",
  "😝", "🤑", "🤗", "🤭", "🫢", "🫣", "🤫", "🤔", "🤐", "🤨",
  "😐", "😑", "😶", "🫥", "😏", "😒", "🙄", "😬", "😮", "😯",
  "😲", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳",
  "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🫠", "🤢", "🤮",
  "🥴", "😵", "🤩", "🥳", "😎", "🤓", "🧐", "🥸", "😕", "🫤",
  "😟", "🙁", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤",
  "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌", "🫶", "🤝",
  "🙏", "✋", "🤚", "🖐", "👋", "🤟", "✌️", "🤞", "🫰", "🤙",
  "💪", "🦵", "🦶", "👀", "👁", "👅", "👄",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💕",
  "💞", "💗", "💖", "💘", "💝", "💟", "♥️", "💯", "💢", "💥",
  "🔥", "🌈", "⭐", "🌟", "✨", "💫", "🎉", "🎊", "🎈", "🎁",
  "🏆", "🥇", "🥈", "🥉", "🏅", "🎯", "🎮", "🎵", "🎶", "🎤",
  "🍕", "🍔", "🍟", "🌭", "🥪", "🥙", "🍣", "🍱", "🍛", "🍜",
  "🍝", "🍩", "🍪", "🎂", "🍰", "🧁", "🍫", "🍬", "🍭", "☕",
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
  "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆",
  "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋",
  "🐌", "🐞", "🐜", "🦗", "🪰", "🪱", "🐙", "🦑", "🦐", "🦞",
  "🎉", "🎊", "🎈", "🎁", "🎀", "🪄", "🎭", "🖼", "🎨", "🧩",
  "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🪀", "🏓",
  "🏔", "🌍", "🌎", "🌏", "🗺", "🏝", "🏖", "🌋", "🏛", "🏗",
  "⛪", "🕌", "🕍", "🛕", "⛩", "🕋", "⛲", "🎠", "🎡", "🎢",
];

function EmojiPicker({ onEmojiSelect, buttonLabel = "😊", align = "left" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { trackUse, getFavorites } = useEmojiFavorites();

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (emoji) => {
    trackUse(emoji);
    onEmojiSelect(emoji);
    setOpen(false);
  };

  const favs = getFavorites();

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-lg hover:scale-110 transition-transform"
        title="Add emoji"
      >
        {buttonLabel}
      </button>
      {open && (
        <div className={`absolute bottom-full mb-2 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50 w-72 max-w-[90vw] ${align === "right" ? "right-0" : "left-0"}`}>
          <div className="max-h-56 overflow-y-auto">
            {favs.length > 0 && (
              <>
                <div className="grid grid-cols-8 gap-1 pb-1.5 mb-1.5 border-b border-gray-100">
                  {favs.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSelect(emoji)}
                      className="text-lg p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="grid grid-cols-8 gap-1">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  className="text-lg p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmojiPicker;
