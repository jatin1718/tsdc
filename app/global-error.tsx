"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100">
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Task Tracker needs to restart</h1>
            <p className="text-gray-600 mb-6">An unexpected application error occurred.</p>
            <button onClick={() => reset()} className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition">
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
