export function Spinner({ size = "md" }) {
  const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className="flex justify-center items-center p-4">
      <div className={`${sizes[size]} border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin`} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mb-4" />
      <p className="text-gray-500 animate-pulse">Loading...</p>
    </div>
  );
}

export function OverlayLoader() {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 shadow-xl flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mb-3" />
        <p className="text-gray-600 text-sm">Please wait...</p>
      </div>
    </div>
  );
}

export function DotsLoader() {
  return (
    <div className="flex gap-1 justify-center items-center p-2">
      <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}