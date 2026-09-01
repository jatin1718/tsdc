// Save this file as: app/teammate/page.tsx  (REPLACES current file)
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

  // array-contains: finds every task where THIS user's uid is anywhere in
  // the assignedTo array — works the same way for solo or shared tasks.
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "tasks"),
      where("assignedTo", "array-contains", user.uid),
      orderBy("assignedDate", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[]);
    });
    return () => unsubscribe();
  }, [user]);

  // Marks only the CURRENT user's own part as done. If everyone assigned
  // has now done their part, the task's overall status flips to "completed".
  const handleMarkMyPartComplete = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !user) return;
    const newCompletedBy = [...(task.completedBy || []), user.uid];
    const newStatus = newCompletedBy.length === task.assignedTo.length ? "completed" : "pending";
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        completedBy: newCompletedBy,
        status: newStatus,
      });
    } catch (error) {
      console.error("Error updating task: ", error);
      alert("Couldn't mark your part as complete.");
    }
  };

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

  const groupedByProject = tasks.reduce<Record<string, { projectId: string; tasks: Task[] }>>(
    (groups, task) => {
      const key = task.projectName || "Unassigned";
      if (!groups[key]) groups[key] = { projectId: task.projectId, tasks: [] };
      groups[key].tasks.push(task);
      return groups;
    },
    {}
  );

  if (loading || userData?.role !== "teammate") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Tasks</h1>
            <p className="text-gray-500">Logged in as: {userData?.name}</p>
          </div>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">
            Log Out
          </button>
        </div>

        {tasks.length === 0 ? (
          <p className="text-gray-500 italic">No tasks assigned yet. You're all caught up!</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByProject).map(([projectName, group]) => (
              <div key={projectName}>
                <Link
                  href={`/teammate/projects/${group.projectId}`}
                  className="inline-block text-lg font-bold text-gray-700 mb-2 border-b pb-1 hover:text-blue-600 transition"
                >
                  {projectName} &rarr;
                </Link>
                <div className="space-y-3 mt-2">
                  {group.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      currentUserId={user?.uid}
                      onMarkComplete={handleMarkMyPartComplete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}