// Save this file as: app/admin/history/page.tsx (REPLACES current file)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import Sidebar from "@/components/Sidebar";
import TaskCard from "@/components/TaskCard";

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  assignedToNames: string[];
  completedBy: string[];
  projectName: string;
  deadline: string;
  status: "pending" | "completed";
}

export default function HistoryPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (userData?.role !== "admin") {
      router.push("/teammate");
    }
  }, [user, userData, loading, router]);

  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("assignedDate", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[]);
    });
    return () => unsubscribe();
  }, []);

  const filteredTasks = tasks.filter((t) => (filter === "all" ? true : t.status === filter));

  if (loading || userData?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-zinc-50">
      <Sidebar />
      <main className="flex-1 px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight mb-4">History</h1>

          <div className="flex gap-2 mb-4">
            {(["all", "pending", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition ${
                  filter === f
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {filteredTasks.length === 0 ? (
            <p className="text-zinc-500 italic">No tasks found.</p>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} showProject showAssignee />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}