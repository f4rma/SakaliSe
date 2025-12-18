const Link = require('../models/link');
const { generateToken } = require('../src/utils/generateToken');
const { sendEmail, sendAccessNotification } = require('../src/utils/emailService');

// Create new one-time link
exports.createLink = async (req, res, next) => {
  try {
    const { jenis_konten, isi_konten, judul, email_pengirim, email_penerima } = req.body;

    // Validation
    if (!jenis_konten || !isi_konten || !email_pengirim) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Generate unique token
    const token = generateToken();

    // Create link
    const link = await Link.create({
      token,
      jenis_konten,
      isi_konten,
      judul: judul || 'Secret Message',
      email_pengirim,
      email_penerima: email_penerima || null
    });

    // Generate shareable URL
    const shareUrl = `${process.env.BASE_URL}/view.html?token=${token}`;

    // Send email if recipient provided
    if (email_penerima) {
      await sendEmail({
        to: email_penerima,
        subject: `🔒 ${judul || 'You have received a secure message'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">🔒 LINKONCE - Secure One-Time Message</h2>
            <p>You have received a secure message that can only be viewed <strong>once</strong>.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Message Type:</strong> ${jenis_konten}</p>
              <p style="margin: 10px 0 0 0;"><strong>Expires:</strong> ${new Date(link.waktu_kedaluwarsa).toLocaleString()}</p>
            </div>
            <p>
              <a href="${shareUrl}" 
                 style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Message (One-Time Only)
              </a>
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              ⚠️ <strong>Important:</strong> This link will self-destruct after being viewed once. 
              Make sure you're ready before clicking.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px;">
              Sent via LINKONCE - Zero-knowledge one-time access system<br>
              From: ${email_pengirim}
            </p>
          </div>
        `
      });
    }

    res.status(201).json({
      success: true,
      message: 'Link created successfully',
      data: {
        token,
        shareUrl,
        expires: link.waktu_kedaluwarsa,
        emailSent: !!email_penerima
      }
    });

  } catch (error) {
    next(error);
  }
};

// Access link (atomic operation)
exports.accessLink = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Collect access metadata
    const metadata = {
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent'),
      timestamp: new Date()
    };

    // Atomic access attempt
    const link = await Link.atomicAccess(token, metadata);

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link tidak ditemukan, sudah diakses, atau telah kedaluwarsa',
        reason: 'INVALID_ACCESS'
      });
    }

    // Send access notification to creator
    const io = req.app.get('io');
    io.emit('link-accessed', {
      token: link.token,
      judul: link.judul,
      waktu_diakses: metadata.timestamp
    });

    // Send email notification
    await sendAccessNotification({
      to: link.email_pengirim,
      judul: link.judul,
      token: link.token,
      waktu_diakses: metadata.timestamp,
      ip_address: metadata.ip_address
    });

    // Return content (only once!)
    res.status(200).json({
      success: true,
      message: 'Content accessed successfully',
      data: {
        judul: link.judul,
        jenis_konten: link.jenis_konten,
        isi_konten: link.isi_konten,
        waktu_dibuat: link.waktu_dibuat,
        waktu_diakses: metadata.timestamp
      }
    });

  } catch (error) {
    next(error);
  }
};

// Check link status (without accessing)
exports.checkLink = async (req, res, next) => {
  try {
    const { token } = req.params;

    const result = await Link.checkStatus(token);

    if (!result.valid) {
      return res.status(200).json({
        success: false,
        valid: false,
        reason: result.reason
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      data: {
        judul: result.link.judul,
        jenis_konten: result.link.jenis_konten,
        waktu_kedaluwarsa: result.link.waktu_kedaluwarsa,
        status: result.link.status
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get link statistics (for creator)
exports.getStats = async (req, res, next) => {
  try {
    const stats = await Link.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalLinks = await Link.countDocuments();
    const activeLinks = await Link.countDocuments({ status: 'AKTIF' });
    const accessedLinks = await Link.countDocuments({ status: 'TERPAKAI' });
    const expiredLinks = await Link.countDocuments({ status: 'KEDALUWARSA' });

    res.status(200).json({
      success: true,
      data: {
        total: totalLinks,
        aktif: activeLinks,
        terpakai: accessedLinks,
        kedaluwarsa: expiredLinks,
        breakdown: stats
      }
    });

  } catch (error) {
    next(error);
  }
};