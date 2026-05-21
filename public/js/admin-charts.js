// Admin Analytics Charts with Chart.js
document.addEventListener('DOMContentLoaded', function() {
  if (typeof Chart === 'undefined') {
    return;
  }

  // Sales chart data (mock - can pass from EJS)
  const salesCtx = document.getElementById('salesChart');
  if (salesCtx) {
    new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Sales $',
          data: [12000, 19000, 15000, 25000, 22000, 30000],
          borderColor: '#f4c025',
          backgroundColor: 'rgba(244, 192, 37, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
          x: { grid: { color: 'rgba(255,255,255,0.1)' } }
        }
      }
    });
  }

  // Orders bar chart
  const ordersCtx = document.getElementById('ordersChart');
  if (ordersCtx) {
    new Chart(ordersCtx, {
      type: 'bar',
      data: {
        labels: ['Chanel', 'Dior', 'Tom Ford', 'Gucci', 'YSL'],
        datasets: [{
          label: 'Orders',
          data: [340, 280, 450, 220, 310],
          backgroundColor: '#f4c025',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // Export button
  document.querySelector('#export-btn')?.addEventListener('click', function() {
    // Mock export
    const dataStr = 'data:text/csv;charset=utf-8,Order ID,Customer,Amount\\n10234,Alice,$135';
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = 'analytics.csv';
    link.click();
    if (window.showToast) {
      window.showToast('Report exported!', 'success');
    }
  });
});
