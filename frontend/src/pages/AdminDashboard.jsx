import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Notification from "../components/Notification";
import Logo from "../assets/gdev logo.svg";
import { OverlayLoader } from "../components/Loaders";

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
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerLink, setBannerLink] = useState("");
  const [bannerImg, setBannerImg] = useState(null);
  const [banners, setBanners] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);
  const [deletingBanner, setDeletingBanner] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [deletingContact, setDeletingContact] = useState(null);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [counts, setCounts] = useState({
    members: 0,
    pending: 0,
    prayer: 0,
    testimony: 0,
    complaint: 0,
    income: 0,
    expense: 0,
  });

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

  useEffect(() => {
    if (["prayer", "testimony", "complaint"].includes(activeTab)) {
      API.get("/contact/all").then(r => {
        setContacts(r.data);
        const c = r.data;
        setCounts(prev => ({
          ...prev,
          prayer: c.filter(x => x.type === "prayer").length,
          testimony: c.filter(x => x.type === "testimony").length,
          complaint: c.filter(x => x.type === "complaint").length,
        }));
      });
    }
    if (activeTab === "pending") {
      API.get("/auth/pending").then(r => {
        setPendingMembers(r.data);
        setCounts(prev => ({ ...prev, pending: r.data.length }));
      });
    }
  }, [activeTab]);

  const handleApproveMember = async (id) => {
    try {
      await API.put(`/auth/approve-member/${id}`);
      setNotification({ open: true, type: "success", message: "Member approved" });
      const res = await API.get("/auth/pending");
      setPendingMembers(res.data);
      setCounts(prev => ({ ...prev, pending: res.data.length }));
    } catch {
      setNotification({ open: true, type: "error", message: "Approval failed" });
    }
  };

  const handleRejectMember = async (id) => {
    try {
      await API.put(`/auth/reject-member/${id}`);
      setNotification({ open: true, type: "success", message: "Member rejected" });
      const res = await API.get("/auth/pending");
      setPendingMembers(res.data);
      setCounts(prev => ({ ...prev, pending: res.data.length }));
    } catch {
      setNotification({ open: true, type: "error", message: "Rejection failed" });
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersRes, pendingRes, meetingsRes, balanceRes, bannersRes] = await Promise.all([
        API.get("/auth/members"),
        API.get("/auth/pending"),
        API.get("/attendance/meetings"),
        API.get("/finance/balance-sheet"),
        API.get("/banners/all"),
      ]);
      
      setMembers(membersRes.data);
      setCounts(prev => ({ ...prev, members: membersRes.data.length }));
      setPendingMembers(pendingRes.data);
      setCounts(prev => ({ ...prev, pending: pendingRes.data.length }));
      setMeetings(meetingsRes.data);
      setBalance(balanceRes.data);
      setBanners(bannersRes.data);

      const contactsRes = await API.get("/contact/all").catch(() => ({ data: [] }));
      setContacts(contactsRes.data);
      setCounts(prev => ({
        ...prev,
        prayer: contactsRes.data.filter(x => x.type === "prayer").length,
        testimony: contactsRes.data.filter(x => x.type === "testimony").length,
        complaint: contactsRes.data.filter(x => x.type === "complaint").length,
      }));
    } catch (error) {
      console.error("Dashboard fetch error:", error);
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

  const handleBannerUpload = async (e) => {
    e.preventDefault();
    if (!bannerImg) {
      setNotification({ open: true, type: "error", message: "Select an image" });
      return;
    }
    const fd = new FormData();
    fd.append("title", bannerTitle);
    fd.append("link", bannerLink);
    fd.append("image", bannerImg);
    fd.append("isActive", "true");
    try {
      await API.post("/banners", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setNotification({ open: true, type: "success", message: "Banner uploaded!" });
      setBannerTitle(""); setBannerLink(""); setBannerImg(null);
      fetchData();
    } catch (err) {
      setNotification({ open: true, type: "error", message: "Upload failed" });
    }
  };

  const handleDeleteBanner = async (id) => {
    setDeletingBanner(null);
    try {
      await API.delete(`/banners/${id}`);
      setNotification({ open: true, type: "success", message: "Banner deleted" });
      fetchData();
    } catch (err) {
      setNotification({ open: true, type: "error", message: "Delete failed" });
    }
  };

  const handleUpdateBanner = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("title", editingBanner.title);
    fd.append("link", editingBanner.link || "");
    fd.append("isActive", editingBanner.isActive);
    if (bannerImg) fd.append("image", bannerImg);
    try {
      await API.put(`/banners/${editingBanner._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setNotification({ open: true, type: "success", message: "Banner updated" });
      setEditingBanner(null);
      setBannerImg(null);
      fetchData();
    } catch (err) {
      setNotification({ open: true, type: "error", message: "Update failed" });
    }
  };

  const handleDeleteContact = async (id) => {
    const contact = contacts.find(c => c._id === id);
    setDeletingContact(null);
    try {
      await API.delete(`/contact/${id}`);
      setContacts(prev => prev.filter(c => c._id !== id));
      if (contact) {
        setCounts(prev => ({ ...prev, [contact.type]: Math.max(0, prev[contact.type] - 1) }));
      }
      setNotification({ open: true, type: "success", message: "Deleted" });
    } catch {
      setNotification({ open: true, type: "error", message: "Delete failed" });
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
    { id: "pending", label: "Pending Registration" },
    { id: "dues", label: "Mark Dues" },
    { id: "attendance", label: "Attendance" },
    { id: "income", label: "Income" },
    { id: "expense", label: "Expenses" },
    { id: "balance", label: "Balance Sheet" },
    { id: "banners", label: "Banners" },
    { id: "prayer", label: "Prayer" },
    { id: "testimony", label: "Testimony" },
    { id: "complaint", label: "Complaints" },
  ];

  if (loading) {
    return <OverlayLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
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
            <div className="flex items-center gap-2">
              <img src={Logo} alt="Logo" className="h-8 w-8" />
              <h1 className="text-xl md:text-2xl font-bold">Royal Youth Admin</h1>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-adminOrange text-white px-3 md:px-4 py-2 rounded hover:bg-orange-600 text-sm md:text-base"
          >
            Logout
          </button>
        </div>
      </header>

<div className="container mx-auto p-4 md:p-6">
        {activeTab ? (
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setActiveTab(null)} className="flex items-center gap-2 text-adminBlue hover:text-blue-700 font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
        ) : (
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {tabs.map((tab, i) => {
                const colors = [
                  "bg-blue-500 hover:bg-blue-600",
                  "bg-orange-500 hover:bg-orange-600",
                  "bg-emerald-500 hover:bg-emerald-600",
                  "bg-purple-500 hover:bg-purple-600",
                  "bg-rose-500 hover:bg-rose-600",
                  "bg-cyan-500 hover:bg-cyan-600",
                  "bg-amber-500 hover:bg-amber-600",
                  "bg-teal-500 hover:bg-teal-600",
                ];
                const countKey = tab.id === "pending" ? "pending" : tab.id;
                const count = counts[countKey];
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-3 py-3 rounded-lg text-white font-semibold text-sm md:text-base shadow-sm transition-all ${colors[i % colors.length]}`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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

{selectedMember && (
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
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {selectedMember.profileImage && (selectedMember.profileImage.startsWith('data:') || selectedMember.profileImage.startsWith('http')) && (
                      <img
                        src={selectedMember.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    {!selectedMember.profileImage || (!selectedMember.profileImage.startsWith('data:') && !selectedMember.profileImage.startsWith('http')) ? (
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : null}
                  </div>
                  <div>
                    <p className="font-semibold">{selectedMember.firstname} {selectedMember.surname} {selectedMember.othername}</p>
                    <p className="text-sm text-gray-500">{selectedMember.occupation || 'No occupation'}</p>
                  </div>
                </div>
<div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-semibold">Phone:</span> {selectedMember.phone}</div>
                  <div><span className="font-semibold">Email:</span> {selectedMember.email || '-'}</div>
                  <div><span className="font-semibold">DOB:</span> {selectedMember.dob ? new Date(selectedMember.dob).toLocaleDateString() : '-'}</div>
                  <div><span className="font-semibold">Age:</span> {selectedMember.dob ? calculateAge(selectedMember.dob) : '-'} years</div>
                  <div><span className="font-semibold">Address:</span> {selectedMember.address || '-'}</div>
                  <div><span className="font-semibold">Born Again:</span> {selectedMember.bornAgain}</div>
                  <div><span className="font-semibold">Status:</span> {selectedMember.membershipStatus}</div>
                  <div><span className="font-semibold">Last Login:</span> {selectedMember.lastLogin ? new Date(selectedMember.lastLogin).toLocaleDateString() : 'Never'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pending" && (
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <h2 className="text-lg md:text-xl font-bold mb-4 text-adminBlue">Pending Registrations ({pendingMembers.length})</h2>
            {pendingMembers.length === 0 ? (
              <p className="text-gray-500">No pending registrations.</p>
            ) : (
              <div className="space-y-4">
                {pendingMembers.map(m => (
                  <div key={m._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{m.firstname} {m.surname} {m.othername}</p>
                        <p className="text-sm text-gray-500">{m.phone}</p>
                        <p className="text-sm text-gray-500">{m.email}</p>
                        <p className="text-sm mt-1"><span className="font-medium">Occupation:</span> {m.occupation}</p>
                        <p className="text-sm"><span className="font-medium">Address:</span> {m.address}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveMember(m._id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">Approve</button>
                        <button onClick={() => handleRejectMember(m._id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

        {activeTab === "banners" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-adminBlue">Upload Banner</h2>
            <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm">
              <p className="font-semibold">Specifications:</p>
              <p>Size: 1200 x 400px (recommended)</p>
              <p>Formats: JPEG, PNG, WebP</p>
              <p>Max size: 5MB</p>
            </div>
            <form onSubmit={handleBannerUpload} className="space-y-4">
              <input type="text" placeholder="Banner Title" className="border p-2 w-full rounded" value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} required />
              <input type="url" placeholder="Link (optional)" className="border p-2 w-full rounded" value={bannerLink} onChange={e => setBannerLink(e.target.value)} />
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setBannerImg(e.target.files[0])} className="border p-2 w-full rounded" required />
              <button type="submit" className="bg-adminBlue text-white px-6 py-2 rounded">Upload</button>
            </form>
            <div className="mt-8">
              <h3 className="font-bold mb-4">Existing Banners ({banners.length})</h3>
              {banners.map(b => (
                <div key={b._id} className="flex items-center gap-3 p-2 border rounded mb-2">
                  <img src={b.image.startsWith("http") ? b.image : `http://localhost:5000${b.image}`} className="w-16 h-10 object-cover rounded" />
                  <span className="flex-1">{b.title}</span>
                  <button onClick={() => setEditingBanner(b)} className="text-blue-500 mr-2">Edit</button>
                  <button onClick={() => setDeletingBanner(b)} className="text-red-500">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {deletingBanner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
              <h3 className="font-bold mb-4">Confirm Delete</h3>
              <p className="mb-4">Delete "{deletingBanner.title}"?</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeletingBanner(null)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button onClick={() => handleDeleteBanner(deletingBanner._id)} className="px-4 py-2 bg-red-500 text-white rounded">Delete</button>
              </div>
            </div>
          </div>
        )}

        {editingBanner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="font-bold mb-4">Edit Banner</h3>
              <form onSubmit={handleUpdateBanner} className="space-y-3">
                <input type="text" defaultValue={editingBanner.title} onChange={e => setEditingBanner({...editingBanner, title: e.target.value})} className="border p-2 w-full rounded" required />
                <input type="url" defaultValue={editingBanner.link} onChange={e => setEditingBanner({...editingBanner, link: e.target.value})} className="border p-2 w-full rounded" placeholder="Link" />
                <label className="flex items-center gap-2"><input type="checkbox" defaultChecked={editingBanner.isActive} onChange={e => setEditingBanner({...editingBanner, isActive: e.target.checked})} /> <span>Active</span></label>
                <input type="file" accept="image/*" onChange={e => setBannerImg(e.target.files[0])} className="border p-2 w-full rounded" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingBanner(null)} className="flex-1 px-4 py-2 bg-gray-200 rounded">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-adminBlue text-white rounded">Save</button>
                </div>
              </form>
            </div>
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
              <div className="bg-adminOrange p-4 rounded-lg">
                <p className="text-gray-600 text-sm md:text-base">Final Balance</p>
                <p className="text-xl md:text-2xl font-bold text-black">N{balance.balance}</p>
              </div>
            </div>
          </div>
        )}

        {["prayer", "testimony", "complaint"].includes(activeTab) && (
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold text-adminBlue">
                {activeTab === "prayer" ? "Prayer Requests" : activeTab === "testimony" ? "Testimonies" : "Complaints & Suggestions"}
              </h2>
              <button onClick={() => { API.get("/contact/all").then(r => setContacts(r.data)); }} className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">Refresh</button>
            </div>
            <div className="space-y-3">
              {contacts.filter(c => c.type === activeTab).length === 0 ? (
                <p className="text-gray-500">No submissions yet.</p>
              ) : (
                contacts.filter(c => c.type === activeTab).map(c => (
                  <div key={c._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        {c.phone && <p className="text-sm text-gray-500">{c.phone}</p>}
                        {c.email && <p className="text-sm text-gray-500">{c.email}</p>}
                        <p className="mt-2 text-gray-700">{c.message}</p>
                        <p className="text-xs text-gray-400 mt-2">{new Date(c.createdAt).toLocaleString()}</p>
                      </div>
                      <button onClick={() => setDeletingContact(c)} className="text-red-500 hover:text-red-700 ml-4">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {deletingContact && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
              <h3 className="font-bold mb-4">Confirm Delete</h3>
              <p className="mb-4">Delete this submission?</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeletingContact(null)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button onClick={() => handleDeleteContact(deletingContact._id)} className="px-4 py-2 bg-red-500 text-white rounded">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <footer className="fixed bottom-0 left-0 right-0 bg-adminBlue text-white text-center py-3 text-sm z-40">
        <p>Royal Youth Portal Admin Dashboard</p>
        <p className="text-blue-200 mt-1">2026 All Rights Reserved</p>
      </footer>
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