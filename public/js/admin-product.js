document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('adminSidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const openSidebarBtn = document.getElementById('openSidebarBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const modal = document.getElementById('addProductModal');
  const openBtn = document.getElementById('openModalBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  const backdrop = document.getElementById('modalBackdrop');
  const configInput = document.getElementById('adminProductConfig');
  const shouldOpenAddModal = configInput?.value === 'true';
  const searchInput = document.getElementById('searchInput');
  const categoryChips = Array.from(document.querySelectorAll('.filter-chip'));
  const productRows = Array.from(document.querySelectorAll('.js-product-row'));
  const noFilterResultsRow = document.getElementById('noFilterResultsRow');
  const visibleProductCount = document.getElementById('visibleProductCount');
  let activeCategory = 'all';

  function toggleSidebar(show) {
    if (!sidebar || window.innerWidth >= 1024) {
      return;
    }

    sidebar.classList.toggle('-translate-x-full', !show);
    sidebar.classList.toggle('translate-x-0', show);

    if (sidebarBackdrop) {
      sidebarBackdrop.classList.toggle('hidden', !show);
    }
  }

  function setActiveChip(category) {
    categoryChips.forEach((chip) => {
      const isActive = chip.dataset.category === category;
      chip.classList.toggle('bg-primary', isActive);
      chip.classList.toggle('border-primary/10', isActive);
      chip.classList.toggle('text-background-dark', isActive);
      chip.classList.toggle('font-bold', isActive);
      chip.classList.toggle('shadow-md', isActive);
      chip.classList.toggle('bg-[#2d2616]', !isActive);
      chip.classList.toggle('border', !isActive);
      chip.classList.toggle('border-[#493f22]', !isActive);
      chip.classList.toggle('text-text-muted', !isActive);
      chip.classList.toggle('font-medium', !isActive);
    });
  }

  function applyProductFilters() {
    if (!productRows.length) {
      return;
    }

    const query = (searchInput?.value || '').trim().toLowerCase();
    let visibleCount = 0;

    productRows.forEach((row) => {
      const matchesSearch =
        !query ||
        row.dataset.name.includes(query) ||
        row.dataset.sku.includes(query);
      const matchesCategory =
        activeCategory === 'all' || row.dataset.category === activeCategory;
      const shouldShow = matchesSearch && matchesCategory;

      row.classList.toggle('hidden', !shouldShow);

      if (shouldShow) {
        visibleCount += 1;
      }
    });

    if (visibleProductCount) {
      visibleProductCount.textContent = String(visibleCount);
    }

    if (noFilterResultsRow) {
      noFilterResultsRow.classList.toggle('hidden', visibleCount !== 0);
    }
  }

  function toggleModal(show) {
    if (!modal) {
      return;
    }

    modal.classList.toggle('hidden', !show);
  }

  if (openSidebarBtn) {
    openSidebarBtn.addEventListener('click', () => toggleSidebar(true));
  }

  if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', () => toggleSidebar(false));
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => toggleSidebar(false));
  }

  if (openBtn) {
    openBtn.addEventListener('click', () => toggleModal(true));
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => toggleModal(false));
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => toggleModal(false));
  }

  if (shouldOpenAddModal) {
    toggleModal(true);
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyProductFilters);
  }

  categoryChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeCategory = chip.dataset.category || 'all';
      setActiveChip(activeCategory);
      applyProductFilters();
    });
  });

  setActiveChip(activeCategory);
  applyProductFilters();

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      if (sidebarBackdrop) {
        sidebarBackdrop.classList.add('hidden');
      }

      if (sidebar) {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
      }
    } else if (sidebar) {
      sidebar.classList.add('-translate-x-full');
      sidebar.classList.remove('translate-x-0');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      toggleSidebar(false);
    }
  });
});
