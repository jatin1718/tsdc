"use client";

interface Task {
  id: string;
  projectName?: string;
  title: string;
  description: string;
  assignedTo?: string[];
  assignedToNames?: string[];
  completedBy?: string[];
  deadline: string;
  status: "pending" | "completed";
}

interface TaskCardProps {
  task: Task;
  showProject?: boolean;
  showAssignee?: boolean;
  currentUserId?: string;
  onMarkComplete?: (taskId: string) => void;
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
  const showChips = showAssignee || isMultiAssignee;

  const currentUserIsContributor = !!currentUserId && assignedTo.includes(currentUserId);
  const currentUserAlreadyDone = !!currentUserId && completedBy.includes(currentUserId);

  const isDone = task.status === "completed";

  return (
    <div
      className={`p-4 bg-white border rounded-lg border-l-[3px] ${
        isDone ? "border-zinc-200 border-l-emerald-400" : "border-zinc-200 border-l-amber-400"
      }`}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          {showProject && task.projectName && (
            <span className="inline-block text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded mb-1.5">
              {task.projectName}
            </span>
          )}
          <h3 className="font-semibold text-zinc-900">{task.title}</h3>
          {task.description && <p className="text-sm text-zinc-500 mt-0.5">{task.description}</p>}
          <p className="text-sm text-zinc-400 mt-1.5">Deadline: {task.deadline}</p>

          {showChips && assignedTo.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {assignedTo.map((uid, i) => {
                const name = task.assignedToNames?.[i] || "Unknown";
                const done = completedBy.includes(uid);
                return (
                  <span
                    key={uid}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      done ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
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

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              isDone ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {task.status}
          </span>
          {isMultiAssignee && (
            <span className="text-xs text-zinc-400 whitespace-nowrap">
              {completedBy.length}/{assignedTo.length} done
            </span>
          )}
          {(onEdit || onDelete) && (
            <div className="flex gap-2 text-xs mt-1">
              {onEdit && (
                <button onClick={() => onEdit(task)} className="text-indigo-600 hover:underline">
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
          className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition"
        >
          {isMultiAssignee ? "Mark My Part as Done" : "Mark as Completed"}
        </button>
      )}
    </div>
  );
}