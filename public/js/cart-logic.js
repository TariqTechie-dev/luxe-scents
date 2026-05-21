document.addEventListener('DOMContentLoaded', () => {
  const quantityInput = document.getElementById('qtyInput');

  function updateQuantity(delta) {
    if (!quantityInput) {
      return;
    }

    const currentValue = parseInt(quantityInput.value, 10) || 1;
    const maxValue = parseInt(quantityInput.max, 10);
    const upperLimit = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : Infinity;
    quantityInput.value = Math.min(upperLimit, Math.max(1, currentValue + delta));
  }

  window.incrementQty = function incrementQty() {
    updateQuantity(1);
  };

  window.decrementQty = function decrementQty() {
    updateQuantity(-1);
  };

  document.querySelectorAll('[data-cart-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      if (form.dataset.cartForm === 'add') {
        return;
      }

      if (!window.fetch || !window.FormData) {
        return;
      }

      event.preventDefault();

      const submitter = event.submitter || form.querySelector('button[type="submit"]');
      const originalHtml = submitter ? submitter.innerHTML : '';
      const loadingLabel = submitter?.dataset.loadingLabel;

      if (submitter) {
        submitter.disabled = true;

        if (loadingLabel) {
          submitter.textContent = loadingLabel;
        } else {
          submitter.classList.add('opacity-60', 'cursor-not-allowed');
        }
      }

      try {
        const requestUrl = form.getAttribute('action') || '/cart/add';
        const formData = new FormData(form);
        const requestBody = new URLSearchParams();
        const csrfToken = formData.get('_csrf');

        for (const [key, value] of formData.entries()) {
          requestBody.append(key, value.toString());
        }

        const response = await fetch(requestUrl, {
          method: (form.method || 'POST').toUpperCase(),
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            ...(csrfToken ? { 'x-csrf-token': csrfToken.toString() } : {})
          },
          body: requestBody.toString()
        });
        const data = await parseJsonResponse(response);

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Unable to update cart.');
        }

        syncCartUi(form, data);

        if (window.showToast && data.message) {
          window.showToast(data.message, 'success');
        }
      } catch (error) {
        if (window.showToast) {
          window.showToast(error.message || 'Unable to update cart.', 'error');
        } else {
          console.error(error);
        }
      } finally {
        if (submitter) {
          submitter.disabled = false;

          if (loadingLabel) {
            submitter.innerHTML = originalHtml;
          } else {
            submitter.classList.remove('opacity-60', 'cursor-not-allowed');
          }
        }
      }
    });
  });
});

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type');

  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Expected JSON but got:', text);
    throw new Error('Server returned HTML instead of JSON');
  }

  return response.json();
}

function syncCartUi(form, data) {
  const cart = data.cart || { totalQty: 0, totalPrice: 0 };
  const productId = form.querySelector('[name="productId"]')?.value;

  updateTextContent('.cart-count', String(cart.totalQty));
  updateTextContent('.cart-count-summary', String(cart.totalQty));
  updateCurrency('.cart-total', cart.totalPrice);
  updateCurrency('.cart-grand-total', cart.totalPrice);

  if (!productId) {
    return;
  }

  const cartItem = document.querySelector(`.cart-item[data-product-id="${productId}"]`);

  if (!cartItem) {
    return;
  }

  if (data.removedProductId === productId || !data.cart?.lineItem) {
    cartItem.remove();

    if (cart.totalQty === 0) {
      window.location.reload();
    }

    return;
  }

  updateTextContent(cartItem.querySelector('.cart-item-qty'), String(data.cart.lineItem.quantity));
  updateCurrency(cartItem.querySelector('.cart-line-total'), data.cart.lineItem.lineTotal);
}

function updateTextContent(target, value) {
  const elements = typeof target === 'string' ? document.querySelectorAll(target) : [target];

  elements.forEach((element) => {
    if (!element) {
      return;
    }

    element.textContent = value;
  });
}

function updateCurrency(target, value) {
  const elements = typeof target === 'string' ? document.querySelectorAll(target) : [target];
  const formattedValue = `$${Number(value || 0).toFixed(2)}`;

  elements.forEach((element) => {
    if (!element) {
      return;
    }

    element.textContent = formattedValue;
  });
}
