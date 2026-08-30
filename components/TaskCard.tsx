// Save this file as: components/TaskCard.tsx  (new top-level folder: components/)
"use client";

interface Task {
  id: string;
  projectName?: string;
  title: string;
  description: string;
  assignedToName?: string;
  deadline: string;
  status: "pending" | "completed";
}

interface TaskCardProps {
  task: Task;
  showProject?: boolean; // show which project this task belongs to (History, Teammate view)
  showAssignee?: boolean; // show who it's assigned to (Admin views)
  onMarkComplete?: (taskId: string) => void; // only passed on the Teammate dashboard
}

// ONE reusable card for displaying a task, used in four different places:
// project detail, history, and the teammate dashboard. If we ever want to
// change how a task looks, we change it here once — not in four files.
export default function TaskCard({ task, showProject, showAssignee, onMarkComplete }: TaskCardProps) {
  return (
    <div
      className={`p-4 bg-white border rounded shadow-sm border-l-4 ${
        task.status === "completed" ? "border-green-400" : "border-yellow-400"
      }`}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          {showProject && task.projectName && (
            <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded mb-1">
              {task.projectName}
            </span>
          )}
          <h3 className="font-bold text-lg text-gray-800">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {showAssignee && task.assignedToName && (
              <>
                Assigned to: <span className="font-medium text-gray-700">{task.assignedToName}</span>
                {" · "}
              </>
            )}
            Deadline: {task.deadline}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
            task.status === "completed"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {task.status}
        </span>
      </div>

      {onMarkComplete && task.status === "pending" && (
        <button
          onClick={() => onMarkComplete(task.id)}
          className="mt-3 bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 transition"
        >
          Mark as Completed
        </button>
      )}
    </div>
  );
}