const supabase = require('../supabase/client');
const { generateToken } = require('../src/utils/generateToken');

//  Buat Link
exports.createLink = async (req, res, next) => {
  try {
    const { judul, isi_konten } = req.body;

    if (!isi_konten || !isi_konten.trim()) {
      const err = new Error('Isi konten harus diisi');
      err.statusCode = 400;
      throw err;
    }

    const token = generateToken();

    const { error } = await supabase
      .from('links')
      .insert({
        token,
        judul: judul || 'Konten Rahasia',
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
    next(err); // lempar ke errorHandler
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

    // Update status → TERPAKAI (bersifat atomic)
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
      const err = new Error('Link tidak valid atau sudah diakses');
      err.statusCode = 410;
      throw err;
    }

    //  Emit Socket.IO (inti mekanisme burn)
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
