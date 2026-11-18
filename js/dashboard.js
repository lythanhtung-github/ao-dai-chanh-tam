// --- DASHBOARD LOGIC ---
function renderDashboard() {
    const activeOrders = orders.filter(o => o.status !== 'HỦY');
    
    // Stats: Áo Dài
    const adOrders = activeOrders.filter(o => o.type === 'aodai');
    document.getElementById('stat-ad-total').innerText = adOrders.length;
    document.getElementById('stat-ad-completed').innerText = adOrders.filter(o => o.status === 'HOÀN TẤT').length;
    
    const adExpected = adOrders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);
    const adCollected = adOrders.reduce((sum, o) => sum + getPaidAmount(o), 0);
    document.getElementById('stat-ad-collected').innerText = formatMoney(adCollected);
    document.getElementById('stat-ad-remaining').innerText = formatMoney(Math.max(0, adExpected - adCollected));
    
    document.getElementById('stat-female').innerText = adOrders.filter(o => o.gender === 'Nữ').length;
    document.getElementById('stat-male').innerText = adOrders.filter(o => o.gender === 'Nam').length;

    // Stats: Túi
    const bagOrders = activeOrders.filter(o => o.type === 'tui');
    const totalBagsOrdered = bagOrders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
    const totalBagsDelivered = bagOrders.reduce((sum, o) => sum + (Number(o.delivered_quantity) || 0), 0);
    
    document.getElementById('stat-bag-total').innerText = totalBagsOrdered;
    document.getElementById('stat-bag-delivered').innerText = totalBagsDelivered;
    
    const bagExpected = bagOrders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);
    const bagCollected = bagOrders.reduce((sum, o) => sum + getPaidAmount(o), 0);
    document.getElementById('stat-bag-collected').innerText = formatMoney(bagCollected);
    document.getElementById('stat-bag-remaining').innerText = formatMoney(Math.max(0, bagExpected - bagCollected));

    // Progress Bars (Ao Dai only to keep it clean)
    const counts = {};
    ALL_STATUSES.forEach(s => counts[s] = 0);
    adOrders.forEach(o => { if(counts[o.status] !== undefined) counts[o.status]++ });

    const container = document.getElementById('status-progress');
    const progressRows = [];

    STATUS_FLOW.forEach(status => {
        const count = counts[status];
        const pct = adOrders.length ? (count / adOrders.length) * 100 : 0;
        const color = STATUS_STYLES[status].bar;

        progressRows.push(`
            <div>
                <div class="flex justify-between text-xs font-medium mb-1">
                    <span class="text-slate-700">${escapeHtml(status)}</span>
                    <span class="text-slate-500">${count}</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2">
                    <div class="${color} h-2 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
                </div>
            </div>
        `);
    });
    container.innerHTML = progressRows.join('');

    // Yearly Stats Calculation (Separated for Ao Dai and Tui)
    const yearlyData = {};
    activeOrders.forEach(o => {
        const year = getOrderYear(o);
        if (!yearlyData[year]) {
            yearlyData[year] = {
                aodai: { count: 0, total: 0, collected: 0 },
                tui: { count: 0, total: 0, collected: 0 }
            };
        }
        const paid = getPaidAmount(o);
        if (o.type === 'aodai') {
            yearlyData[year].aodai.count++;
            yearlyData[year].aodai.total += (Number(o.price) || 0);
            yearlyData[year].aodai.collected += paid;
        } else {
            yearlyData[year].tui.count++;
            yearlyData[year].tui.total += (Number(o.price) || 0);
            yearlyData[year].tui.collected += paid;
        }
    });

    const yearlyContainer = document.getElementById('yearly-stats-container');
    const yearCards = [];

    const years = Object.keys(yearlyData).sort((a, b) => b - a);

    if (years.length === 0) {
        yearlyContainer.innerHTML = '<p class="text-sm text-slate-500 italic text-center py-4">Chưa có dữ liệu thống kê</p>';
    } else {
        years.forEach(year => {
            const data = yearlyData[year];
            const adRemaining = Math.max(0, data.aodai.total - data.aodai.collected);
            const tuiRemaining = Math.max(0, data.tui.total - data.tui.collected);
            const totalCount = data.aodai.count + data.tui.count;
            
            yearCards.push(`
                <div class="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors mb-3">
                    <div class="flex justify-between items-center mb-3 border-b border-slate-200/60 pb-2">
                        <h4 class="font-bold text-slate-800 text-base">Năm ${escapeHtml(year)}</h4>
                        <span class="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-md shadow-sm">Tổng: ${totalCount} đơn</span>
                    </div>

                    <!-- Tài chính Áo Dài -->
                    <div class="mb-3 pb-3 border-b border-slate-200/50 border-dashed">
                        <div class="text-sm font-bold text-sky-600 mb-2 flex items-center"><i class="fa-solid fa-shirt mr-1.5"></i>Tài chính Áo Dài (${data.aodai.count} đơn)</div>
                        <div class="grid grid-cols-2 gap-3 text-xs md:text-sm">
                            <div>
                                <div class="text-slate-500 mb-0.5 font-medium">Tổng doanh thu</div>
                                <div class="font-bold text-slate-900">${formatMoney(data.aodai.total)}</div>
                            </div>
                            <div class="text-right">
                                <div class="text-slate-500 mb-0.5 font-medium">Đã thu / Còn nợ</div>
                                <div class="font-bold"><span class="text-emerald-600">${formatMoney(data.aodai.collected)}</span> <span class="text-slate-300 font-normal mx-0.5">/</span> <span class="text-rose-600">${formatMoney(adRemaining)}</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- Tài chính Túi -->
                    <div>
                        <div class="text-sm font-bold text-amber-600 mb-2 flex items-center"><i class="fa-solid fa-bag-shopping mr-1.5"></i>Tài chính Túi Chánh Tâm (${data.tui.count} đơn)</div>
                        <div class="grid grid-cols-2 gap-3 text-xs md:text-sm">
                            <div>
                                <div class="text-slate-500 mb-0.5 font-medium">Tổng doanh thu</div>
                                <div class="font-bold text-slate-900">${formatMoney(data.tui.total)}</div>
                            </div>
                            <div class="text-right">
                                <div class="text-slate-500 mb-0.5 font-medium">Đã thu / Còn nợ</div>
                                <div class="font-bold"><span class="text-emerald-600">${formatMoney(data.tui.collected)}</span> <span class="text-slate-300 font-normal mx-0.5">/</span> <span class="text-rose-600">${formatMoney(tuiRemaining)}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
}

function renderColorStats() {
    const yearFilter = document.getElementById('color-stat-year').value;
    const monthFilter = document.getElementById('color-stat-month').value;
    
    const activeOrders = orders.filter(o => o.type === 'aodai' && o.status !== 'HỦY');
    
    const stats = {
        'CAM': { 'Nữ': 0, 'Nam': 0 },
        'LAM': { 'Nữ': 0, 'Nam': 0 },
        'VÀNG': { 'Nữ': 0, 'Nam': 0 }
    };
    
    let totalShirts = 0;
    
    activeOrders.forEach(o => {
        const orderYear = getOrderYear(o);
        let orderMonth = "ALL";
        
        if (o.ngay_tao) {
            const parts = o.ngay_tao.split('/');
            if (parts.length === 3) orderMonth = parseInt(parts[1]).toString();
        } else if (o.ts) {
            orderMonth = (new Date(o.ts).getMonth() + 1).toString();
        }
        
        if (yearFilter !== 'ALL' && orderYear !== yearFilter) return;
        if (monthFilter !== 'ALL' && orderMonth !== monthFilter) return;
        
        o.colors.forEach(c => {
            if (stats[c]) {
                stats[c][o.gender]++;
                totalShirts++;
            }
        });
    });
    
    const container = document.getElementById('color-stats-container');
    container.innerHTML = '';
    
    ['CAM', 'LAM', 'VÀNG'].forEach(color => {
        const nu = stats[color]['Nữ'];
        const nam = stats[color]['Nam'];
        const total = nu + nam;
        
        const bgColorCode = color === 'CAM' ? 'bg-orange-50 border-orange-100' : (color === 'LAM' ? 'bg-blue-50 border-blue-100' : 'bg-yellow-50 border-yellow-100');
        const iconColor = COLOR_MAP[color];
        
        container.innerHTML += `
            <div class="p-4 ${bgColorCode} border rounded-xl flex justify-between items-center transition-all hover:shadow-md">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full shadow-inner flex-shrink-0 ${iconColor}"></div>
                    <div>
                        <div class="font-bold text-slate-800">Màu ${color}</div>
                        <div class="text-xs text-slate-500 font-medium mt-0.5">
                            Nữ: <span class="text-rose-600 font-bold text-sm">${nu}</span> 
                            <span class="mx-1 text-slate-300">|</span> 
                            Nam: <span class="text-blue-600 font-bold text-sm">${nam}</span>
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Tổng số</div>
                    <div class="font-black text-xl text-slate-800">${total}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML += `
        <div class="mt-4 pt-4 border-t border-slate-200/60 flex justify-between items-center">
            <span class="font-bold text-slate-700 text-sm"><i class="fa-solid fa-shirt text-slate-400 mr-2"></i>Tổng cộng tất cả áo:</span>
            <span class="font-black text-xl text-emerald-700 bg-emerald-50 px-4 py-1.5 border border-emerald-100 rounded-xl shadow-sm">${totalShirts}</span>
        </div>
    `;
}

