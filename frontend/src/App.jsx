import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SetPassword from "./pages/SetPassword";
import Dashboard from "./pages/Dashboard";


import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminSignup from "./pages/Admin/AdminSignup";
import UserManagement from "./pages/Admin/UserManagement";
import AdminNotificationCenter from "./pages/Admin/NotificationCenter";
import AdminRecordManagement from "./pages/Admin/AdminRecordManagement";
import AdminProfilePage from "./pages/Admin/AdminProfilePage";
import AdminSettingsPage from "./pages/Admin/AdminSettingsPage";

import RecordsPage from "./pages/RecordsPage";
import ReportsPage from "./pages/ReportsPage";
import NotificationCenter from "./pages/NotificationCenter";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import RouteLoadingBar from "./components/RouteLoadingBar";
import "./App.css";

function App() {
  return (
    <Router>
      <RouteLoadingBar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/notifications" element={<NotificationCenter />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />


        {/* ✅ Admin routes */}
        <Route path="/AdminLogin" element={<AdminLogin />} />
        <Route path="/adminsignup" element={<AdminSignup />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/notifications" element={<AdminNotificationCenter />} />
        <Route path="/admin/records" element={<AdminRecordManagement />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
