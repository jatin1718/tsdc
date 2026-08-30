// Save this file as: components/ProjectHeader.tsx
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
  planning: "bg-gray-100 text-gray-700",
  active: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

// ONE place that renders "everything about a project" — used on both the
// admin and teammate project-detail pages. Before this, the same block of
// JSX would've been copy-pasted in two files; now a change here updates both.
export default function ProjectHeader({ project, completedCount, totalCount }: ProjectHeaderProps) {
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const status = project.status || "active";

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm mt-3 mb-6">
      <div className="flex justify-between items-start flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${STATUS_STYLES[status]}`}>
          {status}
        </span>
      </div>

      <p className="text-gray-500 mt-1">{project.description}</p>

      {project.techStack && (
        <div className="flex flex-wrap gap-2 mt-3">
          {project.techStack.split(",").map((tech) => (
            <span
              key={tech.trim()}
              className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded font-medium"
            >
              {tech.trim()}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
        {project.startDate && <span>Start: {project.startDate}</span>}
        {project.deadline && <span>Deadline: {project.deadline}</span>}
        {project.githubLink && (
          <a
            href={project.githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            GitHub Repo &rarr;
          </a>
        )}
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
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
  );
}
