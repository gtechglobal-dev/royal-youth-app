import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { PageLoader } from "./components/Loaders";
import { LiveProvider } from "./contexts/LiveContext";
import { connectSocket } from "./services/socket";

const InstallPrompt = lazy(() => import("./components/InstallPrompt"));
const PushNotificationManager = lazy(() => import("./components/PushNotificationManager"));
const LiveNotification = lazy(() => import("./components/LiveNotification"));
const CallRoom = lazy(() => import("./components/CallRoom"));
const IncomingCall = lazy(() => import("./components/IncomingCall"));

const LandingPage = lazy(() => import("./pages/landingPage"));
const Register = lazy(() => import("./pages/Register"));
const RegistrationSuccess = lazy(() => import("./pages/RegistrationSuccess"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const MemberDashboard = lazy(() => import("./pages/MemberDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Members = lazy(() => import("./pages/Members"));
const MemberProfile = lazy(() => import("./pages/MemberProfile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const CommunityFeed = lazy(() => import("./pages/CommunityFeed"));
const DirectMessages = lazy(() => import("./pages/DirectMessages"));
const SinglePost = lazy(() => import("./pages/SinglePost"));
const LiveRoomPage = lazy(() => import("./pages/LiveRoomPage"));

function App() {
  useEffect(() => {
    if (localStorage.getItem("token")) {
      connectSocket();
    }
  }, []);

  return (
    <BrowserRouter>
      <LiveProvider>
        <Suspense fallback={<PageLoader />}>
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
            <Route path="/post/:id" element={<SinglePost />} />
            <Route path="/live/:sessionId" element={<LiveRoomPage />} />
          </Routes>
        </Suspense>
      <Suspense fallback={null}>
        <InstallPrompt />
        <PushNotificationManager />
        <LiveNotification />
        <CallRoom />
        <IncomingCall />
      </Suspense>
      </LiveProvider>
    </BrowserRouter>
  );
}

export default App;
