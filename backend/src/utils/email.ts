import nodemailer from "nodemailer";
import { env } from "../config";

// ─── Email via Nodemailer + Gmail App Password ────────────────────────────────

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

function createTransport() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: env.GMAIL_USER,
      pass: env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendMail({ to, subject, html }: SendMailOptions) {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    console.log(`\n[DEV MOCK EMAIL]\nTo: ${to}\nSubject: ${subject}\n`);
    return;
  }
  try {
    const transporter = createTransport();
    const info = await transporter.sendMail({
      from: `UniCare <${env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(` Email sent to ${to} — MessageId: ${info.messageId}`);
  } catch (err: any) {
    console.error(` Email send failed: ${err.message}`);
  }
}

// ─── 1. Email Verification Code ───────────────────────────────────────────────

export const sendVerificationEmail = async (to: string, code: string): Promise<void> => {
  await sendMail({
    to,
    subject: "Vérifiez votre adresse e-mail — UniCare",
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif;max-width:560px;margin:auto;background:#f8fafc;padding:32px;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#06122e;border-radius:12px;padding:12px 20px;">
            <span style="color:white;font-size:20px;font-weight:800;letter-spacing:-0.5px;">UniCare</span>
          </div>
        </div>
        <div style="background:white;border-radius:12px;padding:32px;border:1px solid #e2e8f0;text-align:center;">
          <h1 style="font-size:22px;color:#0f172a;margin:0 0 8px;">Confirmez votre e-mail</h1>
          <p style="color:#64748b;font-size:14px;margin:0 0 28px;line-height:1.6;">
            Bienvenue sur UniCare. Utilisez le code ci-dessous pour vérifier votre adresse e-mail.
            Ce code expire dans <strong>24 heures</strong>.
          </p>
          <div style="display:inline-block;background:#f1f5f9;border:2px dashed #06122e;border-radius:12px;padding:16px 24px;margin:8px 0 28px;text-align:center;vertical-align:middle;">
            <span style="font-size:32px;font-weight:800;letter-spacing:8px;text-indent:8px;display:inline-block;color:#0f172a;">${code}</span>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            Si vous n'avez pas créé de compte, ignorez cet e-mail.
          </p>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:24px;">
          © ${new Date().getFullYear()} UniCare · Tous droits réservés<br>
          Données chiffrées · Confidentialité garantie
        </p>
      </div>
    `,
  });
};

// ─── 2. Appointment Confirmation ──────────────────────────────────────────────

export async function sendAppointmentConfirmationEmail(
  to: string,
  details: {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    location: string;
  },
) {
  await sendMail({
    to,
    subject: "Confirmation de rendez-vous — UniCare",
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif;max-width:640px;margin:auto;background:#f8fafc;padding:28px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:18px;">
          <div style="display:inline-block;background:#06122e;border-radius:12px;padding:12px 20px;">
            <span style="color:white;font-size:20px;font-weight:800;letter-spacing:-0.5px;">UniCare</span>
          </div>
          <div style="font-size:13px;color:#64748b;margin-top:8px;">Centre Médical • Béjaïa</div>
        </div>
        <div style="background:#fff;border-radius:10px;padding:22px;border:1px solid #e6edf2;">
          <h1 style="font-size:20px;color:#0f172a;margin:0 0 8px;">Rendez-vous confirmé ✓</h1>
          <p style="color:#64748b;font-size:14px;margin:0 0 18px;">Bonjour ${details.patientName},</p>
          <div style="background:#f7fbfd;border:1px solid #e9f2f6;border-radius:8px;padding:14px;margin-bottom:14px;">
            <table style="width:100%;font-size:14px;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;color:#64748b;font-weight:600;">Médecin</td>
                <td style="padding:8px 0;color:#0f172a;font-weight:700;text-align:right;">${details.doctorName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;font-weight:600;">Date</td>
                <td style="padding:8px 0;color:#0f172a;font-weight:700;text-align:right;">${details.date}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;font-weight:600;">Heure</td>
                <td style="padding:8px 0;color:#0f172a;font-weight:700;text-align:right;">${details.time}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;font-weight:600;">Lieu</td>
                <td style="padding:8px 0;color:#0f172a;font-weight:700;text-align:right;">${details.location}</td>
              </tr>
            </table>
          </div>
          <p style="color:#64748b;font-size:13px;margin:0;">Pour annuler ou reporter ce rendez-vous, connectez-vous à votre espace patient ou contactez la clinique.</p>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px;">© ${new Date().getFullYear()} UniCare · Confidentialité des données médicales</p>
      </div>
    `,
  });
}
