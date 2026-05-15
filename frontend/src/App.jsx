import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/landingPage";
import Register from "./pages/Register";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import AdminLogin from "./pages/AdminLogin";
import MemberDashboard from "./pages/MemberDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Members from "./pages/Members";
import MemberProfile from "./pages/MemberProfile";
import EditProfile from "./pages/EditProfile";
import CommunityFeed from "./pages/CommunityFeed";
import DirectMessages from "./pages/DirectMessages";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registration-success" element={<RegistrationSuccess />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/dashboard" element={<MemberDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/member/:id" element={<MemberProfile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/community" element={<CommunityFeed />} />
        <Route path="/messages" element={<DirectMessages />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
