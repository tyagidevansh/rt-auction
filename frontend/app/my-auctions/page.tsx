"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { API_ENDPOINTS } from "../../lib/api";
import { Auction } from "../../types";
import Link from "next/link";

export default function MyAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMyAuctions();
    }
  }, [user]);

  const fetchMyAuctions = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.AUCTIONS}?status=all`);
      const data = await response.json();
      if (response.ok) {
        // Filter to only show user's auctions
        const myAuctions = data.auctions.filter(
          (auction: Auction) => auction.seller_id === user.id
        );
        setAuctions(myAuctions);
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
      return "Ended";
    }

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  if (!user) {
    return (
      <div className="text-center">
        <p>You must be logged in to view your auctions.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center">Loading your auctions...</div>;
  }

  const filteredAuctions = auctions.filter((auction) => {
    if (filter === "all") return true;
    return auction.status === filter;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Auctions ({auctions.length})</h1>
        <Link
          href="/create-auction"
          className="bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors"
        >
          Create New Auction
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "active", label: "Active" },
          { key: "ended", label: "Ended" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === key
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label} (
            {auctions.filter((a) => key === "all" || a.status === key).length})
          </button>
        ))}
      </div>

      {filteredAuctions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            No auctions found for this filter.
          </p>
          <Link
            href="/create-auction"
            className="bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors"
          >
            Create Your First Auction
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map((auction) => {
            const isEnded =
              new Date(
                auction.end_time + (auction.end_time.includes("Z") ? "" : "Z")
              ) <= new Date();
            const needsAction =
              isEnded &&
              auction.current_highest_bid &&
              auction.seller_accepted === null;

            return (
              <div
                key={auction.id}
                className="border border-gray-300 p-4 relative"
              >
                {needsAction && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    Action Required
                  </div>
                )}

                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{auction.title}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      auction.status === "active"
                        ? "bg-green-100 text-green-800"
                        : auction.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {auction.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {auction.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Starting price:</span>
                    <span className="font-medium">
                      ${auction.starting_price}
                    </span>
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
                    <span className="text-sm">Status:</span>
                    <span className="text-sm font-medium">
                      {auction.status === "pending"
                        ? "Starts " +
                          new Date(
                            auction.start_time +
                              (auction.start_time.includes("Z") ? "" : "Z")
                          ).toLocaleString()
                        : auction.status === "active"
                        ? formatTimeLeft(auction.end_time)
                        : "Ended"}
                    </span>
                  </div>
                </div>

                {/* Bid Status for Ended Auctions */}
                {isEnded && auction.current_highest_bid && (
                  <div className="mb-4 text-sm">
                    {auction.seller_accepted === null ? (
                      <div className="text-orange-600 font-medium">
                        ⚠️ Awaiting your decision on final bid
                      </div>
                    ) : auction.seller_accepted ? (
                      <div className="text-green-600 font-medium">
                        ✓ Final bid accepted
                      </div>
                    ) : (
                      <div className="text-red-600 font-medium">
                        ✗ Final bid rejected
                      </div>
                    )}
                  </div>
                )}

                <Link
                  href={`/auction/${auction.id}`}
                  className="block w-full text-center bg-black text-white py-2 hover:bg-gray-800 transition-colors"
                >
                  {needsAction ? "Review & Decide" : "View Details"}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
