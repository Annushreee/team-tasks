import type { PasswordStrength } from "../../lib/passwordStrength";

type Props = {
  strength: PasswordStrength;
  showWhenEmpty?: boolean;
};

export function PasswordStrengthMeter({ strength, showWhenEmpty }: Props) {
  const { score, label, checks } = strength;
  const hasInput = Object.values(checks).some(Boolean) || score > 0;
  if (!hasInput && !showWhenEmpty) return null;

  return (
    <div className="pw-meter" aria-live="polite">
      <div className="pw-meter-head">
        <span className="pw-meter-label">Password strength</span>
        <span className={`pw-meter-badge pw-meter-${label.toLowerCase()}`}>{label}</span>
      </div>
      <div className={`pw-meter-bars pw-score-${score}`} role="presentation">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`pw-meter-bar ${i < score ? "active" : ""}`} />
        ))}
      </div>
      <ul className="pw-meter-checks">
        <li className={checks.length ? "ok" : ""}>At least 8 characters</li>
        <li className={checks.upper && checks.lower ? "ok" : ""}>Upper & lowercase letters</li>
        <li className={checks.number ? "ok" : ""}>One number</li>
        <li className={checks.symbol ? "ok" : ""}>One symbol (recommended)</li>
      </ul>
    </div>
  );
}
