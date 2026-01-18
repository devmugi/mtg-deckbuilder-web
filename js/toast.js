/**
 * Toast notification system
 */

let toastTimeout = null;

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {Object} action - Optional action { label, callback }
 * @param {number} duration - Duration in ms (default 3000)
 */
export function showToast(message, action = null, duration = 3000) {
  const toast = document.getElementById('toast');

  // Clear any existing timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  // Build toast content
  if (action) {
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-action" type="button">${action.label}</button>
    `;
    toast.querySelector('.toast-action').addEventListener('click', () => {
      action.callback();
      toast.classList.remove('visible');
    }, { once: true });
  } else {
    toast.textContent = message;
  }

  toast.classList.add('visible');

  toastTimeout = setTimeout(() => {
    toast.classList.remove('visible');
  }, duration);
}
