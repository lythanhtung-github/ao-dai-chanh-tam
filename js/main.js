// --- INIT ---
async function init() {
    loadPrices();
    await fetchGoogleSheetData();
    if (orders.length === 0) seedDemoData();
    
    populateOrderFilterYears(); // Populate filter after data is loaded

    // Event Listeners for Filters
    const resetPageAndRender = () => { currentPage = 1; renderOrders(); };
    document.getElementById('search-input').addEventListener('input', resetPageAndRender);
    document.getElementById('year-filter').addEventListener('change', resetPageAndRender);
    document.getElementById('status-filter').addEventListener('change', resetPageAndRender);
    document.getElementById('payment-filter').addEventListener('change', resetPageAndRender);
    document.getElementById('group-filter').addEventListener('change', resetPageAndRender);
    document.getElementById('color-filter').addEventListener('change', resetPageAndRender);
    
    // Event Listeners for Color Stats
    document.getElementById('color-stat-year').addEventListener('change', renderColorStats);
    document.getElementById('color-stat-month').addEventListener('change', renderColorStats);

    renderPriceSelect();

    // Open default menus in desktop
    if (window.innerWidth >= 768) {
        toggleMenu('menu-aodai', 'icon-aodai');
    }

    // Initial view
    switchTab('dashboard');
}

// Run Init
window.addEventListener('DOMContentLoaded', init);
