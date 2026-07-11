import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { AuthButton, AuthField, AuthLayout } from "../components/layouts/AuthLayout";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import { loginUser, verifyLoginOtp, ApiError, type AuthUser } from "../lib/api";
import { authStore } from "../lib/authStore";
import { ShieldCheck, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP step state
  const [otpStep, setOtpStep] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // Step 1: Submit email + password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      if (res.status === "otp_required") {
        setPendingEmail(res.data.email ?? email);
        setOtpStep(true);
        toast.success("Code envoyé !", {
          description: "Vérifiez votre boîte email pour le code à 6 chiffres.",
        });
      } else if (res.data.user) {
        // Fallback: direct login (dev mode / Google)
        authStore.login(res.data.user);
        nav({ to: getRedirect() ?? (authStore.dashboardFor(res.data.user) as "/") });
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Une erreur est survenue.";
      toast.error("Connexion échouée", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: OTP digit input handling
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Veuillez entrer les 6 chiffres du code.");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyLoginOtp({ email: pendingEmail, otp: code });
      authStore.login(res.data.user);
      toast.success(`Bienvenue, ${res.data.user.firstName} !`, {
        description: "Connexion réussie.",
      });
      nav({ to: getRedirect() ?? (authStore.dashboardFor(res.data.user) as "/") });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Code invalide.";
      toast.error("Vérification échouée", { description: msg });
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setOtp(["", "", "", "", "", ""]);
    try {
      await loginUser({ email, password });
      toast.success("Nouveau code envoyé !", { description: "Vérifiez votre email." });
    } catch {
      toast.error("Impossible de renvoyer le code.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Step UI ──
  if (otpStep) {
    return (
      <AuthLayout
        title="Vérification"
        subtitle={`Un code à 6 chiffres a été envoyé à ${pendingEmail}`}
        footer={
          <button
            onClick={() => { setOtpStep(false); setOtp(["", "", "", "", "", ""]); }}
            className="font-semibold text-teal hover:underline cursor-pointer"
          >
            ← Retour à la connexion
          </button>
        }
      >
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          {/* OTP visual badge */}
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 border border-teal/20">
              <ShieldCheck className="h-7 w-7 text-teal" />
            </div>
          </div>

          {/* 6-digit boxes */}
          <div className="flex justify-center gap-3">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={i === 0 ? handleOtpPaste : undefined}
                className="h-14 w-12 rounded-xl border-2 border-border bg-white text-center text-xl font-bold text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
                autoFocus={i === 0}
              />
            ))}
          </div>

          <AuthButton type="submit" disabled={loading || otp.join("").length < 6}>
            {loading ? "Vérification…" : "Valider le code"}
          </AuthButton>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-sm text-ink-soft hover:text-teal transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Renvoyer le code
          </button>
        </form>
      </AuthLayout>
    );
  }

  // ── Credentials Step UI ──
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
