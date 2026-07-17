import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { googleLoginUser, ApiError, type AuthUser } from "@/lib/api";
import { authStore } from "@/lib/authStore";
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
      // Poll for window.google to be populated (handles race condition when async/defer loads it early)
      let attempts = 0;
      const interval = setInterval(() => {
        if (getGoogle()?.accounts?.id) {
          clearInterval(interval);
          resolve();
        } else if (attempts > 60) { // 3 seconds timeout
          clearInterval(interval);
          reject(new Error("Google Identity Services script failed to initialize."));
        }
        attempts++;
      }, 50);
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      let attempts = 0;
      const interval = setInterval(() => {
        if (getGoogle()?.accounts?.id) {
          clearInterval(interval);
          resolve();
        } else if (attempts > 40) { // 2 seconds timeout
          clearInterval(interval);
          resolve(); // Resolve anyway to let it fail gracefully
        }
        attempts++;
      }, 50);
    };
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
  const nav = useNavigate();
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
        const res = await googleLoginUser({ idToken: credential }) as any;
        
        if (res.status === "verification_required") {
          toast.success("Compte créé !", {
            description: `Un code de vérification a été envoyé à ${res.email}`,
          });
          nav({ to: "/verify-email", search: { email: res.email } });
          return;
        }

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
              : "La connexion Google a échoué.";
        toast.error("Échec de l'authentification Google", { description: msg });
      } finally {
        setLoading(false);
      }
    },
    [setLoading, successMessage, nav],
  );

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
  }, [mounted]);

  // Handle Google SDK initialization and button rendering in a stable hook
  useEffect(() => {
    if (!scriptReady || !GOOGLE_CLIENT_ID || !hiddenRef.current) return;

    const gId = getGoogle()?.accounts?.id;
    if (!gId) return;

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

    // Always clear the container before rendering Google's iframe to avoid duplication/clearing conflicts
    hiddenRef.current.innerHTML = "";
    gId.renderButton(hiddenRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
      text: "continue_with",
      type: "standard",
      shape: "circle",
    });
  }, [scriptReady, handleCredential]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="text-center text-xs text-ink-soft">
        Google Sign-In non configuré. Ajoutez VITE_GOOGLE_CLIENT_ID dans .env
      </p>
    );
  }

  if (!mounted || !scriptReady) {
    return (
      <div className="flex h-11 w-full items-center justify-center rounded-full border border-border bg-white/60 text-sm text-ink-soft animate-pulse">
        Chargement Google…
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full">
      <div ref={hiddenRef} className="w-full max-w-[320px] flex justify-center" />
    </div>
  );
}

