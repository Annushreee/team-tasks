import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { EmptyState } from "../components/EmptyState";
import { IconChevronRight } from "../components/icons";
import { Skeleton } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  taskCount: number;
  myRole: string | undefined;
};

export function ProjectsPage() {
  const toast = useToast();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api<{ projects: ProjectRow[] }>("/api/projects");
        if (!cancelled) setProjects(r.projects);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load projects");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await api("/api/projects", {
        method: "POST",
        json: { name, description: description.trim() || null },
      });
      setName("");
      setDescription("");
      const r = await api<{ projects: ProjectRow[] }>("/api/projects");
      setProjects(r.projects);
      toast("Project created. You are the admin.", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Projects</h1>
        <p className="lead muted">
          Each project has its own team, roles, and tasks. Creating a project makes you the <strong>admin</strong>
          —you can invite others by email from the project page.
        </p>
      </header>

      <div className="card card-interactive">
        <div className="section-head">
          <h2>New project</h2>
        </div>
        <form onSubmit={(e) => void createProject(e)} className="form row-form">
          {error && (
            <div className="banner error" role="alert" style={{ width: "100%" }}>
              {error}
            </div>
          )}
          <label className="input-with-hint">
            Name <span className="field-hint">Shown on cards and in the header</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q2 product launch"
              required
            />
          </label>
          <label className="grow input-with-hint">
            Description <span className="field-hint">Optional — a short summary for your team</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Goals, scope, links…"
            />
          </label>
          <button type="submit" className="btn primary" disabled={pending}>
            {pending ? "Creating…" : "Create project"}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="project-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" aria-busy="true">
              <Skeleton className="sk-line sk-w-60" />
              <Skeleton className="sk-line sk-w-80" />
              <Skeleton className="sk-line sk-w-40" style={{ marginTop: "1rem" }} />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Use the form above to create your first project. You will be the admin and can invite teammates from the project page."
        />
      ) : (
        <ul className="project-grid">
          {projects.map((p) => (
            <li key={p.id}>
              <Link to={`/projects/${p.id}`} className="card project-card card-interactive">
                <h3>{p.name}</h3>
                {p.description ? (
                  <p className="muted small" style={{ margin: 0, flex: 1 }}>
                    {p.description}
                  </p>
                ) : (
                  <p className="muted small" style={{ margin: 0, flex: 1, fontStyle: "italic" }}>
                    No description
                  </p>
                )}
                <div className="project-meta">
                  <span className={`pill ${p.myRole === "ADMIN" ? "ok" : ""}`}>{p.myRole ?? "Member"}</span>
                  <span className="muted small">
                    {p.taskCount} task{p.taskCount === 1 ? "" : "s"}
                  </span>
                  <span className="muted small" style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
                    Open <IconChevronRight className="nav-icon" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
