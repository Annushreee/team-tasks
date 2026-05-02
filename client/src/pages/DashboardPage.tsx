import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { EmptyState } from "../components/EmptyState";
import { SkeletonCard } from "../components/Skeleton";
import { formatTaskStatus, relativeDueLabel } from "../lib/format";

type Dashboard = {
  totals: { todo: number; inProgress: number; done: number; overdue: number };
  overdueTasks: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
    project: { id: string; name: string };
    assignee: { id: string; name: string } | null;
  }>;
  myUpcoming: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
    project: { id: string; name: string };
    assignee: { id: string; name: string } | null;
  }>;
};

function Stat({
  label,
  value,
  tone,
  emoji,
}: {
  label: string;
  value: number;
  tone?: string;
  emoji: string;
}) {
  return (
    <div className={`stat ${tone ?? ""}`}>
      <span className={`stat-icon ${tone ?? "todo"}`} aria-hidden>
        {emoji}
      </span>
      <div className="stat-body">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const d = await api<Dashboard>("/api/dashboard");
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="page">
        <div className="banner error" role="alert">
          {error}
        </div>
        <p className="muted small" style={{ marginTop: "0.75rem" }}>
          Check that you are online and the API is running, then refresh the page.
        </p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p className="lead muted">Loading your overview…</p>
        </div>
        <div className="stat-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const totalActive = data.totals.todo + data.totals.inProgress;
  const emptyWorkspace = totalActive === 0 && data.totals.done === 0 && data.overdueTasks.length === 0;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p className="lead muted">Track status, deadlines, and your own open work across every project.</p>
      </header>

      {emptyWorkspace && (
        <EmptyState
          title="You are all caught up"
          description="Create a project to add tasks, or ask a teammate to invite you to theirs."
          action={{ label: "Go to projects", to: "/projects" }}
        />
      )}

      <div className="stat-grid">
        <Stat label="To do" value={data.totals.todo} emoji="○" />
        <Stat label="In progress" value={data.totals.inProgress} emoji="◐" tone="progress" />
        <Stat label="Done" value={data.totals.done} emoji="✓" tone="done" />
        <Stat
          label="Overdue"
          value={data.totals.overdue}
          emoji="!"
          tone={data.totals.overdue ? "danger" : "done"}
        />
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Overdue</h2>
        </div>
        {data.overdueTasks.length === 0 ? (
          <div className="card" style={{ padding: "1.5rem" }}>
            <p className="muted" style={{ margin: 0 }}>
              No overdue tasks. Nice work.
            </p>
          </div>
        ) : (
          <ul className="list card" style={{ padding: "0 1rem", marginBottom: 0 }}>
            {data.overdueTasks.map((t) => (
              <li key={t.id} className="list-item">
                <div>
                  <Link className="task-link" to={`/projects/${t.project.id}`}>
                    {t.title}
                  </Link>
                  <div className="small muted">
                    {t.project.name}
                    {t.assignee ? ` · ${t.assignee.name}` : ""}
                  </div>
                </div>
                <span className="pill danger">{formatTaskStatus(t.status)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>My open tasks</h2>
        </div>
        {data.myUpcoming.length === 0 ? (
          <div className="card" style={{ padding: "1.5rem" }}>
            <p className="muted" style={{ margin: 0 }}>
              Nothing assigned to you or created by you that is still open.
            </p>
          </div>
        ) : (
          <ul className="list card" style={{ padding: "0 1rem", marginBottom: 0 }}>
            {data.myUpcoming.map((t) => {
              const dueHint = relativeDueLabel(t.dueDate);
              return (
                <li key={t.id} className="list-item">
                  <div>
                    <Link className="task-link" to={`/projects/${t.project.id}`}>
                      {t.title}
                    </Link>
                    <div className="small muted">
                      {t.project.name}
                      {dueHint ? ` · ${dueHint}` : ""}
                    </div>
                  </div>
                  <span className="pill warn">{formatTaskStatus(t.status)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
