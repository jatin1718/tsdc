// Save this file as: app/teammate/projects/[projectId]/page.tsx  (REPLACES current file)
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, Timestamp } from "firebase/firestore";
import TaskCard from "@/components/TaskCard";
import ProjectHeader from "@/components/ProjectHeader";
import { getErrorMessage } from "@/lib/errorMessage";

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
  assignedTo: string[];
  assignedToNames: string[];
  completedBy: string[];
  deadline: string;
  status: "pending" | "completed";
  assignedDate?: Timestamp;
}

export default function TeammateProjectDetailPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectError, setProjectError] = useState("");
  const [tasksError, setTasksError] = useState("");

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
      try {
        setProjectError("");
        const snap = await getDoc(doc(db, "projects", projectId));
        if (snap.exists()) setProject({ id: snap.id, ...snap.data() } as Project);
        else setProjectError("Project not found.");
      } catch (error) {
        console.error("Error loading project:", error);
        setProjectError(getErrorMessage(error, "Could not load this project."));
      }
    };
    fetchProject();
  }, [projectId]);

  // Shows EVERY task in this project (not filtered to this user) so
  // teammates see full team progress — same as before.
  useEffect(() => {
    setTasksError("");
    const q = query(
      collection(db, "tasks"),
      where("projectId", "==", projectId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextTasks = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Task)
          .sort(
            (a, b) =>
              (b.assignedDate?.toMillis() ?? 0) -
              (a.assignedDate?.toMillis() ?? 0)
          );

        setTasks(nextTasks);
        setTasksError("");
      },
      (error) => {
        console.error("Error loading project tasks:", error);
        setTasksError(getErrorMessage(error, "Could not load project tasks."));
      }
    );

    return () => unsubscribe();
  }, [projectId]);

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

        {projectError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mt-4 mb-4">
            <p className="font-medium">Could not load the project.</p>
            <p className="text-sm mt-1">{projectError}</p>
          </div>
        ) : project && <ProjectHeader project={project} completedCount={completedCount} totalCount={totalCount} />}

        <h2 className="text-xl font-bold text-gray-800 mb-3">All Tasks in This Project</h2>
        {tasksError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p className="font-medium">Could not load project tasks.</p>
            <p className="text-sm mt-1">{tasksError}</p>
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-gray-500 italic">No tasks yet.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                showAssignee
                currentUserId={user?.uid}
                onMarkComplete={handleMarkMyPartComplete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}