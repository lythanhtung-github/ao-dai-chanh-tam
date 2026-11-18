// --- ORDER DETAIL MODAL ---
let currentDetailOrderId = null;

function openOrderDetail(id) {
    currentDetailOrderId = id;
    renderOrderDetail();
    const modal = document.getElementById('order-detail-modal');
    const content = document.getElementById('order-detail-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        if (window.innerWidth >= 768) {
            content.classList.remove('scale-95');
        } else {
            content.classList.remove('translate-y-full');
        }
    }, 10);
}

function closeOrderDetail() {
    const modal = document.getElementById('order-detail-modal');
    const content = document.getElementById('order-detail-content');
    modal.classList.add('opacity-0');
    if (window.innerWidth >= 768) {
        content.classList.add('scale-95');
    } else {
        content.classList.add('translate-y-full');
    }
    setTimeout(() => {
        modal.classList.add('hidden');
        currentDetailOrderId = null;
    }, 300);
}

function renderOrderDetail() {
    const order = orders.find(o => o.id === currentDetailOrderId);
    if (!order) return;

    const body = document.getElementById('detail-body');
    const paid = getPaidAmount(order);
    const remaining = Math.max(0, order.price - paid);
    const style = STATUS_STYLES[order.status] || STATUS_STYLES['MỚI'];
    const escName = escapeHtml(order.name);
    const escGroup = escapeHtml(order.group);
    const escStatus = escapeHtml(order.status);

    let progressHtml = '';
    
    if (order.type === 'aodai') {
        order.colors.forEach(c => {
            const det = order.chi_tiet_mau[c];
            progressHtml += `
                <div class="border border-slate-100 rounded-xl p-4 mb-3 flex flex-col sm:flex-row justify-between sm:items-start gap-3 bg-white shadow-sm">
                    <div class="flex items-center gap-2 mb-2 sm:mb-0 sm:w-1/4 sm:mt-3">
                        <div class="w-5 h-5 rounded-full ${COLOR_MAP[c]} shadow-inner"></div>
                        <span class="font-bold text-slate-800">Màu ${c}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1 flex-wrap sm:justify-end">
                        <div class="flex flex-col gap-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100 w-full sm:w-auto transition-all">
                            <label class="flex items-center gap-3 text-sm cursor-pointer">
                                <input type="checkbox" onchange="toggleColorState('${order.id}', '${c}', 'nhan_tho', this.checked)" ${det.nhan_tho ? 'checked' : ''} class="w-5 h-5 text-sky-500 rounded border-slate-300 focus:ring-sky-500">
                                <span class="font-semibold ${det.nhan_tho ? 'text-slate-800' : 'text-slate-500'}">Nhận từ thợ</span>
                            </label>
                            ${det.nhan_tho ? `
                                <input type="date" onchange="updateColorDate('${order.id}', '${c}', 'ngay_nhan_tho', this.value)" value="${parseDateToInputFormat(det.ngay_nhan_tho)}" class="mt-1 text-[13px] font-medium px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white w-full cursor-pointer">
                            ` : ''}
                        </div>
                        <div class="flex flex-col gap-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100 w-full sm:w-auto transition-all">
                            <label class="flex items-center gap-3 text-sm cursor-pointer">
                                <input type="checkbox" onchange="toggleColorState('${order.id}', '${c}', 'giao_khach', this.checked)" ${det.giao_khach ? 'checked' : ''} class="w-5 h-5 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500">
                                <span class="font-semibold ${det.giao_khach ? 'text-slate-800' : 'text-slate-500'}">Giao khách</span>
                            </label>
                            ${det.giao_khach ? `
                                <input type="date" onchange="updateColorDate('${order.id}', '${c}', 'ngay_giao', this.value)" value="${parseDateToInputFormat(det.ngay_giao)}" class="mt-1 text-[13px] font-medium px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 bg-white w-full cursor-pointer">
                            ` : ''}
                        </div>
                        <div class="flex flex-col gap-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100 w-full sm:w-auto transition-all">
                            <label class="flex items-center gap-3 text-sm cursor-pointer">
                                <input type="checkbox" onchange="toggleColorState('${order.id}', '${c}', 'gui_tien_tho', this.checked)" ${det.gui_tien_tho ? 'checked' : ''} class="w-5 h-5 text-purple-500 rounded border-slate-300 focus:ring-purple-500">
                                <span class="font-semibold ${det.gui_tien_tho ? 'text-slate-800' : 'text-slate-500'}">Gửi tiền thợ</span>
                            </label>
                            ${det.gui_tien_tho ? `
                                <input type="date" onchange="updateColorDate('${order.id}', '${c}', 'ngay_gui_tien', this.value)" value="${parseDateToInputFormat(det.ngay_gui_tien)}" class="mt-1 text-[13px] font-medium px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-700 bg-white w-full cursor-pointer">
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
    } else {
        // Bags Progress
        progressHtml = `
            <div class="border border-slate-100 rounded-xl p-4 mb-3 flex flex-col md:flex-row justify-between md:items-center bg-white shadow-sm gap-4">
                <div>
                    <div class="text-sm text-slate-500 font-medium mb-1">Số lượng túi đã giao</div>
                    <div class="font-black text-2xl text-slate-800">${order.delivered_quantity || 0} <span class="text-base text-slate-400 font-medium">/ ${order.quantity} túi</span></div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="updateBagDelivery('${order.id}', -1)" class="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-colors"><i class="fa-solid fa-minus"></i></button>
                    <button onclick="updateBagDelivery('${order.id}', 1)" class="w-10 h-10 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-amber-600 font-bold transition-colors"><i class="fa-solid fa-plus"></i></button>
                    <button onclick="updateBagDelivery('${order.id}', 'ALL')" class="ml-2 px-4 py-2 bg-emerald-50 text-emerald-600 font-bold text-sm rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200">Giao hết</button>
                </div>
            </div>
        `;
    }

    let historyHtml = '';
    if (order.lich_su_thanh_toan && order.lich_su_thanh_toan.length > 0) {
        historyHtml = `<div class="mt-3 space-y-2">`;
        order.lich_su_thanh_toan.forEach((p, idx) => {
            const methodBadge = p.phuong_thuc === 'Chuyển khoản' 
                ? `<span class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700 border border-sky-200">Chuyển khoản</span>`
                : `<span class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">Tiền mặt</span>`;

            historyHtml += `
                <div class="flex justify-between items-center text-sm p-3 bg-slate-50 border border-slate-100 rounded-lg gap-2">
                    <div class="text-slate-500 font-medium flex items-center flex-wrap gap-1">
                        <i class="fa-regular fa-clock mr-1"></i>
                        <input type="date" onchange="updatePaymentDate('${order.id}', ${idx}, this.value)" value="${escapeHtml(parseDateToInputFormat(p.ngay))}" title="Chỉnh sửa ngày nộp tiền" class="text-[13px] font-medium px-2 py-1 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white cursor-pointer">
                        ${p.phuong_thuc ? methodBadge : ''}
                    </div>
                    <div class="font-bold text-slate-700 whitespace-nowrap">${formatMoney(p.so_tien)}</div>
                </div>
            `;
        });
        historyHtml += `</div>`;
    } else {
        historyHtml = `<p class="text-sm text-slate-400 mt-2 italic font-medium">Chưa có lịch sử giao dịch.</p>`;
    }

    body.innerHTML = `
        <div class="mb-6 flex justify-between items-start">
            <div>
                <h4 class="font-bold text-xl text-slate-900">${escName}</h4>
                <p class="text-sm text-slate-500 font-medium">${order.gender ? escapeHtml(order.gender) + ' • ' : ''}${escGroup}</p>
                <span class="inline-block mt-2 px-2.5 py-1 rounded-md text-[11px] font-bold ${style.bg} ${style.text}">
                    ${escStatus}
                </span>
            </div>
            <button onclick="editOrderInfo('${order.id}')" class="text-slate-500 hover:text-sky-600 hover:bg-sky-50 bg-slate-100 p-2 px-3 rounded-lg text-sm font-semibold transition-colors">
                <i class="fa-solid fa-pen"></i> Sửa
            </button>
        </div>

        <!-- Section 1: Progress -->
        <div class="mb-8">
            <h5 class="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">
                <i class="fa-solid ${order.type === 'aodai' ? 'fa-shirt text-sky-500' : 'fa-bag-shopping text-amber-500'} mr-1"></i> Tiến độ áo / Túi
            </h5>
            ${progressHtml}
        </div>

        <!-- Section 2: Payment -->
        <div class="mb-6">
            <h5 class="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2"><i class="fa-solid fa-wallet mr-1 text-slate-400"></i> Thanh toán của Khách</h5>
            
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 flex justify-between items-center shadow-sm">
                <div>
                    <div class="text-xs font-bold text-slate-500 mb-1 tracking-wide">CÒN LẠI CẦN THU</div>
                    <div class="text-2xl font-bold ${remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}">${formatMoney(remaining)}</div>
                </div>
                <div class="text-right">
                    <div class="text-xs font-bold text-slate-500 mb-1 tracking-wide">TỔNG ĐƠN</div>
                    <div class="text-sm font-bold text-slate-700">${formatMoney(order.price)}</div>
                </div>
            </div>

            ${remaining > 0 ? `
                <div class="flex flex-col sm:flex-row gap-2 mb-4">
                    <input type="number" id="detail-pay-amount" placeholder="Nhập số tiền nộp..." class="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <input type="date" id="detail-pay-date" value="${parseDateToInputFormat(getTodayFormatted())}" title="Ngày nộp tiền" aria-label="Ngày nộp tiền" class="px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 cursor-pointer">
                    <div class="relative flex-shrink-0">
                        <select id="detail-pay-method" class="w-full sm:w-auto pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none cursor-pointer text-slate-700">
                            <option value="Chuyển khoản" selected>Chuyển khoản</option>
                            <option value="Tiền mặt">Tiền mặt</option>
                        </select>
                        <svg xmlns="http://www.w3.org/2000/svg" class="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                    </div>
                    <button onclick="addPaymentInstallment('${order.id}')" class="px-5 py-3 ${order.type === 'tui' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-sky-500 hover:bg-sky-600'} text-white font-bold rounded-xl text-sm shadow-sm whitespace-nowrap transition-colors w-full sm:w-auto">Nộp tiền</button>
                </div>
            ` : `
                <div class="mb-4 text-sm font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl flex items-center gap-2 border border-emerald-100 shadow-sm">
                    <i class="fa-solid fa-check-circle"></i> Đã thanh toán đủ toàn bộ đơn hàng
                </div>
            `}
            
            <div>
                <div class="text-xs font-bold text-slate-500 tracking-wider">LỊCH SỬ THU TIỀN</div>
                ${historyHtml}
            </div>
        </div>
        
        <div class="mt-8 border-t border-slate-100 pt-6 flex flex-col gap-3">
            <button onclick="syncCurrentOrderDetail()" class="w-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md flex justify-center items-center gap-2">
                <i class="fa-solid fa-floppy-disk"></i> LƯU
            </button>
            
            ${order.status !== 'HỦY' ? `
                <button onclick="cancelOrder('${order.id}')" class="text-red-500 text-sm font-bold py-2 px-4 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto">
                    <i class="fa-solid fa-ban"></i> Hủy bỏ đơn hàng
                </button>
            ` : `
                <button onclick="restoreOrder('${order.id}')" class="text-emerald-600 text-sm font-bold py-2 px-4 hover:bg-emerald-50 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto">
                    <i class="fa-solid fa-rotate-left"></i> Phục hồi đơn hàng
                </button>
            `}
        </div>
    `;
}

function syncCurrentOrderDetail() {
    const order = orders.find(o => o.id === currentDetailOrderId);
    if (order) {
        showToast('Đang lưu thay đổi lên Cloud...', 'info');
        syncToGoogleSheets('UPDATE', order);
    }
}

function toggleColorState(orderId, color, field, isChecked) {
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx > -1) {
        const today = getTodayFormatted();
        orders[idx].chi_tiet_mau[color][field] = isChecked;
        if (field === 'nhan_tho') {
            orders[idx].chi_tiet_mau[color].ngay_nhan_tho = isChecked ? (orders[idx].chi_tiet_mau[color].ngay_nhan_tho || today) : null;
        } else if (field === 'giao_khach') {
            orders[idx].chi_tiet_mau[color].ngay_giao = isChecked ? (orders[idx].chi_tiet_mau[color].ngay_giao || today) : null;
        } else if (field === 'gui_tien_tho') {
            orders[idx].chi_tiet_mau[color].ngay_gui_tien = isChecked ? (orders[idx].chi_tiet_mau[color].ngay_gui_tien || today) : null;
        }
        
        evaluateOrderStatus(orders[idx]);
        saveData();
        markPendingSync(orders[idx].id);
        renderOrderDetail();
        renderOrders();
    }
}

function updateColorDate(orderId, color, field, value) {
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx > -1) {
        orders[idx].chi_tiet_mau[color][field] = formatDateFromInput(value);
        saveData();
        markPendingSync(orders[idx].id);
        renderOrderDetail();
    }
}

