import nodemailer from "nodemailer";
import { env } from "../config";

// ─── Transporter ──────────────────────────────────────────────────────────────

function createTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null; // Dev mode / mock fallback
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export async function sendMail({ to, subject, html, attachments }: SendMailOptions) {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`\n[DEV MOCK EMAIL] to: ${to} | subject: ${subject}\n`);
      return;
    }

    // Resend requires onboarding@resend.dev as sender when no custom domain is verified
    const isResend = env.SMTP_HOST?.includes("resend");
    const fromAddress = isResend ? "onboarding@resend.dev" : env.FROM_EMAIL;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      attachments,
    });
    console.log(` Email sent to ${to} — MessageId: ${info.messageId}`);
  } catch (err: any) {
    console.error(` Email send failed to ${to}: ${err.message}`, err);
    throw err; // Re-throw so registration fails clearly if email can't be sent
  }
}

// ─── Verification & Password Resets ──────────────────────────────────────────

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
          <div style="display:inline-block;background:#f1f5f9;border:2px dashed #06122e;border-radius:12px;padding:20px 40px;margin:8px 0 28px;">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#0f172a;">${code}</span>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            Si vous n'avez pas créé de compte, ignorez cet e-mail.
          </p>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:24px;">
          © ${new Date().getFullYear()} UniCare · Tous droits réservés<br>
          Données chiffrées AES-256 · Confidentialité garantie
        </p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (to: string, resetToken: string): Promise<void> => {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await sendMail({
    to,
    subject: "Réinitialisation de mot de passe — UniCare",
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif;max-width:560px;margin:auto;background:#f8fafc;padding:32px;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#06122e;border-radius:12px;padding:12px 20px;">
            <span style="color:white;font-size:20px;font-weight:800;letter-spacing:-0.5px;">UniCare</span>
          </div>
        </div>
        <div style="background:white;border-radius:12px;padding:32px;border:1px solid #e2e8f0;text-align:center;">
          <h1 style="font-size:22px;color:#0f172a;margin:0 0 8px;">Réinitialiser votre mot de passe</h1>
          <p style="color:#64748b;font-size:14px;margin:0 0 28px;line-height:1.6;">
            Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le bouton ci-dessous.
            Ce lien expire dans <strong>10 minutes</strong>.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#06122e;color:white;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:24px;">
            Réinitialiser le mot de passe
          </a>
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            Si vous n'avez pas demandé cela, ignorez cet e-mail.
          </p>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:24px;">
          © ${new Date().getFullYear()} UniCare · Tous droits réservés
        </p>
      </div>
    `,
  });
};

export const sendLoginOtpEmail = async (to: string, otp: string, firstName: string): Promise<void> => {
  await sendMail({
    to,
    subject: "Votre code de connexion — UniCare",
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif;max-width:560px;margin:auto;background:#f8fafc;padding:32px;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#06122e;border-radius:12px;padding:12px 20px;">
            <span style="color:white;font-size:20px;font-weight:800;letter-spacing:-0.5px;">UniCare</span>
          </div>
        </div>
        <div style="background:white;border-radius:12px;padding:32px;border:1px solid #e2e8f0;text-align:center;">
          <h1 style="font-size:22px;color:#0f172a;margin:0 0 8px;">Code de connexion</h1>
          <p style="color:#64748b;font-size:14px;margin:0 0 8px;line-height:1.6;">Bonjour ${firstName},</p>
          <p style="color:#64748b;font-size:14px;margin:0 0 28px;line-height:1.6;">
            Utilisez le code ci-dessous pour finaliser votre connexion.
            Ce code expire dans <strong>10 minutes</strong>.
          </p>
          <div style="display:inline-block;background:#f1f5f9;border:2px dashed #06122e;border-radius:12px;padding:20px 40px;margin:8px 0 28px;">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#0f172a;">${otp}</span>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            Si vous n'avez pas demandé cette connexion, changez immédiatement votre mot de passe.
          </p>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:24px;">
          © ${new Date().getFullYear()} UniCare · Tous droits réservés<br>
          Code usage unique · Valide 10 minutes
        </p>
      </div>
    `,
  });
};

// ─── Appointments Notifications ──────────────────────────────────────────────

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
          <h1 style="font-size:20px;color:#0f172a;margin:0 0 8px;">Rendez-vous confirmé</h1>
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

