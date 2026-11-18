// --- CONSTANTS & CONFIG ---
const GOOGLE_SHEET_ID = '1lyZTSXRJLqD8rSiSrJceDL3RfRaBrSX6GfovCHdIuAo';
const SHEET_AODAI = 'AO-DAI';
const SHEET_TUI = 'TUI';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwv2vpcGMzGWVVLLg5uJDkGpDkeKOtGHdXyej87fb2u5nJ0yV_XYfj23ACKOd-MpC0/exec';

const STATUS_FLOW = ['MỚI', 'ĐANG XỬ LÝ', 'HOÀN TẤT'];
const ALL_STATUSES = [...STATUS_FLOW, 'HỦY'];

const STATUS_STYLES = {
    'MỚI': { bg: 'bg-slate-100', text: 'text-slate-700', icon: 'fa-asterisk', bar: 'bg-slate-400' },
    'ĐANG XỬ LÝ': { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'fa-spinner', bar: 'bg-blue-500' },
    'HOÀN TẤT': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'fa-check-double', bar: 'bg-emerald-500' },
    'HỦY': { bg: 'bg-red-50', text: 'text-red-500', icon: 'fa-xmark', bar: 'bg-red-400' }
};

const COLOR_MAP = {
    'CAM': 'bg-orange-500',
    'LAM': 'bg-blue-500',
    'VÀNG': 'bg-yellow-400'
};

// Chips lọc màu trên danh sách đơn (id phần tử tương ứng trong index.html)
const COLOR_CHIP_IDS = [
    { color: 'CAM', id: 'chip-CAM' },
    { color: 'LAM', id: 'chip-LAM' },
    { color: 'VÀNG', id: 'chip-VANG' }
];

const BAG_PRICE = 60000;
const STORAGE_KEY = 'chanhtam_orders_v3';
const STORAGE_PRICES_KEY = 'chanhtam_prices_v3';

// --- STATE ---
let orders = [];
let prices = [];
let currentTab = 'dashboard';
let currentListType = 'aodai'; // 'aodai' or 'tui'
let currentPage = 1;
let currentSort = { key: null, dir: 'asc' }; // null = mặc định (mới nhất)
let colorFilterSelection = []; // chips màu đang chọn (đơn có BẤT KỲ màu nào trong danh sách)
const ITEMS_PER_PAGE = 20;

// Các view chính của app (dùng khi bật/tắt hiển thị)
const VIEW_IDS = ['dashboard', 'orders', 'prices', 'form'];
