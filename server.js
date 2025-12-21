require('dotenv').config();
const express = require('express');
const http = require('http');
const multer = require('multer');
const { Server } = require('socket.io');

const supabase = require('./config/database');
const { generateToken } = require('./src/utils/generateToken');
const { isAllowedFile } = require('./src/utils/fileValidator');
const {
  sendEmail,
  sendAccessNotification
} = require('./src/utils/emailService');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set('io', io);

const PORT = process.env.PORT || 3000;

/* ===============================
   MIDDLEWARE
================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

/* ===============================
   MULTER (MEMORY)
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

    /* ===== Upload files to Supabase ===== */
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

    /* ===== OPTIONAL: send link via email ===== */
    if (email) {
      await sendEmail({
        to: email,
        subject: '🔐 SakaliSe — One-Time Secret Link',
        html: `
          <div style="font-family:Arial;max-width:600px;margin:auto">
            <h2>Secret Link Generated</h2>
            <p>This link can be opened <b>only once</b>.</p>
            <p>
              <a href="${shareUrl}">${shareUrl}</a>
            </p>
            <p style="color:#666;font-size:12px">
              After first access, this link will be permanently destroyed.
            </p>
          </div>
        `
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
   ACCESS LINK (ONCE)
================================ */
app.get('/api/links/:token', async (req, res) => {
  const { token } = req.params;
  const { socketId } = req.query;

  const { data } = await supabase
    .from('links')
    .update({
      status: 'TERPAKAI',
      accessed_at: new Date().toISOString()
    })
    .eq('token', token)
    .eq('status', 'AKTIF')
    .select()
    .maybeSingle();

  if (!data) {
    return res.json({ success: false });
  }

  /* ===== Burn other tabs ===== */
  if (socketId) {
    io.to(token).except(socketId).emit('burn');
  }

  /* ===== Signed URLs ===== */
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

  /* ===== Access notification email ===== */
  if (process.env.ADMIN_EMAIL) {
    await sendAccessNotification({
      to: process.env.ADMIN_EMAIL,
      judul: data.judul,
      token,
      waktu_diakses: data.accessed_at,
      ip_address: req.ip
    });
  }

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
server.listen(PORT, () => {
  console.log(`SakaliSe running at http://localhost:${PORT}`);
});
