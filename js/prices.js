// --- PRICES LOGIC (Ao Dai) ---
function renderPrices() {
    const mobileContainer = document.getElementById('mobile-price-list');
    const desktopBody = document.getElementById('desktop-price-tbody');
    
    mobileContainer.innerHTML = '';
    desktopBody.innerHTML = '';

    prices.forEach(p => {
        const startStr = p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '...';
        const endStr = p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '...';
        
        mobileContainer.innerHTML += `
            <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                <div class="flex-1 mr-4">
                    <h4 class="font-bold text-slate-800 text-sm mb-1">${p.name}</h4>
                    <p class="text-[11px] text-slate-500 font-medium">${p.gender} • Năm ${p.year || 'N/A'}</p>
                    <p class="text-[10px] text-slate-400 font-medium mt-0.5"><i class="fa-regular fa-calendar mr-1"></i> ${startStr} - ${endStr}</p>
                    <div class="font-bold text-slate-900 mt-1.5">${formatMoney(p.price)}</div>
                </div>
                <div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" onchange="togglePriceStatus('${p.id}')" class="sr-only peer" ${p.isActive ? 'checked' : ''}>
                        <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                </div>
            </div>
        `;

        desktopBody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-5 py-3 font-bold text-slate-800">${p.name}</td>
                <td class="px-5 py-3 font-medium text-slate-600">${p.gender}</td>
                <td class="px-5 py-3 font-medium text-slate-600 text-center">${p.year || '-'}</td>
                <td class="px-5 py-3 text-xs text-slate-500 text-center">${startStr}</td>
                <td class="px-5 py-3 text-xs text-slate-500 text-center">${endStr}</td>
                <td class="px-5 py-3 font-bold text-slate-900">${formatMoney(p.price)}</td>
                <td class="px-5 py-3 text-center">
                    <label class="relative inline-flex items-center cursor-pointer flex justify-center">
                        <input type="checkbox" onchange="togglePriceStatus('${p.id}')" class="sr-only peer" ${p.isActive ? 'checked' : ''}>
                        <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                </td>
            </tr>
        `;
    });
}

function togglePriceStatus(id) {
    const idx = prices.findIndex(p => p.id === id);
    if (idx > -1) {
        prices[idx].isActive = !prices[idx].isActive;
        savePrices();
        showToast(`Đã ${prices[idx].isActive ? 'bật' : 'tắt'} hiển thị: ${prices[idx].name}`);
    }
}

function openPriceModal() {
    document.getElementById('price-form').reset();
    const modal = document.getElementById('price-modal');
    const content = document.getElementById('price-modal-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    }, 10);
}

function closePriceModal() {
    const modal = document.getElementById('price-modal');
    const content = document.getElementById('price-modal-content');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

function handlePriceSubmit(e) {
    e.preventDefault();
    const newPrice = {
        id: 'P-' + Date.now(),
        name: document.getElementById('p-name').value,
        gender: document.getElementById('p-gender').value,
        year: parseInt(document.getElementById('p-year').value) || new Date().getFullYear(),
        startDate: document.getElementById('p-start').value,
        endDate: document.getElementById('p-end').value,
        price: parseInt(document.getElementById('p-price').value),
        isActive: document.getElementById('p-active').checked
    };
    prices.push(newPrice);
    savePrices();
    closePriceModal();
    showToast('Đã thêm bảng giá mới!');
}

