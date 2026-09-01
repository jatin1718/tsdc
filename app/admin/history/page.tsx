// Save this file as: app/admin/history/page.tsx  (REPLACES current file)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import AdminNav from "@/components/AdminNav";
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

  // Every task, across every project — no projectId filter here. This is
  // the one query in the whole app that intentionally sees everything.
  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("assignedDate", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[]);
    });
    return () => unsubscribe();
  }, []);

  // Filtering happens in the browser here (not a new Firestore query) because
  // we already have all the tasks loaded — no need to re-fetch from the
  // database just to change which ones are visible.
  const filteredTasks = tasks.filter((t) => (filter === "all" ? true : t.status === filter));

  if (loading || userData?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />
      <div className="max-w-5xl mx-auto px-4 pb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">History</h1>

        <div className="flex gap-2 mb-4">
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-sm font-medium capitalize transition ${
                filter === f ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {filteredTasks.length === 0 ? (
          <p className="text-gray-500 italic">No tasks found.</p>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} showProject showAssignee />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}