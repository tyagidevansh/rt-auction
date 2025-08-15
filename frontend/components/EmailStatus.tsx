"use client";

import { useState } from "react";

interface EmailStatusProps {
  show: boolean;
  success: boolean;
  message: string;
  onClose: () => void;
}

export default function EmailStatus({
  show,
  success,
  message,
  onClose,
}: EmailStatusProps) {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div
        className={`border p-4 rounded-lg shadow-lg ${
          success
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{success ? "✅" : "❌"}</span>
            <div>
              <p className="font-medium">{message}</p>
              {success && (
                <p className="text-sm mt-1 opacity-75">
                   Email notifications have been sent to relevant parties
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
