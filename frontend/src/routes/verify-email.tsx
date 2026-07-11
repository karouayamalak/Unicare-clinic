import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthButton, AuthField, AuthLayout } from "../components/layouts/AuthLayout";
import { verifyEmail, ApiError } from "../lib/api";
import { z } from "zod";

export const Route = createFileRoute("/verify-email")({
  validateSearch: z.object({ email: z.string().optional() }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const nav = useNavigate();
  const { email: prefillEmail } = Route.useSearch();
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Le code doit contenir exactement 6 chiffres.");
      return;
    }
    setLoading(true);
    try {
      await verifyEmail({ email, code });
      toast.success("Email vérifié !", { description: "Vous pouvez maintenant vous connecter." });
      nav({ to: "/login" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Code invalide ou expiré.";
      toast.error("Vérification échouée", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Vérifiez votre email."
      subtitle="Entrez l'adresse e-mail et le code à 6 chiffres reçu dans votre boîte mail."
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
          label="Code de vérification"
          type="text"
          placeholder="123456"
          required
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />
        <AuthButton type="submit" disabled={loading}>
          {loading ? "Vérification…" : "Vérifier mon email"}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}
