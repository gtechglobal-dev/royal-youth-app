import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Notification from "../components/Notification";

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(null);
  const [showAll, setShowAll] = useState(true);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedDuesMember, setSelectedDuesMember] = useState(null);
  const [selectedAttendanceMember, setSelectedAttendanceMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, type: "", message: "" });
  const [deletingMemberId, setDeletingMemberId] = useState(null);

  const [newMeeting, setNewMeeting] = useState({ meetingTitle: "", meetingDate: "" });
  const [meetings, setMeetings] = useState([]);
  const [editingMeeting, setEditingMeeting] = useState(null);

  const [income, setIncome] = useState({ purpose: "", amount: "", date: "" });
  const [expense, setExpense] = useState({ purpose: "", amount: "", date: "" });

  const [balance, setBalance] = useState({ totalDues: 0, totalIncome: 0, totalExpenses: 0, balance: 0, duesMonthly: {} });
  const [incomeRecords, setIncomeRecords] = useState([]);

  const months = [
    "April", "May", "June", "July", "August", "September", 
    "October", "November", "December"
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (!token || user.role !== "admin") {
      navigate("/admin-login");
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const membersRes = await API.get("/auth/members");
      setMembers(membersRes.data);

      const meetingsRes = await API.get("/attendance/meetings");
      setMeetings(meetingsRes.data);

      const balanceRes = await API.get("/finance/balance-sheet");
      setBalance(balanceRes.data);

      const duesIncomeRes = await API.get("/payment/income");
      if (duesIncomeRes.data) {
        setBalance(prev => ({
          ...prev,
          totalDues: duesIncomeRes.data.totalIncome,
          duesMonthly: duesIncomeRes.data.monthlyIncome,
        }));
        setIncomeRecords(duesIncomeRes.data.monthlyIncome);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    try {
      await API.post("/attendance/meeting", newMeeting);
      setNotification({ open: true, type: "success", message: "Meeting created" });
      setNewMeeting({ meetingTitle: "", meetingDate: "" });
      fetchData();
    } catch (error) {
      setNotification({ open: true, type: "error", message: "Error creating meeting" });
    }
  };

  const handleUpdateMeeting = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/attendance/meeting/${editingMeeting._id}`, {
        meetingTitle: editingMeeting.meetingTitle,
        meetingDate: editingMeeting.meetingDate
      });
      setNotification({ open: true, type: "success", message: "Meeting updated" });
      setEditingMeeting(null);
      fetchData();
    } catch (error) {
      setNotification({ open: true, type: "error", message: "Error updating meeting" });
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;
    try {
      await API.delete(`/attendance/meeting/${meetingId}`);
      setNotification({ open: true, type: "success", message: "Meeting deleted" });
      fetchData();
    } catch (error) {
      setNotification({ open: true, type: "error", message: "Error deleting meeting" });
    }
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();
    try {
      await API.post("/finance/income", income);
      setNotification({ open: true, type: "success", message: "Income added" });
      setIncome({ purpose: "", amount: "", date: "" });
      fetchData();
    } catch (error) {
      setNotification({ open: true, type: "error", message: "Error adding income" });
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await API.post("/finance/expense", expense);
      setNotification({ open: true, type: "success", message: "Expense added" });
      setExpense({ purpose: "", amount: "", date: "" });
      fetchData();
    } catch (error) {
      setNotification({ open: true, type: "error", message: "Error adding expense" });
    }
  };

  const updateDues = async (memberId, month, status, amount = 0) => {
    try {
      await API.put(`/auth/dues/${memberId}`, { month, status, amount });
      
      if (status === "Paid" && amount > 0) {
        await API.post("/finance/income", {
          purpose: `Dues - ${month}`,
          amount: amount,
          date: new Date().toISOString().split('T')[0]
        });
      }
      
      setNotification({ open: true, type: "success", message: "Dues updated" });
      fetchData();
    } catch (error) {
      console.error(error);
      setNotification({ open: true, type: "error", message: "Error updating dues: " + error.message });
    }
  };

  const updateMembershipStatus = async (memberId, status) => {
    try {
      await API.put(`/auth/member-status/${memberId}`, { status });
      setNotification({ open: true, type: "success", message: "Membership status updated" });
      fetchData();
    } catch (error) {
      setNotification({ open: true, type: "error", message: "Error updating status" });
    }
  };

  const deleteMember = async () => {
    try {
      await API.delete(`/auth/member/${deletingMemberId}`);
      setNotification({ open: true, type: "success", message: "Member account deleted" });
      setDeletingMemberId(null);
      fetchData();
    } catch (error) {
      setNotification({ open: true, type: "error", message: "Error deleting member" });
    }
  };

  const confirmDeleteMember = (memberId) => {
    setDeletingMemberId(memberId);
  };

  const cancelDelete = () => {
    setDeletingMemberId(null);
  };

  const markAttendance = async (memberId, meetingId, status) => {
    try {
      const meeting = meetings.find(m => m._id === meetingId);
      await API.post("/attendance/mark", {
        userId: memberId,
        meetingTitle: meeting.meetingTitle,
        meetingDate: meeting.meetingDate,
        status
      });
      setNotification({ open: true, type: "success", message: "Attendance marked" });
    } catch (error) {
      console.error(error);
      setNotification({ open: true, type: "error", message: "Error marking attendance: " + error.message });
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const tabs = [
    { id: "members", label: "View Members" },
    { id: "dues", label: "Mark Dues" },
    { id: "attendance", label: "Attendance" },
    { id: "income", label: "Income" },
    { id: "expense", label: "Expenses" },
    { id: "balance", label: "Balance Sheet" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-adminBlue text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl md:text-2xl font-bold">Royal Youth Admin</h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-adminYellow text-black px-3 md:px-4 py-2 rounded hover:bg-yellow-400 text-sm md:text-base"
          >
            Logout
          </button>
        </div>
      </header>

<div className="container mx-auto p-4 md:p-6">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 md:px-4 py-2 rounded text-sm md:text-base ${
                  activeTab === tab.id
                    ? "bg-adminBlue text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "members" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm md:text-base">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 md:p-3 text-left">Name</th>
                  <th className="border p-2 md:p-3 text-left">Phone</th>
                  <th className="border p-2 md:p-3 text-left">DOB</th>
                  <th className="border p-2 md:p-3 text-left">Status</th>
                  <th className="border p-2 md:p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member._id}>
                    <td className="border p-2 md:p-3">{member.firstname} {member.surname}</td>
                    <td className="border p-2 md:p-3">{member.phone}</td>
                    <td className="border p-2 md:p-3">{member.dob ? new Date(member.dob).toLocaleDateString() : '-'}</td>
                    <td className="border p-2 md:p-3">
                      <span className={`px-2 py-1 rounded ${member.membershipStatus === "Active Member" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {member.membershipStatus}
                      </span>
                    </td>
                    <td className="border p-2 md:p-3">
                      <button
                        onClick={() => setSelectedMember(member)}
                        className="text-adminBlue hover:underline mr-2"
                      >
                        View
                      </button>
                      <button
                        onClick={() => confirmDeleteMember(member._id)}
                        className="text-red-500 hover:underline mr-2"
                      >
                        Delete
                      </button>
                      <select
                        value={member.membershipStatus}
                        onChange={(e) => updateMembershipStatus(member._id, e.target.value)}
                        className="border p-1 rounded"
                      >
                        <option value="Active Member">Active</option>
                        <option value="Inactive Member">Inactive</option>
                      </select>
                    </td>
                  </tr>
                ))}
