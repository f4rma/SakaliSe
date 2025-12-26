// ===============================
// PENGATURAN TEMA (GELAP / TERANG)
// ===============================

// Akses root HTML
const rootHtml = document.documentElement;

// Tombol toggle tema
const tombolTema = document.getElementById('toggleTheme');

// Ambil tema dari localStorage (default: gelap)
const temaTersimpan = localStorage.getItem('theme') || 'dark';
rootHtml.setAttribute('data-theme', temaTersimpan);
perbaruiIkonTema(temaTersimpan);

// Event klik tombol tema
tombolTema.addEventListener('click', () => {
  const temaSaatIni = rootHtml.getAttribute('data-theme');
  const temaBerikutnya = temaSaatIni === 'dark' ? 'light' : 'dark';

  rootHtml.setAttribute('data-theme', temaBerikutnya);
  localStorage.setItem('theme', temaBerikutnya);
  perbaruiIkonTema(temaBerikutnya);
});

// Mengubah ikon sesuai tema
function perbaruiIkonTema(tema) {
  tombolTema.textContent = tema === 'dark' ? '🌙' : '☀️';
}
