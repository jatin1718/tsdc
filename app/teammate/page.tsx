// Save this file as: app/teammate/projects/[projectId]/page.tsx  (REPLACES current file)
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, updateDoc } from "firebase/firestore";
import TaskCard from "@/components/TaskCard";
import ProjectHeader from "@/components/ProjectHeader";

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
interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  deadline: string;
  status: "pending" | "completed";
}

export default function TeammateProjectDetailPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
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
    const fetchProject = async () => {
      const snap = await getDoc(doc(db, "projects", projectId));
      if (snap.exists()) setProject({ id: snap.id, ...snap.data() } as Project);
    };
    fetchProject();
  }, [projectId]);

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

  const handleMarkComplete = async (taskId: string) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), { status: "completed" });
    } catch (error) {
      console.error("Error updating task: ", error);
      alert("Couldn't mark task as complete.");
    }
  };

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalCount = tasks.length;

  if (loading || userData?.role !== "teammate") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/teammate" className="text-sm text-blue-600 hover:underline">
          &larr; My Tasks
        </Link>

        {project && (
          <ProjectHeader project={project} completedCount={completedCount} totalCount={totalCount} />
        )}

        <h2 className="text-xl font-bold text-gray-800 mb-3">All Tasks in This Project</h2>
        {tasks.length === 0 ? (
          <p className="text-gray-500 italic">No tasks yet.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                showAssignee
                onMarkComplete={task.assignedTo === user?.uid ? handleMarkComplete : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}