// Save this file as: components/TaskCard.tsx  (REPLACES current file)
"use client";

interface Task {
  id: string;
  projectName?: string;
  title: string;
  description: string;
  assignedTo?: string[]; // array of teammate UIDs — a task can now have multiple contributors
  assignedToNames?: string[]; // parallel array — assignedToNames[i] is the name for assignedTo[i]
  completedBy?: string[]; // UIDs of contributors who've marked THEIR OWN part done
  deadline: string;
  status: "pending" | "completed";
}

interface TaskCardProps {
  task: Task;
  showProject?: boolean;
  showAssignee?: boolean; // force-show contributor chips even for a single assignee (used in Admin/History)
  currentUserId?: string; // used to decide if the "Mark My Part" button applies to the person viewing this card
  onMarkComplete?: (taskId: string) => void; // marks the CURRENT user's own part as done
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskCard({
  task,
  showProject,
  showAssignee,
  currentUserId,
  onMarkComplete,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const assignedTo = task.assignedTo || [];
  const completedBy = task.completedBy || [];
  const isMultiAssignee = assignedTo.length > 1;

  // Chips are always shown for multi-assignee tasks (useful team context),
  // and shown for single-assignee tasks only when explicitly requested
  // (Admin/History views) — a teammate's own single-assignee task doesn't
  // need an "Assigned to: you" chip cluttering their own dashboard.
  const showChips = showAssignee || isMultiAssignee;

  const currentUserIsContributor = !!currentUserId && assignedTo.includes(currentUserId);
  const currentUserAlreadyDone = !!currentUserId && completedBy.includes(currentUserId);

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
          {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
          <p className="text-sm text-gray-500 mt-1">Deadline: {task.deadline}</p>

          {showChips && assignedTo.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {assignedTo?.map((uid, i) => {
                const name = task.assignedToNames?.[i] || "Unknown";
                const done = completedBy.includes(uid);
                return (
                  <span
                    key={uid}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {done ? "✓ " : ""}
                    {name}
                  </span>
                );
              })}
            </div>
          )}
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
          {isMultiAssignee && (
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {completedBy.length}/{assignedTo.length} done
            </span>
          )}
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

      {onMarkComplete && currentUserIsContributor && !currentUserAlreadyDone && (
        <button
          onClick={() => onMarkComplete(task.id)}
          className="mt-3 bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 transition"
        >
          {isMultiAssignee ? "Mark My Part as Done" : "Mark as Completed"}
        </button>
      )}
    </div>
  );
}