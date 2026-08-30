// Save this file as: components/TaskCard.tsx  (REPLACES current file)
"use client";

interface Task {
  id: string;
  projectName?: string;
  title: string;
  description: string;
  assignedTo?: string;
  assignedToName?: string;
  deadline: string;
  status: "pending" | "completed";
}

interface TaskCardProps {
  task: Task;
  showProject?: boolean;
  showAssignee?: boolean;
  onMarkComplete?: (taskId: string) => void;
  // Both are optional — only passed on the Admin project-detail page.
  // History and the Teammate dashboard never pass these, so no edit/delete
  // buttons ever render there, keeping task management in ONE place.
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskCard({
  task,
  showProject,
  showAssignee,
  onMarkComplete,
  onEdit,
  onDelete,
}: TaskCardProps) {
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

        <div className="flex flex-col items-end gap-1">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
              task.status === "completed"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {task.status}
          </span>
          {(onEdit || onDelete) && (
            <div className="flex gap-2 text-xs">
              {onEdit && (
                <button onClick={() => onEdit(task)} className="text-blue-600 hover:underline">
                  Edit
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(task.id)} className="text-red-600 hover:underline">
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
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