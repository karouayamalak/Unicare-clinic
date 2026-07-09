import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { AuthButton, AuthField, AuthLayout } from "../components/layouts/AuthLayout";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import { registerUser, ApiError, type AuthUser } from "../lib/api";
import { validatePassword } from "../lib/passwordValidation";
import { authStore } from "../lib/authStore";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = useCallback(
    (user: AuthUser) => {
      authStore.login(user);
      nav({ to: authStore.dashboardFor(user) as "/" });
    },
    [nav],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error("Mot de passe invalide", { description: passwordError });
      return;
    }

    if (password !== passwordConfirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await registerUser({ firstName, lastName, email, password });
      toast.success("Compte créé !", {
        description: `Un code à 6 chiffres a été envoyé à ${email}`,
      });
      nav({ to: "/verify-email" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Une erreur est survenue.";
      toast.error("Inscription échouée", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Créez votre compte."
      subtitle="Deux minutes. Gratuit. Sans paperasse."
      footer={
        <>
          Déjà un compte?{" "}
          <Link to="/login" className="font-semibold text-teal hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField
            label="Prénom"
            placeholder="Amina"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <AuthField
            label="Nom de famille"
            placeholder="Bouzid"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

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
          placeholder="12 caractères minimum, majuscule, chiffre, symbole"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <AuthField
          label="Confirmer le mot de passe"
          type="password"
          placeholder="Retapez votre mot de passe"
          required
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
        />

        <label className="flex items-start gap-2.5 text-xs text-ink-soft cursor-pointer">
          <input type="checkbox" required className="mt-0.5 rounded accent-teal" />
          <span>
            J'accepte les <span className="font-semibold text-teal">Conditions d'utilisation</span> et la <span className="font-semibold text-teal">Politique de confidentialité</span>.
          </span>
        </label>

        <AuthButton type="submit" disabled={loading}>
          {loading ? "Création en cours…" : "Créer mon compte gratuit"}
        </AuthButton>

        <div className="relative flex items-center gap-3 py-1">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-ink-soft/50">ou s'inscrire avec</span>
          <div className="flex-1 border-t border-border" />
        </div>

        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onLoadingChange={setLoading}
          successMessage="Inscription Google réussie."
          label="S'inscrire avec Google"
        />
      </form>
    </AuthLayout>
  );
}
