"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Dashboard() {
  const { user, userData, logOut } = useAuth();
  const router = useRouter();

  // Task Form States
  const [title, setTitle] = useState("");
  const [assignTo, setAssignTo] = useState("");

  const handleLogout = async () => {
    await logOut();
    router.push("/");
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assignTo) return;

    try {
      await addDoc(collection(db, "tasks"), {
        title: title,
        assignedTo: assignTo, // Jisko task assign karna hai
        status: "pending",
        createdBy: user?.email,
        createdAt: serverTimestamp(),
      });
      setTitle(""); // Form clear kar do
      setAssignTo("");
      alert("Task successfully assigned! 🔥");
    } catch (error) {
      console.error("Error adding task: ", error);
      alert("Oh no, something went wrong!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Workspace</h1>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">
            Log Out
          </button>
        </div>

        {/* User Info */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-8 text-blue-900">
          <p>Logged in as: <strong>{user?.email}</strong> (Role: <span className="uppercase font-bold">{userData?.role || "loading..."}</span>)</p>
        </div>

        {/* Task Form (Only Admin should ideally use this) */}
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h2 className="text-xl font-bold mb-4">Assign a New Task</h2>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Learn React Native"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To (Email or Name)</label>
              <input 
                type="text" 
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                placeholder="e.g. jatin@example.com"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition">
              Assign Task
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}