// ==============================
// view.js — FINAL (STABLE)
// ==============================

const socket = io();
let socketId = null;

const params = new URLSearchParams(window.location.search);
const token = params.get('token');

const loading = document.getElementById('loading');
const warning = document.getElementById('warning');
const content = document.getElementById('content');
const errorBox = document.getElementById('error');

const judulPreview = document.getElementById('judulPreview');
const judulKonten = document.getElementById('judulKonten');
const isiKonten = document.getElementById('isiKonten');
const filesBox = document.getElementById('files');
const revealBtn = document.getElementById('revealBtn');

if (!token) {
  errorBox.textContent = 'Token tidak ditemukan';
  throw new Error('Token missing');
}

/* ==============================
   SOCKET.IO
================================ */
socket.on('connect', () => {
  socketId = socket.id;          // ✅ AMBIL ID DI SINI
  socket.emit('join-link', token);
});

socket.on('burn', () => {
  document.body.innerHTML = `
    <h2 style="color:red">Link ini sudah dibuka di tab lain</h2>
  `;
});

/* ==============================
   CHECK LINK (PREVIEW)
================================ */
fetch(`/api/links/${token}/check`)
  .then(res => res.json())
  .then(result => {
    loading.style.display = 'none';

    if (!result.valid) {
      errorBox.textContent = 'Link tidak valid atau sudah digunakan';
      return;
    }

    judulPreview.textContent = result.data.judul || 'Secret Content';
    warning.style.display = 'block';
  })
  .catch(() => {
    errorBox.textContent = 'Gagal menghubungi server';
  });

/* ==============================
   REVEAL CONTENT (ONCE)
================================ */
revealBtn.onclick = async () => {
  if (!socketId) {
    errorBox.textContent = 'Socket belum siap, coba ulangi';
    return;
  }

  try {
    const res = await fetch(
      `/api/links/${token}?socketId=${socketId}`
    );
    const result = await res.json();

    if (!result.success) {
      errorBox.textContent = 'Link sudah digunakan';
      return;
    }

    warning.style.display = 'none';
    content.style.display = 'block';

    judulKonten.textContent = result.data.judul || '';
    isiKonten.textContent = result.data.isi_konten || '';

    filesBox.innerHTML = '';

    (result.data.files || []).forEach(file => {
      if (!file.signedUrl) return;

      if (file.mime.startsWith('image/')) {
        filesBox.innerHTML += `<img src="${file.signedUrl}">`;
      }

      if (file.mime.startsWith('video/')) {
        filesBox.innerHTML += `
          <video controls>
            <source src="${file.signedUrl}" type="${file.mime}">
          </video>
        `;
      }

      if (file.mime.startsWith('audio/')) {
        filesBox.innerHTML += `
          <audio controls>
            <source src="${file.signedUrl}" type="${file.mime}">
          </audio>
        `;
      }
    });

  } catch (err) {
    console.error(err);
    errorBox.textContent = 'Gagal menghubungi server';
  }
};
