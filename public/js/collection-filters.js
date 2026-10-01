document.addEventListener('DOMContentLoaded', function() {
  const productsGrid = document.querySelector('.products-grid');
  if (!productsGrid) return;

  const productCards = document.querySelectorAll('.product-card');
  let filteredProducts = Array.from(productCards);

  const priceMaxInput = document.getElementById('price-max');
  const priceMaxValue = document.getElementById('price-max-value');
  const priceMinLabel = document.getElementById('price-min-label');
  const priceMaxLabel = document.getElementById('price-max-label');
  const resultsCount = document.getElementById('results-count');

  // Slider range follows the actual products on the page
  const prices = Array.from(productCards).map(card => parseFloat(card.dataset.price) || 0);
  const topPrice = Math.max.apply(null, prices.concat([0]));
  if (priceMaxInput && topPrice > 0) {
    const niceMax = Math.ceil(topPrice / 500) * 500;
    priceMaxInput.min = '0';
    priceMaxInput.max = String(niceMax);
    priceMaxInput.step = '100';
    priceMaxInput.value = String(niceMax);
    if (priceMaxValue) priceMaxValue.textContent = formatFilterCurrency(niceMax);
    if (priceMinLabel) priceMinLabel.textContent = formatFilterCurrency(0);
    if (priceMaxLabel) priceMaxLabel.textContent = formatFilterCurrency(niceMax);
  }

  function updateResultsCount(n) {
    if (resultsCount) resultsCount.textContent = 'Showing ' + n + ' result' + (n === 1 ? '' : 's');
  }

  // Filter functions
  function filterProducts() {
    const searchQuery = document.getElementById('collection-search')?.value.toLowerCase() || '';
    const priceMax = parseFloat(priceMaxInput?.value) || Infinity;
    const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(el => el.value);

    filteredProducts = Array.from(productCards).filter(card => {
      const name = (card.dataset.name || '').toLowerCase();
      const price = parseFloat(card.dataset.price) || 0;
      const cat = card.dataset.category || '';

      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(cat);

      return name.includes(searchQuery) &&
             price <= priceMax &&
             categoryMatch;
    });

    const sortValue = document.getElementById('sort')?.value || 'bestselling';
    const priceOf = (card) => parseFloat(card.dataset.price) || 0;
    const soldOf = (card) => parseInt(card.dataset.sold, 10) || 0;
    const createdOf = (card) => parseInt(card.dataset.createdAt, 10) || 0;
    if (sortValue === 'price-asc') filteredProducts.sort((a, b) => priceOf(a) - priceOf(b));
    else if (sortValue === 'price-desc') filteredProducts.sort((a, b) => priceOf(b) - priceOf(a));
    else if (sortValue === 'newest') filteredProducts.sort((a, b) => createdOf(b) - createdOf(a));
    else filteredProducts.sort((a, b) => soldOf(b) - soldOf(a));

    displayProducts(filteredProducts);
    updateResultsCount(filteredProducts.length);
  }

  function displayProducts(products) {
    const grid = document.querySelector('.products-grid');
    grid.innerHTML = '';
    if (products.length === 0) {
      grid.innerHTML = '<div class="col-span-full text-center py-20"><h3 class="text-xl font-bold text-slate-400">No products found.</h3><p class="mt-2 text-sm text-slate-500 dark:text-text-muted">Try adjusting your filters.</p></div>';
      return;
    }
    products.forEach(product => grid.appendChild(product));
  }

  // Event listeners
  document.getElementById('collection-search')?.addEventListener('input', filterProducts);
  document.querySelectorAll('input[name="category"], #sort').forEach(el => {
    el.addEventListener('change', filterProducts);
  });

  priceMaxInput?.addEventListener('input', () => {
    if (priceMaxValue) priceMaxValue.textContent = formatFilterCurrency(priceMaxInput.value);
    filterProducts();
  });

  document.querySelectorAll('#reset-filters, #reset-filters-mobile')?.forEach(button => {
    button.addEventListener('click', (event) => {
      event.preventDefault();

      const searchInput = document.getElementById('collection-search');
      if (searchInput) searchInput.value = '';

      document.querySelectorAll('#product-filter-sidebar input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
      });

      if (priceMaxInput) {
        priceMaxInput.value = priceMaxInput.max || priceMaxInput.defaultValue || 100000;
        if (priceMaxValue) priceMaxValue.textContent = formatFilterCurrency(priceMaxInput.value);
      }

      window.location.href = window.location.pathname;
    });
  });

  // Mobile: filters collapse under the tune button
  const toggleBtn = document.getElementById('toggle-filters-mobile');
  const filterBody = document.getElementById('filter-body');
  if (toggleBtn && filterBody) {
    if (window.innerWidth < 1024) {
      filterBody.classList.add('hidden');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
    toggleBtn.addEventListener('click', () => {
      const collapsed = filterBody.classList.toggle('hidden');
      toggleBtn.setAttribute('aria-expanded', String(!collapsed));
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) filterBody.classList.remove('hidden');
    });
  }

  window.filterProducts = filterProducts; // Global for buttons

  filterProducts();
});

function formatFilterCurrency(value) {
  if (window.LuxeCurrency?.format) {
    return window.LuxeCurrency.format(value);
  }

  return `Rs. ${Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
}
