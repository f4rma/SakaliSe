// Inisialisasi Socket.IO
const socket = io();

// Ambil token dari URL
const parameterUrl = new URLSearchParams(location.search);
const token = parameterUrl.get('token');

// Elemen UI
const boxKonfirmasi = document.getElementById('konfirmasi');
const boxKonten = document.getElementById('konten');
const boxTerbakar = document.getElementById('hangus');

const tombolBuka = document.getElementById('buka');
const elemenJudul = document.getElementById('judul');
const elemenIsi = document.getElementById('isi');
const boxFile = document.getElementById('files');

// Status akses
let sudahDibuka = false;
let sudahTerbakar = false;

/* ==================
   VALIDASI TOKEN
===================== */
if (!token) {
  tampilkanTerbakar();
  throw new Error('Token tidak ditemukan');
}

/* ==============
   SOCKET.IO
================= */
// Join Room
socket.on('connect', () => {
  socket.emit('join-link', token);
  console.log('Socket terhubung:', socket.id);
});

// Event jika link sudah dibakar di tab lain
socket.on('burn', () => {
  if (!sudahDibuka) {
    tampilkanTerbakar();
  }
});

/* ==================
   Buka Link
===================== */
tombolBuka.addEventListener('click', async () => {
  if (sudahDibuka || sudahTerbakar) return;
  sudahDibuka = true;

  try {
    const response = await fetch(
      `/api/links/${token}?socketId=${socket.id}`
    );
    const hasil = await response.json();

    if (!hasil.success) {
      tampilkanTerbakar();
      return;
    }

    tampilkanKonten(hasil.data);

  } catch (error) {
    console.error(error);
    tampilkanTerbakar();
  }
});

/* =================
   Render Konten
==================== */
function tampilkanKonten(data) {
  boxKonfirmasi.style.display = 'none';
  boxTerbakar.style.display = 'none';
  boxKonten.style.display = 'block';

  elemenJudul.textContent = data.judul;
  tampilkanTeks(data.isi_konten);
  boxFile.innerHTML = '';

  (data.files || []).forEach(file => {
    // Gambar
    if (file.mime.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = file.signedUrl;
      img.className = 'media-img';
      boxFile.appendChild(img);
      return;
    }

    // Video
    if (file.mime.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = file.signedUrl;
      video.controls = true;
      video.className = 'media-video';
      boxFile.appendChild(video);
      return;
    }

    // Audio
    if (file.mime.startsWith('audio/')) {
      const audio = document.createElement('audio');
      audio.src = file.signedUrl;
      audio.controls = true;
      audio.preload = 'metadata';
      audio.className = 'media-audio';

      const label = document.createElement('div');
      label.textContent = file.name;
      label.className = 'audio-label';

      const pembungkus = document.createElement('div');
      pembungkus.className = 'audio-wrapper';
      pembungkus.appendChild(label);
      pembungkus.appendChild(audio);

      boxFile.appendChild(pembungkus);
      return;
    }

    // File lain
    const link = document.createElement('a');
    link.href = file.signedUrl;
    link.textContent = file.name;
    link.target = '_blank';
    link.className = 'file-link';
    boxFile.appendChild(link);
  });
}

// Render isi teks menjadi paragraf
function tampilkanTeks(teks) {
  elemenIsi.innerHTML = '';
  if (!teks) return;

  const paragraf = teks
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  paragraf.forEach(p => {
    const el = document.createElement('p');
    el.textContent = p;
    elemenIsi.appendChild(el);
  });
}

/* ========================
   Tampilkan Tautan Hangus
===========================*/
function tampilkanTerbakar() {
  sudahTerbakar = true;
  boxKonfirmasi.style.display = 'none';
  boxKonten.style.display = 'none';
  boxTerbakar.style.display = 'block';
}
