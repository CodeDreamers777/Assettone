import React, { useState, useEffect, createContext } from "react";
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
import { Toaster } from "./components/ui/toaster";
import LeaseSigning from "./components/SignLease";

import companyLogo from "../src/assets/Assettone Estates Logo transparent (2).png";
// AuthContext with proper typing
interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  logout: () => void;
}
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  logout: () => {},
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token); // Simplified logic
  }, []);

  const logout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
  };

  // NavLink Props Interface
  interface NavLinkProps {
    to: string;
    children: React.ReactNode;
    className?: string;
    activeClassName?: string;
  }

  const NavLink: React.FC<NavLinkProps> = ({
    to,
    children,
    className = "",
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
    <AuthContext.Provider
      value={{ isAuthenticated, setIsAuthenticated, logout }}
    >
      <Router>
        <div className="min-h-screen bg-white dark:bg-gray-900">
          {/* Only show navbar when user is not authenticated */}
          {!isAuthenticated && (
            <nav className="bg-white dark:bg-gray-800 shadow-lg">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                  {/* Logo */}
                  <div className="flex-shrink-0 flex items-center">
                    <Link
                      to="/"
                      className="
      flex items-center
      hover:opacity-80 
      transition-opacity 
      duration-300
    "
                    >
                      <img
                        src={companyLogo}
                        alt="Assettone Logo"
                        className="h-20 md:h-32 lg:h-48 w-auto object-contain"
                      />
                    </Link>
                  </div>

                  {/* Mobile Menu Button */}
                  <div className="sm:hidden">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="
                        text-gray-600 dark:text-white 
                        hover:text-[#38b000] 
                        focus:outline-none 
                        focus:ring-2 
                        focus:ring-[#38b000] 
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
                    <Button
                      className="
                        bg-[#38b000]
                        hover:bg-[#2d9d00] 
                        transition-colors 
                        duration-300
                      "
                      asChild
                    >
                      <Link to="/login">Login / Sign Up</Link>
                    </Button>
                  </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                  <div className="sm:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                      <Link
                        to="/"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#38b000] hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Home
                      </Link>
                      <Link
                        to="/about-us"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#38b000] hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        About Us
                      </Link>
                      <Link
                        to="/contact-us"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#38b000] hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Contact Us
                      </Link>
                      <div className="px-3 py-2">
                        <Button
                          className="w-full bg-[#38b000] hover:bg-[#2d9d00] transition-colors duration-300"
                          asChild
                        >
                          <Link
                            to="/login"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Login / Sign Up
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          )}

          <Toaster />

          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />
              }
            />
            <Route
              path="/book-demo"
              element={
                isAuthenticated ? <Navigate to="/dashboard" /> : <BookADemo />
              }
            />

            <Route
              path="/about-us"
              element={
                isAuthenticated ? <Navigate to="/dashboard" /> : <AboutUs />
              }
            />
            <Route path="/lease-signing" element={<LeaseSigning />} />
            <Route
              path="/contact-us"
              element={
                isAuthenticated ? <Navigate to="/dashboard" /> : <ContactUs />
              }
            />
            <Route
              path="/dashboard/*"
              element={
                isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
              }
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
    </AuthContext.Provider>
  );
}

export default App;
