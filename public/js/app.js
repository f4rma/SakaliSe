// Elemen form utama
const formTautan = document.getElementById('form');

// Modal hasil
const modalHasil = document.getElementById('modal');
const inputLinkHasil = document.getElementById('linkHasil');
const tombolSalin = document.getElementById('tombolSalin');
const tombolTutupModal = document.getElementById('tutupModal');

// Area unggah file
const areaUnggah = document.getElementById('areaUnggah');
const inputFile = document.getElementById('files');
const daftarFile = document.getElementById('daftarFile');

// Penyimpanan file terpilih
let fileTerpilih = [];

// interaksi area unggah file

// Klik area → buka file picker
areaUnggah.addEventListener('click', () => inputFile.click());

// Drag over
areaUnggah.addEventListener('dragover', e => {
  e.preventDefault();
  areaUnggah.classList.add('active');
});

// Drag keluar
areaUnggah.addEventListener('dragleave', () => {
  areaUnggah.classList.remove('active');
});

// Drop file
areaUnggah.addEventListener('drop', e => {
  e.preventDefault();
  areaUnggah.classList.remove('active');
  tambahFile([...e.dataTransfer.files]);
});

// Pilih file via input
inputFile.addEventListener('change', e => {
  tambahFile([...e.target.files]);
});


// manajemen file
function tambahFile(files) {
  files.forEach(file => {
    const sudahAda = fileTerpilih.some(
      f => f.name === file.name && f.size === file.size
    );
    if (!sudahAda) fileTerpilih.push(file);
  });

  sinkronkanInput();
  renderDaftarFile();
}

// Sinkronkan ke input file (penting untuk FormData)
function sinkronkanInput() {
  const dt = new DataTransfer();
  fileTerpilih.forEach(file => dt.items.add(file));
  inputFile.files = dt.files;
}

// Render daftar file di UI
function renderDaftarFile() {
  daftarFile.innerHTML = '';
  const dzBagianDalam = document.querySelector('.dz-inner');
  if (fileTerpilih.length === 0) {
    if (dzBagianDalam) dzBagianDalam.style.display = '';
    return;
  } else {
    if (dzBagianDalam) dzBagianDalam.style.display = 'none';
  }

  fileTerpilih.forEach((file, idx) => {
    const item = document.createElement('div');
    item.className = 'file-item';

    // Nama file
    const nama = document.createElement('span');
    nama.title = file.name;
    nama.textContent = file.name;
    nama.className = 'file-nama';

    // Ukuran file
    const ukuran = document.createElement('small');
    ukuran.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    ukuran.className = 'file-ukuran';

    // Tombol silang
    const btnHapus = document.createElement('span');
    btnHapus.textContent = '×';
    btnHapus.title = 'Hapus file';
    btnHapus.className = 'hapus-file';
    btnHapus.onclick = () => {
      fileTerpilih.splice(idx, 1);
      sinkronkanInput();
      renderDaftarFile();
    };

    item.appendChild(nama);
    item.appendChild(ukuran);
    item.appendChild(btnHapus);
    daftarFile.appendChild(item);
  });
}

// form submit
let sedangMengirim = false;

formTautan.addEventListener('submit', async e => {
  e.preventDefault();
  if (sedangMengirim) return;

  sedangMengirim = true;

  const tombolSubmit = formTautan.querySelector('button[type="submit"]');
  tombolSubmit.disabled = true;
  tombolSubmit.textContent = 'Memproses...';

  try {
    const isiPesan = formTautan
      .querySelector('textarea[name="isi_konten"]')
      .value.trim();

    if (!isiPesan && fileTerpilih.length === 0) {
      alert('Isi pesan atau lampirkan minimal satu file.');
      throw new Error('Validasi gagal');
    }

    const formData = new FormData();
    formData.set('isi_konten', isiPesan);

    const email = formTautan.querySelector('input[name="email"]').value.trim();
    if (email) formData.set('email', email);

    fileTerpilih.forEach(file => formData.append('files', file));

    const response = await fetch('/api/links', {
      method: 'POST',
      body: formData
    });

    const hasil = await response.json();

    if (!hasil.success) {
      alert(hasil.message || 'Gagal membuat tautan');
      return;
    }

    // Tampilkan hasil
    inputLinkHasil.value = hasil.data.bagikanUrl;
    modalHasil.classList.remove('hidden');

  } catch (err) {
    console.error(err);
  } finally {
    sedangMengirim = false;
    tombolSubmit.disabled = false;
    tombolSubmit.textContent = 'Buat Tautan';
  }
});

// aksi tombol salin
tombolSalin.onclick = () => {
  navigator.clipboard.writeText(inputLinkHasil.value);
  tombolSalin.textContent = 'Tersalin!';
  setTimeout(() => (tombolSalin.textContent = 'Salin'), 1200);
};

tombolTutupModal.onclick = () => {
  modalHasil.classList.add('hidden');
  formTautan.reset();
  daftarFile.innerHTML = '';
  fileTerpilih = [];
  sinkronkanInput();
};
