export function Spinner({ size = "md", className = "", color = "purple" }) {
  const sizes = { sm: "w-4 h-4 border-2", md: "w-8 h-8 border-4", lg: "w-12 h-12 border-4" };
  const colors = {
    purple: "border-purple-200 border-t-purple-600",
    white: "border-white/30 border-t-white",
    indigo: "border-indigo-200 border-t-indigo-600",
    blue: "border-blue-200 border-t-blue-600",
  };
  return (
    <div className={`${sizes[size]} ${colors[color] || colors.purple} rounded-full animate-spin ${className}`} />
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Spinner size="lg" />
      <p className="text-gray-500 animate-pulse mt-4">Loading...</p>
    </div>
  );
}

export function OverlayLoader() {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 shadow-xl flex flex-col items-center">
        <Spinner size="md" />
        <p className="text-gray-600 text-sm mt-3">Please wait...</p>
      </div>
    </div>
  );
}

export function DotsLoader() {
  return (
    <div className="flex gap-1 justify-center items-center p-2">
      <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}
