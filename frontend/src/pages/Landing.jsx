import { Link } from "react-router-dom";

export default function Landing() {
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      width: "100vw",
      overflowX: "hidden",
      boxSizing: "border-box",
      background: "linear-gradient(135deg, #eef2ff, #c7d2fe)",
      color: "#111827",
      fontFamily: "'Montserrat', sans-serif",
    },
    navbar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 6%",
      background: "rgba(255, 255, 255, 0.9)",
      borderBottom: "1px solid rgba(226,232,240,0.8)",
      position: "sticky",
      top: 0,
      zIndex: 10,
    },
    logo: {
      fontSize: "1.8rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      color: "#4f46e5",
    },
    navLinks: {
      display: "flex",
      gap: "16px",
      alignItems: "center",
    },
    link: {
      color: "#4f46e5",
      textDecoration: "none",
      fontWeight: 600,
      fontSize: "0.95rem",
      transition: "opacity 0.2s, color 0.2s",
    },
    hero: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      padding: "40px 16px",
      maxWidth: "960px",
      margin: "0 auto",
    },
    title: {
      fontSize: "clamp(2.4rem, 4.5vw, 3.5rem)",
      fontWeight: 800,
      marginBottom: "20px",
      color: "#111827",
    },
    subtitle: {
      fontSize: "clamp(1rem, 2.2vw, 1.25rem)",
      maxWidth: "640px",
      lineHeight: 1.6,
      color: "#6b7280",
      marginBottom: "32px",
    },
    buttons: {
      display: "flex",
      gap: "16px",
      flexWrap: "wrap",
      justifyContent: "center",
    },
    btn: {
      textDecoration: "none",
      padding: "12px 30px",
      borderRadius: "999px",
      fontWeight: 600,
      transition: "transform 0.15s ease, box-shadow 0.15s ease, background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease",
      fontSize: "0.95rem",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 12px 30px rgba(79, 70, 229, 0.25)",
      border: "none",
    },
    primary: {
      background: "linear-gradient(120deg,#4f46e5,#7c3aed)",
      color: "#ffffff",
    },
    secondary: {
      background: "#ffffff",
      color: "#4f46e5",
      border: "1px solid #dbeafe",
      boxShadow: "0 6px 18px rgba(148,163,184,0.35)",
    },
    footer: {
      textAlign: "center",
      padding: "16px 0",
      fontSize: "0.85rem",
      color: "#6b7280",
    },
  };

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <header style={styles.navbar}>
        <h1 style={styles.logo}>Guidance</h1>
        <nav style={styles.navLinks}>
          <Link
            to="/login"
            style={styles.link}
            onMouseOver={(e) => (e.target.style.opacity = "0.7")}
            onMouseOut={(e) => (e.target.style.opacity = "1")}
          >
            Login
          </Link>
          <Link
            to="/Signup"
            style={styles.link}
            onMouseOver={(e) => (e.target.style.opacity = "0.7")}
            onMouseOut={(e) => (e.target.style.opacity = "1")}
          >
            Sign Up
          </Link>
        </nav>
      </header>

  
        <main style={styles.hero}>
          <h2 style={styles.title}>Guidance Counsel Record System.</h2>
          <p style={styles.subtitle}>
            You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.
          </p>
          <div style={styles.buttons}>
            <Link
              to="/Login"
              style={{ ...styles.btn, ...styles.primary }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 18px 40px rgba(79, 70, 229, 0.35)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 12px 30px rgba(79, 70, 229, 0.25)";
              }}
            >
              Get Started
            </Link>
            <Link
              to="/login"
              style={{ ...styles.btn, ...styles.secondary }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 16px 32px rgba(148,163,184,0.45)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 6px 18px rgba(148,163,184,0.35)";
              }}
            >
              Log In
            </Link>
            <Link
              to="/adminlogin"
              style={{ ...styles.btn, ...styles.secondary }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 16px 32px rgba(148,163,184,0.45)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 6px 18px rgba(148,163,184,0.35)";
              }}
            >
              Admin Login
            </Link>
          </div>
        </main>

        {/* Footer */}
      <footer style={styles.footer}>
        © {new Date().getFullYear()} Collab Project. All rights reserved.
      </footer>
    </div>
  );
}