</tbody>
            </table>
          </div>
        )}

        {selectedAttendanceMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedMember(null)} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-lg font-bold mb-4 text-adminBlue">Member Profile</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {selectedMember.profileImage && (
                    <img
                      src={selectedMember.profileImage?.startsWith('http') ? selectedMember.profileImage : `http://localhost:5000/uploads/${selectedMember.profileImage}`}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{selectedMember.firstname} {selectedMember.surname} {selectedMember.othername}</p>
                    <p className="text-sm text-gray-500">{selectedMember.occupation || 'No occupation'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-semibold">Phone:</span> {selectedAttendanceMember.phone}</div>
                  <div><span className="font-semibold">Email:</span> {selectedAttendanceMember.email || '-'}</div>
                  <div><span className="font-semibold">DOB:</span> {selectedAttendanceMember.dob ? new Date(selectedAttendanceMember.dob).toLocaleDateString() : '-'}</div>
                  <div><span className="font-semibold">Age:</span> {selectedAttendanceMember.dob ? calculateAge(selectedAttendanceMember.dob) : '-'} years</div>
                  <div><span className="font-semibold">Address:</span> {selectedAttendanceMember.address || '-'}</div>
                  <div><span className="font-semibold">Born Again:</span> {selectedAttendanceMember.bornAgain}</div>
                  <div><span className="font-semibold">Status:</span> {selectedAttendanceMember.membershipStatus}</div>
                  <div><span className="font-semibold">Last Login:</span> {selectedAttendanceMember.lastLogin ? new Date(selectedAttendanceMember.lastLogin).toLocaleDateString() : 'Never'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {deletingMemberId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={cancelDelete} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
              <h3 className="text-lg font-bold mb-4 text-adminBlue">Confirm Delete</h3>
              <p className="mb-4">Are you sure you want to delete this member account? This action cannot be undone.</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={cancelDelete}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteMember}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "dues" && (
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <h2 className="text-lg md:text-xl font-bold mb-4 text-adminBlue">Mark Dues</h2>
            <select
              className="border p-2 w-full mb-4"
              onChange={(e) => {
                const member = members.find(m => m._id === e.target.value);
                setSelectedDuesMember(member);
              }}
            >
              <option value="">Select Member</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.firstname} {member.surname}
                </option>
              ))}
            </select>

            {selectedDuesMember && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse mt-4 text-sm md:text-base">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 md:p-3 text-left">Month</th>
                      <th className="border p-2 md:p-3 text-left">Amount</th>
                      <th className="border p-2 md:p-3 text-left">Date</th>
                      <th className="border p-2 md:p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {months.map((month) => (
                      <tr key={month}>
                        <td className="border p-2 md:p-3">{month}</td>
                        <td className="border p-2 md:p-3">
                          <input
                            type="number"
                            placeholder="Amount"
                            className="border p-1 rounded w-24"
                            defaultValue={selectedDuesMember.dues[month]?.amount || ""}
                            onBlur={(e) => {
                              const amount = parseInt(e.target.value) || 0;
                              if (amount > 0 && selectedDuesMember.dues[month]?.status !== "Paid") {
                                updateDues(selectedDuesMember._id, month, "Paid", amount);
                              }
                            }}
                          />
                        </td>
                        <td className="border p-2 md:p-3 text-sm">
                          {selectedDuesMember.dues[month]?.date 
                            ? new Date(selectedDuesMember.dues[month].date).toLocaleDateString('en-GB')
                            : '-'}
                        </td>
                        <td className="border p-2 md:p-3">
                          <button
                            onClick={() => {
                              const currentAmount = selectedDuesMember.dues[month]?.amount || 0;
                              const newStatus = selectedDuesMember.dues[month]?.status === "Paid" ? "Unpaid" : "Paid";
                              const amount = newStatus === "Paid" ? (currentAmount || 1000) : 0;
                              updateDues(selectedDuesMember._id, month, newStatus, amount);
                              setSelectedDuesMember({ ...selectedDuesMember, dues: { ...selectedDuesMember.dues, [month]: { status: newStatus, amount } } });
                            }}
                            className={`px-3 py-1 rounded ${
                              selectedDuesMember.dues[month]?.status === "Paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {selectedDuesMember.dues[month]?.status || "Unpaid"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="space-y-4">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <h2 className="text-lg md:text-xl font-bold mb-4 text-adminBlue">Create Meeting</h2>
              <form onSubmit={handleCreateMeeting} className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Meeting Title"
                  className="border p-2 flex-1"
                  value={newMeeting.meetingTitle}
                  onChange={(e) => setNewMeeting({ ...newMeeting, meetingTitle: e.target.value })}
                  required
                />
                <input
                  type="date"
                  className="border p-2"
                  value={newMeeting.meetingDate}
                  onChange={(e) => setNewMeeting({ ...newMeeting, meetingDate: e.target.value })}
                  required
                />
                <button type="submit" className="bg-adminBlue text-white px-4 md:px-6 py-2 rounded">
                  Create
                </button>
              </form>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <h2 className="text-lg md:text-xl font-bold mb-4 text-adminBlue">Meetings</h2>
              {meetings.length === 0 ? (
                <p>No meetings created yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm md:text-base">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 md:p-3 text-left">Title</th>
                        <th className="border p-2 md:p-3 text-left">Date</th>
                        <th className="border p-2 md:p-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meetings.map((meeting) => (
                        <tr key={meeting._id}>
                          <td className="border p-2 md:p-3">{meeting.meetingTitle}</td>
                          <td className="border p-2 md:p-3">{new Date(meeting.meetingDate).toLocaleDateString()}</td>
                          <td className="border p-2 md:p-3">
                            <button
                              onClick={() => setSelectedMember({ ...selectedAttendanceMember, currentMeeting: meeting._id })}
                              className="text-adminBlue hover:underline mr-2"
                            >
                              Mark
                            </button>
                            <button
                              onClick={() => setEditingMeeting(meeting)}
                              className="text-yellow-500 hover:underline mr-2"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMeeting(meeting._id)}
                              className="text-red-500 hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {editingMeeting && (
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                <h2 className="text-lg md:text-xl font-bold mb-4 text-adminBlue">Edit Meeting</h2>
                <form onSubmit={handleUpdateMeeting} className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Meeting Title"
                    className="border p-2 flex-1"
                    value={editingMeeting.meetingTitle}
                    onChange={(e) => setEditingMeeting({ ...editingMeeting, meetingTitle: e.target.value })}
                    required
                  />
                  <input
                    type="date"
                    className="border p-2"
                    value={editingMeeting.meetingDate?.split('T')[0]}
                    onChange={(e) => setEditingMeeting({ ...editingMeeting, meetingDate: e.target.value })}
                    required
                  />
                  <button type="submit" className="bg-adminBlue text-white px-4 md:px-6 py-2 rounded">
                    Update
                  </button>
                  <button type="button" onClick={() => setEditingMeeting(null)} className="bg-gray-400 text-white px-4 md:px-6 py-2 rounded">
                    Cancel
                  </button>
                </form>
              </div>
            )}

            {selectedAttendanceMember?.currentMeeting && (
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                <h2 className="text-lg md:text-xl font-bold mb-4 text-adminBlue">Mark Attendance</h2>
                <select
                  className="border p-2 w-full mb-4"
                  onChange={(e) => setSelectedMember({ ...selectedAttendanceMember, selectedAttendanceMemberId: e.target.value })}
                >
                  <option value="">Select Member</option>
                  {members.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.firstname} {member.surname}
                    </option>
                  ))}
                </select>

                {selectedAttendanceMember.selectedAttendanceMemberId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => markAttendance(selectedAttendanceMember.selectedAttendanceMemberId, selectedAttendanceMember.currentMeeting, "Present")}
                      className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                      Present
                    </button>
                    <button
                      onClick={() => markAttendance(selectedAttendanceMember.selectedAttendanceMemberId, selectedAttendanceMember.currentMeeting, "Absent")}
                      className="bg-red-500 text-white px-4 py-2 rounded"
                    >
                      Absent
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "income" && (
          <div className="space-y-4">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <h2 className="text-lg md:text-xl font-bold mb-4 text-adminBlue">Add Income</h2>
              <form onSubmit={handleAddIncome} className="space-y-3 md:space-y-4">
                <input
                  type="text"
                  placeholder="Purpose"
                  className="border p-2 w-full"
                  value={income.purpose}
                  onChange={(e) => setIncome({ ...income, purpose: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Amount"
                  className="border p-2 w-full"
                  value={income.amount}
                  onChange={(e) => setIncome({ ...income, amount: e.target.value })}
                  required
                />
                <input
                  type="date"
                  className="border p-2 w-full"
                  value={income.date}
                  onChange={(e) => setIncome({ ...income, date: e.target.value })}
                  required
                />
                <button type="submit" className="bg-green-500 text-white px-4 md:px-6 py-2 rounded">
                  Add Income
                </button>
              </form>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <h2 className="text-lg md:text-xl font-bold mb-4 text-adminBlue">2026 Monthly Dues Income</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm md:text-base">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 md:p-3 text-left">Month</th>
                      <th className="border p-2 md:p-3 text-left">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(incomeRecords).map(([month, amount]) => (
                      <tr key={month}>
                        <td className="border p-2 md:p-3">{month}</td>
                        <td className="border p-2 md:p-3">N{amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-green-100 font-bold">
                      <td className="border p-2 md:p-3">Grand Total</td>
                      <td className="border p-2 md:p-3">N{Object.values(incomeRecords).reduce((a, b) => a + b, 0).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "expense" && (
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <h2 className="text-lg md:text-xl font-bold mb-4 text-adminBlue">Add Expense</h2>
            <form onSubmit={handleAddExpense} className="space-y-3 md:space-y-4">
              <input
                type="text"
                placeholder="Purpose"
                className="border p-2 w-full"
                value={expense.purpose}
                onChange={(e) => setExpense({ ...expense, purpose: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Amount"
                className="border p-2 w-full"
                value={expense.amount}
                onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
                required
              />
              <input
                type="date"
                className="border p-2 w-full"
                value={expense.date}
                onChange={(e) => setExpense({ ...expense, date: e.target.value })}
                required
              />
              <button type="submit" className="bg-red-500 text-white px-4 md:px-6 py-2 rounded">
                Add Expense
              </button>
            </form>
          </div>
        )}

        {activeTab === "balance" && (
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <h2 className="text-lg md:text-xl font-bold mb-4 text-adminBlue">Balance Sheet</h2>
            <div className="grid md:grid-cols-2 gap-3 md:gap-4">
              <div className="bg-green-100 p-4 rounded-lg">
                <p className="text-gray-600 text-sm md:text-base">2026 Dues Income (Apr-Dec)</p>
                <p className="text-xl md:text-2xl font-bold text-green-700">N{balance.totalDues.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <p className="text-gray-600 text-sm md:text-base">Total Other Income</p>
                <p className="text-xl md:text-2xl font-bold text-blue-700">N{balance.totalIncome}</p>
              </div>
              <div className="bg-red-100 p-4 rounded-lg">
                <p className="text-gray-600 text-sm md:text-base">Total Expenses</p>
                <p className="text-xl md:text-2xl font-bold text-red-700">N{balance.totalExpenses}</p>
              </div>
              <div className="bg-adminYellow p-4 rounded-lg">
                <p className="text-gray-600 text-sm md:text-base">Final Balance</p>
                <p className="text-xl md:text-2xl font-bold text-black">N{balance.balance}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        isOpen={notification.open}
        onClose={() => setNotification({ ...notification, open: false })}
      />
    </div>
  );
}

export default AdminDashboard;