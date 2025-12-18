// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// DOM elements
const loadingState = document.getElementById('loadingState');
const warningState = document.getElementById('warningState');
const contentState = document.getElementById('contentState');
const errorState = document.getElementById('errorState');
const revealBtn = document.getElementById('revealBtn');

// Check if token exists
if (!token) {
  showError('No token provided in URL');
} else {
  checkLinkStatus();
}

// Check link status without accessing
async function checkLinkStatus() {
  try {
    const response = await fetch(`/api/links/${token}/check`);
    const result = await response.json();

    if (result.valid) {
      // Show warning before access
      loadingState.classList.add('hidden');
      warningState.classList.remove('hidden');

      // Fill preview data
      document.getElementById('previewJudul').textContent = result.data.judul;
      document.getElementById('previewJenis').textContent = result.data.jenis_konten.toUpperCase();
      
      const expiryDate = new Date(result.data.waktu_kedaluwarsa);
      document.getElementById('previewExpiry').textContent = expiryDate.toLocaleString();

      // Setup reveal button
      revealBtn.addEventListener('click', accessLink);
    } else {
      // Show error
      const errorMessages = {
        'TOKEN_NOT_FOUND': 'This link does not exist or has been deleted.',
        'ALREADY_ACCESSED': 'This link has already been accessed and destroyed.',
        'EXPIRED': 'This link has expired and is no longer available.'
      };
      
      showError(errorMessages[result.reason] || 'This link is not available.');
    }
  } catch (error) {
    console.error('Error checking link:', error);
    showError('Network error. Please try again.');
  }
}

// Access link (one-time)
async function accessLink() {
  revealBtn.disabled = true;
  revealBtn.textContent = 'Accessing...';

  try {
    const response = await fetch(`/api/links/${token}`);
    const result = await response.json();

    if (result.success) {
      // Show content
      warningState.classList.add('hidden');
      contentState.classList.remove('hidden');

      // Fill content data
      document.getElementById('contentJudul').textContent = result.data.judul;
      document.getElementById('contentType').textContent = result.data.jenis_konten.toUpperCase();
      document.getElementById('contentBody').textContent = result.data.isi_konten;
      document.getElementById('accessTime').textContent = new Date(result.data.waktu_diakses).toLocaleString();

      // Setup copy button
      document.getElementById('copyContent').addEventListener('click', () => {
        const contentBody = document.getElementById('contentBody');
        const range = document.createRange();
        range.selectNode(contentBody);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        
        const btn = document.getElementById('copyContent');
        btn.textContent = 'Copied! ✓';
        setTimeout(() => {
          btn.textContent = 'Copy';
        }, 2000);
      });
    } else {
      showError(result.message || 'Failed to access link');
    }
  } catch (error) {
    console.error('Error accessing link:', error);
    showError('Network error. Please try again.');
  }
}

// Show error state
function showError(message) {
  loadingState.classList.add('hidden');
  warningState.classList.add('hidden');
  contentState.classList.add('hidden');
  errorState.classList.remove('hidden');
  
  document.getElementById('errorMessage').textContent = message;
}