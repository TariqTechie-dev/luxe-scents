document.addEventListener('DOMContentLoaded', () => {
  if (window.__adminSidebarInitialized) {
    return;
  }

  window.__adminSidebarInitialized = true;

  const sidebar = document.querySelector('[data-admin-sidebar]');
  const backdrop = document.querySelector('[data-admin-sidebar-backdrop]');
  const openButtons = Array.from(document.querySelectorAll('[data-admin-sidebar-open]'));
  const closeButtons = Array.from(document.querySelectorAll('[data-admin-sidebar-close]'));
  const desktopQuery = window.matchMedia('(min-width: 768px)');
  let lastFocusedElement = null;
  let isSidebarOpen = false;
  let bodyLockAdded = false;

  if (!sidebar) {
    return;
  }

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function getFocusableElements() {
    return Array.from(sidebar.querySelectorAll(focusableSelector))
      .filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
  }

  function setBodyLock(shouldLock) {
    if (shouldLock) {
      if (!document.body.classList.contains('overflow-hidden')) {
        document.body.classList.add('overflow-hidden');
        bodyLockAdded = true;
      }

      return;
    }

    if (bodyLockAdded) {
      document.body.classList.remove('overflow-hidden');
      bodyLockAdded = false;
    }
  }

  function setSidebarInteractive(isInteractive) {
    sidebar.toggleAttribute('inert', !isInteractive);
  }

  function setOpenState(isOpen) {
    const shouldOpen = Boolean(isOpen);
    const isDesktop = desktopQuery.matches;
    const wasOpen = isSidebarOpen;
    const isInteractive = shouldOpen || isDesktop;

    sidebar.classList.toggle('-translate-x-full', !shouldOpen);
    sidebar.classList.toggle('translate-x-0', shouldOpen);
    sidebar.setAttribute('aria-hidden', isInteractive ? 'false' : 'true');
    setSidebarInteractive(isInteractive);

    if (backdrop) {
      backdrop.classList.toggle('hidden', !shouldOpen || isDesktop);
      backdrop.setAttribute('aria-hidden', 'true');
    }

    openButtons.forEach((button) => {
      button.setAttribute('aria-expanded', String(shouldOpen));
    });

    setBodyLock(shouldOpen && !isDesktop);
    isSidebarOpen = shouldOpen;

    if (shouldOpen && !isDesktop && !wasOpen) {
      lastFocusedElement = document.activeElement;
      closeButtons[0]?.focus({ preventScroll: true });
    } else if (!shouldOpen && lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus({ preventScroll: true });
      lastFocusedElement = null;
    }
  }

  function syncToViewport() {
    if (desktopQuery.matches) {
      setOpenState(true);
      backdrop?.classList.add('hidden');
      setBodyLock(false);
      return;
    }

    setOpenState(false);
  }

  openButtons.forEach((button) => {
    button.addEventListener('click', () => setOpenState(true));
  });

  closeButtons.forEach((button) => {
    button.addEventListener('click', () => setOpenState(false));
  });

  backdrop?.addEventListener('click', () => setOpenState(false));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isSidebarOpen && !desktopQuery.matches) {
      setOpenState(false);
      return;
    }

    if (event.key !== 'Tab' || !isSidebarOpen || desktopQuery.matches) {
      return;
    }

    const focusableElements = getFocusableElements();

    if (!focusableElements.length) {
      event.preventDefault();
      sidebar.focus({ preventScroll: true });
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus({ preventScroll: true });
    }
  });

  if (typeof desktopQuery.addEventListener === 'function') {
    desktopQuery.addEventListener('change', syncToViewport);
  } else {
    desktopQuery.addListener(syncToViewport);
  }

  syncToViewport();
});
