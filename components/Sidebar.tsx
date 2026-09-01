"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Projects",
    match: (path: string) => path === "/admin" || path.startsWith("/admin/projects"),
  },
  {
    href: "/admin/history",
    label: "History",
    match: (path: string) => path.startsWith("/admin/history"),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userData, logOut } = useAuth();

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-200 bg-white min-h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-5 border-b border-zinc-200">
        <span className="font-semibold text-zinc-900 tracking-tight">Task Tracker</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded-md text-sm font-medium transition ${
              item.match(pathname)
                ? "bg-indigo-50 text-indigo-700"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-zinc-200">
        <p className="px-3 text-sm text-zinc-500 truncate mb-2">{userData?.name}</p>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-red-600 transition"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}