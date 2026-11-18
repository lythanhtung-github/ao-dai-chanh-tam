// --- UTILS ---
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Tổng tiền đã thu của 1 đơn (dùng chung ở orders, order-detail, dashboard, sheets)
function getPaidAmount(order) {
    return (order.lich_su_thanh_toan || []).reduce((s, p) => s + (Number(p.so_tien) || 0), 0);
}

function debounce(fn, ms) {
    let timer = null;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), ms);
    };
}

function isValidDateString(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return false;
    // Basic regex to check if format is like DD/MM/YYYY or D/M/YYYY
    const regex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    return regex.test(dateStr.trim());
}

function getOrderYear(order) {
    if (order.ngay_tao) {
        const match = order.ngay_tao.match(/\d{4}/);
        if (match) return match[0];
    }
    return new Date(order.ts).getFullYear().toString();
}

function formatMoney(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

function parseDateToInputFormat(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2];
        return `${y}-${m}-${d}`;
    }
    if (dateStr.includes('-')) return dateStr;
    return '';
}

function formatDateFromInput(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const y = parts[0];
        const m = parts[1];
        const d = parts[2];
        return `${d}/${m}/${y}`;
    }
    return dateStr;
}

function getTodayFormatted() {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// Chuyển đổi đơn để so sánh ngày (dd/mm/yyyy -> số yyyymmdd, fallback ts)
function getOrderDateValue(order) {
    if (isValidDateString(order.ngay_tao)) {
        const parts = order.ngay_tao.split('/');
        return Number(`${parts[2]}${parts[1].padStart(2, '0')}${parts[0].padStart(2, '0')}`);
    }
    return order.ts || 0;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    let icon = '<i class="fa-solid fa-circle-check text-emerald-400 text-lg"></i>';
    if (type === 'error') {
        icon = '<i class="fa-solid fa-circle-exclamation text-rose-400 text-lg"></i>';
    } else if (type === 'warning') {
        icon = '<i class="fa-solid fa-triangle-exclamation text-amber-400 text-lg"></i>';
    } else if (type === 'info') {
        icon = '<i class="fa-solid fa-circle-info text-sky-400 text-lg"></i>';
    }
    
    toast.className = `bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-3 toast-enter pointer-events-auto`;
    toast.innerHTML = `${icon} ${message}`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.replace('toast-enter', 'toast-leave');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

