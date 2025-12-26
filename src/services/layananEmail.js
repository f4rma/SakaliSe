// src/utils/emailService.js
const pengirimEmail = require('../config/email');

// Low-level email sender
const sendEmail = async ({ to, subject, html }) => {
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
  <body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:8px;padding:24px">
      <h2 style="margin-top:0;color:#111827">🔐 SakaliSe</h2>
      <p>Link rahasia ini hanya dapat dibuka <strong>sekali</strong>.</p>
      <p>
        <a href="${shareUrl}" style="color:#2563eb;word-break:break-all">
          ${shareUrl}
        </a>
      </p>
      <p style="font-size:12px;color:#6b7280">
        Setelah dibuka, link akan otomatis dinonaktifkan demi keamanan.
      </p>
    </div>
  </body>
  </html>
  `;

  return sendEmail({
    to,
    subject: 'SakaliSe — Konten Sekali Akses',
    html
  });
};

/**
 * Email: Notifikasi link diakses
 */
const kirimNotifikasiAkses = async ({
  to,
  judul,
  token,
  waktu_diakses,
  ip_address
}) => {
  const html = `
  <!DOCTYPE html>
  <html lang="id">
  <body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden">
      
      <div style="background:#111827;padding:20px;color:#ffffff">
        <h2 style="margin:0">SakaliSe</h2>
        <p style="margin:4px 0 0;font-size:13px;color:#9ca3af">
          Notifikasi Akses Link
        </p>
      </div>

      <div style="padding:24px">
        <div style="background:#fee2e2;border-left:4px solid #ef4444;padding:14px">
          <strong>Link telah diakses</strong> dan dinonaktifkan
        </div>

        <table width="100%" style="margin-top:20px;border-collapse:collapse">
          <tr>
            <td style="padding:10px;color:#6b7280">Judul</td>
            <td style="padding:10px">${judul}</td>
          </tr>
          <tr>
            <td style="padding:10px;color:#6b7280">Token</td>
            <td style="padding:10px">${token.slice(0, 12)}…</td>
          </tr>
          <tr>
            <td style="padding:10px;color:#6b7280">Waktu Akses</td>
            <td style="padding:10px">
              ${new Date(waktu_diakses).toLocaleString('id-ID')}
            </td>
          </tr>
          <tr>
            <td style="padding:10px;color:#6b7280">IP Address</td>
            <td style="padding:10px">${ip_address}</td>
          </tr>
        </table>

        <p style="margin-top:20px;font-size:12px;color:#6b7280">
          Demi keamanan, konten tidak dapat diakses kembali.
        </p>
      </div>

    </div>
  </body>
  </html>
  `;

  return sendEmail({
    to,
    subject: `Link diakses: ${judul}`,
    html
  });
};

module.exports = {
  kirimLinkSekaliPakai,
  kirimNotifikasiAkses
};