function updateBagDelivery(orderId, action) {
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx > -1) {
        let order = orders[idx];
        if (action === 'ALL') {
            order.delivered_quantity = order.quantity;
        } else {
            let newQty = (order.delivered_quantity || 0) + action;
            if (newQty < 0) newQty = 0;
            if (newQty > order.quantity) newQty = order.quantity;
            order.delivered_quantity = newQty;
        }
        
        evaluateOrderStatus(order);
        saveData();
        markPendingSync(order.id);
        renderOrderDetail();
        renderOrders();
    }
}

function addPaymentInstallment(orderId) {
    const input = document.getElementById('detail-pay-amount');
    const methodSelect = document.getElementById('detail-pay-method');
    const dateInput = document.getElementById('detail-pay-date');
    let amt = parseInt(input.value);
    const method = methodSelect ? methodSelect.value : 'Chuyển khoản';
    const ngay = (dateInput && dateInput.value) ? formatDateFromInput(dateInput.value) : getTodayFormatted();

    if (!amt || amt <= 0) return;

    const idx = orders.findIndex(o => o.id === orderId);
    if (idx > -1) {
        const order = orders[idx];
        const paid = getPaidAmount(order);
        const remaining = order.price - paid;

        if (amt > remaining) amt = remaining;

        order.lich_su_thanh_toan.push({ ngay: ngay, so_tien: amt, phuong_thuc: method });

        evaluateOrderStatus(order);
        saveData();
        markPendingSync(order.id);
        renderOrderDetail();
        renderOrders();
        showToast(`Đã ghi nhận ${formatMoney(amt)} ngày ${ngay} (Chưa đồng bộ)`);
    }
}

