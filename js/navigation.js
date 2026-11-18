// --- NAVIGATION & SIDEBAR LOGIC ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
}

function toggleMenu(menuId, iconId) {
    const menu = document.getElementById(menuId);
    const icon = document.getElementById(iconId);
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        menu.classList.add('flex');
        icon.classList.add('rotate-90');
    } else {
        menu.classList.add('hidden');
        menu.classList.remove('flex');
        icon.classList.remove('rotate-90');
    }
}

function switchTab(tabId) {
    currentTab = tabId;
    
    // Hide all views
    ['dashboard', 'orders', 'prices', 'form'].forEach(id => {
        document.getElementById(`view-${id}`).classList.add('hidden');
        document.getElementById(`view-${id}`).classList.remove('block');
    });
    
    // Map tabId to View ID and Titles
    let targetView = tabId;
    let mobileTitle = "";
    let desktopTitle = "";

    if (tabId.startsWith('orders-')) {
        targetView = 'orders';
        currentListType = tabId.split('-')[1]; // 'aodai' or 'tui'
        mobileTitle = currentListType === 'aodai' ? "Đơn Áo Dài" : "Đơn Túi";
        desktopTitle = currentListType === 'aodai' ? "Danh sách đơn Áo Dài" : "Danh sách đơn Túi";
        currentPage = 1;
    } else if (tabId.startsWith('form-')) {
        targetView = 'form';
        const formType = tabId.split('-')[1];
        switchFormType(formType);
        mobileTitle = formType === 'aodai' ? "Thêm đơn Áo dài" : "Thêm đơn Túi";
        desktopTitle = formType === 'aodai' ? "Thêm đơn Áo dài mới" : "Thêm đơn Túi mới";
    } else if (tabId === 'dashboard') {
        mobileTitle = "Tổng quan";
        desktopTitle = "Tổng quan hệ thống";
    } else if (tabId === 'prices') {
        mobileTitle = "Bảng giá";
        desktopTitle = "Quản lý Bảng Giá";
    }

    // Show target
    document.getElementById(`view-${targetView}`).classList.remove('hidden');
    document.getElementById(`view-${targetView}`).classList.add('block');
    
    document.getElementById('mobile-title').innerText = mobileTitle;
    document.getElementById('desktop-title').innerText = desktopTitle;

    // Reset scroll
    document.getElementById('main-scroll').scrollTop = 0;

    // Update Nav Styles
    updateNavStyles(tabId);

    // Execute specific logic
    if(tabId === 'dashboard') renderDashboard();
    if(tabId.startsWith('orders-')) renderOrders();
    if(tabId === 'prices') renderPrices();
    if(tabId.startsWith('form-') && !document.getElementById('f-id').value) {
        resetFormFieldsOnly(); // Reset data but keep the configured type
    }

    // Close sidebar on mobile after clicking
    if (window.innerWidth < 768 && !document.getElementById('sidebar').classList.contains('-translate-x-full')) {
        toggleSidebar();
    }
}

function updateNavStyles(activeTab) {
    const allNavs = document.querySelectorAll('.nav-item');
    allNavs.forEach(btn => {
        btn.classList.remove('bg-sky-50', 'text-sky-600', 'bg-amber-50', 'text-amber-600', 'bg-indigo-50', 'text-indigo-600');
        btn.classList.add('text-slate-500');
    });

    const activeBtn = document.getElementById(`nav-${activeTab}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-500', 'hover:bg-slate-50');
        if (activeTab.includes('tui')) {
            activeBtn.classList.add('bg-amber-50', 'text-amber-600');
        } else {
            activeBtn.classList.add('bg-sky-50', 'text-sky-600');
        }
    }
}

function switchFormType(type) {
    document.getElementById('f-type').value = type;
    
    const btnSubmit = document.getElementById('f-submit-btn');
    
    if (type === 'aodai') {
        document.getElementById('form-section-aodai').classList.remove('hidden');
        document.getElementById('form-section-aodai').classList.add('block');
        document.getElementById('form-section-tui').classList.add('hidden');
        document.getElementById('form-section-tui').classList.remove('block');
        
        btnSubmit.classList.remove('bg-amber-500', 'hover:bg-amber-600', 'active:bg-amber-700');
        btnSubmit.classList.add('bg-sky-500', 'hover:bg-sky-600', 'active:bg-sky-700');
        
        autoSetPrice();
    } else {
        document.getElementById('form-section-aodai').classList.add('hidden');
        document.getElementById('form-section-aodai').classList.remove('block');
        document.getElementById('form-section-tui').classList.remove('hidden');
        document.getElementById('form-section-tui').classList.add('block');
        
        btnSubmit.classList.remove('bg-sky-500', 'hover:bg-sky-600', 'active:bg-sky-700');
        btnSubmit.classList.add('bg-amber-500', 'hover:bg-amber-600', 'active:bg-amber-700');
        
        updateFinalPriceDisplay();
    }
}

