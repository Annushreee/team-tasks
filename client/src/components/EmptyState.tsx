import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  title: string;
  description: string;
  action?: { label: string; to: string };
  children?: ReactNode;
};

export function EmptyState({ title, description, action, children }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state-visual" aria-hidden>
        {children ?? <span className="empty-state-dot" />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc muted">{description}</p>
      {action && (
        <Link to={action.to} className="btn primary empty-state-cta">
          {action.label}
        </Link>
      )}
    </div>
  );
}
