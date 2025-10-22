import { Link } from "react-router-dom";


export default function Landing() {
const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100vw",           // use viewport width instead of the incorrect 100vh
        overflowX: "hidden",     // avoid horizontal scroll when using 100vw
        boxSizing: "border-box",
        background: "linear-gradient(135deg, #4f46e5, #9333ea)",
        color: "white",
        fontFamily: "'Segoe UI', sans-serif",
    },
    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 6%",      // use percentage padding so it stays responsive
        background: "rgba(0, 0, 0, 0.2)",
        position: "sticky",
        top: 0,
    },
    logo: {
        fontSize: "1.8rem",
        fontWeight: "bold",
        letterSpacing: "1px",
    },
    navLinks: {
        display: "flex",
        gap: "20px",
    },
    link: {
        color: "white",
        textDecoration: "none",
        fontWeight: "500",
        fontSize: "1rem",
        transition: "opacity 0.2s",
    },
    hero: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "40px 20px",
    },
    title: {
        fontSize: "3.5rem",
        fontWeight: "800",
        marginBottom: "20px",
        textShadow: "2px 2px 8px rgba(0,0,0,0.3)",
    },
    subtitle: {
        fontSize: "1.3rem",
        maxWidth: "600px",
        lineHeight: "1.6",
        color: "#f3f3f3",
        marginBottom: "40px",
    },
    buttons: {
        display: "flex",
        gap: "20px",
    },
    btn: {
        textDecoration: "none",
        padding: "14px 36px",
        borderRadius: "8px",
        fontWeight: "600",
        transition: "all 0.3s ease",
        fontSize: "1rem",
    },
    primary: {
        backgroundColor: "white",
        color: "#4f46e5",
    },
    secondary: {
        border: "2px solid white",
        color: "white",
    },
    footer: {
        textAlign: "center",
        padding: "15px 0",
        background: "rgba(0, 0, 0, 0.2)",
        fontSize: "0.9rem",
    },
};

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <header style={styles.navbar}>
        <h1 style={styles.logo}>Collab Project</h1>
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
            to="/signup"
            style={styles.link}
            onMouseOver={(e) => (e.target.style.opacity = "0.7")}
            onMouseOut={(e) => (e.target.style.opacity = "1")}
          >
            Sign Up
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main style={styles.hero}>
        <h2 style={styles.title}>Collaborate. Create. Connect.</h2>
        <p style={styles.subtitle}>
          Build amazing things together — share ideas, organize projects, and boost productivity in one platform designed for teamwork.
        </p>
        <div style={styles.buttons}>
          <Link
            to="/signup"
            style={{ ...styles.btn, ...styles.primary }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#f4f4f4")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "white")}
          >
            Get Started
          </Link>
          <Link
            to="/login"
            style={{ ...styles.btn, ...styles.secondary }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.color = "#4f46e5";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "white";
            }}
          >
            Log In
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
