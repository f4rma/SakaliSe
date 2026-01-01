// src/utils/emailService.js
const pengirimEmail = require('../config/email');

// Pengirim email tingkat rendah
const kirimEmail = async ({ to, subject, html }) => {
  try {
    const info = await pengirimEmail.sendMail({
      from: `"SakaliSe" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });

    console.log('Email dikirim:', info.messageId);
    return info;
  } catch (error) {
    console.error('Gagal mengirim email:', error);
    throw error;
  }
};

// Email: Link sekali pakai dibuat
const kirimLinkSekaliPakai = async ({ to, shareUrl }) => {
  const html = `
  <!DOCTYPE html>
  <html lang="id">
  <body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif">
    <div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;padding:32px 24px;box-shadow:0 2px 8px #0001">
      <h2 style="margin-top:0;color:#111827;text-align:center;font-size:1.5em">
        SakaliSe
      </h2>
      <p style="font-size:1.1em;margin-bottom:24px">
        Tautan ini berisi pesan yang dapat dibuka sekali.
      </p>
      <div style="background:#f1f5f9;padding:18px 14px;border-radius:6px;margin-bottom:18px;word-break:break-all;text-align:center;overflow:visible;white-space:normal;">
        <a href="${shareUrl}" style="color:#2563eb;text-decoration:none;font-weight:bold;word-break:break-all;">${shareUrl}</a>
      </div>
      <p style="font-size:13px;color:#6b7280;margin:0;overflow:visible;white-space:normal;">
        Setelah dibuka, tautan akan otomatis dinonaktifkan demi keamanan.
      </p>
    </div>
  </body>
  </html>
  `;

  return kirimEmail({
    to,
    subject: 'SakaliSe — Konten Sekali Akses',
    html
  });
};


module.exports = {
  kirimLinkSekaliPakai
};
 