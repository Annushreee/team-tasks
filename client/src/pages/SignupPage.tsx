import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { PasswordStrengthMeter } from "../components/auth/PasswordStrengthMeter";
import { useAuth } from "../context/AuthContext";
import { evaluatePassword } from "../lib/passwordStrength";

const FEATURES = [
  {
    title: "You start as admin",
    description: "Your first project is yours to configure—invite people when they have accounts.",
  },
  {
    title: "Tasks & deadlines",
    description: "Assign work, track status, and catch overdue items on the dashboard.",
  },
  {
    title: "Built for teams",
    description: "Members see shared projects; admins control who joins and project settings.",
  },
];

export function SignupPage() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [shakeToken, setShakeToken] = useState(0);

  const strength = useMemo(() => evaluatePassword(password), [password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!strength.checks.length) {
      setError("Password must be at least 8 characters.");
      setShakeToken((t) => t + 1);
      return;
    }
    setPending(true);
    try {
      await signup(email, password, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
      setShakeToken((t) => t + 1);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Get started"
      headline="Create your workspace"
      subcopy="Free to start. Set up your profile in a minute—then spin up your first project and invite the team."
      features={FEATURES}
      swapHref="/login"
      swapLabel="I already have an account"
      footer={
        <p className="auth-muted-footer">
          Already registered? <Link to="/login">Sign in instead</Link>
        </p>
      }
    >
      <div className="auth-card-head">
        <h1 className="auth-title">Sign up</h1>
        <p className="auth-lead muted">
          Tell us who you are. Choose a strong password to protect your workspace.
        </p>
      </div>

      <div className="auth-steps" aria-hidden>
        <span className="auth-step active">1 · Account</span>
        <span className="auth-step-div">→</span>
        <span className="auth-step">2 · First project</span>
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
          <span className="auth-field-label">Full name</span>
          <div className="auth-input-wrap">
            <span className="auth-input-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Morgan"
              required
              minLength={1}
              autoComplete="name"
            />
          </div>
        </label>

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
              autoComplete="new-password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
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

        <PasswordStrengthMeter strength={strength} showWhenEmpty />

        <button type="submit" className="btn auth-submit primary" disabled={pending}>
          {pending ? (
            <span className="auth-btn-inner">
              <span className="auth-spinner" aria-hidden />
              Creating your account…
            </span>
          ) : (
            "Create account & continue"
          )}
        </button>
      </form>

      <p className="auth-terms">
        By continuing you agree to use this app responsibly. We store only what is needed to run projects and
        tasks.
      </p>
    </AuthLayout>
  );
}
