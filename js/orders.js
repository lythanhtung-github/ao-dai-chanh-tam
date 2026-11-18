// --- ORDERS LOGIC ---
function updateSearchClearButton() {
    const input = document.getElementById('search-input');
    const btn = document.getElementById('search-clear');
    if (!input || !btn) return;
    btn.classList.toggle('hidden', input.value.length === 0);
}

function clearSearchInput() {
    const input = document.getElementById('search-input');
    if (!input) return;
    input.value = '';
    updateSearchClearButton();
    currentPage = 1;
    renderOrders();
    input.focus();
}

function renderOrders() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const yearFilter = document.getElementById('year-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const paymentFilter = document.getElementById('payment-filter').value;
    const groupFilter = document.getElementById('group-filter').value;

    // Bộ lọc màu (chips) chỉ áp dụng cho đơn Áo dài
    const colorChips = document.getElementById('color-chips');
    if (colorChips) colorChips.classList.toggle('hidden', currentListType !== 'aodai');

    let filtered = orders.filter(o => o.type === currentListType && o.name.toLowerCase().includes(search));

    if (yearFilter !== 'ALL') {
        filtered = filtered.filter(o => getOrderYear(o) === yearFilter);
    }

    if (statusFilter === 'INCOMPLETE') {
        filtered = filtered.filter(o => o.status === 'MỚI' || o.status === 'ĐANG XỬ LÝ');
    } else if (statusFilter !== 'ALL') {
        filtered = filtered.filter(o => o.status === statusFilter);
    }

    if (groupFilter !== 'ALL') {
        filtered = filtered.filter(o => o.group === groupFilter);
    }

    if (colorFilterSelection.length > 0 && currentListType === 'aodai') {
        filtered = filtered.filter(o => (o.colors || []).some(c => colorFilterSelection.includes(c)));
    }

    if (paymentFilter !== 'ALL') {
        filtered = filtered.filter(o => {
            const paid = getPaidAmount(o);
            if (paymentFilter === 'UNPAID') return paid === 0;
            if (paymentFilter === 'PARTIAL') return paid > 0 && paid < (Number(o.price) || 0);
            if (paymentFilter === 'OWED') return paid < (Number(o.price) || 0);
            if (paymentFilter === 'PAID') return paid >= (Number(o.price) || 0);
            return true;
        });
    }

    sortFilteredOrders(filtered);

    // Pagination Logic
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filtered.length);
    const paginatedOrders = filtered.slice(startIndex, endIndex);

    const mobileContainer = document.getElementById('mobile-order-list');
    const desktopBody = document.getElementById('desktop-order-tbody');
    const emptyState = document.getElementById('empty-state');
    const thProductLabel = document.getElementById('th-product-label');
    const paginationInfo = document.getElementById('pagination-info');
    const summaryBar = document.getElementById('orders-summary');

    // Update Table Header based on type (span bên trong nút sort của th)
    if (thProductLabel) thProductLabel.innerText = currentListType === 'aodai' ? 'Màu áo' : 'Số lượng túi';
    updateSortHeaderStyles();
    updateColorChipStyles();

    // Thanh tổng hợp theo đúng phạm vi đang lọc
    if (summaryBar) {
        if (filtered.length === 0) {
            summaryBar.classList.add('hidden');
        } else {
            const totalValue = filtered.reduce((s, o) => s + (Number(o.price) || 0), 0);
            const totalPaid = filtered.reduce((s, o) => s + getPaidAmount(o), 0);
            document.getElementById('summary-count').innerText = filtered.length;
            document.getElementById('summary-total').innerText = formatMoney(totalValue);
            document.getElementById('summary-paid').innerText = formatMoney(totalPaid);
            document.getElementById('summary-debt').innerText = formatMoney(Math.max(0, totalValue - totalPaid));
            summaryBar.classList.remove('hidden');
        }
    }

    mobileContainer.innerHTML = '';
    desktopBody.innerHTML = '';
    document.getElementById('pagination-controls').innerHTML = '';

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        mobileContainer.classList.add('hidden');
        desktopBody.parentElement.parentElement.classList.add('hidden');
        if (paginationInfo) paginationInfo.innerText = '';
        return;
    }

    emptyState.classList.add('hidden');
    mobileContainer.classList.remove('hidden');
    desktopBody.parentElement.parentElement.classList.remove('hidden');
    
    if (paginationInfo) {
        paginationInfo.innerText = `Hiển thị ${startIndex + 1} - ${endIndex} trên tổng số ${filtered.length} đơn hàng`;
    }

    // Gom HTML vào mảng rồi gán 1 lần (tránh nối innerHTML trong vòng lặp)
    const mobileRows = [];
    const desktopRows = [];

    paginatedOrders.forEach(order => {
        const style = STATUS_STYLES[order.status] || STATUS_STYLES['MỚI'];
        const paid = getPaidAmount(order);

        // Dữ liệu đến từ Google Sheet -> luôn escape trước khi nhúng vào HTML
        const escName = escapeHtml(order.name);
        const escGroup = escapeHtml(order.group);
        const escGender = escapeHtml(order.gender || '');
        const escStatus = escapeHtml(order.status);
        const displayDate = isValidDateString(order.ngay_tao) ? order.ngay_tao : '01/01/2026';
        const escDate = escapeHtml(displayDate);

        let productInfoMobile = '';
        let productInfoDesktop = '';
        let progressText = '';

        if (order.type === 'aodai') {
            const colorDots = (order.colors || []).map(c => `<span class="w-3 h-3 rounded-full ${COLOR_MAP[c] || 'bg-slate-300'} shadow-sm inline-block border border-slate-100"></span>`).join('');
            const delivered = (order.colors || []).filter(c => order.chi_tiet_mau[c]?.giao_khach).length;
            const totalColors = (order.colors || []).length;

            productInfoMobile = `<div class="flex items-center gap-2"><span class="text-[12px] font-bold text-slate-700">${totalColors} Áo dài</span><div class="flex gap-1">${colorDots}</div></div>`;
            productInfoDesktop = `<div class="flex gap-1 mb-1">${colorDots}</div>`;
            progressText = `${delivered}/${totalColors}`;
        } else {
            productInfoMobile = `<div class="flex items-center gap-1.5 text-[12px] font-bold text-slate-700"><i class="fa-solid fa-bag-shopping text-amber-500"></i> ${Number(order.quantity) || 0} Túi</div>`;
            productInfoDesktop = `<div class="font-bold text-slate-800">${Number(order.quantity) || 0} túi</div>`;
            progressText = `${order.delivered_quantity || 0}/${order.quantity}`;
        }

        // Mobile Card
        mobileRows.push(`
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm active:bg-slate-50 transition-colors cursor-pointer flex flex-col gap-3" onclick="openOrderDetail('${order.id}')">
                <div class="flex justify-between items-start gap-3">
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-slate-900 text-[15px] truncate mb-1">${escName}</h4>
                        <div class="text-[12px] text-slate-500 font-medium truncate flex items-center gap-1.5">
                            <i class="fa-solid ${order.gender === 'Nữ' ? 'fa-venus text-rose-400' : (order.gender === 'Nam' ? 'fa-mars text-blue-400' : 'fa-users text-slate-400')}"></i>
                            <span>${order.gender ? escGender + ' • ' : ''}${escGroup}</span>
                        </div>
                        <div class="text-[11px] text-slate-400 mt-1 font-medium"><i class="fa-regular fa-calendar mr-1"></i>${escDate}</div>
                    </div>
                    <span class="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-100/50 ${style.bg} ${style.text} whitespace-nowrap tracking-wide uppercase">
                        ${escStatus}
                    </span>
                </div>

                <div class="border-t border-slate-100"></div>

                <div class="flex justify-between items-end pt-0.5">
                    <div class="space-y-1.5">
                        ${productInfoMobile}
                        <div class="text-[11px] font-medium text-slate-500 flex items-center">
                            <i class="fa-solid fa-truck-fast text-slate-400 w-4"></i>Giao: <span class="text-slate-700 font-bold ml-1">${progressText}</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-blue-600 text-[15px] leading-none mb-1.5">${formatMoney(order.price)}</div>
                        <div class="text-[11px] font-bold ${paid >= order.price ? 'text-emerald-500' : (paid > 0 ? 'text-amber-500' : 'text-slate-400')}">
                            ${paid >= order.price ? '<i class="fa-solid fa-check-circle mr-1"></i>Đã thu đủ' : (paid > 0 ? `Đã thu: ${formatMoney(paid)}` : 'Chưa thu tiền')}
                        </div>
                    </div>
                </div>
            </div>
        `);

        // Desktop Table Row
        desktopRows.push(`
            <tr class="hover:bg-slate-50 transition-colors group cursor-pointer" onclick="openOrderDetail('${order.id}')">
                <td class="px-5 py-3">
                    <div class="font-bold text-slate-800">${escName}</div>
                    ${order.gender ? `<div class="text-xs text-slate-500 font-medium">${escGender}</div>` : ''}
                </td>
                <td class="px-5 py-3 text-xs text-slate-500 font-medium">${escDate}</td>
                <td class="px-5 py-3 font-medium text-slate-600">${escGroup}</td>
                <td class="px-5 py-3">
                    ${productInfoDesktop}
                    <div class="text-[10px] text-slate-500">${progressText}</div>
                </td>
                <td class="px-5 py-3">
                    <div class="font-bold text-slate-900">${formatMoney(order.price)}</div>
                    <div class="text-[10px] ${paid >= order.price ? 'text-emerald-500 font-bold' : 'text-slate-500'}">Đã thu: ${formatMoney(paid)}</div>
                </td>
                <td class="px-5 py-3">
                    <span class="px-2.5 py-1 rounded-md text-[11px] font-bold ${style.bg} ${style.text}">
                        <i class="fa-solid ${style.icon} mr-1"></i>${escStatus}
                    </span>
                </td>
                <td class="px-5 py-3 text-right">
                    <button class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors">Chi tiết</button>
                </td>
            </tr>
        `);
    });

    mobileContainer.innerHTML = mobileRows.join('');
    desktopBody.innerHTML = desktopRows.join('');

    renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
    const controlsContainer = document.getElementById('pagination-controls');
    if (totalPages <= 1) return; 

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevBtn.className = `w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`;
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => { 
        if(currentPage > 1) { 
            currentPage--; 
            renderOrders(); 
            document.getElementById('main-scroll').scrollTop = 0;
        } 
    };
    controlsContainer.appendChild(prevBtn);

    // Page Numbers 
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, currentPage + 1);
    
    if (currentPage === 1) endPage = Math.min(totalPages, 3);
    if (currentPage === totalPages) startPage = Math.max(1, totalPages - 2);

    if (startPage > 1) {
        controlsContainer.appendChild(createPageBtn(1));
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'text-slate-400 font-bold px-1';
            ellipsis.innerText = '...';
            controlsContainer.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        controlsContainer.appendChild(createPageBtn(i));
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'text-slate-400 font-bold px-1';
            ellipsis.innerText = '...';
            controlsContainer.appendChild(ellipsis);
        }
        controlsContainer.appendChild(createPageBtn(totalPages));
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextBtn.className = `w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`;
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => { 
        if(currentPage < totalPages) { 
            currentPage++; 
            renderOrders(); 
            document.getElementById('main-scroll').scrollTop = 0;
        } 
    };
    controlsContainer.appendChild(nextBtn);
}