export async function sendDoctorAppointmentNotification(
  to: string,
  details: {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    reason: string;
    action: string;
  },
) {
  await sendMail({
    to,
    subject: `Nouveau rendez-vous — UniCare`,
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif;max-width:640px;margin:auto;background:#f8fafc;padding:24px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:12px;">
          <div style="display:inline-block;background:#06122e;border-radius:12px;padding:8px 16px;">
            <span style="color:white;font-size:16px;font-weight:800;letter-spacing:-0.5px;">UniCare</span>
          </div>
        </div>
        <div style="background:#fff;border-radius:10px;padding:18px;border:1px solid #e6edf2;">
          <h2 style="font-size:18px;margin:0 0 8px;color:#0f172a;">Notification de rendez-vous</h2>
          <p style="color:#64748b;margin:0 0 12px;">Bonjour ${details.doctorName}, un patient a ${details.action} un rendez-vous.</p>
          <div style="background:#f7fbfd;border:1px solid #e9f2f6;border-radius:8px;padding:10px;">
            <table style="width:100%;font-size:14px;">
              <tr><td style="color:#64748b;font-weight:600;">Patient</td><td style="text-align:right;font-weight:700;color:#0f172a;">${details.patientName}</td></tr>
              <tr><td style="color:#64748b;font-weight:600;">Date</td><td style="text-align:right;font-weight:700;color:#0f172a;">${details.date}</td></tr>
              <tr><td style="color:#64748b;font-weight:600;">Heure</td><td style="text-align:right;font-weight:700;color:#0f172a;">${details.time}</td></tr>
              <tr><td style="color:#64748b;font-weight:600;">Motif</td><td style="text-align:right;font-weight:700;color:#0f172a;">${details.reason}</td></tr>
            </table>
          </div>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:12px;">© ${new Date().getFullYear()} UniCare</p>
      </div>
    `,
  });
}

export async function sendAppointmentCancellationEmail(
  to: string,
  details: {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    cancelledBy: string;
  },
) {
  await sendMail({
    to,
    subject: "Annulation de rendez-vous — UniCare",
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif;max-width:560px;margin:auto;background:#f8fafc;padding:32px;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#06122e;border-radius:12px;padding:12px 20px;">
            <span style="color:white;font-size:20px;font-weight:800;letter-spacing:-0.5px;">UniCare</span>
          </div>
        </div>
        <div style="background:white;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h1 style="font-size:20px;color:#ef4444;margin:0 0 4px;">Rendez-vous Annulé</h1>
          <p style="color:#64748b;font-size:14px;margin:0 0 24px;">Bonjour,</p>
          <p style="color:#0f172a;font-size:14px;margin:0 0 16px;">
            Le rendez-vous suivant a été annulé par <strong>${details.cancelledBy}</strong> :
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:24px;">
            <table style="width:100%;font-size:14px;border-collapse:collapse;">
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 0;color:#64748b;font-weight:600;">Patient</td>
                <td style="padding:10px 0;color:#0f172a;font-weight:700;text-align:right;">${details.patientName}</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 0;color:#64748b;font-weight:600;">Médecin</td>
                <td style="padding:10px 0;color:#0f172a;font-weight:700;text-align:right;">${details.doctorName}</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 0;color:#64748b;font-weight:600;">Date</td>
                <td style="padding:10px 0;color:#0f172a;font-weight:700;text-align:right;">${details.date}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#64748b;font-weight:600;">Heure</td>
                <td style="padding:10px 0;color:#0f172a;font-weight:700;text-align:right;">${details.time}</td>
              </tr>
            </table>
          </div>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:24px;">
          © ${new Date().getFullYear()} UniCare · Centre Médical Béjaïa
        </p>
      </div>
    `,
  });
}

// ─── PDF Document Builders ────────────────────────────────────────────────────

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n");
}

function buildSimplePdfBuffer(title: string, lines: string[]) {
  const textBlocks = lines.map((line) => `(${escapePdfText(line)}) Tj\n0 -14 Td`);
  const content = `BT\n/F1 12 Tf\n72 760 Td\n(${escapePdfText(title)}) Tj\n0 -24 Td\n${textBlocks.join("\n")}ET`;
  const stream = Buffer.from(content, "utf8");
  const objects = [
    "%PDF-1.4",
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj",
    `4 0 obj<< /Length ${stream.length} >>stream\n${content}\nendstream\nendobj`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj",
  ];

  const pdfBody = objects.join("\n");
  const xrefOffset = pdfBody.length + 1;

  let currentOffset = 0;
  const offsets = [0];
  for (let i = 0; i < objects.length; i += 1) {
    const obj = objects[i];
    const bytesLength = Buffer.byteLength(obj ?? "", "utf8");
    offsets.push(currentOffset + bytesLength + 1);
    currentOffset += bytesLength + 1;
  }

  return Buffer.from(
    [
      `%PDF-1.4\n`,
      ...objects.map((obj) => `${obj}\n`),
      `xref\n0 ${objects.length + 1}\n`,
      `0000000000 65535 f \n`,
      ...offsets
        .slice(1)
        .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`),
      `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
    ].join(""),
  );
}

