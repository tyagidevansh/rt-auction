"use client";

import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-gray-300 text-gray-900 bg-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          RTAuction
        </Link>

        <nav className="flex items-center space-x-4">
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
                className="px-3 py-1 border border-black hover:bg-black hover:text-white transition-colors"
              >
                Notifications
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
      </div>
    </header>
  );
}
