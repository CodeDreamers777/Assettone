import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LandingPage } from "./components/LandingPage";
import { Dashboard } from "./components/Dashboard";
import AuthScreen from "./components/Authscreen";
import BookADemo from "./components/BookADemo";
import AboutUs from "./components/AbousUs";
import ContactUs from "./components/ContactUs";
import ProfilePage from "./components/Profile";
import { UnitsPage } from "./components/UnitPage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setIsAuthenticated(false);
  };

  const NavLink = ({
    to,
    children,
    className = "",
    activeClassName = "border-primary text-primary",
  }) => {
    return (
      <Link
        to={to}
        className={`
          relative 
          px-3 py-2 
          text-sm font-medium text-gray-700 
          transition-all duration-300 ease-in-out
          group
          ${className}
        `}
      >
        <span
          className={`
            absolute inset-x-0 bottom-0 h-0.5 
            bg-primary 
            scale-x-0 
            group-hover:scale-x-100 
            transition-transform duration-300 ease-in-out
          `}
        />
        {children}
      </Link>
    );
  };

  return (
    <Router>
      <div className="min-h-screen bg-white">
        {/* Desktop Navbar */}
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link
                  to="/"
                  className="
                    text-2xl font-bold text-primary 
                    hover:text-primary-600 
                    transition-colors 
                    duration-300
                  "
                >
                  Assettone
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <div className="sm:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="
                    text-gray-600 
                    hover:text-primary 
                    focus:outline-none 
                    focus:ring-2 
                    focus:ring-primary 
                    rounded-md 
                    p-2 
                    transition-colors 
                    duration-300
                  "
                >
                  {isMenuOpen ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Desktop Navigation Links */}
              <div className="hidden sm:flex sm:items-center sm:space-x-4">
                <NavLink to="/">Home</NavLink>
                <NavLink to="/about-us">About Us</NavLink>
                <NavLink to="/contact-us">Contact Us</NavLink>

                {isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      className="
                        border-primary 
                        text-primary 
                        hover:bg-primary/10 
                        transition-colors 
                        duration-300
                      "
                      asChild
                    >
                      <Link to="/dashboard">Dashboard</Link>
                    </Button>
                    <Button
                      variant="destructive"
                      className="
                        hover:bg-red-600 
                        transition-colors 
                        duration-300
                      "
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="
                      bg-primary 
                      hover:bg-primary-600 
                      transition-colors 
                      duration-300
                    "
                    asChild
                  >
                    <Link to="/login">Login / Sign Up</Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
              <div className="sm:hidden">
                <div className="px-2 pt-2 pb-3 space-y-1">
                  <NavLink
                    to="/"
                    className="
                      block 
                      px-3 py-2 
                      rounded-md 
                      hover:bg-gray-100
                    "
                  >
                    Home
                  </NavLink>
                  <NavLink
                    to="/about-us"
                    className="
                      block 
                      px-3 py-2 
                      rounded-md 
                      hover:bg-gray-100
                    "
                  >
                    About Us
                  </NavLink>
                  <NavLink
                    to="/contact-us"
                    className="
                      block 
                      px-3 py-2 
                      rounded-md 
                      hover:bg-gray-100
                    "
                  >
                    Contact Us
                  </NavLink>

                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <Link
                        to="/dashboard"
                        className="
                          block 
                          px-3 py-2 
                          rounded-md 
                          bg-primary/10 
                          text-primary 
                          hover:bg-primary/20
                        "
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="
                          w-full 
                          text-left 
                          px-3 py-2 
                          rounded-md 
                          text-red-600 
                          hover:bg-red-50
                        "
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      className="
                        block 
                        px-3 py-2 
                        rounded-md 
                        bg-primary 
                        text-white 
                        hover:bg-primary-600
                      "
                    >
                      Login / Sign Up
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Routes remain the same */}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/book-demo" element={<BookADemo />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route
            path="/profile"
            element={
              isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/dashboard/*"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <AuthScreen onLoginSuccess={() => setIsAuthenticated(true)} />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