function formatPrescriptionContent(prescription: any) {
  if (Array.isArray(prescription)) {
    return prescription
      .map(
        (drug, index) =>
          `${index + 1}. ${drug?.drug || "Médicament"} — ${drug?.dose || ""} — ${drug?.freq || ""}`,
      )
      .filter(Boolean);
  }

  if (prescription && typeof prescription === "object") {
    const drugs = Array.isArray((prescription as any).drugs)
      ? (prescription as any).drugs
      : [];
    if (drugs.length > 0) {
      return drugs
        .map(
          (drug: any, index: number) =>
            `${index + 1}. ${drug?.drug || "Médicament"} — ${drug?.dose || ""} — ${drug?.freq || ""}`,
        )
        .filter(Boolean);
    }

    return [
      `Médicament: ${(prescription as any).drug || ""}`,
      `Dose: ${(prescription as any).dose || ""}`,
      `Fréquence: ${(prescription as any).freq || ""}`,
      `Renouvellements: ${(prescription as any).refills || 0}`,
      `Notes: ${(prescription as any).notes || ""}`,
    ].filter((line) => line && !line.endsWith(": "));
  }

  return ["Aucune prescription n’a été ajoutée."];
}

export async function sendAppointmentCompletionEmail(
  to: string,
  details: {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    prescription?: any;
    price?: number;
    receiptNumber?: string;
  },
) {
  const prescriptionLines = formatPrescriptionContent(details.prescription);
  const ordonnancePdf = buildSimplePdfBuffer("Ordonnance médicale", [
    `Patient: ${details.patientName}`,
    `Médecin: ${details.doctorName}`,
    `Date: ${details.date}`,
    `Heure: ${details.time}`,
    "",
    ...prescriptionLines,
  ]);

  const receiptPdf = buildSimplePdfBuffer("Reçu de consultation", [
    `Patient: ${details.patientName}`,
    `Médecin: ${details.doctorName}`,
    `Date: ${details.date}`,
    `Heure: ${details.time}`,
    `Montant: ${details.price ?? 0} DA`,
    `Numéro de reçu: ${details.receiptNumber || "N/A"}`,
  ]);

  await sendMail({
    to,
    subject: "Votre consultation est terminée — Ordonnance et reçu",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:680px;margin:auto;background:#f4f7fb;padding:20px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:12px;">
          <div style="display:inline-block;background:#06122e;border-radius:12px;padding:12px 20px;">
            <span style="color:white;font-size:20px;font-weight:800;letter-spacing:-0.5px;">UniCare</span>
          </div>
          <div style="font-size:12px;color:#64748b;margin-top:8px;">UniCare • Béjaïa</div>
        </div>
        <div style="background:#fff;border-radius:10px;padding:18px;border:1px solid #e6edf2;">
          <h2 style="font-size:18px;margin:0 0 8px;color:#0f172a;">Consultation terminée</h2>
          <p style="color:#64748b;margin:0 0 12px;">Bonjour ${details.patientName},</p>
          <p style="color:#0f172a;margin:0 0 12px;">Votre consultation avec <strong>${details.doctorName}</strong> est terminée.</p>
          <div style="background:#f7fbfd;border:1px solid #e9f2f6;border-radius:8px;padding:12px;margin-bottom:12px;">
            <table style="width:100%;font-size:14px;">
              <tr><td style="color:#64748b;font-weight:600;">Date</td><td style="text-align:right;font-weight:700;color:#0f172a;">${details.date}</td></tr>
              <tr><td style="color:#64748b;font-weight:600;">Heure</td><td style="text-align:right;font-weight:700;color:#0f172a;">${details.time}</td></tr>
              <tr><td style="color:#64748b;font-weight:600;">Montant</td><td style="text-align:right;font-weight:700;color:#0f172a;">${details.price ?? 0} DA</td></tr>
              <tr><td style="color:#64748b;font-weight:600;">Reçu</td><td style="text-align:right;font-weight:700;color:#0f172a;">${details.receiptNumber ?? "N/A"}</td></tr>
            </table>
          </div>
          <p style="color:#64748b;margin:0 0 10px;">Vous trouverez ci-joint votre ordonnance et votre reçu au format PDF. Conservez-les pour vos dossiers médicaux.</p>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:14px;">© ${new Date().getFullYear()} UniCare · Tous droits réservés</p>
      </div>
    `,
    attachments: [
      {
        filename: "ordonnance.pdf",
        content: ordonnancePdf,
        contentType: "application/pdf",
      },
      {
        filename: "recu.pdf",
        content: receiptPdf,
        contentType: "application/pdf",
      },
    ],
  });
}
