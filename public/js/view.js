const socket = io();

const params = new URLSearchParams(location.search);
const token = params.get('token');

const confirmBox = document.getElementById('confirm');
const contentBox = document.getElementById('content');
const burnedBox = document.getElementById('burned');

const openBtn = document.getElementById('openBtn');
const judulEl = document.getElementById('judul');
const isiEl = document.getElementById('isi');
const filesBox = document.getElementById('files');

let opened = false;
let burned = false;

/* ===============================
   VALIDASI TOKEN
================================ */
if (!token) {
  showBurned();
  throw new Error('Token missing');
}

/* ===============================
   SOCKET
================================ */
socket.on('connect', () => {
  mySocketId = socket.id;
  socket.emit('join-link', token);
  console.log('Socket connected:', mySocketId);
});

socket.on('burn', () => {
  console.log('BURN RECEIVED');
  if (!opened) {
    showBurned();
  }
});

/* ===============================
   BUTTON OPEN
================================ */
openBtn.addEventListener('click', async () => {
  if (opened || burned) return;
  opened = true;

  try {
    const res = await fetch(
      `/api/links/${token}?socketId=${socket.id}`
    );
    const json = await res.json();

    if (!json.success) {
      showBurned();
      return;
    }

    renderContent(json.data);

  } catch (err) {
    console.error(err);
    showBurned();
  }
});

/* ===============================
   RENDER CONTENT
================================ */
function renderContent(data) {
  confirmBox.style.display = 'none';
  burnedBox.style.display = 'none';
  contentBox.style.display = 'block';

  judulEl.textContent = data.judul;
  renderTextContent(data.isi_konten);
  filesBox.innerHTML = '';

  (data.files || []).forEach(file => {
    if (file.mime.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = file.signedUrl;
      img.className = 'media-img';
      filesBox.appendChild(img);
      return;
    }

    if (file.mime.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = file.signedUrl;
      video.controls = true;
      video.className = 'media-video';
      filesBox.appendChild(video);
      return;
    }

    if (file.mime.startsWith('audio/')) {
    const audio = document.createElement('audio');
    audio.src = file.signedUrl;
    audio.controls = true;
    audio.preload = 'metadata';
    audio.className = 'media-audio';

    const label = document.createElement('div');
    label.textContent = file.name;
    label.className = 'audio-label';

    const wrapper = document.createElement('div');
    wrapper.className = 'audio-wrapper';
    wrapper.appendChild(label);
    wrapper.appendChild(audio);

    filesBox.appendChild(wrapper);
    return;
    }

    const a = document.createElement('a');
    a.href = file.signedUrl;
    a.textContent = `${file.name}`;
    a.target = '_blank';
    a.className = 'file-link';
    filesBox.appendChild(a);
  });
}

function renderTextContent(text) {
  isiEl.innerHTML = '';

  if (!text) return;

  // Pecah berdasarkan baris kosong
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  paragraphs.forEach(p => {
    const el = document.createElement('p');
    el.textContent = p;
    isiEl.appendChild(el);
  });
}

/* ===============================
   BURN UI
================================ */
function showBurned() {
  burned = true;
  confirmBox.style.display = 'none';
  contentBox.style.display = 'none';
  burnedBox.style.display = 'block';
}