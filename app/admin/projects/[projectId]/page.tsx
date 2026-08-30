// Save this file as: app/admin/projects/[projectId]/page.tsx  (REPLACES current file)
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import AdminNav from "@/components/AdminNav";
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
interface Teammate {
  uid: string;
  name: string;
  email: string;
}
interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo?: string;
  assignedToName?: string;
  deadline: string;
  status: "pending" | "completed";
}

export default function ProjectDetailPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Task form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");

  // Project-edit form state
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [pName, setPName] = useState("");
  const [pDescription, setPDescription] = useState("");
  const [pTechStack, setPTechStack] = useState("");
  const [pStartDate, setPStartDate] = useState("");
  const [pDeadline, setPDeadline] = useState("");
  const [pStatus, setPStatus] = useState<"planning" | "active" | "completed">("planning");
  const [pGithubLink, setPGithubLink] = useState("");

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

  // ---------- TASK: create or edit (same form, same handler) ----------
  const resetTaskForm = () => {
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setTaskDeadline("");
    setEditingTaskId(null);
    setShowTaskForm(false);
  };

  const handleEditTaskClick = (task: Task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setAssignedTo(task.assignedTo?? "");
    setTaskDeadline(task.deadline);
    setShowTaskForm(true);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assignedTo || !taskDeadline || !project) return;
    const teammate = teammates.find((t) => t.uid === assignedTo);

    try {
      if (editingTaskId) {
        // EDIT mode: update the existing doc. We deliberately do NOT touch
        // `status` here — editing a task's details shouldn't accidentally
        // reset its completion state.
        await updateDoc(doc(db, "tasks", editingTaskId), {
          title,
          description,
          assignedTo,
          assignedToName: teammate?.name || "",
          deadline: taskDeadline,
        });
      } else {
        // CREATE mode
        await addDoc(collection(db, "tasks"), {
          title,
          description,
          assignedTo,
          assignedToName: teammate?.name || "",
          assignedBy: user?.uid,
          projectId: project.id,
          projectName: project.name,
          deadline: taskDeadline,
          assignedDate: serverTimestamp(),
          status: "pending",
        });
      }
      resetTaskForm();
    } catch (error) {
      console.error("Error saving task: ", error);
      alert("Something went wrong while saving the task.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "tasks", taskId));
    } catch (error) {
      console.error("Error deleting task: ", error);
      alert("Something went wrong while deleting the task.");
    }
  };

  // ---------- PROJECT: edit ----------
  const handleEditProjectClick = () => {
    if (!project) return;
    setPName(project.name);
    setPDescription(project.description);
    setPTechStack(project.techStack || "");
    setPStartDate(project.startDate || "");
    setPDeadline(project.deadline || "");
    setPStatus(project.status || "planning");
    setPGithubLink(project.githubLink || "");
    setShowProjectForm(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return;
    try {
      await updateDoc(doc(db, "projects", projectId), {
        name: pName,
        description: pDescription,
        techStack: pTechStack,
        startDate: pStartDate,
        deadline: pDeadline,
        status: pStatus,
        githubLink: pGithubLink,
      });
      // Local state won't auto-refresh (project is fetched once, not via
      // onSnapshot), so we update it directly here to reflect the edit
      // immediately without needing a page refresh.
      setProject({ id: projectId, name: pName, description: pDescription, techStack: pTechStack, startDate: pStartDate, deadline: pDeadline, status: pStatus, githubLink: pGithubLink });
      setShowProjectForm(false);
    } catch (error) {
      console.error("Error updating project: ", error);
      alert("Something went wrong while updating the project.");
    }
  };

  // ---------- PROJECT: delete (cascades to its tasks) ----------
  const handleDeleteProject = async () => {
    if (
      !window.confirm(
        `Delete "${project?.name}" and all ${tasks.length} of its tasks? This cannot be undone.`
      )
    )
      return;
    try {
      // writeBatch groups multiple writes into ONE atomic operation — either
      // everything here succeeds, or none of it does. Without this, deleting
      // tasks one-by-one in a loop could fail halfway through (e.g. network
      // drop) and leave the project gone but some tasks still orphaned.
      const batch = writeBatch(db);
      tasks.forEach((task) => {
        batch.delete(doc(db, "tasks", task.id));
      });
      batch.delete(doc(db, "projects", projectId));
      await batch.commit();
      router.push("/admin");
    } catch (error) {
      console.error("Error deleting project: ", error);
      alert("Something went wrong while deleting the project.");
    }
  };

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalCount = tasks.length;

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
        <div className="flex justify-between items-center">
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">
            &larr; All Projects
          </Link>
          {project && (
            <div className="flex gap-3 text-sm">
              <button onClick={handleEditProjectClick} className="text-blue-600 hover:underline font-medium">
                Edit Project
              </button>
              <button onClick={handleDeleteProject} className="text-red-600 hover:underline font-medium">
                Delete Project
              </button>
            </div>
          )}
        </div>

        {showProjectForm && (
          <form onSubmit={handleUpdateProject} className="bg-white p-6 rounded-lg border shadow-sm mt-3 mb-6 space-y-4">
            <h2 className="font-bold text-gray-800">Edit Project</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input type="text" value={pName} onChange={(e) => setPName(e.target.value)} required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={pDescription} onChange={(e) => setPDescription(e.target.value)} rows={3}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tech Stack (comma-separated)</label>
              <input type="text" value={pTechStack} onChange={(e) => setPTechStack(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={pStartDate} onChange={(e) => setPStartDate(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input type="date" value={pDeadline} onChange={(e) => setPDeadline(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={pStatus} onChange={(e) => setPStatus(e.target.value as "planning" | "active" | "completed")}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500">
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Link</label>
                <input type="url" value={pGithubLink} onChange={(e) => setPGithubLink(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition">
                Save Changes
              </button>
              <button type="button" onClick={() => setShowProjectForm(false)} className="px-4 py-2 rounded border text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        )}

        {project && (
          <ProjectHeader project={project} completedCount={completedCount} totalCount={totalCount} />
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Tasks</h2>
          <button
            onClick={() => (showTaskForm ? resetTaskForm() : setShowTaskForm(true))}
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition"
          >
            {showTaskForm ? "Cancel" : "+ New Task"}
          </button>
        </div>

        {showTaskForm && (
          <form onSubmit={handleSubmitTask} className="bg-white p-6 rounded-lg border shadow-sm mb-6 space-y-4">
            <h3 className="font-bold text-gray-800">{editingTaskId ? "Edit Task" : "New Task"}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500">
                <option value="">Select a teammate</option>
                {teammates.map((t) => (
                  <option key={t.uid} value={t.uid}>{t.name} ({t.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input type="date" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-blue-600 text-white font-bold px-4 py-2 rounded hover:bg-blue-700 transition">
                {editingTaskId ? "Update Task" : "Assign Task"}
              </button>
              <button type="button" onClick={resetTaskForm} className="px-4 py-2 rounded border text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        )}

        {tasks.length === 0 ? (
          <p className="text-gray-500 italic">No tasks in this project yet.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                showAssignee
                onEdit={handleEditTaskClick}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