function createPageBtn(page) {
    const btn = document.createElement('button');
    btn.innerText = page;
    btn.className = `w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${currentPage === page ? 'bg-sky-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`;
    btn.onclick = () => {
        if (currentPage !== page) {
            currentPage = page;
            renderOrders();
            document.getElementById('main-scroll').scrollTop = 0;
        }
    };
    return btn;
}

// --- SORT THEO CỘT ---
const SORT_COLUMNS = ['name', 'date', 'group', 'product', 'price', 'status'];

function sortOrders(key) {
    if (currentSort.key !== key) {
        currentSort = { key, dir: 'asc' };      // lần 1: tăng dần
    } else if (currentSort.dir === 'asc') {
        currentSort.dir = 'desc';               // lần 2: giảm dần
    } else {
        currentSort = { key: null, dir: 'asc' }; // lần 3: về mặc định (mới nhất)
    }
    currentPage = 1;
    renderOrders();
}

function sortFilteredOrders(filtered) {
    if (!currentSort.key) {
        filtered.sort((a, b) => b.ts - a.ts);
        return;
    }
    const dir = currentSort.dir === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
        switch (currentSort.key) {
            case 'name':
                return dir * (a.name || '').localeCompare(b.name || '', 'vi');
            case 'group':
                return dir * (a.group || '').localeCompare(b.group || '', 'vi');
            case 'date':
                return dir * (getOrderDateValue(a) - getOrderDateValue(b));
            case 'product':
                return dir * (getProductCount(a) - getProductCount(b));
            case 'price':
                return dir * ((Number(a.price) || 0) - (Number(b.price) || 0));
            case 'status': {
                // Thứ tự: MỚI < ĐANG XỬ LÝ < HOÀN TẤT < HỦY
                let ia = ALL_STATUSES.indexOf(a.status); if (ia === -1) ia = ALL_STATUSES.length;
                let ib = ALL_STATUSES.indexOf(b.status); if (ib === -1) ib = ALL_STATUSES.length;
                return dir * (ia - ib);
            }
            default:
                return b.ts - a.ts;
        }
    });
}

