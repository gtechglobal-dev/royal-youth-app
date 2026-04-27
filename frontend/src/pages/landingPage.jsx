import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BannerGallery from "../components/BannerGallery";
import ContactSection from "../components/ContactSection";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import Logo from "../assets/gdev logo.svg";
import { PageLoader } from "../components/Loaders";

function ScrollSection({ children, className = "" }) {
  const [ref, isVisible] = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
    >
      {children}
    </div>
  );
}

function LandingPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/95 shadow-sm border-b border-sky-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={Logo} alt="RY" className="w-10 h-10 md:w-12 md:h-12" />
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-800">Royal Youth</h1>
                <p className="text-sky-500 text-xs md:text-sm font-medium">Impact Your World</p>
              </div>
            </Link>
            <div className="flex items-center gap-2 md:gap-3">
              <Link to="/login">
                <button className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-3 py-2 md:px-6 md:py-2.5 rounded-xl font-semibold hover:from-sky-600 hover:to-blue-700 transition shadow-lg shadow-sky-500/30 text-sm md:text-base">
                  Login
                </button>
              </Link>
              <Link to="/register">
                <button className="border-2 border-sky-500 text-sky-600 px-3 py-2 md:px-6 md:py-2.5 rounded-xl font-semibold hover:bg-sky-500 hover:text-white transition text-sm md:text-base">
                  Join Us
                </button>
              </Link>
              <Link to="/admin-login">
                <button className="border-2 border-gray-400 text-gray-600 px-3 py-2 md:px-6 md:py-2.5 rounded-xl font-semibold hover:bg-gray-100 transition text-sm md:text-base">
                  Admin
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <ScrollSection>
        <section className="py-4 px-2 md:py-8 md:px-4">
          <div className="container mx-auto max-w-6xl">
            <BannerGallery />
          </div>
        </section>
      </ScrollSection>

      <ScrollSection>
        <section className="py-12 md:py-20 px-4 bg-gradient-to-br from-sky-100 via-white to-blue-50">
          <div className="container mx-auto max-w-4xl text-center">
            <p className="text-sky-600 text-base md:text-lg mb-2 font-medium">Our Slogan</p>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4 md:mb-6">
              Impact Your World
            </h2>
            <p className="text-gray-600 mb-6 md:mb-8 max-w-xl mx-auto text-sm md:text-base px-4">
              Building a community of faith, purpose, and excellence. Join us in making a difference.
            </p>
            <Link to="/register">
              <button className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-3 md:px-10 md:py-4 rounded-2xl font-bold text-base md:text-lg hover:from-sky-600 hover:to-blue-700 transition shadow-xl shadow-sky-500/30">
                Become a Member
              </button>
            </Link>
          </div>
        </section>
      </ScrollSection>

      <ScrollSection>
        <section className="py-12 md:py-16 px-2 md:px-4 bg-white">
          <div className="container mx-auto max-w-5xl">
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl border border-sky-200/50 p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-sky-200">
                <div className="group px-4 py-4 md:py-0 text-center md:text-left hover:bg-sky-100/50 rounded-xl md:rounded-none transition-all cursor-pointer">
                  <div className="w-12 h-12 mx-auto md:mx-0 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Updates</h3>
                  <p className="text-gray-600 text-sm">Stay informed about events and activities.</p>
                </div>

                <div className="group px-4 py-4 md:py-0 text-center md:text-left hover:bg-sky-100/50 rounded-xl md:rounded-none transition-all cursor-pointer">
                  <div className="w-12 h-12 mx-auto md:mx-0 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Stories</h3>
                  <p className="text-gray-600 text-sm">Read inspiring testimonies.</p>
                </div>

                <div className="group px-4 py-4 md:py-0 text-center md:text-left hover:bg-sky-100/50 rounded-xl md:rounded-none transition-all cursor-pointer">
                  <div className="w-12 h-12 mx-auto md:mx-0 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Get Involved</h3>
                  <p className="text-gray-600 text-sm">Connect and participate.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollSection>

      <ScrollSection>
        <ContactSection />
      </ScrollSection>

      <footer className="bg-gradient-to-r from-sky-500 to-blue-600 py-6 md:py-8 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 items-center">
            <div className="flex items-center gap-3 justify-center">
              <img src={Logo} alt="RY" className="w-10 h-10" />
              <div>
                <h3 className="text-white font-bold">Royal Youth</h3>
                <p className="text-sky-100 text-sm">Impact Your World</p>
              </div>
            </div>
            <div className="flex gap-6 justify-center">
              <Link to="/login" className="text-white hover:text-sky-100 transition text-sm font-medium">Login</Link>
              <Link to="/register" className="text-white hover:text-sky-100 transition text-sm font-medium">Join Us</Link>
              <Link to="/admin-login" className="text-white hover:text-sky-100 transition text-sm font-medium">Admin</Link>
            </div>
          </div>
          <div className="border-t border-sky-400/30 pt-4">
            <p className="text-sky-100 text-sm">© Royal Youth {new Date().getFullYear()}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;