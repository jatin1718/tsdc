"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
        <p className="text-gray-600 mb-6">This page hit an unexpected error. Your data has not been intentionally deleted.</p>
        <button onClick={() => reset()} className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition">
          Try again
        </button>
      </div>
    </main>
  );
}
