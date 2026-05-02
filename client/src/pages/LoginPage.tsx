import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  {
    title: "Role-based access",
    description: "Project admins manage members; everyone collaborates on tasks.",
  },
  {
    title: "Live dashboard",
    description: "See overdue work and your open tasks across projects at a glance.",
  },
  {
    title: "Secure sessions",
    description: "HTTP-only cookies and validated APIs—no tokens in localStorage.",
  },
];

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [shakeToken, setShakeToken] = useState(0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setShakeToken((t) => t + 1);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Operations workspace"
      headline="Welcome back"
      subcopy="Pick up where you left off—projects, tasks, and team context in one place."
      features={FEATURES}
      swapHref="/signup"
      swapLabel="Create account"
      footer={
        <p className="auth-muted-footer">
          New to Team Tasks? <Link to="/signup">Sign up free</Link>
        </p>
      }
    >
      <div className="auth-card-head">
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-lead muted">Use your work email and password. We will keep you signed in securely.</p>
      </div>

      <form
        key={shakeToken}
        onSubmit={(e) => void onSubmit(e)}
        className={`form auth-form ${error ? "auth-form-shake" : ""}`}
      >
        {error && (
          <div className="banner error auth-alert" role="alert">
            <span className="auth-alert-icon" aria-hidden>
              !
            </span>
            <span>{error}</span>
          </div>
        )}

        <label className="auth-field">
          <span className="auth-field-label">Work email</span>
          <div className="auth-input-wrap">
            <span className="auth-input-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </label>

        <label className="auth-field">
          <span className="auth-field-label">Password</span>
          <div className="password-wrap auth-input-wrap auth-input-wrap--pw">
            <span className="auth-input-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
            </span>
            <input
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              tabIndex={-1}
              onClick={() => setShowPw((s) => !s)}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <button type="submit" className="btn auth-submit primary" disabled={pending}>
          {pending ? (
            <span className="auth-btn-inner">
              <span className="auth-spinner" aria-hidden />
              Signing in…
            </span>
          ) : (
            "Continue to dashboard"
          )}
        </button>
      </form>

      <p className="auth-security-note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
        </svg>
        Encrypted connection · Session stored in an HTTP-only cookie
      </p>
    </AuthLayout>
  );
}
