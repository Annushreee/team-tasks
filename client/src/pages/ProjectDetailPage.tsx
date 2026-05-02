import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../context/ToastContext";
import { formatTaskStatus, initials, relativeDueLabel } from "../lib/format";

type Member = { userId: string; email: string; name: string; role: string };
type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  assignee: { id: string; email: string; name: string } | null;
  createdBy: { id: string; name: string };
};

type ProjectPayload = {
  project: {
    id: string;
    name: string;
    description: string | null;
    myRole?: string;
    members: Member[];
    tasks: Task[];
  };
};

const STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
const COL_LABEL: Record<string, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export function ProjectDetailPage() {
  const toast = useToast();
  const { projectId } = useParams();
  const [data, setData] = useState<ProjectPayload["project"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskQuery, setTaskQuery] = useState("");

  const isAdmin = data?.myRole === "ADMIN";

  async function load() {
    if (!projectId) return;
    const r = await api<ProjectPayload>(`/api/projects/${projectId}`);
    setData(r.project);
  }

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await api<ProjectPayload>(`/api/projects/${projectId}`);
        if (!cancelled) setData(r.project);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const filteredTasks = useMemo(() => {
    const tasks = data?.tasks ?? [];
    const q = taskQuery.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false) ||
        t.assignee?.name.toLowerCase().includes(q),
    );
  }, [data?.tasks, taskQuery]);

  const byStatus = useMemo(() => {
    return {
      TODO: filteredTasks.filter((t) => t.status === "TODO"),
      IN_PROGRESS: filteredTasks.filter((t) => t.status === "IN_PROGRESS"),
      DONE: filteredTasks.filter((t) => t.status === "DONE"),
    };
  }, [filteredTasks]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    setError(null);
    try {
      await api(`/api/projects/${projectId}/members`, {
        method: "POST",
        json: { email: inviteEmail, role: inviteRole },
      });
      setInviteEmail("");
      await load();
      toast("Teammate added to the project.", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invite failed";
      setError(msg);
      toast(msg, "error");
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    setError(null);
    try {
      await api(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        json: {
          title: taskTitle,
          dueDate: taskDue ? new Date(taskDue).toISOString() : null,
        },
      });
      setTaskTitle("");
      setTaskDue("");
      await load();
      toast("Task added.", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create task";
      setError(msg);
      toast(msg, "error");
    }
  }

  async function updateTask(task: Task, patch: Record<string, unknown>) {
    if (!projectId) return;
    setError(null);
    try {
      await api(`/api/projects/${projectId}/tasks/${task.id}`, {
        method: "PATCH",
        json: patch,
      });
      await load();
      toast("Task updated.", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setError(msg);
      toast(msg, "error");
    }
  }

  async function removeTask(task: Task) {
    if (!projectId) return;
    if (!window.confirm(`Delete task “${task.title}”?`)) return;
    setError(null);
    try {
      await api(`/api/projects/${projectId}/tasks/${task.id}`, { method: "DELETE" });
      await load();
      toast("Task removed.", "info");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      setError(msg);
      toast(msg, "error");
    }
  }

  async function changeMemberRole(userId: string, role: "ADMIN" | "MEMBER") {
    if (!projectId) return;
    setError(null);
    try {
      await api(`/api/projects/${projectId}/members/${userId}`, {
        method: "PATCH",
        json: { role },
      });
      await load();
      toast("Role updated.", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Role update failed";
      setError(msg);
      toast(msg, "error");
    }
  }

  async function removeMember(userId: string) {
    if (!projectId) return;
    if (!window.confirm("Remove this member from the project?")) return;
    setError(null);
    try {
      await api(`/api/projects/${projectId}/members/${userId}`, { method: "DELETE" });
      await load();
      toast("Member removed.", "info");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Remove failed";
      setError(msg);
      toast(msg, "error");
    }
  }

  if (error && !data) {
    return (
      <div className="page">
        <div className="banner error" role="alert">
          {error}
        </div>
        <p className="muted small" style={{ marginTop: "0.75rem" }}>
          You may not have access to this project, or the link is wrong.
        </p>
        <Link to="/projects" className="btn secondary" style={{ marginTop: "1rem", display: "inline-block" }}>
          Back to projects
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Project</h1>
          <p className="lead muted">Loading…</p>
        </div>
        <div className="card">
          <div className="skeleton sk-line sk-w-40" />
          <div className="skeleton sk-line sk-w-80" style={{ marginTop: "0.5rem" }} />
        </div>
      </div>
    );
  }

  const memberOptions = data.members;

  function TaskCard({ task }: { task: Task }) {
    const due = relativeDueLabel(task.dueDate);
    return (
      <div className="task-card">
        <p className="task-card-title">{task.title}</p>
        <div className="task-card-meta">
          {[due, task.assignee?.name].filter(Boolean).join(" · ") || "No due date · unassigned"}
        </div>
        {task.description && <p className="small muted" style={{ margin: "0 0 0.5rem" }}>{task.description}</p>}
        <div className="task-card-actions">
          <select
            value={task.status}
            aria-label={`Status for ${task.title}`}
            onChange={(e) => void updateTask(task, { status: e.target.value })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatTaskStatus(s)}
              </option>
            ))}
          </select>
          <select
            value={task.assignee?.id ?? ""}
            aria-label={`Assignee for ${task.title}`}
            onChange={(e) =>
              void updateTask(task, {
                assigneeId: e.target.value || null,
              })
            }
          >
            <option value="">Unassigned</option>
            {memberOptions.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            aria-label={`Due date for ${task.title}`}
            value={task.dueDate ? task.dueDate.slice(0, 10) : ""}
            onChange={(e) =>
              void updateTask(task, {
                dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
              })
            }
          />
          <button type="button" className="btn danger-ghost small" onClick={() => void removeTask(task)}>
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/projects">Projects</Link>
        <span className="muted" aria-hidden>
          /
        </span>
        <span>{data.name}</span>
      </nav>

      <header className="page-header" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: "0.75rem" }}>
        <div style={{ flex: "1 1 200px" }}>
          <h1 style={{ marginBottom: "0.35rem" }}>{data.name}</h1>
          {data.description ? (
            <p className="lead muted" style={{ margin: 0 }}>
              {data.description}
            </p>
          ) : (
            <p className="lead muted" style={{ margin: 0, fontStyle: "italic" }}>
              No description yet.
            </p>
          )}
        </div>
        <span className={isAdmin ? "role-badge" : "role-badge member"}>{isAdmin ? "Admin" : "Member"}</span>
      </header>

      {error && (
        <div className="banner error" role="alert" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div className="two-col">
        <section className="card section" style={{ marginTop: 0 }}>
          <div className="section-head">
            <h2>Tasks</h2>
          </div>
          <p className="small muted" style={{ marginTop: 0, marginBottom: "1rem" }}>
            Drag-free board: tasks are grouped by status. Change status or assignee from any card.
          </p>

          <form onSubmit={(e) => void addTask(e)} className="form row-form" style={{ marginBottom: "1rem" }}>
            <label className="grow">
              New task title
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
              />
            </label>
            <label>
              Due date
              <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
            </label>
            <button type="submit" className="btn primary">
              Add task
            </button>
          </form>

          <div className="task-toolbar">
            <input
              type="search"
              className="search-input"
              placeholder="Search tasks by title, description, or assignee…"
              value={taskQuery}
              onChange={(e) => setTaskQuery(e.target.value)}
              aria-label="Filter tasks"
            />
            {taskQuery && (
              <button type="button" className="btn ghost btn-sm" onClick={() => setTaskQuery("")}>
                Clear filter
              </button>
            )}
          </div>

          {data.tasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              description="Add your first task above. Set optional due dates and assign teammates once tasks exist."
            />
          ) : (
            <div className="board">
              {STATUSES.map((status) => (
                <div key={status} className="board-col">
                  <div className="board-col-header">
                    <span className="board-col-title">{COL_LABEL[status]}</span>
                    <span className="board-col-count">{byStatus[status].length}</span>
                  </div>
                  {byStatus[status].length === 0 ? (
                    <p className="muted small" style={{ margin: "0.5rem 0.25rem" }}>
                      None
                    </p>
                  ) : (
                    byStatus[status].map((t) => <TaskCard key={t.id} task={t} />)
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="card section team-card" style={{ marginTop: 0 }}>
          <div className="section-head">
            <h2>Team</h2>
          </div>
          <p className="small muted" style={{ marginTop: 0 }}>
            {isAdmin
              ? "Invite people by email (they must sign up first). You can promote members to admin when needed."
              : "Only admins can add or remove members. You can still work on all tasks in this project."}
          </p>
          {isAdmin && (
            <form onSubmit={(e) => void invite(e)} className="form" style={{ marginBottom: "1rem" }}>
              <label>
                Email address
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                />
              </label>
              <label>
                Role
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}>
                  <option value="MEMBER">Member — can work on tasks</option>
                  <option value="ADMIN">Admin — can manage project & team</option>
                </select>
              </label>
              <button type="submit" className="btn secondary">
                Invite to project
              </button>
            </form>
          )}
          <div>
            {data.members.map((m) => (
              <div key={m.userId} className="member-row">
                <span className="member-avatar" aria-hidden>
                  {initials(m.name)}
                </span>
                <div className="member-info">
                  <div className="member-name">{m.name}</div>
                  <div className="member-email">{m.email}</div>
                </div>
                {isAdmin ? (
                  <div className="row gap" style={{ justifyContent: "flex-end" }}>
                    <select
                      value={m.role}
                      aria-label={`Role for ${m.name}`}
                      onChange={(e) => void changeMemberRole(m.userId, e.target.value as "ADMIN" | "MEMBER")}
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button type="button" className="btn ghost small" onClick={() => void removeMember(m.userId)}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className="pill">{m.role}</span>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
