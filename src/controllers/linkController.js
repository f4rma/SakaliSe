const supabase = require('../config/supabase');
const { generateToken } = require('../utils/generateToken');
const { isAllowedFile } = require('../utils/fileValidator');
const { uploadFiles, createSignedUrls } = require('../services/storageService');
const {
  kirimLinkSekaliPakai,
  kirimNotifikasiAkses
} = require('../services/emailService');

//  Buat Link
exports.createLink = async (req, res, next) => {
  try {
    const { judul, isi_konten, email } = req.body;
    const files = req.files || [];

    if (!isi_konten && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Konten wajib diisi'
      });
    }

    // VALIDASI FILE
    files.forEach(file => {
      if (!isAllowedFile(file.mimetype)) {
        const err = new Error('Tipe file tidak diizinkan');
        err.statusCode = 400;
        throw err;
      }
    });

    const token = generateToken();

    const uploadedFiles =
      files.length > 0 ? await uploadFiles(token, files) : [];

    const { error } = await supabase.from('links').insert({
      token,
      judul: judul || 'Pesan Rahasia | SakaliSe',
      isi_konten: isi_konten || null,
      files: uploadedFiles,
      status: 'AKTIF'
    });

    if (error) throw error;

    const baseUrl =
      process.env.BASE_URL ||
      `${req.protocol}://${req.get('host')}`;

    const shareUrl = `${baseUrl}/view.html?token=${token}`;

    if (email) {
      kirimLinkSekaliPakai({ to: email, shareUrl }).catch(() => {});
    }

    res.json({ success: true, data: { shareUrl } });

  } catch (err) {
    next(err);
  }
};


//   Cek link (disini aman, tanpa burn)
exports.checkLink = async (req, res, next) => {
  try {
    const { token } = req.params;

    const { data, error } = await supabase
      .from('links')
      .select('judul, status')
      .eq('token', token)
      .maybeSingle();

    if (error || !data || data.status !== 'AKTIF') {
      return res.json({ valid: false });
    }

    res.json({
      valid: true,
      data: {
        judul: data.judul
      }
    });

  } catch (err) {
    next(err);
  }
};


//   Akses link, socket.IO emit disini
exports.accessLink = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { socketId } = req.query;

    // ATOMIC UPDATE → hanya satu request yang berhasil
    const { data, error } = await supabase
      .from('links')
      .update({
        status: 'TERPAKAI',
        accessed_at: new Date().toISOString()
      })
      .eq('token', token)
      .eq('status', 'AKTIF')
      .select()
      .maybeSingle();

    // JIKA GAGAL → sudah dibuka di tab lain
    if (error || !data) {
      return res.status(410).json({
        success: false,
        message: 'Link sudah diakses'
      });
    }

    // BURN TAB LAIN (KECUALI TAB INI)
    if (req.io && socketId) {
      req.io.to(token).except(socketId).emit('burn');
    }

    const signedFiles = await createSignedUrls(data.files || []);

    res.json({
      success: true,
      data: {
        judul: data.judul,
        isi_konten: data.isi_konten,
        files: signedFiles
      }
    });

  } catch (err) {
    next(err);
  }
};

