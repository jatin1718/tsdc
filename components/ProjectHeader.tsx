"use client";

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

interface ProjectHeaderProps {
  project: Project;
  completedCount: number;
  totalCount: number;
}

const STATUS_STYLES: Record<string, string> = {
  planning: "bg-zinc-100 text-zinc-600",
  active: "bg-indigo-50 text-indigo-700",
  completed: "bg-emerald-50 text-emerald-700",
};

export default function ProjectHeader({ project, completedCount, totalCount }: ProjectHeaderProps) {
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const status = project.status || "active";

  return (
    <div className="bg-white p-6 rounded-lg border border-zinc-200 mt-3 mb-6">
      <div className="flex justify-between items-start flex-wrap gap-2">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">{project.name}</h1>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status]}`}>
          {status}
        </span>
      </div>

      <p className="text-zinc-500 mt-1">{project.description}</p>

      {project.techStack && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {project.techStack.split(",").map((tech) => (
            <span
              key={tech.trim()}
              className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md font-medium"
            >
              {tech.trim()}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-4 mt-3 text-sm text-zinc-500">
        {project.startDate && <span>Start: {project.startDate}</span>}
        {project.deadline && <span>Deadline: {project.deadline}</span>}
        {project.githubLink && (
          <a
            href={project.githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline font-medium"
          >
            GitHub Repo
          </a>
        )}
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm text-zinc-500 mb-1.5">
          <span>Progress</span>
          <span>
            {completedCount}/{totalCount} tasks completed ({progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-zinc-100 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}