// --- FORM & BUSINESS LOGIC ---
// Đối tượng tiến độ mặc định cho 1 màu áo mới
function createEmptyColorDetail() {
    return { nhan_tho: false, ngay_nhan_tho: null, giao_khach: false, ngay_giao: null, gui_tien_tho: false, ngay_gui_tien: null };
}

// Màu có dữ liệu tiến độ (đã nhận/giao/gửi tiền hoặc đã ghi ngày) -> cảnh báo khi xóa
function colorHasProgress(det) {
    if (!det) return false;
    return det.nhan_tho || det.giao_khach || det.gui_tien_tho ||
        det.ngay_nhan_tho || det.ngay_giao || det.ngay_gui_tien;
}

function renderPriceSelect() {
    const selectEl = document.getElementById('f-price-select');
    selectEl.innerHTML = '';
    
    const activePrices = prices.filter(p => p.isActive);
    
    if (activePrices.length > 0) {
        const optGroup = document.createElement('optgroup');
        optGroup.label = "Giá theo bảng (đã bật hiển thị)";
        activePrices.forEach(p => {
            const option = document.createElement('option');
            option.value = p.price;
            option.textContent = `${formatMoney(p.price)} - ${p.name}`;
            optGroup.appendChild(option);
        });
        selectEl.appendChild(optGroup);
    }

    const customGroup = document.createElement('optgroup');
    customGroup.label = "Tùy chỉnh khác";
    const customOption = document.createElement('option');
    customOption.value = 'CUSTOM';
    customOption.textContent = "Tùy chỉnh (Tự nhập giá)...";
    customGroup.appendChild(customOption);
    
    selectEl.appendChild(customGroup);
    
    handlePriceSelectChange();
}

function getUnitPrice() {
    const selectVal = document.getElementById('f-price-select').value;
    if (selectVal === 'CUSTOM') {
        return parseInt(document.getElementById('f-custom-price').value) || 0;
    }
    return parseInt(selectVal) || 0;
}

function updateFormBagQuantity(change) {
    const input = document.getElementById('f-bag-qty');
    let val = parseInt(input.value) || 1;
    val += change;
    if(val < 1) val = 1;
    input.value = val;
    updateFinalPriceDisplay();
}

function getTotalPrice() {
    const type = document.getElementById('f-type').value;
    if (type === 'aodai') {
        const unitPrice = getUnitPrice();
        const checkedColors = document.querySelectorAll('input[name="f-colors"]:checked').length;
        return unitPrice * checkedColors;
    } else {
        const qty = parseInt(document.getElementById('f-bag-qty').value) || 1;
        return qty * BAG_PRICE;
    }
}

function updateFinalPriceDisplay() {
    document.getElementById('f-calculated-price').innerText = formatMoney(getTotalPrice());
}

function handlePriceSelectChange() {
    const selectVal = document.getElementById('f-price-select').value;
    const customContainer = document.getElementById('f-custom-price-container');
    
    if (selectVal === 'CUSTOM') {
        customContainer.classList.remove('hidden');
    } else {
        customContainer.classList.add('hidden');
    }
    updateFinalPriceDisplay();
}

