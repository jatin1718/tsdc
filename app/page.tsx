"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// This page has no UI of its own — it's a "traffic controller". Every
// visitor lands here first ("/"), and gets sent onward based on who they are:
// not logged in -> /login, admin -> /admin, teammate -> /teammate.
export default function Home() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // wait until AuthContext knows who's logged in

    if (!user) {
      router.push("/login");
      return;
    }

    if (userData?.role === "admin") {
      router.push("/admin");
    } else if (userData?.role === "teammate") {
      router.push("/teammate");
    }
  }, [user, userData, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  );
}