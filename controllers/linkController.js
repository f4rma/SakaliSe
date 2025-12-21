const supabase = require('../supabase/client');
const { generateToken } = require('../src/utils/generateToken');

/* ==============================
   CREATE LINK
================================ */
exports.createLink = async (req, res, next) => {
  try {
    const { judul, isi_konten } = req.body;

    if (!isi_konten || !isi_konten.trim()) {
      const err = new Error('Isi konten wajib');
      err.statusCode = 400;
      throw err;
    }

    const token = generateToken();

    const { error } = await supabase
      .from('links')
      .insert({
        token,
        judul: judul || 'Secret Content',
        isi_konten,
        status: 'AKTIF'
      });

    if (error) throw error;

    res.json({
      success: true,
      data: {
        shareUrl: `${process.env.BASE_URL}/view.html?token=${token}`
      }
    });

  } catch (err) {
    next(err); // ⬅️ lempar ke errorHandler
  }
};


/* ==============================
   CHECK LINK (AMAN, TANPA BURN)
================================ */
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


/* ==============================
   ACCESS LINK (SEKALI PAKAI)
   ⬅️ SOCKET.IO EMIT DI SINI
================================ */
exports.accessLink = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Update status → TERPAKAI (atomic)
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
      const err = new Error('Link invalid / sudah diakses');
      err.statusCode = 410;
      throw err;
    }

    //  SOCKET.IO EMIT (INI INTINYA)
    const io = req.app.get('io');
    io.to(token).emit('burn');

    res.json({
      success: true,
      data: {
        judul: data.judul,
        isi_konten: data.isi_konten,
        files: data.files || []
      }
    });

  } catch (err) {
    next(err);
  }
};
