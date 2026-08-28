// Save this file as: app/admin/page.tsx  (new folder: app/admin/)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  where,
} from "firebase/firestore";

interface Teammate {
  uid: string;
  name: string;
  email: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  deadline: string;
  status: "pending" | "completed";
}

export default function AdminDashboard() {
  const { user, userData, loading, logOut } = useAuth();
  const router = useRouter();

  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [deadline, setDeadline] = useState("");

  // GUARD: this is the "security guard" for this floor. Runs on every visit
  // to /admin — not just once at the front door. Kicks out anyone who isn't
  // a logged-in admin, even if they typed the URL directly.
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

  // Fetch the list of teammates ONCE when the page loads — used to populate
  // the "Assign To" dropdown. This list doesn't need to update live.
  useEffect(() => {
    const fetchTeammates = async () => {
      const q = query(collection(db, "users"), where("role", "==", "teammate"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({
        uid: doc.id,
        name: doc.data().name,
        email: doc.data().email,
      }));
      setTeammates(list);
    };
    fetchTeammates();
  }, []);

  // Live-listen to ALL tasks, newest first — admin needs to see everything.
  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("assignedDate", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(list);
    });
    return () => unsubscribe();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assignedTo || !deadline) return;

    // Denormalization: we look up the teammate's name here and save a COPY
    // of it directly on the task. This means the teammate dashboard can show
    // "assigned by" info without running a second query for every task.
    // Trade-off: if the teammate's name changes later, old tasks still show
    // the old name — acceptable for this project's scope.
    const teammate = teammates.find((t) => t.uid === assignedTo);

    try {
      await addDoc(collection(db, "tasks"), {
        title,
        description,
        assignedTo, // teammate's uid — this is what we filter by on their dashboard
        assignedToName: teammate?.name || "",
        assignedBy: user?.uid,
        deadline, // "YYYY-MM-DD" string from the date input — simple, sortable as text
        assignedDate: serverTimestamp(),
        status: "pending",
      });
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDeadline("");
    } catch (error) {
      console.error("Error adding task: ", error);
      alert("Something went wrong while creating the task.");
    }
  };

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

  // While the guard above is still deciding, or if this render happens to
  // slip through for a non-admin for a split second, show a loading state
  // instead of the real dashboard content.
  if (loading || userData?.role !== "admin") {
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
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-500">Logged in as: {userData?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Log Out
          </button>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border mb-8">
          <h2 className="text-xl font-bold mb-4">Assign a New Task</h2>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a teammate</option>
                {teammates.map((t) => (
                  <option key={t.uid} value={t.uid}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
              {teammates.length === 0 && (
                <p className="text-sm text-orange-600 mt-1">
                  No teammates found — sign up a teammate account first.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              Assign Task
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">All Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-gray-500 italic">No tasks created yet.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 bg-white border rounded shadow-sm flex justify-between items-center border-l-4 ${
                    task.status === "completed" ? "border-green-400" : "border-yellow-400"
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-lg">{task.title}</h3>
                    <p className="text-sm text-gray-500">
                      Assigned to:{" "}
                      <span className="font-semibold text-gray-700">{task.assignedToName}</span>
                      {" · "}Deadline: {task.deadline}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      task.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}