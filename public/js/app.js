// Online Perfume Store - Interactive Features
// Progressive enhancement - works without JS too

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.flash-close').forEach((button) => {
    button.addEventListener('click', () => {
      button.closest('.flash-message')?.remove();
    });
  });

  document.querySelectorAll('.flash-message[data-auto-dismiss="true"]').forEach((message) => {
    window.setTimeout(() => {
      message.remove();
    }, 4000);
  });

  const toggle = document.querySelector('.dark-mode-toggle');

  if (toggle) {
    toggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
  }
});