function getProductCount(order) {
    return order.type === 'aodai' ? (order.colors || []).length : (Number(order.quantity) || 0);
}

function updateSortHeaderStyles() {
    SORT_COLUMNS.forEach(key => {
        const icon = document.getElementById(`sort-icon-${key}`);
        if (!icon) return;
        if (currentSort.key === key) {
            const asc = currentSort.dir === 'asc';
            icon.className = `fa-solid ${asc ? 'fa-sort-up' : 'fa-sort-down'} text-[10px] text-sky-600`;
        } else {
            icon.className = 'fa-solid fa-sort text-[10px] text-slate-300';
        }
    });
}

// --- CHIPS LỌC MÀU (đơn có BẤT KỲ màu nào được chọn) ---
function toggleColorChip(color) {
    const i = colorFilterSelection.indexOf(color);
    if (i > -1) {
        colorFilterSelection.splice(i, 1);
    } else {
        colorFilterSelection.push(color);
    }
    currentPage = 1;
    renderOrders();
}

function updateColorChipStyles() {
    COLOR_CHIP_IDS.forEach(({ color, id }) => {
        const chip = document.getElementById(id);
        if (!chip) return;
        const active = colorFilterSelection.includes(color);
        chip.className = `flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-colors whitespace-nowrap ${active ? 'bg-sky-50 border-sky-400 text-sky-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`;
    });
}

