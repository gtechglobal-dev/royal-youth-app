import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import BannerGallery from "../components/BannerGallery";
import ContactSection from "../components/ContactSection";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import Logo from "../assets/gdev logo.svg";
import PresidentImage from "../assets/president.png";
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

function TypeWriter({ className = "" }) {
  const [welcomeChar, setWelcomeChar] = useState(0);
  const [royalChar, setRoyalChar] = useState(0);
  const [hubChar, setHubChar] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let speed;
    if (phase === 0) speed = welcomeChar < 10 ? 140 : 800;
    else if (phase === 1) speed = welcomeChar > 0 ? 70 : 300;
    else if (phase === 2) speed = royalChar < 11 ? 140 : 600;
    else if (phase === 3) speed = hubChar < 3 ? 140 : 1200;
    else if (phase === 4) speed = hubChar > 0 ? 70 : 300;
    else if (phase === 5) speed = royalChar > 0 ? 70 : 300;

    const id = setTimeout(() => {
      if (phase === 0) {
        if (welcomeChar < 10) setWelcomeChar((c) => c + 1);
        else setPhase(1);
      } else if (phase === 1) {
        if (welcomeChar > 0) setWelcomeChar((c) => c - 1);
        else { setPhase(2); setWelcomeChar(0); }
      } else if (phase === 2) {
        if (royalChar < 11) setRoyalChar((c) => c + 1);
        else setPhase(3);
      } else if (phase === 3) {
        if (hubChar < 3) setHubChar((c) => c + 1);
        else setPhase(4);
      } else if (phase === 4) {
        if (hubChar > 0) setHubChar((c) => c - 1);
        else setPhase(5);
      } else if (phase === 5) {
        if (royalChar > 0) setRoyalChar((c) => c - 1);
        else { setPhase(0); setRoyalChar(0); setHubChar(0); }
      }
    }, speed);
    return () => clearTimeout(id);
  }, [phase, welcomeChar, royalChar, hubChar]);

  const welcomeVisible = "WELCOME TO".slice(0, welcomeChar);
  const royalVisible = "ROYAL YOUTH".slice(0, royalChar);
  const hubVisible = "HUB".slice(0, hubChar);

  const showRoyal = phase >= 2;
  const showHub = phase >= 3 && phase <= 4;

  const cursorPhase = phase !== 1 && phase !== 5 && (phase !== 0 || welcomeChar > 0);

  return (
    <div className={className}>
      <div className="flex flex-col items-center justify-center min-h-[3.4em]">
        {welcomeVisible && (
          <span className="block text-5xl md:text-7xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {welcomeVisible}
            {cursorPhase && phase === 0 && <span className="inline-block w-0.5 h-[1.1em] bg-indigo-600 ml-1 align-middle animate-pulse" />}
          </span>
        )}
        {showRoyal && (
          <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
            {royalVisible}
            {(phase === 2 || phase === 5) && royalVisible.length > 0 && <span className="inline-block w-0.5 h-[1.1em] bg-indigo-600 ml-1 align-middle animate-pulse" />}
          </span>
        )}
        {showHub && (
          <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
            {hubVisible}
            {(phase === 3 || phase === 4) && hubVisible.length > 0 && <span className="inline-block w-0.5 h-[1.1em] bg-indigo-600 ml-1 align-middle animate-pulse" />}
          </span>
        )}
      </div>
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [readMore, setReadMore] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);

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

      <BannerGallery />

      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 py-1.5 md:py-2 overflow-hidden shadow-lg">
        <div className="inline-flex whitespace-nowrap" style={{ animation: "marquee 80s linear infinite" }}>
          {[...Array(12)].map((_, i) => (
            <span key={i} className="text-white text-sm md:text-base font-medium mx-6 flex-shrink-0 tracking-wide">
              ✨ Royal Youth Hub — Where God refines you for greatness, purpose, and impact. Stay connected, keep serving, and let your light shine ✨
            </span>
          ))}
        </div>
      </div>

      <ScrollSection className="py-8 px-4" delay={100}>
        <div className="container mx-auto max-w-5xl">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-32 h-32 md:w-48 md:h-48 overflow-hidden shadow-2xl rounded-2xl border-4 border-indigo-100 flex-shrink-0">
                  <img src={PresidentImage} alt="Youth President" className="w-full h-full object-cover object-[center_10%]" />
                </div>
                <div className="text-left">
                  <svg className="w-10 h-10 md:w-14 md:h-14 text-indigo-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  <h2 className="text-xl md:text-3xl font-bold text-indigo-700">From the President's Desk</h2>
                </div>
              </div>
            </div>
            <div className="text-gray-700 space-y-4 leading-relaxed text-sm md:text-base text-justify">
              <p>Welcome to Royal Youth Hub — a growing platform created to connect and empower young people.</p>
              <p>As we launch this initiative, we are currently at the startup stage, and we are excited about the many innovations,
                {readMore && (
                  <>
                    improvements, and opportunities that will continue to develop within the Hub. Our vision is to build a vibrant community where young believers within Soulwinners International Churches and other denominations as well can connect, share ideas, grow together, and support one another in the fear of God.
                  </>
                )}
              </p>
              {readMore && (
                <>
                  <p>Royal Youth Hub is a space for collaboration, learning, leadership, and meaningful relationships. We invite you to be part of this journey from the beginning, as your participation, ideas, and support will help shape the future of this Hub.</p>
                  <p>You will also find sections for Complaints/Suggestions, Prayer Requests, and Testimonies below—please feel free to use them at your convenience.</p>
                  <p className="font-semibold text-indigo-700">More updates and exciting features are coming soon. Royal Youth Hub — where growth happens.</p>
                  <div className="mt-6 pt-4 border-t border-indigo-200 text-left">
                    <p className="font-bold text-gray-800">Warm regards,</p>
                    <p className="text-indigo-600 font-semibold">Rev. Mark Nelson Nnannah</p>
                    <p className="text-gray-500 text-sm">Youth President</p>
                  </div>
                </>
              )}
              {!readMore && (
                <button onClick={() => setReadMore(true)} className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors">Read more...</button>
              )}
            </div>
            {!isLoggedIn && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8 pt-8 border-t border-gray-200">
                <div className="w-full max-w-xs sm:w-auto">
                  <button onClick={() => setShowEligibilityModal(true)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 md:px-10 md:py-4 rounded-2xl font-bold text-base md:text-lg transition-all shadow-xl shadow-indigo-600/30 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]">
                    Create An Account
                  </button>
                </div>
                <Link to="/login" className="w-full max-w-xs sm:w-auto">
                  <button className="w-full bg-white text-indigo-600 border-2 border-indigo-200 px-8 py-3 md:px-10 md:py-4 rounded-2xl font-bold text-base md:text-lg transition-all hover:bg-indigo-50 hover:border-indigo-300">
                    Login
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </ScrollSection>

      <ScrollSection className="py-16 px-4 bg-white" delay={200}>
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

      {showEligibilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-slideUp border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Important Registration Notice</h3>
            </div>
            <div className="text-gray-600 space-y-4 mb-8 leading-relaxed">
              <p>
                Please note that account registration is currently <strong className="text-indigo-700">exclusive to youths of Soulwinners Int'l Church C4/C5 Owerri</strong>.
              </p>
              <p>
                We are actively working on expanding access to other branches and denominations. More upgrades are coming soon!
              </p>
              <p className="font-medium text-gray-800">Would you like to proceed with registration?</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => navigate("/register")} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
                Yes, Proceed
              </button>
              <button onClick={() => setShowEligibilityModal(false)} className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98]">
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
