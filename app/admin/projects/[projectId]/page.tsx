// Save this file as: app/admin/projects/[projectId]/page.tsx
//
// IMPORTANT: [projectId] with square brackets is a LITERAL folder name in
// Next.js — it's not a placeholder for you to fill in. It tells Next.js
// "this part of the URL is a variable." So when someone visits
// /admin/projects/abc123, Next.js runs this file and gives you
// projectId = "abc123" via the useParams() hook below.
//
// Create the folders exactly like this (all literal, including brackets):
//   app/admin/projects/[projectId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import AdminNav from "@/components/AdminNav";
import TaskCard from "@/components/TaskCard";

interface Project {
  id: string;
  name: string;
  description: string;
}
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

export default function ProjectDetailPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string; // comes from the [projectId] folder name

  const [project, setProject] = useState<Project | null>(null);
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [deadline, setDeadline] = useState("");

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

  // Fetch this ONE project's details, once — we don't need it to update live.
  useEffect(() => {
    const fetchProject = async () => {
      const snap = await getDoc(doc(db, "projects", projectId));
      if (snap.exists()) setProject({ id: snap.id, ...snap.data() } as Project);
    };
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    const fetchTeammates = async () => {
      const q = query(collection(db, "users"), where("role", "==", "teammate"));
      const snapshot = await getDocs(q);
      setTeammates(
        snapshot.docs.map((d) => ({ uid: d.id, name: d.data().name, email: d.data().email }))
      );
    };
    fetchTeammates();
  }, []);

  // Live-listen to tasks that belong to THIS project only.
  useEffect(() => {
    const q = query(
      collection(db, "tasks"),
      where("projectId", "==", projectId),
      orderBy("assignedDate", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[]);
    });
    return () => unsubscribe();
  }, [projectId]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assignedTo || !deadline || !project) return;
    const teammate = teammates.find((t) => t.uid === assignedTo);
    try {
      await addDoc(collection(db, "tasks"), {
        title,
        description,
        assignedTo,
        assignedToName: teammate?.name || "",
        assignedBy: user?.uid,
        projectId: project.id, // links this task back to the project it belongs to
        projectName: project.name, // denormalized copy, so we don't re-fetch the project name everywhere this task is shown
        deadline,
        assignedDate: serverTimestamp(),
        status: "pending",
      });
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDeadline("");
      setShowForm(false);
    } catch (error) {
      console.error("Error adding task: ", error);
      alert("Something went wrong while creating the task.");
    }
  };

  // Progress is CALCULATED here from the tasks we already loaded — never
  // stored as a separate number in Firestore. If it were stored, it could
  // drift out of sync (e.g. after a task is deleted). Deriving it live means
  // it's always correct, the same way a scoreboard reflects the raw data.
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalCount = tasks.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

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
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">
          &larr; All Projects
        </Link>

        {project && (
          <div className="bg-white p-6 rounded-lg border shadow-sm mt-3 mb-6">
            <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
            <p className="text-gray-500 mt-1">{project.description}</p>

            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>
                  {completedCount}/{totalCount} tasks completed ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Tasks</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition"
          >
            {showForm ? "Cancel" : "+ New Task"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddTask} className="bg-white p-6 rounded-lg border shadow-sm mb-6 space-y-4">
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
        )}

        {tasks.length === 0 ? (
          <p className="text-gray-500 italic">No tasks in this project yet.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} showAssignee />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}