function autoSetPrice() {
    if (document.getElementById('f-type').value !== 'aodai') return;

    const gender = document.querySelector('input[name="f-gender"]:checked').value;
    const checkedColors = document.querySelectorAll('input[name="f-colors"]:checked');
    const numColors = checkedColors.length;
    
    if (numColors === 0) {
        updateFinalPriceDisplay();
        return;
    }

    const activePrices = prices.filter(p => p.isActive);
    const match = activePrices.find(p => p.gender === gender);
    const selectEl = document.getElementById('f-price-select');
    
    let found = false;
    if (match) {
        for (let i = 0; i < selectEl.options.length; i++) {
            if (selectEl.options[i].value == match.price) {
                selectEl.selectedIndex = i;
                found = true;
                break;
            }
        }
    }
    
    if (!found) {
        selectEl.value = 'CUSTOM';
        document.getElementById('f-custom-price').value = match ? match.price : 0;
    }

    handlePriceSelectChange();
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const type = document.getElementById('f-type').value;
    const id = document.getElementById('f-id').value;
    const name = document.getElementById('f-name').value.trim();
    const group = document.getElementById('f-group').value;
    const price = getTotalPrice();

    let gender = null;
    let colors = [];
    let chi_tiet_mau = {};
    let quantity = 0;

    if (type === 'aodai') {
        const checkedColors = document.querySelectorAll('input[name="f-colors"]:checked');
        const errorMsg = document.getElementById('color-error');
        
        if (checkedColors.length === 0) {
            errorMsg.classList.remove('hidden');
            return;
        }
        errorMsg.classList.add('hidden');

        gender = document.querySelector('input[name="f-gender"]:checked').value;
        colors = Array.from(checkedColors).map(cb => cb.value);
        colors.forEach(c => {
            chi_tiet_mau[c] = createEmptyColorDetail();
        });
    } else {
        quantity = parseInt(document.getElementById('f-bag-qty').value) || 1;
    }
    
    if (id) {
        // Update
        const idx = orders.findIndex(o => o.id === id);
        if (idx > -1) {
            orders[idx].name = name;
            orders[idx].group = group;
            orders[idx].price = price;
            
            if (type === 'aodai') {
                orders[idx].gender = gender;

                // Cảnh báo nếu bỏ chọn màu đã có dữ liệu tiến độ (sẽ bị xóa mất)
                const removedWithProgress = (orders[idx].colors || []).filter(c =>
                    !colors.includes(c) && colorHasProgress(orders[idx].chi_tiet_mau[c]));
                if (removedWithProgress.length > 0) {
                    const ok = confirm(`Màu ${removedWithProgress.join(', ')} đã có tiến độ (nhận thợ/giao khách/gửi tiền) và sẽ bị XÓA nếu tiếp tục. Tiếp tục cập nhật?`);
                    if (!ok) return;
                }

                const newChiTiet = {};
                colors.forEach(c => {
                    newChiTiet[c] = orders[idx].chi_tiet_mau[c] || createEmptyColorDetail();
                });
                orders[idx].colors = colors;
                orders[idx].chi_tiet_mau = newChiTiet;
            } else {
                orders[idx].quantity = quantity;
            }

            evaluateOrderStatus(orders[idx]);
            showToast('Đã cập nhật đơn hàng!');
            syncToGoogleSheets('UPDATE', orders[idx]);
        }
    } else {
        // Create
        const newOrder = {
            id: 'ORD-' + Date.now(),
            type, name, gender, group, colors, price,
            chi_tiet_mau,
            quantity,
            delivered_quantity: 0,
            lich_su_thanh_toan: [],
            status: 'MỚI',
            ts: Date.now(),
            ngay_tao: getTodayFormatted()
        };
        orders.unshift(newOrder);
        showToast('Đã thêm đơn hàng mới!');
        syncToGoogleSheets('ADD', newOrder);
    }

    saveData();
    
    // Switch back to appropriate list
    if(type === 'aodai') {
        switchTab('orders-aodai');
    } else {
        switchTab('orders-tui');
    }
}

function editOrderInfo(id) {
    closeOrderDetail();
    const order = orders.find(o => o.id === id);
    if (!order) return;

    // Vào view form trước (switchTab tự reset form khi chưa có f-id),
    // rồi mới đổ dữ liệu đơn vào để autoSetPrice không ghi đè giá đã chọn
    switchTab(`form-${order.type}`);

    document.getElementById('f-id').value = order.id;
    document.getElementById('f-name').value = order.name;
    document.getElementById('f-group').value = order.group;

    if (order.type === 'aodai') {
        document.querySelector(`input[name="f-gender"][value="${order.gender}"]`).checked = true;
        order.colors.forEach(c => {
            const cb = document.querySelector(`input[name="f-colors"][value="${c}"]`);
            if(cb) cb.checked = true;
        });

        const numColors = order.colors.length || 1;
        const unitPrice = order.price / numColors;

        const selectEl = document.getElementById('f-price-select');
        let foundPrice = false;
        for (let i = 0; i < selectEl.options.length; i++) {
            if (selectEl.options[i].value == unitPrice) {
                selectEl.selectedIndex = i;
                foundPrice = true;
                break;
            }
        }
        if (!foundPrice) {
            selectEl.value = 'CUSTOM';
            document.getElementById('f-custom-price').value = unitPrice;
        }
        handlePriceSelectChange();

    } else {
        document.getElementById('f-bag-qty').value = order.quantity;
        updateFinalPriceDisplay();
    }

    document.getElementById('f-cancel-btn').classList.remove('hidden');
    document.getElementById('form-desktop-title').innerText = 'Chỉnh sửa thông tin cơ bản';
    document.getElementById('mobile-title').innerText = "Chỉnh sửa đơn";
    document.getElementById('desktop-title').innerText = "Chỉnh sửa đơn hàng";
}

function cancelEdit() {
    const type = document.getElementById('f-type').value;
    resetFormFieldsOnly();
    switchTab(`orders-${type}`);
}

function resetFormFieldsOnly() {
    const typeCache = document.getElementById('f-type').value;
    document.getElementById('order-form').reset();
    document.getElementById('f-id').value = '';
    document.getElementById('f-type').value = typeCache;
    document.getElementById('color-error').classList.add('hidden');
    document.getElementById('f-cancel-btn').classList.add('hidden');
    document.getElementById('form-desktop-title').innerText = 'Thêm đơn mới';
    
    if (typeCache === 'aodai') handlePriceSelectChange(); 
    if (typeCache === 'tui') updateFinalPriceDisplay();
}

