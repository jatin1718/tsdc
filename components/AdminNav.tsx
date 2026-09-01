// Save this file as: components/AdminNav.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Shared header for every /admin/* page. Without this, we'd copy-paste a
// header into every admin page — one change (like adding a new tab) would
// mean editing three files instead of one.
export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { userData, logOut } = useAuth();

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

  const linkClass = (path: string) =>
    `px-3 py-2 rounded text-sm font-medium transition ${
      pathname === path ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div className="bg-white border-b mb-6">
      <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-800 mr-2">Task Tracker</span>
          <Link href="/admin" className={linkClass("/admin")}>
            Projects
          </Link>
          <Link href="/admin/history" className={linkClass("/admin/history")}>
            History
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{userData?.name}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600 transition"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}