function updatePaymentDate(orderId, index, value) {
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return;
    const installment = (orders[idx].lich_su_thanh_toan || [])[index];
    if (!installment) return;
    if (!value) {
        renderOrderDetail(); // bỏ trống -> trả về giá trị cũ
        return;
    }
    installment.ngay = formatDateFromInput(value);
    saveData();
    markPendingSync(orderId);
    renderOrderDetail();
    renderOrders();
    showToast(`Đã cập nhật ngày nộp tiền: ${installment.ngay} (Chưa đồng bộ)`, 'info');
}

function evaluateOrderStatus(order) {
    if (order.status === 'HỦY') return;

    const paid = getPaidAmount(order);
    
    if (order.type === 'aodai') {
        const totalColors = order.colors.length;
        const delivered = order.colors.filter(c => order.chi_tiet_mau[c]?.giao_khach).length;
        const receivedFromTailor = order.colors.filter(c => order.chi_tiet_mau[c]?.nhan_tho).length;

        if (delivered === totalColors && paid >= order.price) {
            order.status = 'HOÀN TẤT';
        } else if (paid > 0 || receivedFromTailor > 0 || delivered > 0) {
            order.status = 'ĐANG XỬ LÝ';
        } else {
            order.status = 'MỚI';
        }
    } else {
        const delivered = order.delivered_quantity || 0;
        
        if (delivered >= order.quantity && paid >= order.price) {
            order.status = 'HOÀN TẤT';
        } else if (paid > 0 || delivered > 0) {
            order.status = 'ĐANG XỬ LÝ';
        } else {
            order.status = 'MỚI';
        }
    }
}

function cancelOrder(id) {
    if (!confirm('Bạn chắc chắn muốn HỦY đơn hàng này? (nhấn nút LƯU để đồng bộ lên Cloud)')) return;
    const idx = orders.findIndex(o => o.id === id);
    if (idx > -1) {
        orders[idx].status = 'HỦY';
        saveData();
        markPendingSync(orders[idx].id);
        renderOrderDetail();
        renderOrders();
        showToast('Đã hủy đơn hàng (Chưa đồng bộ)', 'info');
    }
}

function restoreOrder(id) {
    const idx = orders.findIndex(o => o.id === id);
    if (idx > -1) {
        evaluateOrderStatus(orders[idx]);
        saveData();
        markPendingSync(orders[idx].id);
        renderOrderDetail();
        renderOrders();
        showToast('Đã phục hồi đơn hàng (Chưa đồng bộ)', 'info');
    }
}

