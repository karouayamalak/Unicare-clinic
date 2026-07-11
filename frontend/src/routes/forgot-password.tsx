import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthButton, AuthField, AuthLayout } from "@/components/layouts/AuthLayout";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Réinitialiser le mot de passe — UniCare" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  return (
    <AuthLayout
      title="Réinitialisez votre mot de passe."
      subtitle="Entrez votre email et nous vous enverrons un lien de réinitialisation sécurisé."
      footer={
        <>
          Vous vous en souvenez ?{" "}
          <Link to="/login" className="font-medium text-teal hover:underline">
            Retour à la connexion
          </Link>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Lien de réinitialisation envoyé à votre email");
        }}
        className="space-y-5"
      >
        <AuthField label="Email" type="email" placeholder="vous@unicare.dz" required />
        <AuthButton type="submit">Envoyer le lien de réinitialisation</AuthButton>
      </form>
    </AuthLayout>
  );
}
