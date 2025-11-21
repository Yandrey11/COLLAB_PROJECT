import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function AdminSidebar() {
  const navigate = useNavigate();

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
  ];

  return (
    <aside
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
        height: "fit-content",
      }}
    >
      <h2 style={{ margin: 0, color: "#4f46e5" }}>Admin Panel</h2>
      <p style={{ color: "#6b7280", fontSize: 13, marginTop: 8 }}>
        Manage users, view analytics, monitor system activity, and configure settings.
      </p>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #eef2ff",
              background: "linear-gradient(90deg,#eef2ff,#fff)",
              cursor: "pointer",
              textAlign: "left",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {item.label}
          </button>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            onClick={handleLogout}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              background: "#ef4444",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
