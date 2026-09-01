"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import TaskCard from "@/components/TaskCard";

interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: "pending" | "completed";
  projectId: string;
  projectName: string;
  assignedTo: string[];
  assignedToNames: string[];
  completedBy: string[];
}

export default function TeammateDashboard() {
  const { user, userData, loading, logOut } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (userData?.role !== "teammate") {
      router.push("/admin");
    }
  }, [user, userData, loading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "tasks"), where("assignedTo", "array-contains", user.uid), orderBy("assignedDate", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[]);
    });
    return () => unsubscribe();
  }, [user]);

  const handleMarkMyPartComplete = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !user) return;
    const newCompletedBy = [...(task.completedBy || []), user.uid];
    const newStatus = newCompletedBy.length === task.assignedTo.length ? "completed" : "pending";
    try {
      await updateDoc(doc(db, "tasks", taskId), { completedBy: newCompletedBy, status: newStatus });
    } catch (error) {
      console.error("Error updating task: ", error);
      alert("Couldn't mark your part as complete.");
    }
  };

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

  const groupedByProject = tasks.reduce<Record<string, { projectId: string; tasks: Task[] }>>((groups, task) => {
    const key = task.projectName || "Unassigned";
    if (!groups[key]) groups[key] = { projectId: task.projectId, tasks: [] };
    groups[key].tasks.push(task);
    return groups;
  }, {});

  if (loading || userData?.role !== "teammate") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-3xl mx-auto px-6 h-16 flex justify-between items-center">
          <div>
            <span className="font-semibold text-zinc-900 tracking-tight">Task Tracker</span>
            <span className="text-sm text-zinc-400 ml-2">{userData?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-zinc-600 hover:text-red-600 px-3 py-1.5 rounded-md hover:bg-zinc-50 transition"
          >
            Log out
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight mb-6">My Tasks</h1>

        {tasks.length === 0 ? (
          <p className="text-zinc-500 italic">No tasks assigned yet. You're all caught up!</p>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByProject).map(([projectName, group]) => (
              <div key={projectName}>
                <Link
                  href={`/teammate/projects/${group.projectId}`}
                  className="inline-block text-sm font-semibold text-zinc-700 mb-3 pb-1.5 border-b border-zinc-200 hover:text-indigo-600 transition"
                >
                  {projectName}
                </Link>
                <div className="space-y-3">
                  {group.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} currentUserId={user?.uid} onMarkComplete={handleMarkMyPartComplete} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}