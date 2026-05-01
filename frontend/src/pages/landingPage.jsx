import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import BannerGallery from "../components/BannerGallery";
import ContactSection from "../components/ContactSection";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import Logo from "../assets/gdev logo.svg";
import { PageLoader } from "../components/Loaders";

function ScrollSection({ children, className = "", delay = 0 }) {
  const [ref, isVisible] = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (token && user.role !== "admin") {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/");
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-sm border-b border-indigo-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <img src={Logo} alt="RY" className="w-10 h-10 md:w-12 md:h-12 transition-transform group-hover:scale-105" />
                <div className="absolute -inset-1 bg-indigo-600 rounded-full opacity-0 group-hover:opacity-20 blur transition-opacity" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                  Royal Youth Hub
                </h1>
                <p className="text-indigo-400 text-xs md:text-sm font-medium">Impact Your World</p>
              </div>
            </Link>
            <div className="flex items-center gap-2 md:gap-3">
              {isLoggedIn && (
                <>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="bg-indigo-600 text-white px-4 py-2 md:px-5 rounded-xl font-semibold hover:bg-indigo-700 transition-all text-sm md:text-base shadow-lg shadow-indigo-600/25"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 md:px-5 rounded-xl font-semibold transition-all text-sm md:text-base shadow-lg shadow-amber-500/25"
                  >
                    Logout
                  </button>
                </>
              )}

              {!isLoggedIn && (
                <Link to="/admin-login">
                  <button className="border-2 border-indigo-200 text-indigo-600 px-4 py-2 md:px-6 rounded-xl font-semibold hover:bg-indigo-50 hover:border-indigo-300 transition-all text-sm md:text-base">
                    Admin
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="pt-16 md:pt-20">
        <BannerGallery />
      </div>

      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 py-1.5 md:py-2 overflow-hidden shadow-lg">
        <div className="flex whitespace-nowrap" style={{ animation: "marquee 20s linear infinite" }}>
          {[...Array(4)].map((_, i) => (
            <span key={i} className="text-white text-sm md:text-base font-medium mx-8 flex-shrink-0 tracking-wide">
              ✨ Welcome to Royal Youth Hub — Where God refines you... Keep impacting your world ✨
            </span>
          ))}
        </div>
      </div>

      <ScrollSection className="py-20 md:py-32 px-4" delay={100}>
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-block mb-6">
            <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold tracking-wide">
              BUILDING COMMUNITY
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-none tracking-[-0.08em] md:tracking-[-0.05em]">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
              ROYAL YOUTH
            </span>
            <br />
            <span className="text-gray-800">HUB</span>
          </h2>
          <p className="text-gray-600 mb-10 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed">
            Building a community of faith, purpose, and excellence. Join us in making a difference.
          </p>
          {!isLoggedIn && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-8">
              <Link to="/register" className="w-full max-w-xs sm:w-auto">
                <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 md:px-10 md:py-4 rounded-2xl font-bold text-base md:text-lg transition-all shadow-xl shadow-indigo-600/30 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]">
                  Register
                </button>
              </Link>
              <Link to="/login" className="w-full max-w-xs sm:w-auto">
                <button className="w-full bg-white text-indigo-600 border-2 border-indigo-200 px-8 py-3 md:px-10 md:py-4 rounded-2xl font-bold text-base md:text-lg transition-all hover:bg-indigo-50 hover:border-indigo-300">
                  Login
                </button>
              </Link>
            </div>
          )}
        </div>
      </ScrollSection>

      <ScrollSection className="py-16 md:py-24 px-4 bg-white" delay={200}>
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "Updates",
                desc: "Stay informed about events and activities in Royal Youth Hub.",
                color: "from-amber-400 to-orange-500"
              },
              {
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
                title: "Stories",
                desc: "Read inspiring testimonies from Royal Youth Hub.",
                color: "from-indigo-400 to-purple-500"
              },
              {
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: "Get Involved",
                desc: "Connect and participate in Royal Youth Hub.",
                color: "from-purple-400 to-pink-500"
              }
            ].map((item, idx) => (
              <div key={idx} className="group bg-white rounded-3xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-2xl hover:shadow-indigo-200/50 transition-all hover:-translate-y-2 border border-gray-100">
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg`}>
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">{item.title}</h3>
                <p className="text-gray-600 text-center leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollSection>

      <ScrollSection delay={300}>
        <ContactSection />
      </ScrollSection>

      <footer className="bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-8 mb-8">
            <div className="flex items-center gap-4">
              <img src={Logo} alt="RY" className="w-12 h-12" />
              <div>
                <h3 className="text-white font-bold text-lg">Royal Youth Hub</h3>
                <p className="text-indigo-300 text-sm">Impact Your World</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/login" className="text-indigo-200 hover:text-white transition-colors font-medium">
                Login
              </Link>
              <Link to="/register" className="text-indigo-200 hover:text-white transition-colors font-medium">
                Join Us
              </Link>
              <Link to="/admin-login" className="text-indigo-200 hover:text-white transition-colors font-medium">
                Admin
              </Link>
            </div>
          </div>
          <div className="border-t border-indigo-800/50 pt-8 text-center">
            <p className="text-indigo-300 text-sm">
              © Royal Youth Hub {new Date().getFullYear()}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
