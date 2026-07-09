import { useCallback, useEffect, useRef, useState } from "react";
import { googleLoginUser, ApiError, type AuthUser } from "../../lib/api";
import { authStore } from "../../lib/authStore";
import { toast } from "sonner";

export const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || undefined;

const GIS_SCRIPT = "https://accounts.google.com/gsi/client";

type GoogleAccounts = {
  accounts: {
    id: {
      initialize: (config: Record<string, unknown>) => void;
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
      prompt: (momentListener?: (n: GoogleMoment) => void) => void;
    };
  };
};

type GoogleMoment = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
};

function getGoogle(): GoogleAccounts | null {
  return (window as unknown as { google?: GoogleAccounts }).google ?? null;
}

function loadGoogleScript(): Promise<void> {
  if (getGoogle()?.accounts?.id) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SCRIPT}"]`);
    if (existing) {
      const done = () => resolve();
      if (getGoogle()?.accounts?.id) {
        done();
        return;
      }
      existing.addEventListener("load", done, { once: true });
      existing.addEventListener("error", () => reject(new Error("Google script failed")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google script failed to load"));
    document.head.appendChild(script);
  });
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  onSuccess,
  onLoadingChange,
  successMessage = "Connexion Google réussie.",
  label = "Continuer avec Google",
}: {
  onSuccess: (user: AuthUser) => void;
  onLoadingChange?: (loading: boolean) => void;
  successMessage?: string;
  label?: string;
}) {
  const hiddenRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  const [mounted, setMounted] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);

  onSuccessRef.current = onSuccess;

  const setLoading = useCallback(
    (value: boolean) => {
      setBusy(value);
      onLoadingChange?.(value);
    },
    [onLoadingChange],
  );

  const handleCredential = useCallback(
    async (credential: string) => {
      try {
        setLoading(true);
        const res = await googleLoginUser({ idToken: credential });
        authStore.login(res.data.user);
        toast.success(`Bienvenue, ${res.data.user.firstName} !`, { description: successMessage });
        onSuccessRef.current(res.data.user);
      } catch (err) {
        console.error("Google login failure:", err);
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : typeof err === "string"
            ? err
            : "La connexion Google a échoué.";
        toast.error("Échec de l'authentification Google", { description: msg });
      } finally {
        setLoading(false);
      }
    },
    [setLoading, successMessage],
  );

  const ensureInitialized = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) return false;

    const gId = getGoogle()?.accounts?.id;
    if (!gId) return false;

    if (!initializedRef.current) {
      gId.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential?: string }) => {
          if (response?.credential) {
            void handleCredential(response.credential);
          }
        },
        ux_mode: "popup",
        auto_select: false,
      });
      initializedRef.current = true;
    }

    if (hiddenRef.current && hiddenRef.current.childElementCount === 0) {
      hiddenRef.current.innerHTML = "";
      gId.renderButton(hiddenRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
        type: "standard",
      });
    }

    return true;
  }, [handleCredential]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !GOOGLE_CLIENT_ID) return;

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled) return;
        setScriptReady(true);
        ensureInitialized();
      })
      .catch((err) => {
        console.error(err);
        toast.error("Google Sign-In indisponible", {
          description: "Impossible de charger le script Google.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [mounted, ensureInitialized]);

  const handleClick = () => {
    if (!GOOGLE_CLIENT_ID) return;

    setLoading(true);

    loadGoogleScript()
      .then(() => {
        if (!ensureInitialized()) {
          throw new Error("Google Sign-In not ready");
        }

        const gId = getGoogle()?.accounts?.id;
        if (!gId) throw new Error("Google Sign-In not ready");

        const hiddenBtn =
          hiddenRef.current?.querySelector('[role="button"]') ??
          hiddenRef.current?.querySelector("div");
        if (hiddenBtn instanceof HTMLElement) {
          hiddenBtn.click();
          return;
        }

        gId.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            const reason =
              notification.getNotDisplayedReason?.() ||
              notification.getSkippedReason?.() ||
              "unknown";
            console.warn("Google prompt not shown:", reason);
            toast.error("Connexion Google impossible", {
              description:
                "Vérifiez que http://localhost:5173 est autorisé dans Google Cloud Console.",
            });
            setLoading(false);
          }
        });
      })
      .catch(() => {
        toast.error("Google Sign-In indisponible", {
          description: "Réessayez dans quelques secondes.",
        });
        setLoading(false);
      });
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="text-center text-xs text-ink-soft">
        Google Sign-In non configuré. Ajoutez VITE_GOOGLE_CLIENT_ID dans .env
      </p>
    );
  }

  if (!mounted) {
    return (
      <div className="flex h-11 w-full items-center justify-center rounded-xl border border-border bg-white/60 text-sm text-ink-soft">
        Chargement Google…
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={hiddenRef} className="sr-only" aria-hidden />

      <button
        type="button"
        disabled={busy || !scriptReady}
        onClick={handleClick}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GoogleIcon />
        {busy ? "Connexion…" : !scriptReady ? "Chargement Google…" : label}
      </button>
    </div>
  );
}
