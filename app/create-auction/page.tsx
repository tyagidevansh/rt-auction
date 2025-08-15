"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

export default function CreateAuctionPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [bidIncrement, setBidIncrement] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!user) {
      setError("You must be logged in to create an auction");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auctions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seller_id: user.id,
          title,
          description,
          starting_price: parseFloat(startingPrice),
          bid_increment: parseFloat(bidIncrement),
          start_time: startTime,
          duration_hours: parseInt(durationHours),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create auction");
        return;
      }

      router.push(`/auction/${data.auction.id}`);
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center">
        <p>You must be logged in to create an auction.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Auction</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 border border-red-500 bg-red-50 text-red-700">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Item Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
            placeholder="Enter a descriptive title for your item"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
            placeholder="Provide details about the item's condition, features, etc."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startingPrice"
              className="block text-sm font-medium mb-1"
            >
              Starting Price ($) *
            </label>
            <input
              id="startingPrice"
              type="number"
              min="0"
              step="0.01"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              placeholder="0.00"
            />
          </div>

          <div>
            <label
              htmlFor="bidIncrement"
              className="block text-sm font-medium mb-1"
            >
              Bid Increment ($) *
            </label>
            <input
              id="bidIncrement"
              type="number"
              min="0.01"
              step="0.01"
              value={bidIncrement}
              onChange={(e) => setBidIncrement(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              placeholder="1.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startTime"
              className="block text-sm font-medium mb-1"
            >
              Start Date & Time *
            </label>
            <input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="durationHours"
              className="block text-sm font-medium mb-1"
            >
              Duration (hours) *
            </label>
            <select
              id="durationHours"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
            >
              <option value="">Select duration</option>
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="4">4 hours</option>
              <option value="6">6 hours</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours</option>
              <option value="48">48 hours</option>
              <option value="72">72 hours</option>
              <option value="168">1 week</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white py-2 px-6 hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Auction"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="border border-gray-300 py-2 px-6 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
