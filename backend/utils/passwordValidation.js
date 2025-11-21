export const PASSWORD_RULES = [
  {
    id: "minLength",
    label: "At least 8 characters",
    test: (password = "") => typeof password === "string" && password.length >= 8,
  },
  {
    id: "uppercase",
    label: "At least one uppercase letter (A-Z)",
    test: (password = "") => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "At least one lowercase letter (a-z)",
    test: (password = "") => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "At least one number (0-9)",
    test: (password = "") => /[0-9]/.test(password),
  },
  {
    id: "special",
    label: "At least one special character (!@#$%^&*)",
    test: (password = "") => /[!@#$%^&*]/.test(password),
  },
];

export function validatePassword(password = "") {
  const results = PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    passed: rule.test(password),
  }));

  const errors = results.filter((r) => !r.passed).map((r) => r.label);
  const passedCount = results.filter((r) => r.passed).length;

  let strength = "Weak";
  if (password.length >= 8 && passedCount >= 3) strength = "Medium";
  if (password.length >= 12 && passedCount >= PASSWORD_RULES.length) strength = "Strong";

  return {
    isValid: errors.length === 0,
    errors,
    rules: results,
    strength,
  };
}
