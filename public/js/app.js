// Socket.io connection
const socket = io();

// DOM elements
const linkForm = document.getElementById('linkForm');
const resultContainer = document.getElementById('resultContainer');
const isiKontenTextarea = document.getElementById('isi_konten');
const charCount = document.querySelector('.char-count');
const submitBtn = document.getElementById('submitBtn');
const copyBtn = document.getElementById('copyBtn');
const createAnotherBtn = document.getElementById('createAnother');

// Character counter
isiKontenTextarea.addEventListener('input', (e) => {
  charCount.textContent = `${e.target.value.length} chars`;
});

// Form submission
linkForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Disable button
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating Link...';

  const formData = {
    judul: document.getElementById('judul').value || 'Secret Message',
    jenis_konten: document.getElementById('jenis_konten').value,
    isi_konten: document.getElementById('isi_konten').value,
    email_pengirim: document.getElementById('email_pengirim').value,
    email_penerima: document.getElementById('email_penerima').value || null
  };

  try {
    const response = await fetch('/api/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (result.success) {
      // Show result
      linkForm.classList.add('hidden');
      resultContainer.classList.remove('hidden');

      // Fill in data
      document.getElementById('generatedLink').value = result.data.shareUrl;
      
      const expiryDate = new Date(result.data.expires);
      const hoursUntilExpiry = Math.round((expiryDate - new Date()) / (1000 * 60 * 60));
      document.getElementById('expiryTime').textContent = `${hoursUntilExpiry} hours`;
      document.getElementById('emailStatus').textContent = result.data.emailSent ? 'Yes ✅' : 'No';

      // Show success notification
      showNotification('Link created successfully! 🎉', 'success');
    } else {
      showNotification(result.message || 'Failed to create link', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Network error. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Secret Link';
  }
});

// Copy button
copyBtn.addEventListener('click', () => {
  const linkInput = document.getElementById('generatedLink');
  linkInput.select();
  document.execCommand('copy');
  
  copyBtn.textContent = 'Copied! ✓';
  setTimeout(() => {
    copyBtn.textContent = 'Copy';
  }, 2000);
});

// Create another link
createAnotherBtn.addEventListener('click', () => {
  linkForm.reset();
  linkForm.classList.remove('hidden');
  resultContainer.classList.add('hidden');
  charCount.textContent = '0 chars';
});

// Socket.io: Listen for link access notifications
socket.on('link-accessed', (data) => {
  showNotification(`Your link "${data.judul}" was just accessed!`, 'info');
});

// Notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    animation: slideInRight 0.3s;
    max-width: 300px;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 4000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);