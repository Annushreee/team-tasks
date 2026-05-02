import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export type AuthFeature = { title: string; description: string };

type Props = {
  eyebrow: string;
  headline: string;
  subcopy: string;
  features: AuthFeature[];
  swapHref: string;
  swapLabel: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthLayout({
  eyebrow,
  headline,
  subcopy,
  features,
  swapHref,
  swapLabel,
  children,
  footer,
}: Props) {
  return (
    <div className="auth-root">
      <header className="auth-chrome">
        <Link to="/" className="auth-chrome-brand" aria-label="Team Tasks home">
          <span className="auth-chrome-mark">TT</span>
          <span className="auth-chrome-name">Team Tasks</span>
        </Link>
        <Link to={swapHref} className="auth-chrome-cta">
          {swapLabel}
        </Link>
      </header>

      <div className="auth-shell">
        <aside className="auth-aside">
          <div className="auth-aside-bg" aria-hidden />
          <div className="auth-aside-inner">
            <p className="auth-eyebrow">{eyebrow}</p>
            <h2 className="auth-headline">{headline}</h2>
            <p className="auth-subcopy">{subcopy}</p>

            <ul className="auth-feature-list">
              {features.map((f) => (
                <li key={f.title} className="auth-feature-item">
                  <span className="auth-feature-icon" aria-hidden>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </span>
                  <div>
                    <strong className="auth-feature-title">{f.title}</strong>
                    <p className="auth-feature-desc">{f.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="auth-stats" aria-hidden>
              <div className="auth-stat">
                <span className="auth-stat-num">RBAC</span>
                <span className="auth-stat-label">Admin & member</span>
              </div>
              <div className="auth-stat">
                <span className="auth-stat-num">REST</span>
                <span className="auth-stat-label">Prisma + Postgres</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="auth-panel">
          <div className="auth-glass">{children}</div>
          <div className="auth-footer-links">{footer}</div>
        </div>
      </div>
    </div>
  );
}
