/* =========================
   ELEMENTS
========================= */
const form = document.getElementById('form');
const modal = document.getElementById('modal');
const resultLink = document.getElementById('resultLink');
const copyBtn = document.getElementById('copyBtn');
const closeModal = document.getElementById('closeModal');

const dropzone = document.getElementById('dropzone');
const filesInput = document.getElementById('files');
const fileList = document.getElementById('fileList');

/* =========================
   FILE STATE
========================= */
let selectedFiles = [];

/* =========================
   DROPZONE EVENTS
========================= */
dropzone.addEventListener('click', () => filesInput.click());

dropzone.addEventListener('dragover', e => {
  e.preventDefault();
  dropzone.classList.add('active');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('active');
});

dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('active');

  const newFiles = Array.from(e.dataTransfer.files);
  addFiles(newFiles);
});

filesInput.addEventListener('change', e => {
  addFiles(Array.from(e.target.files));
});

/* =========================
   FILE HANDLING
========================= */
function addFiles(files) {
  files.forEach(file => {
    // Cegah duplikat (nama + ukuran)
    if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
      selectedFiles.push(file);
    }
  });

  syncInputFiles();
  renderFiles();
}

function syncInputFiles() {
  const dt = new DataTransfer();
  selectedFiles.forEach(file => dt.items.add(file));
  filesInput.files = dt.files;
}

function renderFiles() {
  fileList.innerHTML = '';

  if (selectedFiles.length === 0) return;

  selectedFiles.forEach(file => {
    const div = document.createElement('div');
    div.className = 'file-item';

    div.innerHTML = `
      <span title="${file.name}">${file.name}</span>
      <small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>
    `;

    fileList.appendChild(div);
  });
}

/* =========================
   FORM SUBMIT
========================= */
let isSubmitting = false;

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (isSubmitting) return;
  isSubmitting = true;

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Memproses...';

  try {
    const isiKonten = form
      .querySelector('textarea[name="isi_konten"]')
      .value
      .trim();

    if (!isiKonten && selectedFiles.length === 0) {
      alert('Isi pesan atau lampirkan minimal satu file.');
      throw new Error('Validation failed');
    }

    const fd = new FormData();
    fd.set('isi_konten', isiKonten);

    const email = form.querySelector('input[name="email"]').value.trim();
    if (email) fd.set('email', email);

    selectedFiles.forEach(file => {
      fd.append('files', file);
    });

    const res = await fetch('/api/links', {
      method: 'POST',
      body: fd
    });

    const json = await res.json();

    if (!json.success) {
      alert(json.message || 'Gagal membuat tautan');
      return;
    }

    resultLink.value = json.data.shareUrl;
    modal.classList.remove('hidden');

  } catch (err) {
    console.error(err);
  } finally {
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Buat Tautan';
  }
});

/* =========================
   MODAL ACTIONS
========================= */
copyBtn.onclick = () => {
  navigator.clipboard.writeText(resultLink.value);
  copyBtn.textContent = 'Copied!';
  setTimeout(() => (copyBtn.textContent = 'Copy'), 1200);
};

closeModal.onclick = () => {
  modal.classList.add('hidden');
  form.reset();
  fileList.innerHTML = '';
  selectedFiles = [];
  syncInputFiles();
};
