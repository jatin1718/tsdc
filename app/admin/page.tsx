"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import Sidebar from "@/components/Sidebar";

interface Project {
  id: string;
  name: string;
  description: string;
  techStack?: string;
  startDate?: string;
  deadline?: string;
  status?: "planning" | "active" | "completed";
  githubLink?: string;
}

const STATUS_STYLES: Record<string, string> = {
  planning: "bg-zinc-100 text-zinc-600",
  active: "bg-indigo-50 text-indigo-700",
  completed: "bg-emerald-50 text-emerald-700",
};

export default function AdminProjectsPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<"planning" | "active" | "completed">("planning");
  const [githubLink, setGithubLink] = useState("");

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
        techStack,
        startDate,
        deadline,
        status,
        githubLink,
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
      });
      setName("");
      setDescription("");
      setTechStack("");
      setStartDate("");
      setDeadline("");
      setStatus("planning");
      setGithubLink("");
      setShowForm(false);
    } catch (error) {
      console.error("Error creating project: ", error);
      alert("Something went wrong while creating the project.");
    }
  };

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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Projects</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition"
            >
              {showForm ? "Cancel" : "New Project"}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreateProject} className="bg-white p-6 rounded-lg border border-zinc-200 mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full p-2 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Tech Stack <span className="text-zinc-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  placeholder="Next.js, Firebase, Tailwind CSS"
                  className="w-full p-2 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "planning" | "active" | "completed")}
                    className="w-full p-2 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">GitHub Link</label>
                  <input
                    type="url"
                    value={githubLink}
                    onChange={(e) => setGithubLink(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full p-2 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition"
              >
                Create Project
              </button>
            </form>
          )}

          {projects.length === 0 ? (
            <p className="text-zinc-500 italic">No projects yet — create one to get started.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  className="block bg-white p-5 rounded-lg border border-zinc-200 hover:border-indigo-300 transition"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h2 className="font-semibold text-zinc-900">{project.name}</h2>
                    {project.status && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${STATUS_STYLES[project.status]}`}
                      >
                        {project.status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{project.description}</p>
                  {project.techStack && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.techStack
                        .split(",")
                        .slice(0, 3)
                        .map((tech) => (
                          <span key={tech.trim()} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">
                            {tech.trim()}
                          </span>
                        ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}