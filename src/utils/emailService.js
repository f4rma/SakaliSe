const transporter = require('../../config/email');

exports.sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"LINKONCE" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });

    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

exports.sendAccessNotification = async ({ to, judul, token, waktu_diakses, ip_address }) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">🔔 Link Accessed - LINKONCE</h2>
        <p>Your one-time link has been accessed and destroyed.</p>
        <div style="background: #fef2f2; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0;">
          <p style="margin: 0;"><strong>Title:</strong> ${judul}</p>
          <p style="margin: 10px 0 0 0;"><strong>Token:</strong> ${token.substring(0, 16)}...</p>
          <p style="margin: 10px 0 0 0;"><strong>Accessed at:</strong> ${new Date(waktu_diakses).toLocaleString()}</p>
          <p style="margin: 10px 0 0 0;"><strong>IP Address:</strong> ${ip_address}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This link is now permanently destroyed and cannot be accessed again.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px;">
          LINKONCE - Zero-knowledge one-time access system
        </p>
      </div>
    `;

    await this.sendEmail({
      to,
      subject: `🔔 Link Accessed: ${judul}`,
      html
    });
  } catch (error) {
    console.error('Notification email failed:', error);
  }
};