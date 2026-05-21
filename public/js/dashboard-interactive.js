// User Dashboard Interactivity
document.addEventListener('DOMContentLoaded', function() {
  if (!document.querySelector('.stat-card')) {
    return;
  }

  // Animate stat counters
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const statNumber = entry.target.querySelector('.stat-number');
        if (statNumber && !statNumber.dataset.animated) {
          statNumber.dataset.animated = 'true';
          const target = parseInt(statNumber.dataset.target);
          let current = 0;
          const increment = target / 100;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              statNumber.textContent = target;
              clearInterval(timer);
            } else {
              statNumber.textContent = Math.floor(current);
            }
          }, 20);
        }

        observer.unobserve(entry.target);
      }
    });
  });

  document.querySelectorAll('.stat-card').forEach(card => observer.observe(card));

  // Expandable order rows
  document.querySelectorAll('.order-row').forEach(row => {
    row.addEventListener('click', function(e) {
      if (e.target.closest('a, button, form')) return; // Don't interfere with actions
      this.classList.toggle('expanded');
      const details = this.querySelector('.order-details');
      if (details) {
        details.style.maxHeight = details.style.maxHeight ? null : `${details.scrollHeight}px`;
      }
    });
  });
  
  window.animateStats = true; // Global flag
});