// Mở danh sách đơn đã lọc sẵn (bấm từ thẻ thống kê trên dashboard)
function openFilteredOrders(listType, { status, payment } = {}) {
    if (status) document.getElementById('status-filter').value = status;
    if (payment) document.getElementById('payment-filter').value = payment;
    switchTab(`orders-${listType}`);
}

// --- POPULATE & RESET FILTERS ---
function populateOrderFilterYears() {
    const yearSelect = document.getElementById('year-filter');
    if (!yearSelect) return;
    const currentVal = yearSelect.value || '2026';

    yearSelect.innerHTML = '<option value="ALL">Tất cả năm</option>';

    const years = new Set(['2026']);
    orders.forEach(o => {
        years.add(getOrderYear(o));
    });

    Array.from(years).sort((a,b) => b - a).forEach(y => {
        yearSelect.innerHTML += `<option value="${y}">Năm ${y}</option>`;
    });

    if (Array.from(years).includes(currentVal)) {
        yearSelect.value = currentVal;
    } else {
        yearSelect.value = 'ALL';
    }
}

function resetFilters() {
    // Đặt lại các input/select
    document.getElementById('search-input').value = '';
    document.getElementById('status-filter').value = 'INCOMPLETE';
    document.getElementById('payment-filter').value = 'ALL';
    document.getElementById('group-filter').value = 'ALL';
    colorFilterSelection = [];
    updateSearchClearButton();

    // Xử lý riêng cho năm (đưa về 2026 nếu có)
    const yearSelect = document.getElementById('year-filter');
    if (yearSelect) {
        const has2026 = Array.from(yearSelect.options).some(opt => opt.value === '2026');
        yearSelect.value = has2026 ? '2026' : 'ALL';
    }

    // Xóa luôn trạng thái sort, trở về mặc định (mới nhất)
    currentSort = { key: null, dir: 'asc' };

    // Trở về trang đầu tiên và render lại
    currentPage = 1;
    renderOrders();
}

