import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function MemberDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [specialPayments, setSpecialPayments] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [payAmount, setPayAmount] = useState(2000);
  const [specialPurpose, setSpecialPurpose] = useState("");
  const [specialAmount, setSpecialAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get("reference");
        const trx = params.get("trx");
        const purpose = params.get("purpose");
        const amount = params.get("amount");

        if (trx === "success" && ref) {
          await API.post("/payment/special-verify", { reference: ref, purpose, amount });
          window.history.replaceState({}, "", "/dashboard");
        }

        const userRes = await API.get("/auth/me");
        setUser(userRes.data);

        const attendRes = await API.get("/attendance/my-attendance");
        setAttendance(attendRes.data);

        const specialRes = await API.get("/payment/special-payments");
        setSpecialPayments(specialRes.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

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

  const handlePayOnlineClick = (month) => {
    setSelectedMonth(month);
    setPayAmount(user.dues[month]?.amount || 2000);
    setShowPayModal(true);
  };

  const handlePayOnline = async () => {
    if (!payAmount || payAmount < 100) {
      alert("Please enter a valid amount (minimum N100)");
      return;
    }

    setProcessing(true);
    try {
      const res = await API.post("/payment/initialize", {
        month: selectedMonth,
        amount: parseInt(payAmount),
      });

      if (res.data.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else {
        alert("Payment initialization failed. Please try again.");
        setProcessing(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      const errorMsg = error.response?.data?.message || error.message || "Payment failed. Please try again.";
      alert(errorMsg);
      setProcessing(false);
    }
  };

  const handleSpecialPayOffline = () => {
    if (!specialPurpose || !specialAmount) {
      alert("Please enter purpose and amount");
      return;
    }
    setShowSpecialModal(false);
    setShowOfflineModal(true);
  };

  const handleSpecialPayOnline = async () => {
    if (!specialPurpose || !specialAmount) {
      alert("Please enter purpose and amount");
      return;
    }

    setProcessing(true);
    try {
      const res = await API.post("/payment/special-initialize", {
        purpose: specialPurpose,
        amount: parseInt(specialAmount),
      });

      if (res.data.authorization_url) {
        const url = new URL(res.data.authorization_url);
        url.searchParams.set("purpose", specialPurpose);
        url.searchParams.set("amount", specialAmount);
        window.location.href = url.toString();
      } else {
        alert("Payment initialization failed. Please try again.");
        setProcessing(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
      setProcessing(false);
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
    return null;
  }

  const months = [
    "April", "May", "June", "July", "August", "September", 
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
              <span className="font-bold text-memberBlue">6337423425 Moniepoint - Royal Youth Concepts</span>
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

      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPayModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Pay Online - {selectedMonth}</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Amount (N)</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
                min="100"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPayModal(false)}
                className="flex-1 bg-gray-500 text-white p-3 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handlePayOnline}
                disabled={processing}
                className="flex-1 bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? "Processing..." : "Pay Now"}
              </button>
            </div>
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
              <button
                onClick={handleSpecialPayOnline}
                disabled={processing}
                className="flex-1 bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? "Processing..." : "Pay Online"}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-memberBlue text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold">Royal Youth Portal</h1>
          <button
            onClick={handleLogout}
            className="bg-memberOrange px-3 md:px-4 py-2 rounded hover:bg-orange-600 text-sm md:text-base"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-6">
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <h2 className="text-lg md:text-xl font-bold mb-4 text-memberBlue">Profile</h2>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {user.profileImage && (user.profileImage.startsWith('data:') || user.profileImage.startsWith('http')) && (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                {!user.profileImage || (!user.profileImage.startsWith('data:') && !user.profileImage.startsWith('http')) ? (
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ) : null}
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
              className="text-memberBlue text-sm hover:underline mb-4"
            >
              Edit Profile
            </button>

            <div className="space-y-2 text-sm md:text-base">
              <p><span className="font-semibold">Age:</span> {calculateAge(user.dob)} years</p>
              <p><span className="font-semibold">Born Again:</span> {user.bornAgain}</p>
              <p><span className="font-semibold">Phone:</span> {user.phone}</p>
              <p><span className="font-semibold">Email:</span> {user.email || "Not provided"}</p>
              <p><span className="font-semibold">Address:</span> {user.address || "Not provided"}</p>
              {user.hobbies && user.hobbies.length > 0 && (
                <p><span className="font-semibold">Hobbies:</span> {user.hobbies.join(", ")}</p>
              )}
              <p><span className="font-semibold">Last Login:</span> {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "First login"}</p>
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <h2 className="text-lg md:text-xl font-bold mb-4 text-memberBlue">Membership Status</h2>
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
              className="bg-memberOrange text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600"
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
                  <th className="border p-2 md:p-3 text-left">Pay Online</th>
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
                    <td className="border p-2 md:p-3">N{user.dues[month]?.amount || 2000}</td>
                    <td className="border p-2 md:p-3">
                      {user.dues[month]?.status !== "Paid" ? (
                        <button
                          onClick={() => handlePayOnlineClick(month)}
                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                        >
                          Pay Online
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
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
          <h2 className="text-lg md:text-xl font-bold mb-4 text-memberBlue">Special Payments/Donations</h2>
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
                    <tr key={index}>
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
          <h2 className="text-lg md:text-xl font-bold mb-4 text-memberBlue">Meeting Attendance</h2>
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
    </div>
  );
}

export default MemberDashboard;