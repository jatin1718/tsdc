// Save this file as: app/teammate/projects/[projectId]/page.tsx
// Same [projectId] dynamic-route pattern as the admin version — the folder
// name with square brackets makes this segment of the URL a variable.
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, updateDoc } from "firebase/firestore";
import TaskCard from "@/components/TaskCard";

interface Project {
  id: string;
  name: string;
  description: string;
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

  // Shows EVERY task in this project, not just this teammate's own — so
  // they can see how the whole project is progressing, not just their slice.
  // This uses the SAME index as the admin project page (projectId + assignedDate),
  // since it's the same query shape — no new index needed here.
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
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

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
          <div className="bg-white p-6 rounded-lg border shadow-sm mt-3 mb-6">
            <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
            <p className="text-gray-500 mt-1">{project.description}</p>

            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Project Progress</span>
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
                // Only THIS teammate's own tasks get the "Mark Completed" button
                // — they shouldn't be able to complete someone else's task,
                // even though they can now SEE everyone's tasks in the project.
                onMarkComplete={task.assignedTo === user?.uid ? handleMarkComplete : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}