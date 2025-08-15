"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { Auction } from "../types";

export default function Home() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchAuctions();
    // Set up polling for real-time updates
    const interval = setInterval(fetchAuctions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAuctions = async () => {
    try {
      const response = await fetch("/api/auctions?status=active");
      const data = await response.json();
      if (response.ok) {
        setAuctions(data.auctions);
      }
    } catch (error) {
      console.error("Error fetching auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeLeft = (endTime: string) => {
    const now = new Date().getTime();
    const end = new Date(
      endTime + (endTime.includes("Z") ? "" : "Z")
    ).getTime();
    const difference = end - now;

    if (difference <= 0) {
      return "Auction ended";
    }

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  if (loading) {
    return <div className="text-center">Loading auctions...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Active Auctions</h1>
        {user && (
          <Link
            href="/create-auction"
            className="bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors"
          >
            Create New Auction
          </Link>
        )}
      </div>

      {!user && (
        <div className="bg-gray-100 border border-gray-300 p-4 mb-8">
          <p className="text-center">
            <Link href="/login" className="underline hover:no-underline">
              Login
            </Link>{" "}
            or{" "}
            <Link href="/register" className="underline hover:no-underline">
              Register
            </Link>{" "}
            to create auctions and place bids.
          </p>
        </div>
      )}

      {auctions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No active auctions found.</p>
          {user && (
            <Link
              href="/create-auction"
              className="bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors"
            >
              Create the first auction
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <div key={auction.id} className="border border-gray-300 p-4">
              <h3 className="font-semibold text-lg mb-2">{auction.title}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {auction.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm">Starting price:</span>
                  <span className="font-medium">${auction.starting_price}</span>
                </div>

                {auction.current_highest_bid ? (
                  <div className="flex justify-between">
                    <span className="text-sm">Current bid:</span>
                    <span className="font-bold text-green-600">
                      ${auction.current_highest_bid}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-sm">No bids yet</span>
                    <span className="text-gray-500">-</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-sm">Time left:</span>
                  <span className="text-sm font-medium">
                    {formatTimeLeft(auction.end_time)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm">Seller:</span>
                  <span className="text-sm">{auction.seller?.name}</span>
                </div>
              </div>

              <Link
                href={`/auction/${auction.id}`}
                className="block w-full text-center bg-black text-white py-2 hover:bg-gray-800 transition-colors"
              >
                View Details & Bid
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
