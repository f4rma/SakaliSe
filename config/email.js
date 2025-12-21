const nodemailer = require('nodemailer');

const pengirimEmail = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verif koneksi SMTP
pengirimEmail.verify((error) => {
  if (error) {
    console.error('Kesalahan koneksi SMTP:', error);
  } else {
    console.log('Server SMTP siap mengirim email');
  }
});

module.exports = pengirimEmail;