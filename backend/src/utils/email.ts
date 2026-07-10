import nodemailer from "nodemailer";
import { env } from "../config";

// ─── Transporter ──────────────────────────────────────────────────────────────

function createTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null; // No transporter in dev if SMTP is unconfigured
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

// ─── Send helpers ─────────────────────────────────────────────────────────────

export const sendVerificationEmail = async (
  to: string,
  code: string,
): Promise<void> => {
  if (env.NODE_ENV === "development") {
    console.log(`\n📧 [DEV] Verification code for ${to}: ${code}\n`);
    return;
  }

  const transporter = createTransporter();
  if (!transporter) return;

  await transporter.sendMail({
    from: env.FROM_EMAIL,
    to,
    subject: "Vérifiez votre adresse email — UniCare",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#06122e;">Bienvenue sur UniCare</h2>
        <p>Votre code de vérification à 6 chiffres est :</p>
        <p style="font-size:2.5rem;letter-spacing:0.4rem;font-weight:700;color:#2563eb;">${code}</p>
        <p>Ce code expire dans <strong>24 heures</strong>.</p>
        <p style="color:#64748b;font-size:0.8rem;">Si vous n'avez pas créé de compte UniCare, ignorez cet email.</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string,
): Promise<void> => {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  if (env.NODE_ENV === "development") {
    console.log(`\n📧 [DEV] Password reset link for ${to}: ${resetUrl}\n`);
    return;
  }

  const transporter = createTransporter();
  if (!transporter) return;

  await transporter.sendMail({
    from: env.FROM_EMAIL,
    to,
    subject: "Réinitialisation de votre mot de passe — UniCare",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#06122e;">Réinitialisation du mot de passe</h2>
        <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#06122e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
          Réinitialiser le mot de passe
        </a>
        <p style="color:#64748b;font-size:0.8rem;">Ce lien expire dans <strong>10 minutes</strong>.</p>
        <p style="color:#64748b;font-size:0.8rem;">Si vous n'avez pas demandé de réinitialisation, ignorez cet email.</p>
      </div>
    `,
  });
};
