const form = document.getElementById('form');
const isiKonten = document.getElementById('isi_konten');
const filesInput = document.getElementById('files');
const emailInput = document.getElementById('email');

const resultBox = document.getElementById('result');
const resultLink = document.getElementById('resultLink');
const copyBtn = document.getElementById('copyBtn');

let activeType = 'text';

/* =========================
   TAB HANDLER
========================= */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('bg-white', 'text-black');
      b.classList.add('bg-zinc-800');
    });

    btn.classList.add('bg-white', 'text-black');
    btn.classList.remove('bg-zinc-800');

    activeType = btn.dataset.type;
    filesInput.classList.toggle('hidden', activeType === 'text');
  });
});

/* =========================
   SUBMIT
========================= */
form.addEventListener('submit', async e => {
  e.preventDefault();

  const formData = new FormData();
  formData.append('isi_konten', isiKonten.value);
  formData.append('email', emailInput.value);

  for (const file of filesInput.files) {
    formData.append('files', file);
  }

  try {
    const res = await fetch('/api/links', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || 'Failed to create link');
      return;
    }

    resultBox.classList.remove('hidden');
    resultLink.value = data.data.shareUrl;

  } catch (err) {
    console.error(err);
    alert('Server error');
  }
});

/* =========================
   COPY
========================= */
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(resultLink.value);
  copyBtn.textContent = 'COPIED';
  setTimeout(() => (copyBtn.textContent = 'COPY'), 1500);
});
