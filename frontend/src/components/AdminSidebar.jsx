import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { initializeTheme } from "../utils/themeUtils";

export default function AdminSidebar() {
  const navigate = useNavigate();

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, []);

  const handleLogout = useCallback(async () => {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to log out?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, log out",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      localStorage.removeItem("adminToken");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const navItems = [
    { label: "Dashboard", action: () => navigate("/AdminDashboard") },
    { label: "User Management", action: () => navigate("/admin/users") },
    { label: "Notification Center", action: () => navigate("/admin/notifications") },
    { label: "Record Management", action: () => navigate("/admin/records") },
    {
      label: "Reports",
      action: () => {
        navigate("/AdminDashboard");
        setTimeout(() => {
          const el = document.getElementById("reports-section");
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }, 300);
      },
    },
    { label: "Profile", action: () => navigate("/admin/profile") },
  ];

  return (
    <aside className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm h-fit sticky top-10 self-start w-full max-w-[360px]">
      <h2 className="m-0 text-indigo-600 dark:text-indigo-400 text-lg font-bold">Admin Panel</h2>
      <p className="text-gray-600 dark:text-gray-400 text-xs mt-2">
        Manage users, view analytics, monitor system activity, and configure settings.
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className="px-3 py-2.5 rounded-lg border border-indigo-50 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-white dark:from-gray-700 dark:to-gray-800 cursor-pointer text-left font-semibold text-gray-900 dark:text-gray-100 hover:from-indigo-100 hover:to-white dark:hover:from-gray-600 dark:hover:to-gray-700 transition-colors"
          >
            {item.label}
          </button>
        ))}

        <div className="flex gap-2 mt-2.5">
          <button
            onClick={handleLogout}
            className="flex-1 px-3 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white border-none cursor-pointer font-semibold transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
