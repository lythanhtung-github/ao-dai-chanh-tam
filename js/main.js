// --- INIT ---
async function init() {
    // Overlay tải dữ liệu: tự tắt sau 15s để không kẹt giao diện nếu có lỗi bất ngờ
    const bootOverlay = document.getElementById('boot-overlay');
    const hideBootOverlay = () => {
        if (!bootOverlay || bootOverlay.dataset.hidden === '1') return;
        bootOverlay.dataset.hidden = '1';
        bootOverlay.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => bootOverlay.remove(), 400);
    };
    setTimeout(hideBootOverlay, 15000);

    loadPrices();
    loadPendingSync();
    updateSyncBadge();

    try {
        await fetchGoogleSheetData();
    } finally {
        hideBootOverlay();
    }

    if (orders.length === 0) seedDemoData();

    populateOrderFilterYears(); // Populate filter after data is loaded

    // Event Listeners for Filters
    const resetPageAndRender = () => { currentPage = 1; renderOrders(); };
    const debouncedSearch = debounce(resetPageAndRender, 250);
    document.getElementById('search-input').addEventListener('input', () => {
        updateSearchClearButton();
        debouncedSearch();
    });
    document.getElementById('year-filter').addEventListener('change', resetPageAndRender);
    document.getElementById('status-filter').addEventListener('change', resetPageAndRender);
    document.getElementById('payment-filter').addEventListener('change', resetPageAndRender);
    document.getElementById('group-filter').addEventListener('change', resetPageAndRender);

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
