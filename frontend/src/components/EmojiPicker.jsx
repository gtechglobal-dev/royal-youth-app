import { useState, useRef, useEffect } from "react";

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

function EmojiPicker({ onEmojiSelect, buttonLabel = "😊" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50 w-72">
          <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => { onEmojiSelect(emoji); setOpen(false); }}
                className="text-lg p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EmojiPicker;
