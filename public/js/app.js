const form = document.getElementById('form');
const modal = document.getElementById('modal');
const resultLink = document.getElementById('resultLink');
const copyBtn = document.getElementById('copyBtn');
const closeModal = document.getElementById('closeModal');

const dropzone = document.getElementById('dropzone');
const filesInput = document.getElementById('files');
const fileList = document.getElementById('fileList');

/* =========================
   DROPZONE
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
  filesInput.files = e.dataTransfer.files;
  renderFiles();
});

filesInput.addEventListener('change', renderFiles);

function renderFiles() {
  fileList.innerHTML = '';
  [...filesInput.files].forEach(file => {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.textContent = `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    fileList.appendChild(div);
  });
}

/* =========================
   SUBMIT FORM
========================= */
form.addEventListener('submit', async e => {
  e.preventDefault();

  const fd = new FormData(form);
  [...filesInput.files].forEach(f => fd.append('files', f));

  try {
    const res = await fetch('/api/links', {
      method: 'POST',
      body: fd
    });

    const json = await res.json();

    if (!json.success) {
      alert(json.message || 'Failed to create link');
      return;
    }

    resultLink.value = json.data.shareUrl;
    modal.classList.remove('hidden');

  } catch (err) {
    console.error(err);
    alert('Server error');
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
};
