// ===============================
// THEME TOGGLE (BUTTON VERSION)
// ===============================

const root = document.documentElement;
const toggleBtn = document.getElementById('toggleTheme');

// init theme
const savedTheme = localStorage.getItem('theme') || 'dark';
root.setAttribute('data-theme', savedTheme);
updateIcon(savedTheme);

toggleBtn.addEventListener('click', () => {
  const current = root.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';

  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateIcon(next);
});

function updateIcon(theme) {
  toggleBtn.textContent = theme === 'dark' ? '🌙' : '☀️';
}
