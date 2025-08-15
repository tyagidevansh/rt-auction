"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";

export default function Header() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="border-b border-gray-300 text-gray-900 bg-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          RTAuction
        </Link>

        <nav className="hidden sm:flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm">Welcome, {user.name}</span>
              <Link
                href="/create-auction"
                className="px-3 py-1 border border-black hover:bg-black hover:text-white transition-colors"
              >
                Create Auction
              </Link>
              <Link
                href="/my-auctions"
                className="px-3 py-1 border border-black hover:bg-black hover:text-white transition-colors"
              >
                My Auctions
              </Link>
              <Link
                href="/notifications"
                className="px-3 py-1 border border-black hover:bg-black hover:text-white transition-colors relative"
              >
                Notifications
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <button
                onClick={logout}
                className="px-3 py-1 bg-black text-white hover:bg-gray-800 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1 border border-black hover:bg-black hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-3 py-1 bg-black text-white hover:bg-gray-800 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </nav>

        <button
          onClick={toggleMenu}
          className="sm:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1"
          aria-label="Toggle menu"
        >
          <span
            className={`block w-6 h-0.5 bg-black transition-transform ${
              isMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          ></span>
          <span
            className={`block w-6 h-0.5 bg-black transition-opacity ${
              isMenuOpen ? "opacity-0" : ""
            }`}
          ></span>
          <span
            className={`block w-6 h-0.5 bg-black transition-transform ${
              isMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          ></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="sm:hidden border-t border-gray-300 bg-white">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            {user ? (
              <>
                <div className="text-sm text-gray-600 pb-2 border-b border-gray-200">
                  Welcome, {user.name}
                </div>
                <Link
                  href="/create-auction"
                  className="block w-full text-left px-3 py-2 border border-black hover:bg-black hover:text-white transition-colors"
                  onClick={closeMenu}
                >
                  Create Auction
                </Link>
                <Link
                  href="/my-auctions"
                  className="block w-full text-left px-3 py-2 border border-black hover:bg-black hover:text-white transition-colors"
                  onClick={closeMenu}
                >
                  My Auctions
                </Link>
                <Link
                  href="/notifications"
                  className="block w-full text-left px-3 py-2 border border-black hover:bg-black hover:text-white transition-colors relative"
                  onClick={closeMenu}
                >
                  Notifications
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="block w-full text-left px-3 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block w-full text-left px-3 py-2 border border-black hover:bg-black hover:text-white transition-colors"
                  onClick={closeMenu}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block w-full text-left px-3 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
                  onClick={closeMenu}
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
