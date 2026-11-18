// --- DATA LAYER ---
// Đọc JSON an toàn: dữ liệu hỏng thì xóa key, không để app crash vĩnh viễn
function readJsonSafe(key) {
    try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : null;
        return Array.isArray(parsed) ? parsed : null;
    } catch (e) {
        console.error(`Dữ liệu localStorage "${key}" hỏng, đã xóa và dùng fallback:`, e);
        localStorage.removeItem(key);
        return null;
    }
}

function loadLocalData() {
    orders = readJsonSafe(STORAGE_KEY) || [];
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function loadPrices() {
    const data = readJsonSafe(STORAGE_PRICES_KEY);
    if (data && data.length > 0) {
        prices = data;
    } else {
        prices = [
            { id: 'P1', name: 'Nữ', gender: 'Nữ', year: 2026, startDate: '2026-01-01', endDate: '2026-12-31', price: 450000, isActive: true },
            { id: 'P4', name: 'Nam', gender: 'Nam', year: 2026, startDate: '2026-01-01', endDate: '2026-12-31', price: 390000, isActive: true }
        ];
        savePrices();
    }
}

function savePrices() {
    localStorage.setItem(STORAGE_PRICES_KEY, JSON.stringify(prices));
    renderPriceSelect();
    if(currentTab === 'prices') renderPrices();
}

// --- DANH SÁCH ĐƠN CHƯA ĐỒNG BỘ (badge + thử lại) ---
function loadPendingSync() {
    try {
        const raw = localStorage.getItem(STORAGE_PENDING_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        pendingSyncIds = Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : [];
    } catch (e) {
        pendingSyncIds = [];
    }
}

function savePendingSync() {
    localStorage.setItem(STORAGE_PENDING_KEY, JSON.stringify(pendingSyncIds));
}

function markPendingSync(id) {
    if (!pendingSyncIds.includes(id)) {
        pendingSyncIds.push(id);
        savePendingSync();
    }
    updateSyncBadge();
}

function clearPendingSync(id) {
    const i = pendingSyncIds.indexOf(id);
    if (i > -1) {
        pendingSyncIds.splice(i, 1);
        savePendingSync();
    }
    updateSyncBadge();
}

function seedDemoData() {
    orders = [
        { 
            id: 'ORD-1', type: 'aodai', name: 'Nguyễn Thị Hoa', gender: 'Nữ', group: 'TÂM AN', colors: ['CAM', 'LAM'], price: 900000, 
            status: 'ĐANG XỬ LÝ', ts: Date.now() - 86400000, ngay_tao: '01/10/2026',
            chi_tiet_mau: {
                'CAM': { nhan_tho: true, ngay_nhan_tho: '01/10/2026', giao_khach: false, ngay_giao: null, gui_tien_tho: false, ngay_gui_tien: null },
                'LAM': { nhan_tho: false, ngay_nhan_tho: null, giao_khach: false, ngay_giao: null, gui_tien_tho: false, ngay_gui_tien: null }
            },
            quantity: 2, delivered_quantity: 0,
            lich_su_thanh_toan: [ { ngay: '01/10/2026', so_tien: 450000, phuong_thuc: 'Chuyển khoản' } ]
        },
        {
            id: 'ORD-2', type: 'tui', name: 'Trần Văn Bình', gender: null, group: 'HÍT THỞ MỈM CƯỜI', colors: [], price: 120000,
            status: 'MỚI', ts: Date.now(), ngay_tao: getTodayFormatted(),
            chi_tiet_mau: {},
            quantity: 2, delivered_quantity: 0,
            lich_su_thanh_toan: []
        }
    ];
    saveData();
}

