"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { API_ENDPOINTS } from "../../../lib/api";
import { Auction, Bid } from "../../../types";
import { useSocket } from "../../../hooks/useSocket";

export default function AuctionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [error, setError] = useState("");
  const [auctionId, setAuctionId] = useState<string>("");
  const { user } = useAuth();
  const { joinAuction, leaveAuction, onAuctionUpdate, offAuctionUpdate } =
    useSocket();

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setAuctionId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (!auctionId) return;

    fetchAuctionData();

    joinAuction(auctionId);

    const handleAuctionUpdate = (data: {
      auction?: Auction;
      bids?: Bid[];
      newBid?: Bid;
      statusChanged?: boolean;
    }) => {
      console.log("Real-time update received:", data);

      if (data.auction) {
        setAuction(data.auction);
      }

      if (data.bids) {
        setBids(data.bids);
      }
    };

    onAuctionUpdate(handleAuctionUpdate);

    //timer for countdown updates (this doesn't fetch data, just forces re-render)
    const timerInterval = setInterval(() => {
      setAuction((prev) => (prev ? { ...prev } : null));
    }, 1000);

    // Cleanup
    return () => {
      leaveAuction(auctionId);
      offAuctionUpdate(handleAuctionUpdate);
      clearInterval(timerInterval);
    };
  }, [auctionId]);


  const fetchAuctionData = async () => {
    if (!auctionId) return;

    try {
      const [auctionResponse, bidsResponse] = await Promise.all([
        fetch(API_ENDPOINTS.AUCTION(auctionId)),
        fetch(API_ENDPOINTS.AUCTION_BIDS(auctionId)),
      ]);

      if (auctionResponse.ok) {
        const auctionData = await auctionResponse.json();
        setAuction(auctionData.auction);
      }

      if (bidsResponse.ok) {
        const bidsData = await bidsResponse.json();
        setBids(bidsData.bids);
      }
    } catch (error) {
      console.error("Error fetching auction data:", error);
    } finally {
      setLoading(false);
    }
  };

  const placeBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auction || !auctionId) return;

    setBidLoading(true);
    setError("");

    try {
      const response = await fetch(API_ENDPOINTS.AUCTION_BIDS(auctionId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bidder_id: user.id,
          amount: parseFloat(bidAmount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to place bid");
        return;
      }

      setBidAmount("");
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setBidLoading(false);
    }
  };

  const handleAcceptReject = async (accept: boolean) => {
    if (!auction || !auctionId) return;

    try {
      const response = await fetch(API_ENDPOINTS.AUCTION(auctionId), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seller_accepted: accept,
        }),
      });

      if (response.ok) {
        // no need to manually refresh
      }
    } catch (error) {
      console.error("Error updating auction:", error);
    }
  };

  const formatTimeLeft = (endTime: string) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const difference = end - now;

    if (difference <= 0) {
      return "Auction ended";
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m left`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s left`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s left`;
    }
    return `${seconds}s left`;
  };

  const getAuctionStatus = () => {
    if (!auction) return "Loading...";

    const now = new Date();
    const startTime = new Date(
      auction.start_time + (auction.start_time.includes("Z") ? "" : "Z")
    );
    const endTime = new Date(
      auction.end_time + (auction.end_time.includes("Z") ? "" : "Z")
    );

    // console.log("Debug times:", {
    //   now: now.toISOString(),
    //   nowLocal: now.toLocaleString(),
    //   rawStartTime: auction.start_time,
    //   startTime: startTime.toISOString(),
    //   startTimeLocal: startTime.toLocaleString(),
    //   rawEndTime: auction.end_time,
    //   endTime: endTime.toISOString(),
    //   endTimeLocal: endTime.toLocaleString(),
    //   nowVsStart: now.getTime() - startTime.getTime(),
    //   nowVsEnd: now.getTime() - endTime.getTime(),
    // });

    if (now < startTime) {
      return `Auction starts at ${startTime.toLocaleString()}`;
    } else if (now >= startTime && now < endTime) {
      return formatTimeLeft(
        auction.end_time + (auction.end_time.includes("Z") ? "" : "Z")
      );
    } else {
      return "Auction Ended";
    }
  };

  if (loading) {
    return <div className="text-center">Loading auction details...</div>;
  }

  if (!auction) {
    return <div className="text-center">Auction not found.</div>;
  }

  const now = new Date();
  const isAuctionEnded =
    new Date(auction.end_time + (auction.end_time.includes("Z") ? "" : "Z")) <=
    now;
  const isAuctionStarted =
    new Date(
      auction.start_time + (auction.start_time.includes("Z") ? "" : "Z")
    ) <= now;
  const isUserSeller = user?.id === auction.seller_id;
  const minimumBid = auction.current_highest_bid
    ? auction.current_highest_bid + auction.bid_increment
    : auction.starting_price;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">{auction.title}</h1>

          <div className="space-y-4 mb-6">
            <div className="border-l-4 border-black pl-4">
              <p className="text-sm text-gray-600">Current Status</p>
              <p className="text-lg font-semibold">{getAuctionStatus()}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Starting Price</p>
                <p className="text-lg font-medium">${auction.starting_price}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bid Increment</p>
                <p className="text-lg font-medium">${auction.bid_increment}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">Current Highest Bid</p>
              <p className="text-2xl font-bold text-green-600">
                {auction.current_highest_bid
                  ? `$${auction.current_highest_bid}`
                  : "No bids yet"}
              </p>
              {auction.highest_bidder && (
                <p className="text-sm text-gray-600">
                  by {auction.highest_bidder.name}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-600">Seller</p>
              <p className="text-lg">{auction.seller?.name}</p>
            </div>
          </div>

          {auction.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {auction.description}
              </p>
            </div>
          )}

          {isUserSeller &&
            isAuctionEnded &&
            auction.current_highest_bid &&
            auction.seller_accepted === null && (
              <div className="border border-gray-300 p-4 mb-6">
                <h3 className="font-semibold mb-2">
                  Accept or Reject Final Bid
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Final bid: ${auction.current_highest_bid} by{" "}
                  {auction.highest_bidder?.name}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptReject(true)}
                    className="bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors"
                  >
                    Accept Bid
                  </button>
                  <button
                    onClick={() => handleAcceptReject(false)}
                    className="bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition-colors"
                  >
                    Reject Bid
                  </button>
                </div>
              </div>
            )}

          {isAuctionEnded && auction.seller_accepted !== null && (
            <div
              className={`border p-4 mb-6 ${
                auction.seller_accepted
                  ? "border-green-500 bg-green-50"
                  : "border-red-500 bg-red-50"
              }`}
            >
              <p className="font-semibold">
                {auction.seller_accepted ? "✓ Bid Accepted" : "✗ Bid Rejected"}
              </p>
              <p className="text-sm">
                {auction.seller_accepted
                  ? `The seller has accepted the final bid of $${auction.current_highest_bid}`
                  : `The seller has rejected the final bid of $${auction.current_highest_bid}`}
              </p>
            </div>
          )}
        </div>

        <div>
          {user && !isUserSeller && !isAuctionEnded && isAuctionStarted && (
            <div className="border border-gray-300 p-4 mb-6">
              <h3 className="font-semibold mb-4">Place a Bid</h3>
              {error && (
                <div className="p-3 border border-red-500 bg-red-50 text-red-700 mb-4 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={placeBid}>
                <div className="mb-4">
                  <label
                    htmlFor="bidAmount"
                    className="block text-sm font-medium mb-1"
                  >
                    Bid Amount (minimum: ${minimumBid})
                  </label>
                  <input
                    id="bidAmount"
                    type="number"
                    min={minimumBid}
                    step="0.01"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                    placeholder={`${minimumBid}`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={bidLoading}
                  className="w-full bg-black text-white py-2 px-4 hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {bidLoading ? "Placing Bid..." : "Place Bid"}
                </button>
              </form>
            </div>
          )}

          {!user && !isAuctionEnded && isAuctionStarted && (
            <div className="border border-gray-300 p-4 mb-6 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Please log in to place a bid
              </p>
            </div>
          )}

          {!isAuctionStarted && (
            <div className="border border-gray-300 p-4 mb-6 text-center">
              <p className="text-sm text-gray-600">
                Auction has not started yet
              </p>
            </div>
          )}

          {isUserSeller && (
            <div className="border border-gray-300 p-4 mb-6 text-center">
              <p className="text-sm text-gray-600">
                You cannot bid on your own auction
              </p>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-4">
              Bid History ({bids.length} bids)
            </h3>
            {bids.length === 0 ? (
              <p className="text-gray-500 text-sm">No bids yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {bids.map((bid, index) => (
                  <div
                    key={bid.id}
                    className={`p-3 border rounded ${
                      index === 0
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">${bid.amount}</p>
                        <p className="text-sm text-gray-600">
                          {bid.bidder?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(
                            bid.created_at +
                              (bid.created_at.includes("Z") ? "" : "Z")
                          ).toLocaleString()}
                        </p>
                        {index === 0 && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Highest
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
