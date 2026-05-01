import { useState, useEffect } from "react";
import API from "../services/api";

function UserDashboard() {
  const [userData, setUserData] = useState(null);
  const [showPayments, setShowPayments] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserData(user);
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);

  const handlePayOffline = async (month) => {
    if (!userData) return;
    setProcessing(month);
    
    try {
      await API.put(`/auth/dues/${userData._id}`, {
        month: month,
        status: "Paid",
        amount: 100
      });
      
      const updatedUser = { ...userData };
      updatedUser.dues = updatedUser.dues || {};
      updatedUser.dues[month] = { status: "Paid", amount: 100 };
      setUserData(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      alert(`${month} offline payment recorded! Please make payment at church office.`);
    } catch (err) {
      alert("Failed to record payment. Please try again.");
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  if (!userData) {
    return (
      <div className="p-10">
        <h1 style={{ fontSize: "24px", color: "red" }}>Please log in to view dashboard</h1>
      </div>
    );
  }

  const months2026 = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "24px" }}>Royal Youth Dashboard</h1>

      {/* User Info */}
      <div style={{ background: "white", padding: "24px", borderRadius: "8px", marginBottom: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>Member Information</h2>
        <p><strong>Name:</strong> {userData.firstname} {userData.surname}</p>
        <p><strong>Phone:</strong> {userData.phone}</p>
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Status:</strong> {userData.membershipStatus}</p>
      </div>

      {/* View Dues Record Button */}
      <button
        onClick={() => setShowPayments(!showPayments)}
        style={{
          background: showPayments ? "#1d4ed8" : "#6b7280",
          color: "white",
          padding: "14px 24px",
          borderRadius: "8px",
          border: "none",
          fontSize: "16px",
          cursor: "pointer",
          marginBottom: "20px",
          width: "100%"
        }}
      >
        {showPayments ? "▼ Hide Dues Record / Payment History" : "▶ View Dues Record / Payment History"}
      </button>

      {/* Dues Record Table */}
      {showPayments && (
        <div style={{ background: "white", padding: "24px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>2026 Dues Record</h2>
          
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Month</th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Amount Paid (₦)</th>
                 <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Status</th>
                 <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Date Paid</th>
                 <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #e5e7eb" }}>Pay Offline</th>
              </tr>
            </thead>
            <tbody>
              {months2026.map((month) => {
                const monthData = userData.dues?.[month];
                const isPaid = monthData?.status === "Paid";
                const isProcessing = processing === month;
                
                return (
                  <tr key={month} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "14px", fontWeight: "500" }}>{month}</td>
                    <td style={{ padding: "14px" }}>₦{monthData?.amount || "0"}</td>
                     <td style={{ padding: "14px" }}>
                       <span style={{
                         padding: "6px 12px",
                         borderRadius: "20px",
                         fontSize: "14px",
                         fontWeight: "500",
                         background: isPaid ? "#d1fae5" : "#fee2e2",
                         color: isPaid ? "#166534" : "#991b1b"
                       }}>
                         {isPaid ? "✓ Paid" : "✗ Unpaid"}
                       </span>
                     </td>
                     <td style={{ padding: "14px" }}>
                       {isPaid && monthData?.date
                         ? new Date(monthData.date).toLocaleDateString()
                         : "-"}
                     </td>
                     <td style={{ padding: "14px", textAlign: "center" }}>
                       <button
                         onClick={() => handlePayOffline(month)}
                         disabled={isPaid}
                         style={{
                           padding: "8px 16px",
                           background: isPaid ? "#9ca3af" : "#f59e0b",
                           color: "white",
                           border: "none",
                           borderRadius: "6px",
                           cursor: isPaid ? "not-allowed" : "pointer",
                           fontSize: "14px"
                         }}
                       >
                         Pay Offline
                       </button>
                     </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Special Donations Section - Always visible */}
      <div style={{ background: "white", padding: "24px", borderRadius: "8px", marginTop: "24px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>Special Donations / Payment History</h2>
        
        {userData.specialPayments && userData.specialPayments.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ padding: "12px", textAlign: "left" }}>Date</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Amount (₦)</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Purpose</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {userData.specialPayments.map((payment, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "12px" }}>
                    {payment.date ? new Date(payment.date).toLocaleDateString() : "N/A"}
                  </td>
                  <td style={{ padding: "12px" }}>₦{payment.amount || 0}</td>
                  <td style={{ padding: "12px" }}>{payment.purpose || "N/A"}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      background: (payment.status === "Paid" || payment.status === "Completed") ? "#d1fae5" : "#fee2e2",
                      color: (payment.status === "Paid" || payment.status === "Completed") ? "#166534" : "#991b1b"
                    }}>
                      {payment.status || "N/A"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "#6b7280", padding: "20px", textAlign: "center" }}>No special donations recorded</p>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;