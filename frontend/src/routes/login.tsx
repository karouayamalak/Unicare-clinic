import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { AuthButton, AuthField, AuthLayout } from "../components/layouts/AuthLayout";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import { loginUser, ApiError, type AuthUser } from "../lib/api";
import { authStore } from "../lib/authStore";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const getRedirect = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const r = params.get("redirect");
      if (r && r.startsWith("/")) return r;
    } catch {
      /* ignore */
    }
    return null;
  };

  const handleGoogleSuccess = useCallback(
    (user: AuthUser) => {
      authStore.login(user);
      nav({ to: getRedirect() ?? (authStore.dashboardFor(user) as "/") });
    },
    [nav],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await loginUser({ email, password });
      authStore.login(res.data.user);
      toast.success(`Bienvenue, ${res.data.user.firstName} !`, {
        description: "Connexion réussie.",
      });
      nav({ to: getRedirect() ?? (authStore.dashboardFor(res.data.user) as "/") });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Une erreur est survenue.";
      toast.error("Connexion échouée", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Bon retour."
      subtitle="Connectez-vous pour accéder à vos rendez-vous et dossiers médicaux."
      footer={
        <>
          Nouveau sur UniCare?{" "}
          <Link to="/signup" className="font-semibold text-teal hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          label="Email"
          type="email"
          placeholder="vous@clinique.dz"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthField
          label="Mot de passe"
          type="password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-ink-soft cursor-pointer select-none">
            <input type="checkbox" className="rounded accent-teal" />
            Se souvenir de moi
          </label>
          <Link to="/forgot-password" className="font-semibold text-teal hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>

        <AuthButton type="submit" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </AuthButton>

        <div className="relative flex items-center gap-3 py-1">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-ink-soft/50">ou continuer avec</span>
          <div className="flex-1 border-t border-border" />
        </div>

        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onLoadingChange={setLoading}
          successMessage="Connexion Google réussie."
        />
      </form>
    </AuthLayout>
  );
}
