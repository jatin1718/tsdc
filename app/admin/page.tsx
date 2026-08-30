// Save this file as: app/admin/page.tsx  (REPLACES your existing app/admin/page.tsx)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import AdminNav from "@/components/AdminNav";

interface Project {
  id: string;
  name: string;
  description: string;
}

export default function AdminProjectsPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);

  // GUARD — same pattern as before, repeated on every admin page. Each page
  // checks the role itself; none of them trust that "/" already checked it.
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

  // Live-listen to all projects, newest first.
  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Project[];
      setProjects(list);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addDoc(collection(db, "projects"), {
        name,
        description,
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
      });
      setName("");
      setDescription("");
      setShowForm(false);
    } catch (error) {
      console.error("Error creating project: ", error);
      alert("Something went wrong while creating the project.");
    }
  };

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition"
          >
            {showForm ? "Cancel" : "+ New Project"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateProject} className="bg-white p-6 rounded-lg border shadow-sm mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition"
            >
              Create Project
            </button>
          </form>
        )}

        {projects.length === 0 ? (
          <p className="text-gray-500 italic">No projects yet — create one to get started.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="block bg-white p-5 rounded-lg border shadow-sm hover:shadow-md hover:border-blue-300 transition"
              >
                <h2 className="font-bold text-lg text-gray-800">{project.name}</h2>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}