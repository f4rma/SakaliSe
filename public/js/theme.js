const root = document.documentElement;
const toggle = document.getElementById('themeToggle');

const savedTheme = localStorage.getItem('theme') || 'dark';
root.setAttribute('data-theme', savedTheme);

if (toggle) {
  toggle.checked = savedTheme === 'light';

  toggle.addEventListener('change', () => {
    const theme = toggle.checked ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  });
}
