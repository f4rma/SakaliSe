require('dotenv').config();
const express = require('express');
const http = require('http');
const multer = require('multer');
const { Server } = require('socket.io');

const supabase = require('./config/database');
const { generateToken } = require('./src/utils/generateToken');
const { isAllowedFile } = require('./src/utils/fileValidator');
const {
  kirimLinkSekaliPakai,
  kirimNotifikasiAkses
} = require('./src/utils/emailService');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

/* ===============================
   MIDDLEWARE
================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

/* ===============================
   MULTER (MEMORY STORAGE)
================================ */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB
});

/* ===============================
   SOCKET.IO
================================ */
io.on('connection', socket => {
  socket.on('join-link', token => {
    socket.join(token);
  });
});

/* ===============================
   CREATE LINK
================================ */
app.post('/api/links', upload.array('files'), async (req, res) => {
  try {
    const { judul, isi_konten, email } = req.body;
    const files = req.files || [];

    if (!isi_konten && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Konten wajib diisi'
      });
    }

    const token = generateToken();
    const uploadedFiles = [];

    /* ===== Upload files ===== */
    for (const file of files) {
      if (!isAllowedFile(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Tipe file tidak diizinkan'
        });
      }

      const path = `links/${token}/${Date.now()}-${file.originalname}`;

      const { error } = await supabase.storage
        .from('sakalise-files')
        .upload(path, file.buffer, {
          contentType: file.mimetype
        });

      if (error) throw error;

      uploadedFiles.push({
        path,
        name: file.originalname,
        mime: file.mimetype
      });
    }

    /* ===== Save link ===== */
    await supabase.from('links').insert({
      token,
      judul: judul || 'Secret Content',
      isi_konten: isi_konten || null,
      files: uploadedFiles,
      status: 'AKTIF'
    });

    const shareUrl = `${process.env.BASE_URL}/view.html?token=${token}`;

    /* ===== Send email (optional) ===== */
    if (email) {
      kirimLinkSekaliPakai({
        to: email,
        shareUrl
      }).catch(err => {
        console.error('EMAIL ERROR (ignored):', err.message);
      });
    }


    res.json({
      success: true,
      data: { shareUrl }
    });

  } catch (err) {
    console.error('CREATE LINK ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/* ===============================
   CHECK LINK (PREVIEW)
================================ */
app.get('/api/links/:token/check', async (req, res) => {
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
});

/* ===============================
   ACCESS LINK (ONCE) — FIXED
================================ */
app.get('/api/links/:token', async (req, res) => {
  const { token } = req.params;
  const { socketId } = req.query;

  /* ===== 1. Fetch link safely ===== */
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (!data || data.status !== 'AKTIF') {
    return res.json({ success: false });
  }

  /* ===== 2. Mark as used ===== */
  await supabase
    .from('links')
    .update({
      status: 'TERPAKAI',
      accessed_at: new Date().toISOString()
    })
    .eq('token', token);

  /* ===== 3. Burn other tabs ===== */
  if (socketId) {
    io.to(token).except(socketId).emit('burn');
  }

  /* ===== 4. Signed URLs ===== */
  const signedFiles = [];
  for (const file of data.files || []) {
    const { data: url } = await supabase.storage
      .from('sakalise-files')
      .createSignedUrl(file.path, 60);

    signedFiles.push({
      ...file,
      signedUrl: url.signedUrl
    });
  }

  /* ===== 5. Access notification ===== */
  if (process.env.ADMIN_EMAIL) {
    await kirimNotifikasiAkses({
      to: process.env.ADMIN_EMAIL,
      judul: data.judul,
      token,
      waktu_diakses: new Date().toISOString(),
      ip_address: req.ip
    });
  }

  /* ===== 6. Response ===== */
  res.json({
    success: true,
    data: {
      judul: data.judul,
      isi_konten: data.isi_konten,
      files: signedFiles
    }
  });
});

/* ===============================
   START SERVER
================================ */
server.listen(PORT, '0.0.0.0', () => {
  console.log(`SakaliSe running at http://localhost:${PORT}`);
});
