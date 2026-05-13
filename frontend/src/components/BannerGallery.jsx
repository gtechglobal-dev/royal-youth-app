import { useEffect, useState, useRef } from "react";
import API from "../services/api";

function BannerGallery() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [bannersLoaded, setBannersLoaded] = useState(false);
  const [firstImageLoaded, setFirstImageLoaded] = useState(false);
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
    } finally {
      setBannersLoaded(true);
    }
  };

  useEffect(() => {
    if (banners.length > 0 && banners[0]?.image) {
      const img = new Image();
      img.src = banners[0].image.startsWith("http")
        ? banners[0].image
        : `${import.meta.env.VITE_API_URL}${banners[0].image}`;
      img.onload = () => setFirstImageLoaded(true);
    }
  }, [banners]);

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
      if (diff > 0) handleNext();
      else handlePrev();
    }
  };

  const isLoading = !bannersLoaded || (banners.length > 0 && !firstImageLoaded);

  return (
    <div
      className="group relative w-full overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-50 to-indigo-100"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-indigo-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      )}

      {banners.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 md:py-24">
          <svg className="w-16 h-16 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-indigo-400 font-medium">Banner gallery coming soon...</p>
        </div>
      ) : (
        <>
          {banners[currentIndex] && (
            <img
              src={banners[currentIndex].image.startsWith("http") ? banners[currentIndex].image : `${import.meta.env.VITE_API_URL}${banners[currentIndex].image}`}
              className="w-full opacity-0 block"
              aria-hidden="true"
            />
          )}
          {banners.map((banner, index) => (
            <div
              key={banner._id}
              className={`absolute inset-0 transition-all duration-700 ${
                index === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-105"
              }`}
            >
              <img
                src={banner.image.startsWith("http") ? banner.image : `${import.meta.env.VITE_API_URL}${banner.image}`}
                alt={banner.title}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          ))}

          {banners.length > 1 && (
            <>
              <div
                className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 transition-all duration-300 opacity-0 group-hover:opacity-100"
              >
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                      setIsPaused(true);
                      setTimeout(() => setIsPaused(false), 60000);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentIndex ? "bg-white w-8" : "bg-white/40 w-4 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute top-1/2 -translate-y-1/2 left-4 md:left-6 bg-black/20 backdrop-blur-md hover:bg-black/40 p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110 opacity-0 group-hover:opacity-100"
              >
                <svg className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute top-1/2 -translate-y-1/2 right-4 md:right-6 bg-black/20 backdrop-blur-md hover:bg-black/40 p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110 opacity-0 group-hover:opacity-100"
              >
                <svg className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default BannerGallery;
