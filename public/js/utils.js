window.showToast = function showToast(message, type = 'success') {
  const toast = document.createElement('div');

  toast.className = [
    'fixed',
    'top-4',
    'right-4',
    'max-w-sm',
    'rounded-lg',
    'px-4',
    'py-3',
    'shadow-xl',
    'z-50',
    'transform',
    'translate-x-full',
    'transition-all',
    'duration-300',
    type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
  ].join(' ');

  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full');
  });

  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};
