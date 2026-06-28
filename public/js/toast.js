/**
 * Dynamic Toast Notification Engine
 * Creates and animations feedback messages.
 */
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = '🔔';
  if (type === 'success') {
    icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'error') {
    icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  } else if (type === 'info') {
    icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    <div class="toast-icon-wrapper">${icon}</div>
    <div class="toast-message">${message}</div>
    <button class="toast-close-btn">&times;</button>
  `;

  // Close toast on click
  toast.querySelector('.toast-close-btn').addEventListener('click', () => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  });

  container.appendChild(toast);

  // Trigger animation after appending
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto remove toast
  const autoTimeout = setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }
  }, 4500);

  // Store timeout on the element to clear if manually closed (optional)
  toast.dataset.timeoutId = autoTimeout;
}
