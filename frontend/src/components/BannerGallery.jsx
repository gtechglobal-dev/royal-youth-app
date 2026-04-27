import { useEffect, useState, useRef } from "react";
import API from "../services/api";

function BannerGallery() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 1 && !isPaused) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 60000);
      return () => clearInterval(timer);
    }
  }, [banners.length, isPaused]);

  const fetchBanners = async () => {
    try {
      const res = await API.get("/banners");
      setBanners(res.data);
    } catch (error) {
      console.error("Error fetching banners:", error);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 60000);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 60000);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  if (banners.length === 0) {
    return (
      <div className="w-full h-48 md:h-80 lg:h-[500px] bg-gradient-to-br from-sky-100 to-blue-100 rounded-2xl flex items-center justify-center">
        <p className="text-gray-500 text-sm md:text-base">Banner gallery coming soon...</p>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <div 
      className="relative w-full h-48 sm:h-64 md:h-80 lg:h-[500px] overflow-hidden rounded-xl md:rounded-2xl shadow-xl select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {banners.map((banner, index) => (
        <div
          key={banner._id}
          className={`absolute inset-0 transition-opacity duration-500 ${index === currentIndex ? "opacity-100" : "opacity-0"}`}
        >
          <img
            src={currentBanner.image.startsWith("http") ? currentBanner.image : `http://localhost:5000${currentBanner.image}`}
            alt={currentBanner.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 lg:p-12">
            <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">{currentBanner.title}</h2>
            {currentBanner.link && (
              <a
                href={currentBanner.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-gray-900 px-4 py-1.5 md:px-6 md:py-2 rounded-full font-semibold text-sm md:text-base hover:bg-gray-100 transition"
              >
                Learn More
              </a>
            )}
          </div>
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <div className="absolute bottom-3 md:bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsPaused(true);
                  setTimeout(() => setIsPaused(false), 60000);
                }}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${index === currentIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>

          <button
            onClick={handlePrev}
            className="absolute top-1/2 -translate-y-1/2 left-2 md:left-4 bg-white/20 backdrop-blur-sm hover:bg-white/40 p-1.5 md:p-2 rounded-full transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            className="absolute top-1/2 -translate-y-1/2 right-2 md:right-4 bg-white/20 backdrop-blur-sm hover:bg-white/40 p-1.5 md:p-2 rounded-full transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute top-3 right-3 md:top-4 md:right-4 text-white text-xs md:text-sm opacity-70">
            Swipe or click arrows to navigate
          </div>
        </>
      )}
    </div>
  );
}

export default BannerGallery;