document.addEventListener('DOMContentLoaded', function() {
  const productsGrid = document.querySelector('.products-grid');
  if (!productsGrid) return;

  const productCards = document.querySelectorAll('.product-card');
  let filteredProducts = Array.from(productCards);

  // Filter functions
  function filterProducts() {
    const searchQuery = document.getElementById('collection-search')?.value.toLowerCase() || '';
    const priceMaxInput = document.getElementById('price-max');
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

    displayProducts(filteredProducts);
  }

  function displayProducts(products) {
    const grid = document.querySelector('.products-grid');
    grid.innerHTML = '';
    products.forEach(product => grid.appendChild(product));
  }

  // Event listeners
  const priceMaxInput = document.getElementById('price-max');
  const priceMaxValue = document.getElementById('price-max-value');

  document.getElementById('collection-search')?.addEventListener('input', filterProducts);
  document.querySelectorAll('input[name="category"], #sort').forEach(el => {
    el.addEventListener('change', filterProducts);
  });

  priceMaxInput?.addEventListener('input', () => {
    if (priceMaxValue) priceMaxValue.textContent = formatFilterCurrency(priceMaxInput.value);
    filterProducts();
  });

  if (priceMaxInput && priceMaxValue) {
    priceMaxValue.textContent = formatFilterCurrency(priceMaxInput.value);
  }

  document.querySelectorAll('#reset-filters, #reset-filters-mobile')?.forEach(button => {
    button.addEventListener('click', (event) => {
      event.preventDefault();

      const searchInput = document.getElementById('collection-search');
      if (searchInput) searchInput.value = '';

      document.querySelectorAll('#product-filter-sidebar input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
      });

      if (priceMaxInput) {
        priceMaxInput.value = priceMaxInput.defaultValue || 100000;
        if (priceMaxValue) priceMaxValue.textContent = formatFilterCurrency(priceMaxInput.value);
      }

      window.location.href = window.location.pathname;
    });
  });

  window.filterProducts = filterProducts; // Global for buttons
});

function formatFilterCurrency(value) {
  if (window.LuxeCurrency?.format) {
    return window.LuxeCurrency.format(value);
  }

  return `Rs. ${Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
}
