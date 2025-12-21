const socket = io({ autoConnect: false });

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
  socket.emit('join-link', token);
});

socket.on('burn', () => {
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
  isiEl.textContent = data.isi_konten || '';
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

    const a = document.createElement('a');
    a.href = file.signedUrl;
    a.textContent = `${file.name}`;
    a.target = '_blank';
    a.className = 'file-link';
    filesBox.appendChild(a);
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

/* ===============================
   START
================================ */
socket.connect();
