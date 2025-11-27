import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function Landing() {
  useDocumentTitle("Home");
  return (
    <div className="min-h-screen w-full flex flex-col overflow-x-hidden bg-gradient-to-br from-indigo-50 to-indigo-100 font-sans text-gray-900">
      {/* Navbar */}
      <header className="flex justify-between items-center px-6 py-5 bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <h1 className="text-2xl font-bold tracking-wide text-indigo-600">Guidance</h1>
        <nav className="flex gap-6 items-center">
          <Link
            to="/login"
            className="text-indigo-600 font-semibold hover:text-indigo-500 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="text-indigo-600 font-semibold hover:text-indigo-500 transition-colors"
          >
            Sign Up
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center text-center px-4 py-10 max-w-5xl mx-auto w-full">
        <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
          Guidance Counsel Record System.
        </h2>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl leading-relaxed mb-10">
          You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/login"
            className="px-8 py-3 rounded-full font-semibold transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center justify-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-indigo-500/30"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 rounded-full font-semibold transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center justify-center bg-white text-indigo-600 border border-indigo-100 hover:border-indigo-200"
          >
            Log In
          </Link>
          <Link
            to="/adminlogin"
            className="px-8 py-3 rounded-full font-semibold transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center justify-center bg-white text-indigo-600 border border-indigo-100 hover:border-indigo-200"
          >
            Admin Login
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-500">
        © {new Date().getFullYear()} Collab Project. All rights reserved.
      </footer>
    </div>
  );
}
