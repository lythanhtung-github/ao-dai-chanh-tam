// --- GOOGLE SHEETS SYNC (WRITE) ---
function syncToGoogleSheets(action, order) {
    try {
        const sheetName = order.type === 'aodai' ? SHEET_AODAI : SHEET_TUI;
        
        let don_gia = "";
        if (order.type === 'aodai' && order.colors && order.colors.length > 0) {
            don_gia = order.price / order.colors.length;
        } else if (order.type === 'tui') {
            don_gia = BAG_PRICE;
        }

        const payload = {
            action: action, 
            sheetName: sheetName,
            data: {
                id: order.id,
                ngay_tao: order.ngay_tao || new Date(order.ts).toLocaleDateString('vi-VN'),
                ho_ten: order.name,
                gioi_tinh: order.gender || "",
                nhom_sinh_hoat: order.group,
                so_dien_thoai: "", 
                mau_sac: order.colors ? order.colors.join(', ') : "",
                don_gia: don_gia,
                tong_tien: order.price,
                da_thu: getPaidAmount(order),
                trang_thai_tong: order.status,
                lich_su_thu_tien: order.lich_su_thanh_toan || [],
                tien_do_san_pham: order.type === 'aodai' ? (order.chi_tiet_mau || {}) : null,
                tien_do_giao_tui: order.type === 'tui' ? { da_giao: order.delivered_quantity || 0 } : null,
                ghi_chu: "" 
            }
        };

        // Gửi thẳng payload chuỗi JSON (Không dùng headers để tránh Preflight CORS bị chặn)
        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(payload)
        }).then(() => {
            console.log('Đã gửi yêu cầu đồng bộ lên Cloud:', action, order.id);
        }).catch(e => console.error('Lỗi khi fetch đồng bộ:', e));

    } catch (error) {
        console.error('Lỗi hàm syncToGoogleSheets:', error);
    }
}

// --- GOOGLE SHEETS DATA FETCH ---

// 1. Hàm tải dữ liệu bỏ qua CORS (JSONP Callback) — có timeout 12s để init không treo vĩnh viễn
function fetchSheetDataJSONP(sheetName) {
    return new Promise((resolve, reject) => {
        const callbackName = 'gvizCallback_' + Math.random().toString(36).substr(2, 9);
        const script = document.createElement('script');
        script.src = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json;responseHandler:${callbackName}&sheet=${sheetName}`;

        const cleanup = () => {
            delete window[callbackName];
            script.remove();
            clearTimeout(timeoutId);
        };
        const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error(`Quá 12s không nhận được dữ liệu sheet: ${sheetName}`));
        }, 12000);

        window[callbackName] = function(data) {
            cleanup();
            resolve(data);
        };

        script.onerror = function() {
            cleanup();
            reject(new Error(`Không thể tải script cho sheet: ${sheetName}`));
        };

        document.body.appendChild(script);
    });
}

// 2. Chuyển đổi dữ liệu Google Sheet sang chuẩn của Web
function parseGoogleSheetObject(json, type) {
    try {
        const headers = json.table.cols.map(col => col ? col.label : '');
        
        return json.table.rows.map(row => {
            const obj = {};
            row.c.forEach((cell, i) => {
                const header = headers[i];
                if (header) {
                    let value = cell ? cell.v : '';
                    // Giải mã cột JSON
                    if (header === 'lich_su_thu_tien' || header === 'tien_do_san_pham' || header === 'tien_do_giao_tui') {
                        try {
                            value = value ? JSON.parse(value) : (header === 'lich_su_thu_tien' ? [] : {});
                        } catch(e) { 
                            value = header === 'lich_su_thu_tien' ? [] : {}; 
                        }
                    }
                    obj[header] = value;
                }
            });

            // Xử lý fallback an toàn cho mảng lịch sử thanh toán
            let parsedHistory = [];
            if (Array.isArray(obj.lich_su_thu_tien) && obj.lich_su_thu_tien.length > 0) {
                parsedHistory = obj.lich_su_thu_tien.map(p => ({
                    ngay: p.ngay || p.date || "",
                    so_tien: Number(p.tien) || Number(p.so_tien) || 0,
                    phuong_thuc: p.hinh_thuc || p.phuong_thuc || 'Tiền mặt'
                }));
            } else if (Number(obj.da_thu) > 0) {
                parsedHistory = [{
                    ngay: obj.ngay_tao || "",
                    so_tien: Number(obj.da_thu),
                    phuong_thuc: 'Tiền mặt'
                }];
            }

            // Mapping sang Object chuẩn của app
            // id chỉ giữ ký tự an toàn (A-Za-z0-9_-) vì id được nhúng vào attribute onclick
            return {
                id: String(obj.id || '').replace(/[^A-Za-z0-9_-]/g, ''),
                type: type,
                ngay_tao: obj.ngay_tao || "",
                name: obj.ho_ten,
                gender: obj.gioi_tinh || null,
                group: obj.nhom_sinh_hoat,
                colors: obj.mau_sac ? obj.mau_sac.split(',').map(c => c.trim()).filter(c => c) : [],
                price: Number(obj.tong_tien) || 0,
                status: obj.trang_thai_tong || 'MỚI',
                // Xử lý chuỗi ngày (VD: 14/11/2026 -> timestamp)
                ts: obj.ngay_tao ? new Date(obj.ngay_tao.split('/').reverse().join('-')).getTime() : Date.now(),
                chi_tiet_mau: obj.tien_do_san_pham || {},
                quantity: Number(obj.so_luong) || 1,
                delivered_quantity: obj.tien_do_giao_tui ? (Number(obj.tien_do_giao_tui.da_giao) || 0) : 0,
                lich_su_thanh_toan: parsedHistory
            };
        });
    } catch (error) {
        console.error("Lỗi khi parse dữ liệu:", error);
        return [];
    }
}

// 3. Luồng chạy chính
async function fetchGoogleSheetData() {
    try {
        showToast('Đang tải dữ liệu từ hệ thống...', 'info');
        
        // Fetch song song 2 sheet
        const [aoDaiData, tuiData] = await Promise.all([
            fetchSheetDataJSONP(SHEET_AODAI),
            fetchSheetDataJSONP(SHEET_TUI)
        ]);
        
        const parsedAoDai = parseGoogleSheetObject(aoDaiData, 'aodai');
        const parsedTui = parseGoogleSheetObject(tuiData, 'tui');
        
        const allFetchedOrders = [...parsedAoDai, ...parsedTui];
        
        if (allFetchedOrders.length > 0) {
            orders = allFetchedOrders;
            saveData(); // Sync to local storage as fallback
            showToast(`Đã đồng bộ ${orders.length} đơn hàng!`);
        } else {
            loadLocalData();
            showToast('Không có dữ liệu trên Sheet, dùng dữ liệu cũ.', 'warning');
        }
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        loadLocalData();
        showToast('Lỗi mạng, đang dùng dữ liệu offline!', 'error');
    }
}
