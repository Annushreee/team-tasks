export type PasswordStrength = {
  score: number; // 0–4
  label: "Weak" | "Fair" | "Good" | "Strong";
  checks: {
    length: boolean;
    lower: boolean;
    upper: boolean;
    number: boolean;
    symbol: boolean;
  };
};

export function evaluatePassword(password: string): PasswordStrength {
  const length = password.length >= 8;
  const lower = /[a-z]/.test(password);
  const upper = /[A-Z]/.test(password);
  const number = /\d/.test(password);
  const symbol = /[^A-Za-z0-9]/.test(password);

  let points = 0;
  if (length) points += 1;
  if (lower) points += 0.35;
  if (upper) points += 0.35;
  if (number) points += 0.4;
  if (symbol) points += 0.5;
  if (password.length >= 12) points += 0.4;
  if (password.length >= 16) points += 0.3;

  const score = Math.min(4, Math.floor(points));

  let label: PasswordStrength["label"] = "Weak";
  if (score >= 3) label = "Strong";
  else if (score === 2) label = "Good";
  else if (score === 1) label = "Fair";

  return {
    score,
    label,
    checks: { length, lower, upper, number, symbol },
  };
}
