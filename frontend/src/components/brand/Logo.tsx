import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  return (
    <Link
      to="/"
      className={cn("group inline-flex items-center select-none", className)}
      aria-label="Unicare — Accueil"
    >
      <span
        className={cn(
          "font-sans font-semibold tracking-[-0.02em] text-primary",
          size === "sm" ? "text-base" : size === "md" ? "text-lg" : "text-2xl",
        )}
      >
        Unicare
      </span>
    </Link>
  );
}
