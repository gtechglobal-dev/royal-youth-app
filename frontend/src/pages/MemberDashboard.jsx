import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

function MemberDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showHandbookModal, setShowHandbookModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState("");
  const [pendingResponse, setPendingResponse] = useState("");
  const [responseSubmitted, setResponseSubmitted] = useState(false);
  const [specialPayments, setSpecialPayments] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [specialPurpose, setSpecialPurpose] = useState("");
  const [specialAmount, setSpecialAmount] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      console.log("Dashboard loading - token exists:", !!token);

      if (!token) {
        console.log("No token, redirecting to login");
        navigate("/login");
        return;
      }

      try {
        // Handle payment callback if present
        const params = new URLSearchParams(window.location.search);
        const ref = params.get("reference");
        const trx = params.get("trx");
        const purpose = params.get("purpose");
        const amount = params.get("amount");
        const month = params.get("month");

        if (trx === "success" && ref) {
          const verifyData = { reference: ref };
          if (month) {
            verifyData.month = month;
          }
          if (purpose) {
            // Special payment
            verifyData.purpose = purpose;
            verifyData.amount = amount;
            await API.post("/payment/special-verify", verifyData);
            // Refresh special payments
            const specialRes = await API.get("/payment/special-payments");
            setSpecialPayments(specialRes.data || []);
          } else {
            // Dues payment - verify via backend
            await API.post("/payment/verify", verifyData);
          }
          window.history.replaceState({}, "", "/dashboard");
        }

        // Fetch user data
        console.log("Fetching user data...");
        const userRes = await API.get("/auth/me");
        console.log("User data received:", userRes.data?.firstname, userRes.data?._id);
        setUser(userRes.data || { firstname: "", surname: "", profileImage: "" });

        // Check if reminder should be shown - shows every login until cutoff date
        // Use local timezone: May 4th, 2026 at 5pm (month is 0-indexed, so 4 = May)
        const cutoffDate = new Date(2026, 4, 4, 17, 0, 0);
        const now = new Date();

        if (now < cutoffDate) {
          setShowReminderModal(true);
          // Prevent background scrolling when popup is open
          document.body.style.overflow = 'hidden';

          // Check if user already responded
          try {
            const responsesRes = await API.get("/meeting-responses/meeting?title=" + encodeURIComponent("Family Meeting - 4th May 2026 by 5pm"));
            const userResponse = responsesRes.data?.find(r => r.user?._id === userRes.data?._id);
            if (userResponse) {
              setSelectedResponse(userResponse.response);
              setResponseSubmitted(true);
            }
          } catch (e) {
            console.error("Error checking previous response:", e);
          }
        }

        // Fetch attendance
        try {
          console.log("Fetching attendance...");
          const attendRes = await API.get("/attendance/my-attendance");
          console.log("Attendance records:", attendRes.data?.length);
          setAttendance(attendRes.data || []);
        } catch (e) {
          console.error("Attendance fetch error:", e);
          setAttendance([]);
        }

        // Fetch special payments
        try {
          console.log("Fetching special payments...");
          const specialRes = await API.get("/payment/special-payments");
          console.log("Special payments:", specialRes.data?.length);
          setSpecialPayments(specialRes.data || []);
        } catch (e) {
          console.error("Special payments fetch error:", e);
          setSpecialPayments([]);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        console.error("Error response:", error.response?.data);
        if (error.response?.status === 401) {
          console.log("401 error - removing token and redirecting to login");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }
        // Prevent blank screen by setting default values
        console.log("Setting default user to prevent blank screen");
        setUser({ firstname: "", surname: "", profileImage: "" });
        setAttendance([]);
        setSpecialPayments([]);
      } finally {
        console.log("Setting loading to false");
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Prevent blank screen - if loading is false but user is null, set default user
  useEffect(() => {
    if (!loading && !user) {
      console.log("Preventing blank screen - setting default user");
      setUser({ firstname: "", surname: "", profileImage: "" });
      setAttendance([]);
      setSpecialPayments([]);
    }
  }, [loading, user]);

  // Scroll lock when reminder modal is open
  useEffect(() => {
    if (showReminderModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showReminderModal]);

  // Auto-show birthday modal on every visit while it's their birthday
  useEffect(() => {
    if (!loading && user && isBirthday) {
      setShowBirthdayModal(true);
    }
  }, [loading, user, isBirthday]);

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handlePayOffline = (month) => {
    setSelectedMonth(month);
    setShowOfflineModal(true);
  };

  const handleSpecialPayOffline = () => {
    if (!specialPurpose || !specialAmount) {
      alert("Please enter purpose and amount");
      return;
    }
    setShowSpecialModal(false);
    setShowOfflineModal(true);
  };

  const refreshSpecialPayments = async () => {
    try {
      const specialRes = await API.get("/payment/special-payments");
      setSpecialPayments(specialRes.data || []);
    } catch (e) {
      console.error("Error refreshing special payments:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">Unable to load your profile</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-sky-600 text-white px-4 py-2 rounded hover:bg-sky-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isBirthday = user?.dob && (() => {
    const today = new Date();
    const birth = new Date(user.dob);
    return today.getDate() === birth.getDate() && today.getMonth() === birth.getMonth();
  })();

   const months = [
    "May", "June", "July", "August", "September", 
    "October", "November", "December"
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {showOfflineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowOfflineModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Pay Offline</h3>
            <p className="text-gray-600 mb-4">
              Kindly make dues payment to <br />
              <span className="font-bold text-sky-600">6337423425 Moniepoint - Royal Youth Concepts</span>
            </p>
            <p className="text-gray-600 mb-4">
              Send payment receipt to group chat for necessary updates.
            </p>
            <button
              onClick={() => setShowOfflineModal(false)}
              className="w-full bg-memberBlue text-white p-3 rounded-lg font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      )}

       {showSpecialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSpecialModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Make Special Payment</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Purpose of Payment</label>
              <input
                type="text"
                value={specialPurpose}
                onChange={(e) => setSpecialPurpose(e.target.value)}
                placeholder="e.g., Donation, Building Fund, Event"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Amount (N)</label>
              <input
                type="number"
                value={specialAmount}
                onChange={(e) => setSpecialAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
                min="100"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSpecialModal(false)}
                className="flex-1 bg-gray-500 text-white p-3 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                 onClick={() => {
                   if (!specialPurpose || !specialAmount) {
                     alert("Please enter purpose and amount");
                     return;
                   }
                   setShowSpecialModal(false);
                   setShowOfflineModal(true);
                 }}
                 className="flex-1 bg-gray-600 text-white p-3 rounded-lg font-semibold hover:bg-gray-700"
               >
                 Pay Offline
               </button>
            </div>
          </div>
        </div>
      )}

      {showReminderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/70 to-pink-900/70 backdrop-blur-sm" onClick={() => { setShowReminderModal(false); }} />
          <div className="relative bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 rounded-3xl shadow-2xl w-full max-w-sm max-h-[85vh] overflow-y-scroll p-5 animate-slideUp border-4 border-yellow-300 scrollbar-thin">

            <button
              onClick={() => { setShowReminderModal(false); }}
              className="absolute top-4 right-4 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all hover:scale-110 z-10"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-4">
              <div className="text-5xl mb-3 animate-bounce">💬</div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 bg-clip-text text-transparent animate-pulse">
                Family Reminder
              </h2>
            </div>

            <div className="bg-white/70 rounded-2xl p-4 mb-4 shadow-inner">
              <p className="text-gray-800 text-base leading-relaxed text-center">
                Hi <span className="font-bold text-purple-600">{user?.firstname}</span>, from the <span className="font-bold text-pink-600">Royal Youth family</span> we wish to remind you of our family meeting{" "}
                {new Date().toDateString() === new Date(2026, 4, 4).toDateString() ? (
                  <span className="font-bold text-yellow-600">TODAY by 5pm</span>
                ) : (
                  <span className="font-bold text-yellow-600">on Mon 4th May by 5pm</span>
                )}
                , your presence is of great value to this department, please be present.
              </p>
              <p className="text-gray-800 text-base mt-3 font-semibold text-center">
                God bless you!
              </p>
            </div>

            {responseSubmitted ? (
              <div className="text-center bg-white/80 rounded-xl p-3">
                <div className="text-3xl mb-2">✅</div>
                <p className="font-bold text-purple-600 text-sm mb-2">You Already Selected: {selectedResponse}</p>
                {selectedResponse === "I will be there" && (
                  <p className="font-semibold text-gray-800 text-sm">Great! We look forward to seeing you there! 🎉</p>
                )}
                {selectedResponse === "I will try my best" && (
                  <p className="font-semibold text-gray-800 text-sm">Thanks! We hope you can make it! 🙏</p>
                )}
                {selectedResponse === "I wont be able to make it" && (
                  <p className="font-semibold text-gray-800 text-sm">We'll miss you! Hope to see you next time. 😔</p>
                )}
                {selectedResponse === "I am so busy" && (
                  <p className="font-semibold text-gray-800 text-sm">No worries! We understand. God bless you! 🙏</p>
                )}
                <p className="text-xs text-gray-600 mt-1">Closing...</p>
              </div>
            ) : !pendingResponse ? (
              <div>
                <p className="text-center font-semibold text-gray-700 mb-3 text-base">Will you be attending?</p>
                <div className="space-y-2">
                  {["I will be there", "I will try my best", "I wont be able to make it", "I am so busy"].map((option) => (
                    <button
                      key={option}
                      onClick={() => setPendingResponse(option)}
                      className={`w-full p-3 rounded-lg font-semibold text-white transition-all hover:scale-105 shadow-md text-base ${
                        option === "I will be there" ? "bg-green-500 hover:bg-green-600" :
                        option === "I will try my best" ? "bg-yellow-500 hover:bg-yellow-600" :
                        option === "I wont be able to make it" ? "bg-red-500 hover:bg-red-600" :
                        "bg-gray-500 hover:bg-gray-600"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white/80 rounded-xl p-4">
                <p className="text-center font-semibold text-gray-800 mb-4">Confirm: "{pendingResponse}"?</p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await API.post("/meeting-responses", {
                          userId: user?._id,
                          meetingTitle: "Family Meeting - 4th May 2026 by 5pm",
                          response: pendingResponse
                        });
                      setSelectedResponse(pendingResponse);
                      setPendingResponse("");
                      setResponseSubmitted(true);
                      setTimeout(() => {
                        setShowReminderModal(false);
                      }, 2000);
                    } catch (error) {
                      console.error("Error submitting response:", error);
                    }
                  }}
                    className="flex-1 bg-green-500 text-white p-3 rounded-lg font-semibold hover:bg-green-600"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setPendingResponse("")}
                    className="flex-1 bg-gray-500 text-white p-3 rounded-lg font-semibold hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {isBirthday && showBirthdayModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/70 via-pink-900/70 to-yellow-900/70 backdrop-blur-sm" onClick={() => setShowBirthdayModal(false)} />
          <div className="relative bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 rounded-3xl shadow-2xl w-full max-w-md p-8 animate-slideUp border-4 border-yellow-300">
            <button
              onClick={() => setShowBirthdayModal(false)}
              className="absolute top-4 right-4 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all hover:scale-110 z-10"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">🎁</div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 bg-clip-text text-transparent mb-4">
                🎉 Happy Birthday! 🎉
              </h2>
              <div className="bg-white/70 rounded-2xl p-5 shadow-inner">
                <p className="text-gray-800 text-lg leading-relaxed">
                  Happy Birthday <span className="font-bold text-purple-600">{user?.firstname}</span>
                </p>
                <p className="text-gray-700 mt-4 leading-relaxed">
                  Today we celebrate the gift that you are to the Royal Youth Hub family. Your presence, passion, and commitment add so much value to this community. May this new year of your life be filled with purpose, grace, and remarkable achievements.
                </p>
                <p className="text-gray-700 mt-3 leading-relaxed">
                  Have a truly wonderful birthday. 🎂
                </p>
              </div>
              <button
                onClick={() => setShowBirthdayModal(false)}
                className="mt-6 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-white p-3 rounded-xl font-bold text-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg"
              >
                Close 🎉
              </button>
            </div>
          </div>
        </div>
      )}

      {isBirthday && !showBirthdayModal && (
        <button
          onClick={() => setShowBirthdayModal(true)}
          className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1 animate-float"
        >
          <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-transform cursor-pointer">
            <span className="text-4xl">🎁</span>
          </span>
          <span className="bg-white/90 text-purple-700 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            Special Gift
          </span>
        </button>
      )}

      <header className="bg-sky-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 2 2m-2-2v10m-6 2h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h1 className="text-xl md:text-2xl font-bold">Back to Home</h1>
          </Link>
          <button
            onClick={handleLogout}
            className="bg-orange-500 hover:bg-orange-600 text-white px-3 md:px-4 py-2 rounded text-sm md:text-base"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-6">
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <h2 className="text-lg md:text-xl font-bold mb-4 text-sky-600">Profile</h2>
            
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => user.profileImage && user.profileImage.length > 0 && setShowImageModal(true)}
              >
                {user.profileImage && user.profileImage.length > 0 && (
                  <img
                     src={user.profileImage}
                     alt="Profile"
                     className="w-full h-full object-cover rounded-full"
                   />
                )}
                {(!user.profileImage || user.profileImage.length === 0) && (
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-base md:text-lg font-semibold">
                  {user.firstname} {user.surname} {user.othername}
                </p>
                <p className="text-gray-600 text-sm">{user.occupation || "Not specified"}</p>
              </div>
            </div>

            <button
              onClick={() => navigate("/edit-profile")}
              className="text-sky-600 text-sm hover:underline mb-4"
            >
              Edit Profile
            </button>

            <div className="space-y-2 text-sm md:text-base">
              <p><span className="font-semibold">Age:</span> {calculateAge(user.dob)} years</p>
              <p><span className="font-semibold">Born Again:</span> {user.bornAgain}</p>
              <p><span className="font-semibold">Phone:</span> {user.phone}</p>
              <p><span className="font-semibold">Email:</span> {user.email || "Not provided"}</p>
              <p><span className="font-semibold">Address:</span> {user.address || "Not provided"}</p>
              <p><span className="font-semibold">Soulwinners Branch:</span> {user.branch || "Plot C4/C5 Owerri"}</p>
              {user.hobbies && user.hobbies.length > 0 && (
                <p><span className="font-semibold">Hobbies:</span> {user.hobbies.join(", ")}</p>
              )}
              <p><span className="font-semibold">Last Login:</span> {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "First login"}</p>
              <p><span className="font-semibold">Date Registered:</span> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}</p>
              <button
                onClick={() => setShowHandbookModal(true)}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Download your Handbook Here
              </button>
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <h2 className="text-lg md:text-xl font-bold mb-4 text-sky-600">Membership Status</h2>
            <div className={`p-4 rounded-lg ${user.membershipStatus === "Active Member" ? "bg-green-100" : "bg-red-100"}`}>
              <p className={`text-base md:text-lg font-semibold ${user.membershipStatus === "Active Member" ? "text-green-700" : "text-red-700"}`}>
                {user.membershipStatus}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 md:mt-6 bg-white p-4 md:p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-bold text-memberBlue">2026 Dues Record</h2>
              <button
                onClick={() => setShowSpecialModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-semibold"
              >
              Make Special Payment/Donations
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm md:text-base">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 md:p-3 text-left">Month</th>
                <th className="border p-2 md:p-3 text-left">Status</th>
                   <th className="border p-2 md:p-3 text-left">Amount</th>
                   <th className="border p-2 md:p-3 text-left">Date Paid</th>
                   <th className="border p-2 md:p-3 text-left">Pay Offline</th>
                </tr>
              </thead>
              <tbody>
                {months.map((month) => (
                  <tr key={month}>
                    <td className="border p-2 md:p-3">{month}</td>
                    <td className="border p-2 md:p-3">
                      <span className={`px-2 py-1 rounded ${user.dues[month]?.status === "Paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {user.dues[month]?.status || "Unpaid"}
                      </span>
                    </td>
                     <td className="border p-2 md:p-3">N{user.dues[month]?.amount || 1000}</td>
                     <td className="border p-2 md:p-3">
                       {user.dues[month]?.status === "Paid" && user.dues[month]?.date
                         ? new Date(user.dues[month].date).toLocaleDateString('en-GB')
                         : "-"}
                     </td>
                     <td className="border p-2 md:p-3">
                      {user.dues[month]?.status !== "Paid" ? (
                        <button
                          onClick={() => handlePayOffline(month)}
                          className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
                        >
                          Pay Offline
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 md:mt-6 bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold text-sky-600">Special Payments/Donations</h2>
              <button
                onClick={refreshSpecialPayments}
                className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
              >
                Refresh
              </button>
            </div>
          {specialPayments.length === 0 ? (
            <p className="text-gray-600">No special payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm md:text-base">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 md:p-3 text-left">Purpose</th>
                    <th className="border p-2 md:p-3 text-left">Amount</th>
                    <th className="border p-2 md:p-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {specialPayments.map((payment, index) => (
                    <tr key={payment._id || index}>
                      <td className="border p-2 md:p-3">{payment.purpose}</td>
                      <td className="border p-2 md:p-3">N{payment.amount?.toLocaleString()}</td>
                      <td className="border p-2 md:p-3">{new Date(payment.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 md:mt-6 bg-white p-4 md:p-6 rounded-lg shadow-md">
            <h2 className="text-lg md:text-xl font-bold mb-4 text-sky-600">Meeting Attendance</h2>
          {attendance.length === 0 ? (
            <p className="text-gray-600">No meetings recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm md:text-base">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 md:p-3 text-left">S/N</th>
                    <th className="border p-2 md:p-3 text-left">Meeting Title</th>
                    <th className="border p-2 md:p-3 text-left">Date</th>
                    <th className="border p-2 md:p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record, index) => (
                    <tr key={record._id}>
                      <td className="border p-2 md:p-3">{index + 1}</td>
                      <td className="border p-2 md:p-3">{record.meetingTitle}</td>
                      <td className="border p-2 md:p-3">{new Date(record.meetingDate).toLocaleDateString()}</td>
                      <td className="border p-2 md:p-3">
                        <span className={`px-2 py-1 rounded ${record.status === "Present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-0 right-0 bg-white rounded-full p-2 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={user.profileImage}
              alt="Profile"
              className="max-w-full max-h-[80vh] object-contain"
            />
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = user.profileImage;
                link.download = `${user.firstname}_${user.surname}_profile.jpg`;
                link.click();
              }}
              className="mt-4 flex items-center gap-2 bg-memberBlue text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Image
            </button>
          </div>
        </div>
      )}

      {showHandbookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowHandbookModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-sky-600">Royal Youth Handbook</h3>
            <p className="mb-4 text-gray-600">Please Note the password of this document is <span className="font-bold">royal</span></p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowHandbookModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowHandbookModal(false);
                  window.open("https://drive.google.com/file/d/1sg1_Vfv_CzF7ToCp0JK2ssvUF-YiZObq/view?usp=drivesdk", "_blank");
                }}
                className="px-4 py-2 bg-memberBlue text-white rounded-lg hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberDashboard;