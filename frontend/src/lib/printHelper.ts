import { type DrugLine } from "./api";

export function getReceiptHtml(receipt: {
  receiptNumber: string;
  date: string;
  doctorName: string;
  speciality: string;
  patientName: string;
  patientEmail: string;
  price: number;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Reçu de Consultation #${receipt.receiptNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; color: #1f2937; background: #f8fafc; padding: 24px; }
        .page { max-width: 760px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; }
        .page-header { display: flex; justify-content: space-between; gap: 24px; padding: 32px 36px 24px; background: linear-gradient(135deg, #0f172a 0%, #0f766e 100%); color: #fff; }
        .brand { display: grid; gap: 6px; }
        .brand h1 { font-size: 30px; letter-spacing: 0.05em; margin: 0; }
        .brand p { font-size: 12px; opacity: 0.9; }
        .summary { text-align: right; }
        .summary p { font-size: 12px; margin-bottom: 4px; opacity: 0.95; }
        .summary .title { font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; }
        .content { padding: 28px 36px 36px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin-bottom: 30px; }
        .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 20px; }
        .info-card h3 { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #475569; margin-bottom: 10px; }
        .info-card p { font-size: 14px; color: #111827; margin-bottom: 8px; line-height: 1.5; }
        .line-items { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .line-items th, .line-items td { padding: 14px 16px; }
        .line-items th { text-align: left; background: #f8fafc; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; border-bottom: 1px solid #e2e8f0; }
        .line-items td { border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827; }
        .amount-row td { font-weight: 700; color: #0f172a; }
        .total { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding: 20px 24px; background: #ecfdf5; border: 1px dashed #a7f3d0; border-radius: 14px; }
        .total .text { font-size: 14px; color: #111827; }
        .total .value { font-size: 32px; color: #065f46; }
        .note { margin-top: 24px; padding: 18px 20px; background: #f1f5f9; border-left: 4px solid #0f172a; border-radius: 14px; font-size: 12px; color: #475569; }
        .footer { padding: 20px 36px 28px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .footer .id { font-weight: 700; }
        @media print {
          body { background: #fff; padding: 0; }
          .page { border-color: #d1d5db; }
          .page-header { page-break-inside: avoid; }
          .footer { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="page-header">
          <div class="brand">
            <h1>Unicare</h1>
            <p>Centre Médical de Béjaïa</p>
            <p>Tél : +213 (0)34 12 34 56</p>
            <p>Adresse : Espace Médical Gouraya, Béjaïa</p>
          </div>
          <div class="summary">
            <p class="title">Reçu de Consultation</p>
            <p><strong>Réf : ${receipt.receiptNumber}</strong></p>
            <p>Date : ${receipt.date}</p>
          </div>
        </div>

        <div class="content">
          <div class="info-grid">
            <div class="info-card">
              <h3>Patient</h3>
              <p>${receipt.patientName}</p>
              <p>${receipt.patientEmail}</p>
            </div>
            <div class="info-card">
              <h3>Praticien</h3>
              <p>${receipt.doctorName}</p>
              <p>${receipt.speciality}</p>
            </div>
          </div>

          <table class="line-items">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Consultation médicale</td>
                <td style="text-align: right;">${receipt.price.toLocaleString()} DA</td>
              </tr>
              <tr class="amount-row">
                <td><strong>Total</strong></td>
                <td style="text-align: right;"><strong>${receipt.price.toLocaleString()} DA</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="note">
            Ce reçu confirme la consultation médicale et sert de justificatif pour remboursement ou archives.
          </div>
        </div>

        <div class="footer">
          <span>Unicare • Béjaïa</span>
          <span class="id">DOC : REC-${receipt.receiptNumber.split("-")[1] || "SEC"}</span>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getOrdonnanceHtml(rx: {
  id: string;
  date: string;
  doctorName: string;
  patientName: string;
  drug: string;
  dose: string;
  freq: string;
  refills: number;
  notes?: string;
  drugs?: DrugLine[];
}) {
  const drugsList =
    rx.drugs && rx.drugs.length > 0
      ? rx.drugs
      : [{ drug: rx.drug, dose: rx.dose, freq: rx.freq, refills: rx.refills, notes: rx.notes }];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Ordonnance Médicale</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Georgia', 'Times New Roman', serif; color: #1b1c1d; background: #fff; padding: 24px; }
        .page { max-width: 760px; margin: 0 auto; border: 1px solid #d4d4d8; border-radius: 20px; overflow: hidden; }
        .header { padding: 32px 36px 20px; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
        .brand { line-height: 1.2; }
        .brand strong { display: block; font-size: 22px; margin-bottom: 6px; }
        .brand span { display: block; font-size: 11px; color: #6b7280; }
        .doc-info { text-align: right; font-size: 12px; color: #111827; }
        .doc-info strong { display: block; font-size: 13px; margin-bottom: 8px; }
        .note-box { padding: 22px 26px; background: #f3f4f6; border-top: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db; }
        .note-box p { font-size: 11px; line-height: 1.7; color: #4b5563; }
        .title { padding: 20px 36px 0; text-align: center; }
        .title h1 { font-size: 30px; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 8px; }
        .title .subtitle { font-size: 12px; letter-spacing: 0.22em; color: #6b7280; }
        .patient-rows { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; padding: 0 36px 24px; margin-top: 16px; }
        .patient-card { padding: 18px 20px; border: 1px solid #e5e7eb; border-radius: 14px; background: #ffffff; }
        .patient-card p { font-size: 12px; color: #111827; line-height: 1.6; }
        .patient-card strong { display: block; margin-bottom: 6px; font-size: 12px; color: #111827; }
        .drugs-list { padding: 0 36px 34px; }
        .drug-item { display: grid; gap: 10px; padding: 18px 20px; border: 1px solid #e5e7eb; border-radius: 14px; margin-bottom: 16px; background: #fff; }
        .drug-item .header { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
        .drug-name { font-size: 14px; font-weight: bold; color: #111827; }
        .drug-dose { font-size: 13px; color: #374151; }
        .drug-rule { font-size: 12px; color: #4b5563; font-style: italic; }
        .tag { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 9999px; background: #ecfdf5; color: #166534; font-size: 11px; font-weight: 700; }
        .drug-notes { font-size: 12px; color: #52525b; padding-left: 14px; border-left: 3px solid #d1d5db; }
        .footer { display: flex; justify-content: space-between; gap: 18px; padding: 0 36px 28px; }
        .disclaimer { max-width: 65%; font-size: 11px; color: #4b5563; line-height: 1.7; }
        .signature { min-width: 185px; padding: 18px 20px; border: 1px solid #e5e7eb; border-radius: 14px; text-align: center; }
        .signature p { font-size: 11px; color: #6b7280; margin-bottom: 16px; }
        .signature strong { display: inline-block; font-size: 14px; color: #111827; margin-bottom: 8px; }
        .stamp { font-size: 12px; letter-spacing: 0.08em; color: #0f172a; border-top: 1px dotted #d1d5db; padding-top: 12px; }
        @media print {
          body { padding: 0; }
          .page { border-color: #d1d5db; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="brand">
            <strong>Unicare</strong>
            <span>Centre Médical • Béjaïa</span>
            <span>Tél : +213 (0)34 12 34 56</span>
            <span>Espace Médical Gouraya</span>
          </div>
          <div class="doc-info">
            <strong>${rx.doctorName}</strong>
            <span>Praticien Agréé</span>
            <span>Ordonnance n° RX-${rx.id.substring(0, 8).toUpperCase()}</span>
            <span>Date : ${rx.date}</span>
          </div>
        </div>

        <div class="title">
          <h1>Ordonnance</h1>
          <p class="subtitle">Prescription médicale officielle</p>
        </div>

        <div class="patient-rows">
          <div class="patient-card">
            <strong>Patient</strong>
            <p>${rx.patientName}</p>
          </div>
          <div class="patient-card">
            <strong>Informations</strong>
            <p>Date d'édition : ${rx.date}</p>
          </div>
        </div>

        <div class="drugs-list">
          ${drugsList
            .map(
              (d) => `
            <div class="drug-item">
              <div class="header">
                <div>
                  <div class="drug-name">${d.drug}</div>
                  <div class="drug-dose">${d.dose}</div>
                </div>
                <div class="tag">${d.refills > 0 ? `Renouvelable ${d.refills}` : "Sans renouvellement"}</div>
              </div>
              <div class="drug-rule">Posologie : ${d.freq}</div>
              ${d.notes ? `<div class="drug-notes">${d.notes}</div>` : ""}
            </div>
          `,
            )
            .join("")}
        </div>

        <div class="footer">
          <div class="disclaimer">
            Ce document est une ordonnance médicale délivrée par un praticien autorisé. Respecter scrupuleusement la posologie et la durée du traitement.
          </div>
          <div class="signature">
            <p>Signature</p>
            <strong>${rx.doctorName}</strong>
            <div class="stamp">Médecin</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function openDocumentInTab(html: string) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Veuillez autoriser les popups pour pouvoir ouvrir le document.");
    return;
  }
  win.document.write(html);
  win.document.close();
}

export function printReceipt(receipt: {
  receiptNumber: string;
  date: string;
  doctorName: string;
  speciality: string;
  patientName: string;
  patientEmail: string;
  price: number;
}) {
  const win = window.open("", "_blank", "width=900,height=940");
  if (!win) {
    alert("Veuillez autoriser les popups pour pouvoir imprimer le reçu.");
    return;
  }

  const html = getReceiptHtml(receipt);
  
  // Inject print JS
  const printHtml = html.replace("</body>", `
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        };
      </script>
    </body>
  `);

  win.document.write(printHtml);
  win.document.close();
}

export function printOrdonnance(rx: {
  id: string;
  date: string;
  doctorName: string;
  patientName: string;
  drug: string;
  dose: string;
  freq: string;
  refills: number;
  notes?: string;
  drugs?: DrugLine[];
}) {
  const win = window.open("", "_blank", "width=900,height=940");
  if (!win) {
    alert("Veuillez autoriser les popups pour pouvoir imprimer l'ordonnance.");
    return;
  }

  const html = getOrdonnanceHtml(rx);

  // Inject print JS
  const printHtml = html.replace("</body>", `
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        };
      </script>
    </body>
  `);

  win.document.write(printHtml);
  win.document.close();
}
