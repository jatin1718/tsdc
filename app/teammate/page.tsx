// Save this file as: app/teammate/page.tsx  (new folder: app/teammate/)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";

interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: "pending" | "completed";
}

export default function TeammateDashboard() {
  const { user, userData, loading, logOut } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);

  // GUARD: same idea as the admin page. Without this, an admin (or anyone
  // guessing the URL) could land on /teammate directly.
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

  // The important query for this project: filter tasks SERVER-SIDE with
  // `where("assignedTo", "==", user.uid)` — never fetch every task in the
  // collection and filter it in the browser. That would leak every other
  // teammate's tasks to the client, and doesn't scale.
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "tasks"),
      where("assignedTo", "==", user.uid),
      orderBy("assignedDate", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(list);
    });
    return () => unsubscribe();
  }, [user]);

  const handleMarkComplete = async (taskId: string) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), { status: "completed" });
      // No manual state update needed — the onSnapshot listener above
      // receives the change from Firestore and re-renders automatically.
    } catch (error) {
      console.error("Error updating task: ", error);
      alert("Couldn't mark task as complete.");
    }
  };

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

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
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Log Out
          </button>
        </div>

        {tasks.length === 0 ? (
          <p className="text-gray-500 italic">No tasks assigned yet. You're all caught up!</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 bg-white border rounded shadow-sm border-l-4 ${
                  task.status === "completed" ? "border-green-400" : "border-yellow-400"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{task.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    <p className="text-sm text-gray-500 mt-1">Deadline: {task.deadline}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap ${
                      task.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                {task.status === "pending" && (
                  <button
                    onClick={() => handleMarkComplete(task.id)}
                    className="mt-3 bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 transition"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}