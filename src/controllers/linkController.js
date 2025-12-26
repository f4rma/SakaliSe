const supabase = require('../config/supabase');
const { generateToken } = require('../utils/buatToken');
const { cekFileDiizinkan } = require('../utils/validasiFile');
const {
  uploadFiles,
  createSignedUrls
} = require('../services/layananPenyimpanan');
const { kirimLinkSekaliPakai } = require('../services/layananEmail');

// Buat tautan baru, dapat diakses kapan saja selama data masih ada
exports.buatTautan = async (req, res, next) => {
  try {
    const { judul, isi_konten, email } = req.body;
    const files = req.files || [];

    // Validasi: minimal teks atau file harus ada
    if (!isi_konten && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Konten wajib diisi'
      });
    }

    // Validasi tipe file
    files.forEach(file => {
      if (!cekFileDiizinkan(file.mimetype)) {
        const err = new Error('Tipe file tidak diizinkan');
        err.statusCode = 400;
        throw err;
      }
    });

    // Generate token unik
    const token = generateToken();

     // Upload file ke Supabase Storage
    const fileTersimpan =
      files.length > 0 ? await uploadFiles(token, files) : [];

    // Simpan metadata ke database
    const { error } = await supabase.from('links').insert({
      token,
      judul: judul || 'Pesan Rahasia | SakaliSe',
      isi_konten: isi_konten || null,
      files: fileTersimpan,
      status: 'AKTIF'
    });

    if (error) throw error;

    // Bentuk URL akses
    const baseUrl =
      process.env.BASE_URL ||
      `${req.protocol}://${req.get('host')}`;

    const bagikanUrl = `${baseUrl}/tampilan.html?token=${token}`;

    // Kirim email jika diminta
    if (email) {
      kirimLinkSekaliPakai({
        to: email,
        shareUrl: bagikanUrl
      }).catch(() => {});
    }

    res.json({
      success: true,
      data: { bagikanUrl }
    });

  } catch (err) {
    next(err);
  }
};

// Cek tautan (tanpa menghapus data)
exports.cekTautan = async (req, res, next) => {
  try {
    const { token } = req.params;

    const { data } = await supabase
      .from('links')
      .select('judul, status')
      .eq('token', token)
      .maybeSingle();

    if (!data || data.status !== 'AKTIF') {
      return res.json({ valid: false });
    }

    res.json({
      valid: true,
      data: { judul: data.judul }
    });

  } catch (err) {
    next(err);
  }
};

// Akses tautan (musnah setelah dibaca)
exports.aksesTautan = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { socketId } = req.query;

    // Ambil data link, Jika tidak ada berarti sudah pernah dibuka
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

    if (error || !data) {
      return res.status(410).json({
        success: false,
        message: 'Link sudah diakses'
      });
    }

    // Tutup tab lain (socket IO bekerja)
    if (req.io && socketId) {
      req.io.to(token).except(socketId).emit('burn');
    }

    // Buat URL bertanda untuk file (hanya untuk sesi akses ini)
    const filesDenganUrl =
      await createSignedUrls(data.files || []);

    // Kirim respon ke client
    res.json({
      success: true,
      data: {
        judul: data.judul,
        isi_konten: data.isi_konten,
        files: filesDenganUrl
      }
    });

  } catch (err) {
    next(err);
  }
};
