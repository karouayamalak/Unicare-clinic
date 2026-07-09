/** Matches backend password rules in auth.routes.ts */
export function validatePassword(password: string): string | null {
  if (password.length < 12) return "Minimum 12 caractères.";
  if (!/[A-Z]/.test(password)) return "Au moins une majuscule requise.";
  if (!/[a-z]/.test(password)) return "Au moins une minuscule requise.";
  if (!/[0-9]/.test(password)) return "Au moins un chiffre requis.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Au moins un caractère spécial requis.";
  return null;
}
