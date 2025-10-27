import {
    getFieldCDTC,
    getFieldKQKDGroup,
    getFieldKQKDTQ,
    getFieldTC,
} from './generalFunction/calculateDataBaoCao/getFieldBC.js';


export const ROUTES = {
    LOGIN: "/login",
    LOGIN_SUCCESS: "/login-success",
    CROSS_ROAD: "/cross-road",
    HOME_PAGE: "/",
    ADMIN: "/admin",
    ADMIN2: "/admin2",
    ACCOUNTING: "/accounting",

    WIKI: '/wiki',
    WIKI_FILE_DETAIL: '/wiki/file/:id',

    SURVEY_APP: '/survey-app',

    AI: '/canvas/:companySelect/:buSelect/ai',
    AI_CENTER: '/canvas/:companySelect/:buSelect/ai-center',
    AI_EXTERNAL: '/canvas/:companySelect/:buSelect/ai-external',

    WORK_FLOW: '/work-flow',
    WORK_FLOW_ID: '/work-flow/:id',
    WORK_FLOW_CARD_DETAIL: '/work-flow/:id/cards/:idCard',
    WORK_FLOW_STEP_DETAIL: '/work-flow/:id/cards/:idCard/steps/:idStep',
    WORK_FLOW_TEMPLATE_CONTAINER: '/work-flow/templates-chain/:id',
    WORK_FLOW_TEMPLATE_DETAIL: '/work-flow/templates-chain/:id/detail/:idTemp',
    WORK_FLOW_TEMPLATE_STEP_DETAIL: '/work-flow/templates-chain/:id/detail/:idTemp/steps/:idStep',

    // Canvas
    CANVAS_MAIN: '/canvas',
    CANVAS_COMPANY_SELECT: '/canvas/:companySelect',
    CANVAS_BU_SELECT: '/canvas/:companySelect/:buSelect',
    CANVAS_TAB_SELECT_DASHBOARD: '/canvas/:companySelect/:buSelect/:tabSelect/dashboard',

    CANVAS_TAB_KE_HOACH: '/canvas/:companySelect/:buSelect/ke-hoach',
    CANVAS_TAB_LAP_KE_HOACH_HOME: 'lap-ke-hoach',
    CANVAS_TAB_LAP_KE_HOACH_DETAIL: ':idLapKH',
    CANVAS_TAB_HOP_KE_HOACH_HOME: 'hop-ke-hoach',
    CANVAS_TAB_HOP_KE_HOACH_DETAIL: ':idHopKH',

    CANVAS_TAB_DASHBOARD_HOP_KE_HOACH_DETAIL: 'hop-ke-hoach/:idHopKH',

    CANVAS_TAB_THUC_HIEN: '/canvas/:companySelect/:buSelect/thuc-hien',
    CANVAS_TAB_NHAP_THUC_HIEN_HOME: 'nhap-thuc-hien',
    CANVAS_TAB_NHAP_THUC_HIEN_DETAIL: ':idNhapTH',
    CANVAS_TAB_KHO_DU_LIEU_HOME: 'kho-du-lieu',
    CANVAS_TAB_KHO_DU_LIEU_DETAIL: ':idKhoDL',

    CANVAS_TAB_DU_LIEU_NEN: '/canvas/:companySelect/:buSelect/du-lieu-nen',
    CANVAS_TAB_DU_LIEU_NEN_ID: ':id',

    CANVAS_TAB_HOME: '/canvas/:companySelect/:buSelect/home',
    CANVAS_TAB_HOME_PHUONG_PHAP: 'phuong-phap',
    CANVAS_TAB_HOME_PHUONG_PHAP_ID: ':idNoteChart',

    CANVAS_TAB_HOME_GUIDE: 'guide',
    CANVAS_TAB_HOME_GUIDE_ID: ':idNoteChart',

    CANVAS_TAB_HOME_BO_CHI_SO: 'bo-chi-so',


    CANVAS_TAB_DU_LIEU: '/canvas/:companySelect/:buSelect/thuc-hien',
    CANVAS_TAB_DU_LIEU_DANH_MUC: 'danh-muc',
    CANVAS_TAB_DU_LIEU_DANH_MUC_ID: ':id',
    CANVAS_TAB_DU_LIEU_DLDV: 'du-lieu-dau-vao',
    CANVAS_TAB_DU_LIEU_DLDV_DETAIL: ':id',
    CANVAS_TAB_DU_LIEU_DLDV_DETAIL_THONG_KE: 'thong-ke',
    CANVAS_TAB_DU_LIEU_DLDV_DETAIL_FILE: 'file',
    CANVAS_TAB_DU_LIEU_DLDV_DETAIL_TIPTAP: 'tiptap',
    CANVAS_TAB_DU_LIEU_DLDV_DETAIL_FILE_ID: ':idFile',
    CANVAS_TAB_DU_LIEU_DLDV_DETAIL_THONG_KE_DETAIL: ':idThongKe',
    CANVAS_TAB_DU_LIEU_DLDV_DETAIL_THONG_KE_DETAIL_ORIGINAL: 'original-data',
    CANVAS_TAB_DU_LIEU_DLDV_DETAIL_THONG_KE_DETAIL_MAPPING: 'mapping-data',
    CANVAS_TAB_DU_LIEU_DLDV_DETAIL_THONG_KE_DETAIL_TEMPLATE: 'template-data',
    CANVAS_TAB_DU_LIEU_DLDV_DETAIL_THONG_KE_DETAIL_FORM: 'form',
    CANVAS_TAB_DU_LIEU_DLDV_DETAIL_DU_LIEU_TONG_HOP: 'du-lieu-tong-hop',
    CANVAS_TAB_DU_LIEU_DLDV_DETAIL_HOME: 'home',
    CANVAS_TAB_DU_LIEU_DU_LIEU_TONG_HOP: 'du-lieu-tong-hop',
    CANVAS_TAB_DU_LIEU_DU_LIEU_TONG_HOP_ID: ':id',
    CANVAS_TAB_DU_LIEU_DU_LIEU_TONG_HOP_ID_FIlE: ':file/:idFile',

    CANVAS_TAB_DASHBOARD: '/canvas/:companySelect/:buSelect/dashboard',
    CANVAS_TAB_DASHBOARD_ID: '/canvas/:companySelect/:buSelect/dashboard/:siderId',

    CANVAS_TAB_CONG_CU: '/canvas/:companySelect/:buSelect/cong-cu',
    CANVAS_TAB_CONG_CU_PHAN_TICH_CHIEN_LUOC: '/canvas/:companySelect/:buSelect/dashboard/phan-tich-chien-luoc',
    CANVAS_TAB_CONG_CU_BAN_DO_DU_LIEU_QUAN_TRI: '/canvas/:companySelect/:buSelect/cong-cu/ban-do-du-lieu-quan-tri',
    CANVAS_TAB_CONG_CU_QUAN_LY_TO_DO: '/canvas/:companySelect/:buSelect/cong-cu/project-manager',
    CANVAS_TAB_CONG_CU_WEB_PAGE: '/canvas/:companySelect/:buSelect/cong-cu/web-page',
    CANVAS_TAB_CONG_CU_WEB_PAGE_WEBPAGE: ':idWebPage',
    CANVAS_TAB_CONG_CU_WEB_PAGE_CONTENT: 'content/:idContent',

    // CANVAS_SIDER_SELECT: '/canvas/:companySelect/:buSelect/:tabSelect/dashboard/:siderId',
    CANVAS_TAB_SELECT_DAAS: '/canvas/:companySelect/:buSelect/:tabSelect/daas',
    CANVAS_TAB_SELECT_DAAS_ID: '/canvas/:companySelect/:buSelect/:tabSelect/daas/:id',
    CANVAS_TAB_SELECT_DAAS_ID_FORM: '/canvas/:companySelect/:buSelect/:tabSelect/daas/:id/form',
    CANVAS_TAB_SELECT_DAAS_ID_FILE: '/canvas/:companySelect/:buSelect/:tabSelect/daas/:id/file/:idFile',

    CANVAS_TAB_SELECT_DAAS_CONG_CU: '/canvas/:companySelect/:buSelect/:tabSelect/daas/cong-cu',
    CANVAS_TAB_SELECT_DAAS_CONG_CU_BAN_DO: '/canvas/:companySelect/:buSelect/:tabSelect/daas/cong-cu/ban-do',
    CANVAS_TAB_SELECT_DAAS_CONG_CU_FOLLOW_TINH_BIEN_SO: '/canvas/:companySelect/:buSelect/:tabSelect/daas/cong-cu/tinh-bien-so',
    CANVAS_TAB_SELECT_DAAS_CONG_CU_FOLLOW_TINH_KPI: '/canvas/:companySelect/:buSelect/:tabSelect/daas/cong-cu/tinh-kpi',
    CANVAS_TAB_SELECT_DAAS_CONG_CU_KHKD_ID: '/canvas/:companySelect/:buSelect/:tabSelect/daas/cong-cu/khkd/:idKHKD',
    CANVAS_TAB_SELECT_DAAS_CONG_CU_REPORT_ID: '/canvas/:companySelect/:buSelect/:tabSelect/daas/cong-cu/report/:siderId',
    CANVAS_TAB_SELECT_DAAS_CONG_CU_MD: '/canvas/:companySelect/:buSelect/:tabSelect/daas/cong-cu/master-detail',
    CANVAS_TAB_SELECT_DAAS_CONG_CU_SA: '/canvas/:companySelect/:buSelect/:tabSelect/daas/cong-cu/strategic-analysis',

    KTQT: '/canvas/:companySelect/:buSelect/ke-toan-quan-tri',
    KTQT_CHAY_DU_LIEU: 'chay-du-lieu',
    KTQT_VAS: 'can-doi-phat-sinh',
    KTQT_SKT: 'so-ke-toan',
    KTQT_SKTDC: 'so-ke-toan-dc',
    KTQT_SKTR: 'so-ke-toan-rv',
    KTQT_VASR: 'vas-rv',
    KTQT_DT: 'dt',
    KTQT_GV: 'gv',
    KTQT_CF: 'cf',
    KTQT_MAPPING: 'mapping',
    KTQT_DATA_CRM: 'data-crm',
    KTQT_LEAD_MANAGEMENT: 'lead-management',
    KTQT_DANH_MUC: 'danh-muc-chung',

    KTQT_BCTC: 'bao-cao-tai-chinh',

    KTQT_BCTONGQUAT: 'bc-tong-quat',
    KTQT_BCKQKD_NHOM_DV: 'kqkd-nhom-dv',
    KTQT_BCKQKD_NHOM_SP: 'kqkd-nhom-sp',
    KTQT_BCKQKD_NHOM_KENH: 'kqkd-nhom-kenh',
    KTQT_BCKQKD_NHOM_KENH2: 'kqkd-nhom-kenh-2',
    KTQT_BCKQKD_NHOM_VU_VIEC: 'kqkd-nhom-vu-viec',
    KTQT_BCKQKD_NHOM_VU_VIEC2: 'kqkd-nhom-vu-viec-2',
    KTQT_BCKQKD_NHOM_DV_THANG: 'kqkd-nhom-dv-thang',
    KTQT_BCKQKD_NHOM_SP_THANG: 'kqkd-nhom-sp-thang',
    KTQT_BCHSTC: 'hstc',
    KTQT_BCCDTC: 'cdtc',
    KTQT_BCKQKD_TEAM: 'kqkd-team',
    KTQT_BCTIEN: 'bc-tien',

    KTQT_BCKQKD_DV: "kqkd-dv",
    KTQT_BCKQKD_DV2: "kqkd-dv2",

    KTQT_SO_PHAN_BO_SP: 'so-phan-bo-sp',
    KTQT_SO_PHAN_BO_DON_VI: 'so-phan-bo-dv',
    KTQT_SO_PHAN_BO_KENH: 'so-phan-bo-kenh',
    KTQT_SO_PHAN_BO_VU_VIEC: 'so-phan-bo-vu-viec',
    KTQT_THE_PHAN_BO_DON_VI: 'the-phan-bo-dv',
    KTQT_THE_PHAN_BO_SAN_PHAM: 'the-phan-bo-sp',
    KTQT_THE_PHAN_BO_KENH: 'the-phan-bo-kenh',
    KTQT_THE_PHAN_BO_PROJECT: 'the-phan-bo-vu-viec',

    KEHOACH_KQKD: 'plan-kh-kqkd',
    SOSANH_KH_TH: 'plan-ss-kh-th',
    SOSANH_TH_CUNGKY: 'plan-ss-th-ck',

    PROJECT_MANAGER: '/project-manager',

    GATEWAY: '/gateway',

    // Chain
    // CHAIN_DETAIL: "/accounting/chains/:id",
    // CARD_DETAIL: "/accounting/chains/:id/cards/:idCard",
    // STEP_DETAIL: "/accounting/chains/:id/cards/:idCard/steps/:idStep",
    CHAIN_DETAIL_NEW: "/accounting/options/:option",
    CARD_DETAIL_NEW: "/accounting/options/:option/:idSelected",

    CHAIN_DETAIL: "/accounting/chains/:id/templates/:idTemp",
    CARD_DETAIL: "/accounting/chains/:id/templates/:idTemp/cards/:idCard",
    STEP_DETAIL: "/accounting/chains/:id/templates/:idTemp/cards/:idCard/steps/:idStep",

    // Template
    TEMPLATE_CONTAINER: "/accounting/templates-chain/:id",
    TEMPLATE_DETAIL: "/accounting/templates-chain/:id/detail/:idTemp",
    TEMPLATE_STEP_DETAIL: "/accounting/templates-chain/:id/detail/:idTemp/steps/:idStep",

    // Catalog
    DANH_MUC_KHAC: "/accounting/danh-muc-khac",
    TkNganHang: "tk-ngan-hang",
    TkKeToan: "tk-ke-toan",
    CHUONGTRINH: "chuong-trinh",
    TAISANDAUTU: "tai-san-dau-tu",
    LOAITIEN: "loai-tien",
    CHUSOHUU: "chu-so-huu",
    PHONGBAN: "phong-ban",
    COMPANY: "company",
    NHAN_VIEN: "nhan-vien",
    BU: "business-unit",

    DULIEUKHAC: "/accounting/du-lieu-khac",
    LENH_SAN_XUAT: "lenh-sx",
    CCPB_VU_VIEC: "ccpb-vu-viec",
    CCPB_LENH_SX: "ccpb-lenh-sx",
    REVIEW: "review",
    DETAIL_LENH_SAN_XUAT: "detail-lenh-sx",
    PHIEUNHAP: "phieu-nhap",
    PHIEUXUAT: "phieu-xuat",

    DANH_MUC: "/accounting/danh-muc",
    KHACH_HANG: "khach-hang",
    NHA_CUNG_CAP: "nha-cung-cap",
    KMF: "kmf",
    KMTC: "kmtc",
    SanPham: "san-pham",
    DuAn: "du-an",
    HopDong: "hop-dong",
    Kho: "kho",
    PHIEU_NHAP_XUAT: "phieu-nhap-xuat",
    KENH: 'kenh',

    // Wiki
    WIKI_STORAGE: "/accounting/wiki-storage",
    BAO_CAO: "/accounting/bao-cao",
    BAO_CAO_B01: "b01",
    BAO_CAO_B02: "b02",
    BAO_CAO_B03: "b03",
    GV2B: "gv2b",
    GV3W: "gv3w",
    GV3M: "gv3m",
    GV3MB2: "gv3mb2",
    GTHT: "gtht",
    PBGV2B: "pbgv2b",
    PBGV3: "pbgv3",
    PBLSX: "pblsx",

    BCTIEN: 'bc-tien',
    BCTON_KHO: 'bc-ton-kho',
    BCTHUE_BAO_HIEM: 'bc-thue-bh',

    KHAI_BAO_DAU_KY: "/accounting/khai-bao",
    DAU_KY: "dau-ky",

    SOLIEU: "/accounting/so-lieu",
    CDPS: "cdps",
    SOKETOAN: "so-ke-toan",
    SOKETOANT: "so-ke-toan-t",
    LUONG: "luong",
    SOCHUOI: "so-chuoi",
    TONKHO: "ton-kho",
    SOQUANLYCHITRATRUOC: "so-quan-ly-chi-tra-truoc-ccdc",
    SOQUANLYTAISAN: "so-quan-ly-tai-san",
    SOTAIKHOAN: "so-tai-khoan",
    DKPRO: "dkpro",
    SOTAIKHOANDT: "so-tai-khoan-dt",
    SOTAIKHOANDD: "so-tai-khoan-dd",
    SOOFFSET: "so-offset",
    SOOFFSET1: "so-offset-1",
    PHIEU_THU: "phieu-thu",
    PHIEU_CHI: "phieu-chi",

    // HonDon
    HOADON: '/accounting/hoa-don',

    BANGTHONGKETUOINO: 'bang-thong-ke-tuoi-no',
    HOA_DON_DAU_RA_CHI_TIET: 'hoa-don-dau-ra-chi-tiet',
    HOA_DON_DAU_VAO_CHI_TIET: 'hoa-don-dau-vao-chi-tiet',
    QUANLYDAUVAO: "hoa-don-dau-vao-tong-hop",
    QUANLYDAURA: "hoa-don-dau-ra-tong-hop",

    // SanXuat
    QUANLYSANXUAT: "/accounting/san-xuat",
    LENHSANXUAT: "lenh-san-xuat",
    DINHMUCBOM: "dinh-muc-bom",

    // Quan ly ke hoach kinh doanh
    QLKHKD: '/quan-ly-ke-hoach-kinh-doanh',
    QLKHKD_THIET_LAP_KE_HOACH: 'thiet-lap-ke-hoach',
    QLKHKD_NHAP_LIEU_THUC_THI: 'nhap-lieu-thuc-thi',
    QLKHKD_THUC_HIEN_VA_KE_HOACH: 'thuc-hien-va-ke-hoach',
    QLKHKD_UOC_TINH_LAI_LO: 'uoc-tinh-lai-lo',



};

export const STC_TAB_LIST = [{
    key: "tab1",
    label: "Tab 1",
    path: "/accounting/chains/1",
    icon: "/dashboard.png",
},
{
    key: "tab2",
    label: "Tab 2",
    path: "/accounting/chains/2",
    icon: "/dashboard.png",
},
{
    key: "tab3",
    label: "Tab 3",
    path: "/accounting/chains/3",
    icon: "/dashboard.png",
},
];

export const STATUS_LIST_CARD = [
    {
        key: 'Hoàn thành',
        name: 'Hoàn thành',
    },
    {
        key: 'Chờ xử lý',
        name: 'Chờ xử lý',
    },
    {
        key: 'Chờ duyệt',
        name: 'Chờ duyệt',
    },
    {
        key: 'Hủy/treo',
        name: 'Hủy/treo',
    },
    {
        key: 'Nháp',
        name: 'Nháp',
    },
];

export const botSystem = `
    You act as an expert in Accounting and business practices in Vietnam. You assist the user with the following requirements:
    Response Protocol
    1. Default Output
        - Respond in Vietnamese unless English requested
        - Use standard Vietnamese accounting terms
        - Professional yet approachable tone
        - Include English terms in parentheses when helpful
    2. Knowledge Priority Essential
        - Vietnamese Accounting Standards (VAS)
        - Circular 200/2014/TT-BTC
        - Current Vietnamese tax regulations
        - Local business practices Secondary:
        - IFRS (when requested)
        - International best practices applicable to Vietnam
    3. Response Structure
        - [Problem Summary]
        - [Solution with Implementation Steps]
        - [Regulatory References]
        - [Key Considerations]
    4. Core Rules
        DO:
            - Cite relevant regulations
            - Focus on SME context
            - Provide practical solutions
            - Consider resource limitations
            - Flag issues needing expert help
        DON'T:
            - Give legal advice
            - Suggest aggressive tax strategies
            - Provide ambiguous solutions
            - Exceed accounting scope
    5. Special Considerations
        - Acknowledge Vietnamese business culture
        - Focus on digital transformation where practical
        - Consider SME resource limitations
        - Flag compliance risks
        - Recommend professional help when needed
    6. Quality Parameters
        - Clear, actionable advice
        - Regulatory compliance focus
        - Implementation-oriented solutions
        - SME-appropriate guidance
        - Technology considerations within local context
    `;

export const TRANG_THAI_NHAN_VIEN = [
    {
        key: 'Đang làm',
        name: 'Đang làm',
    },
    {
        key: 'Nghỉ',
        name: 'Nghỉ',
    },
    {
        key: 'Nghỉ',
        name: 'Nghỉ',
    },
];

export const POSITION_OPTIONS = [
    {
        value: 'nhanvien',
        label: 'Nhân viên',
    },
    {
        value: 'truongphong',
        label: 'Trưởng phòng',
    },
    {
        value: 'giamdoc',
        label: 'Giám đốc',
    },
];

export const DEPARTMENT_OPTIONS = [
    {
        value: 'it',
        label: 'IT',
    },
    {
        value: 'ketoan',
        label: 'Kế Toán',
    },
    {
        value: 'sale',
        label: 'Bán hàng',
    },
];

export const API_RESPONSE_CODE = {
    SUCCESS: 'SUCCESS',
    USER_EXIST: 'USER_EXIST',
    USER_CREATED: 'USER_CREATED',
    UPDATED: 'UPDATED',
    NOT_FOUND: 'NOT_FOUND',
    DELETED: 'DELETED',
    CREATED: 'CREATED',
    NOT_CREATED: 'NOT_CREATED',
};

export const HOA_DON_TYPE = {
    DauRa: 'dau_ra',
    DauVao: 'dau_vao',
};

export const SETTING_TYPE = {
    SoQuanLyTaiSan: 'SoQuanLyTaiSan',
    SoQuanLyChiTraTruoc: 'SoQuanLyChiTraTruoc',
    PhuongPhapTinhGiaThanh: 'PhuongPhapTinhGiaThanh',
    ChotSo: 'ChotSo',
    Warning: 'Warning',
    PROMPT_DASHBOARD: 'PROMPT_DASHBOARD',
};

export const DEFAULT_PROMPT_DASHBOARD = "Phân tích dữ liệu kinh doanh và đưa ra insights có giá trị. Tập trung vào xu hướng, so sánh với kỳ trước, và đề xuất các hành động cần thiết.";

export const SETTING_CHOTSO = {
    month: 'Theo tháng',
    term: 'Theo kỳ (P1: Ngày 1-15, P2: Ngày 16-30)',
};

export const LSX_STATUS = {
    PENDING: 'pending_approval',
    APPROVE: 'approved',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCEL: 'cancel',
};

export const CANVAS_TYPE = {
    KE_TOAN: 'ketoan',
    IT: 'it',
    NOTEPAD: 'notepad',
};

export const LIST_OPTION_KQKD = [
    {
        label: 'Doanh thu kinh doanh',
        value: 'Doanh thu',
    },
    {
        label: 'Giá vốn',
        value: 'Giá vốn',
    },
    {
        label: 'Chi phí bán hàng',
        value: 'Chi phí bán hàng',
    },
    {
        label: 'Chi phí quản lí',
        value: 'Chi phí quản lí',
    },
    {
        label: 'Lợi nhuận trước thuế',
        value: 'Lợi nhuận trước thuế',
    },
];
export const LIST_OPTION_CDTC = [
    {
        label: 'Tài sản ngắn hạn',
        value: 'Tài sản ngắn hạn',
    },
    {
        label: 'Tài sản dài hạn',
        value: 'Tài sản dài hạn',
    },
    {
        label: 'Nợ ngắn hạn',
        value: 'Nợ ngắn hạn',
    },
    {
        label: 'Nợ dài hạn',
        value: 'Nợ dài hạn',
    },
    {
        label: 'Vốn chủ sở hữu',
        value: 'Vốn chủ sở hữu',
    },
];
export const LIST_OPTION_TC = [
    {
        label: 'Dư đầu kỳ',
        value: 'Dư đầu kỳ',
    },
    {
        label: 'Dư cuối kỳ',
        value: 'Dư cuối kỳ',
    },
];

export const CANVAS_DATA_PACK = [
    // Tổng quan
    {
        id: 1,
        value: 'TONGQUAT',
        name: 'KQKD tổng quát',
        isPermission: true,
        group: false,
        crossCheck: true,
        field: getFieldKQKDTQ,
        options: LIST_OPTION_KQKD,
        keyDP: 'dp',
    },

    // Nhóm KQKD sản phẩm
    {
        id: 2,
        value: 'KQKD_NHOMSP',
        name: 'KQKD Sản phẩm',
        isPermission: true,
        group: false,
        // crossCheck: true,
        field: getFieldKQKDGroup,
        options: LIST_OPTION_KQKD,
        keyDP: 'dp',
    },
    {
        id: 3,
        value: 'KQKD_NHOMSP2',
        name: 'KQKD Sản phẩm theo tháng',
        isPermission: true,
        group: false,
        field: getFieldKQKDGroup,
        options: LIST_OPTION_KQKD,
    },
    {
        id: 4,
        value: 'NHOMSP_DOANHTHU_CHART',
        name: 'Chart Doanh thu nhóm SP',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 5,
        value: 'NHOMSP_LOINHUAN_CHART',
        name: 'Chart Lợi nhuận nhóm SP',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 6,
        value: 'NHOMSP_LAILO_CHART',
        name: 'Chart Lãi lỗ nhóm SP',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 7,
        value: 'NHOMSP_DONGGOP_CHART',
        name: 'Chart Đóng góp doanh thu SP',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 8,
        value: 'NHOMSP_LAINHOM_CHART',
        name: 'Chart Tỷ lệ lãi nhóm SP',
        isPermission: true,
        group: false,
        isChart: true,
    },

    // Nhóm KQKD đơn vị
    {
        id: 9,
        value: 'KQKD_NHOMDV',
        name: 'KQKD nhóm đơn vị',
        isPermission: true,
        group: false,
        // crossCheck: true,
        field: getFieldKQKDGroup,
        options: LIST_OPTION_KQKD,
        keyDP: 'dp',
    },
    {
        id: 10,
        value: 'KQKD_NHOMDV2',
        name: 'KQKD nhóm đơn vị theo tháng',
        isPermission: true,
        group: false,
    },
    {
        id: 11,
        value: 'NHOMDV_DOANHTHU_CHART',
        name: 'Chart Doanh thu nhóm BU',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 12,
        value: 'NHOMDV_LOINHUAN_CHART',
        name: 'Chart Lợi nhuận nhóm BU',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 13,
        value: 'NHOMDV_LAILO_CHART',
        name: 'Chart Lãi lỗ nhóm BU',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 14,
        value: 'NHOMDV_DONGGOP_CHART',
        name: 'Chart Đóng góp doanh thu BU',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 15,
        value: 'NHOMDV_LAINHOM_CHART',
        name: 'Chart Tỷ lệ lãi nhóm BU',
        isPermission: true,
        group: false,
        isChart: true,
    },

    // Nhóm KQKD đơn vị

    {
        id: 999,
        value: "KQKD_DV",
        name: "KQKD đơn vị",
        isPermission: true,
        group: false
    },


    {
        id: 21,
        value: 'CHIPHILUYKE_CHART',
        name: 'Chart Cấu trúc doanh thu chi phí',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 23,
        value: 'CHART_DOANHTHU_TH_KH_CK',
        name: 'Chart Doanh thu thực hiện, vs kế hoạch, vs cùng kỳ',
        isPermission: true,
        group: false,
        isChart: true,
    },

    {
        id: 24,
        value: 'CHART_CF_TH_KH_CK',
        name: 'Chart Chi phí thực hiện, vs kế hoạch, vs cùng kỳ',
        isPermission: true,
        group: false,
        isChart: true,
    },

    {
        id: 25,
        value: 'CHART_LN_TH_KH_CK',
        name: 'Chart lợi nhuận thực hiện, vs kế hoạch, vs cùng kỳ',
        isPermission: true,
        group: false,
        isChart: true,
    },

    // Nhóm kênh
    {
        id: 399,
        value: 'KQKD_NHOMK',
        name: 'KQKD nhóm kênh',
        isPermission: true,
        group: false,
        // crossCheck: true,
        field: getFieldKQKDGroup,
        options: LIST_OPTION_KQKD,
        keyDP: 'dp',
    },
    {
        id: 400,
        value: 'KQKD_NHOMK2',
        name: 'KQKD nhóm kênh theo tháng',
        isPermission: true,
        group: false,
    },
    {
        id: 26,
        value: 'NHOMK_DOANHTHU_CHART',
        name: 'Chart Doanh thu nhóm kênh',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 27,
        value: 'NHOMK_LOINHUAN_CHART',
        name: 'Chart Lợi nhuận nhóm kênh',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 28,
        value: 'NHOMK_LAILO_CHART',
        name: 'Chart Lãi lỗ nhóm kênh',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 29,
        value: 'NHOMK_DONGGOP_CHART',
        name: 'Chart Đóng góp doanh thu kênh',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 30,
        value: 'NHOMK_LAINHOM_CHART',
        name: 'Chart Tỷ lệ lãi nhóm kênh',
        isPermission: true,
        group: false,
        isChart: true,
    },

    // Nhóm vụ việc
    {
        id: 299,
        value: 'KQKD_NHOMVV',
        name: 'KQKD nhóm vụ việc',
        isPermission: true,
        group: false,
        // crossCheck: true,
        field: getFieldKQKDGroup,
        options: LIST_OPTION_KQKD,
        keyDP: 'dp',
    },
    {
        id: 300,
        value: 'KQKD_NHOMVV2',
        name: 'KQKD nhóm vụ việc theo tháng',
        isPermission: true,
        group: false,
        field: getFieldKQKDGroup,
    },
    {
        id: 31,
        value: 'NHOMVV_DOANHTHU_CHART',
        name: 'Chart Doanh thu vụ việc',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 32,
        value: 'NHOMVV_LOINHUAN_CHART',
        name: 'Chart Lợi nhuận nhóm vụ việc',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 33,
        value: 'NHOMVV_LAILO_CHART',
        name: 'Chart Lãi lỗ nhóm vụ việc',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 34,
        value: 'NHOMVV_DONGGOP_CHART',
        name: 'Chart Đóng góp doanh thu vụ việc',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 35,
        value: 'NHOMVV_LAINHOM_CHART',
        name: 'Chart Tỷ lệ lãi của các vụ việc',
        isPermission: true,
        group: false,
        isChart: true,
    },

    // Thống kê tuổi nợ
    {
        id: 36,
        value: 'TUOINO_PHAITRA_CHART',
        name: 'Chart giá trị phải trả theo các ngày trong hạn/ đáo hạn',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 37,
        value: 'TUOINO_PHAITHU_CHART',
        name: 'Chart giá trị phải thu theo các ngày trong hạn/ đáo hạn',
        isPermission: true,
        group: false,
        isChart: true,
    },

    // Báo cáo
    {
        id: 38,
        value: 'BAOCAO_TIEN',
        name: 'Tiền hiện có (SAB)',
        isPermission: true,
        group: false,
        // crossCheck: true,
    },
    {
        id: 39,
        value: 'BAOCAO_THUE_BAOHIEM',
        name: 'Nghĩa vụ thuế - bảo hiểm (SAB)',
        isPermission: true,
        group: false,
        // crossCheck: true,
    },
    {
        id: 40,
        value: 'BAOCAO_TONKHO',
        name: 'Tồn kho tức thời (SAB)',
        isPermission: true,
        group: false,
        // crossCheck: true,
    },
    {
        id: 41,
        value: 'BAOCAO_TAISANCODINH',
        name: 'Báo cáo tài sản cố định (SAB)',
        isPermission: true,
        group: false,
        // crossCheck: true,
    },
    {
        id: 42,
        value: 'BAOCAO_QUANLYCHITRATRUOC',
        name: 'Sổ quản lý chi trả trước & CDCC (SAB)',
        isPermission: true,
        group: false,
        // crossCheck: true,
    },
    {
        id: 43,
        value: 'BAOCAO_CANDOIPHATSINH',
        name: 'Cân đối phát sinh (SAB)',
        isPermission: true,
        group: false,
        // crossCheck: true,
    },
    // {
    // 	id: 44,
    // 	value: "TON_KHO",
    // 	name: "Tồn kho",
    // 	isPermission: true,
    // 	group: false
    // },
    {
        id: 45,
        value: 'NHAP_XUAT_TON',
        name: 'Nhập xuất tồn (SAB)',
        isPermission: true,
        group: false,
        // crossCheck: true,
    },
    {
        id: 46,
        value: 'PLAN_ACTUAL',
        name: 'Báo cáo kế hoạch KQKD',
        isPermission: true,
        group: false,
    },
    {
        id: 47,
        value: 'CHART_TIEN_VA_TUONGDUONGTIEN',
        name: 'Chart Tiền và tương đương tiền các tháng',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 48,
        value: 'CHART_CANDOITAICHINH',
        name: 'Chart Cân đối tài chính',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 481,
        value: 'CHART_TIENTHUTRONGKY',
        name: 'Chart Tiền thu trong kỳ',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 49,
        value: 'CHART_TONKHO',
        name: 'Chart Tồn kho tổng quát',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 50,
        value: 'CHART_DOANHTHU_KEHOACH',
        name: 'Chart Doanh thu so với kế hoạch',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 51,
        value: 'CHART_LOINHUAN_KEHOACH',
        name: 'Chart Lợi nhuận so với kế hoạch',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 52,
        value: 'SOLIEUHIENTHI',
        name: 'Số liệu hiển thị',
        isPermission: true,
        group: false,
        // crossCheck: false,
    },
    {
        id: 53,
        value: 'DANHMUCCHUNG',
        name: 'Danh mục chung',
        isDM: true,
    },
    {
        id: 54,
        value: 'CHART_CRM_THONGKE',
        name: 'Chart Thống kê về sản phẩm bán',
        isPermission: true,
        group: false,
        isChart: true,
    },
    {
        id: 56,
        value: 'CHART_MATRIX_THONGKE',
        name: 'Chart Ma trận sản phẩm, doanh số',
        isPermission: false,
        isChart: true,
    },
    {
        id: 57,
        value: 'S101',
        name: 'Báo cáo bán hàng tổng hợp',
        isPermission: true,
        group: false,
    },
    {
        id: 58,
        value: 'S102',
        name: 'Sổ quản lý Lead',
        isPermission: true,
        group: false,
    },
    {
        id: 59,
        value: 'DANHMUC_SP_KTQT',
        name: 'Danh mục sản phẩm KTQT',
        isPermission: false,
        isDM: true,
    },
    {
        id: 60,
        value: 'DANHMUC_KM_KQKD',
        name: 'Danh mục Khoản mục KQKD',
        isPermission: false,
        isDM: true,
    },
    {
        id: 61,
        value: 'DANHMUC_THU_CHI',
        name: 'Danh mục Khoản mục Thu chi',
        isPermission: false,
        isDM: true,
    },
    {
        id: 62,
        value: 'DANHMUC_VU_VIEC',
        name: 'Danh mục vụ việc',
        isPermission: false,
        isDM: true,
    },
    {
        id: 63,
        value: 'DANHMUC_KENH',
        name: 'Danh mục kênh',
        isPermission: false,
        isDM: true,
    },
    {
        id: 64,
        value: 'DANHMUC_DONVI',
        name: 'Danh mục đơn vị',
        isPermission: false,
        isDM: true,
    },
    {
        id: 65,
        value: 'DANHMUC_CDPS',
        name: 'Cân đối phát sinh',
        isPermission: false,
        isDM: true,
    },
    {
        id: 66,
        value: 'DANHMUC_NV',
        name: 'Danh mục nhân viên',
        isPermission: false,
        isDM: true,
    },
    {
        id: 67,
        value: 'DANHMUC_NCC',
        name: 'Danh mục nhà cung cấp',
        isPermission: false,
        isDM: true,
    },
    {
        id: 68,
        value: 'DANHMUC_HH',
        name: 'Danh mục hàng hóa',
        isPermission: false,
        isDM: true,
    },
    {
        id: 69,
        value: 'DANHMUC_KH',
        name: 'Danh mục khách hàng',
        isPermission: false,
        isDM: true,
    },
    {
        id: 70,
        value: 'CANDOI_TAICHINH',
        name: 'Cân đối tài chính',
        isPermission: false,
    },
    {
        id: 71,
        value: 'DONGTIEN',
        name: 'Dòng tiền',
        isPermission: false,
    },
];

export const ProjectStepStatus = {
    COMPLETED: 'completed',
    ONGOING: 'ongoing',
};

export const Template_Table_Type = {
    ROTATE: 'ROTATE',
}



export const MODEL_AI = {
    GPT: [

        { name: 'GPT-4.1', value: 'gpt-4.1-2025-04-14' },
        { name: 'GPT-4o Search', value: 'gpt-4o-search-preview-2025-03-11' },
        { name: 'GPT-4 Turbo', value: 'gpt-4-turbo-2024-04-09' },

    ],
    CLAUDE: [
        { name: 'Claude Sonnet 4', value: 'claude-sonnet-4-20250514' },
        { name: 'Claude Opus 4', value: 'claude-opus-4-20250514' },
        { name: 'Claude Sonnet 3.7', value: 'claude-3-7-sonnet-20250219' },
        { name: 'Claude Haiku 3.5', value: 'claude-3-5-haiku-20241022' },
    ],
    GEMINI: [
        { name: '(Google) Gemini 2.5 Pro ', value: 'gemini-2.5-pro-preview-06-05' },
        { name: '(OpenRouter) Gemini 2.5 Pro ', value: 'google/gemini-2.5-pro' },
        { name: '(OpenRouter) Gemini 2.5 Flash', value: 'google/gemini-2.5-flash' },
        { name: '(OpenRouter) Gemini 2.5 Flash Lite', value: 'google/gemini-2.5-flash-lite' },
    ]
};
export const MODEL_TEXT_GEN_AI_LIST = [
    { name: 'Nova', value: 'gpt-5-mini-2025-08-07' },
    { name: 'Lexi (GP)', value: 'google/gemini-2.5-pro' },
    { name: 'Ada (GF)', value: 'google/gemini-2.5-flash' },
    { name: 'Lemma (GFL)', value: 'google/gemini-2.5-flash-lite' },
]
export const MODEL_TEXT_AI_LIST = [
    { name: 'Nova', value: 'gpt-5-mini-2025-08-07' },
    { name: 'Lexi (GP)', value: 'google/gemini-2.5-pro' },
    { name: 'Ada (GF)', value: 'google/gemini-2.5-flash' },
    { name: 'Lemma (GFL)', value: 'google/gemini-2.5-flash-lite' },
]

export const MODEL_AI_LIST = [
    { name: 'Claude Haiku 3.5', value: 'claude-3-5-haiku-20241022' },
    { name: 'Claude Sonnet 4', value: 'claude-sonnet-4-20250514' },
    { name: 'GPT-4.1', value: 'gpt-4.1-2025-04-14' },
    { name: 'GPT-5', value: 'gpt-5-2025-08-07' },
    { name: 'GPT-5 Mini', value: 'gpt-5-mini-2025-08-07' },
    { name: 'GPT-5 Nano', value: 'gpt-5-nano-2025-08-07' },
    { name: '(OpenRouter) Gemini 2.5 Pro ', value: 'google/gemini-2.5-pro' },
    { name: '(OpenRouter) Gemini 2.5 Flash ', value: 'google/gemini-2.5-flash' },
    { name: 'imagen-3.0-generate-002', value: 'imagen-3.0-generate-002' },
    { name: 'gemini-tts', value: 'gemini-tts' },
];
export const MODEL_AI_LIST_SEARCH = [
    { name: 'GPT-4o Search ', value: 'gpt-4o-search-preview-2025-03-11' },
    { name: 'GPT-4o Mini Search ', value: 'gpt-4o-mini-search-preview-2025-03-11' },
    { name: 'GPT-4.1', value: 'gpt-4.1-2025-04-14' },
    { name: 'GPT-4.1 Mini', value: 'gpt-4.1-mini-2025-04-14' },
    { name: 'GPT-5', value: 'gpt-5-2025-08-07' },
    { name: 'GPT-5 Mini', value: 'gpt-5-mini-2025-08-07' },
    { name: 'GPT-5 Nano', value: 'gpt-5-nano-2025-08-07' },
    { name: '(OpenRouter) Gemini 2.5 Flash ', value: 'google/gemini-2.5-flash' },
    { name: '(OpenRouter) Gemini 2.5 Flash Lite', value: 'google/gemini-2.5-flash-lite' },
    { name: '(OpenRouter) Gemini 2.5 Pro', value: 'google/gemini-2.5-pro' },
];

export const MODEL_AI_LIST_K9 = [
    { name: 'Claude Haiku 3.5', value: 'claude-3-5-haiku-20241022' },
    { name: 'Claude Sonnet 4', value: 'claude-sonnet-4-20250514' },
    { name: 'GPT-4.1', value: 'gpt-4.1-2025-04-14' },
    { name: 'GPT-5', value: 'gpt-5-2025-08-07' },
    { name: 'GPT-5 High', value: 'gpt-5-high-2025-08-07' },
    { name: 'GPT-5 Mini', value: 'gpt-5-mini-2025-08-07' },
    { name: 'GPT-5 Mini High', value: 'gpt-5-mini-high-2025-08-07' },
    { name: 'GPT-5 Nano', value: 'gpt-5-nano-2025-08-07' },
    { name: '(OpenRouter) Gemini 2.5 Pro', value: 'google/gemini-2.5-pro' },
    { name: '(OpenRouter) Gemini 2.5 Flash', value: 'google/gemini-2.5-flash' },
    { name: '(OpenRouter) Gemini 2.5 Flash Lite', value: 'google/gemini-2.5-flash-lite' },
];

export const FULL_DASHBOARD_APPS = [
    {
        "id": "data-manager",
        "tag": "Working",
        "icon": "cloud-database_9517778",
        "name": "Data Rubik",
        "tags": [
            "bi-reporting"
        ],
        "content1": "",
        "shortcut": "SHIFT 1",
        "description": "Tích hợp,làm sạch, chuẩn hóa dữ liệu ứng dụng AI và 25+ tác vụ  chuyên dụng cho đặc thù dữ liệu với ngôn ngữ Việt Nam",
        "viewCount": 120
    },
    {
        "id": "forecast",
        "tag": "under-development",
        "icon": "icon_60",
        "name": "Mô hình dự báo kinh doanh",
        "content1": "",
        "description": "Dự báo số liệu kinh doanh 7-15 ngày tới. Giải pháp này đang trong quá trình xây dựng\n",
        "viewCount": 120
    },
    {
        "id": "ai-academic-assistant",
        "tag": "Working",
        "icon": "icon_61",
        "name": "Trợ lý học thuật (AI Academic Assistant)",
        "content1": "",
        "description": "Trợ lý học thuật (AI Academic Assistant) giúp bạn học tập, tìm kiếm thông tin,...",
        "viewCount": 120
    },
    {
        "id": "analysis-review",
        "tag": "Working",
        "icon": "icon_46",
        "name": "Phân tích Kinh doanh",
        "tags": [
            "bi-reporting",
            "data-consolidation"
        ],
        "content1": "",
        "content2": "",
        "shortcut": "SHIFT 2",
        "description": "Đo chỉ số - phân tích kinh doanh thông minh, nắm vững thực trạng số liệu, ứng dụng AI chuyên biệt hóa",
        "viewCount": 120
    },
    {
        "id": "fdr",
        "tag": "On-demand",
        "icon": "icon_58",
        "name": "Hiệu quả Tài chính",
        "tags": [
            "bi-reporting"
        ],
        "content1": "",
        "shortcut": "Shift 3",
        "description": "Module chuyên dụng xử lý phân bổ, tính toán lãi lỗ theo các chiều nhìn khác nhau (Lãi lỗ đơn vị, sản phẩm, dự án...)\t",
        "viewCount": 120
    },
    {
        "id": "data-factory",
        "tag": null,
        "icon": "folder-network_9672259",
        "name": "SDS - Thám báo Social Network",
        "description": "Tổng hợp dữ liệu từ các FBGroup/Page thường xuyên",
        "viewCount": 120
    },
    {
        "id": "business-wikibook",
        "tag": "Working",
        "icon": "icon_62",
        "name": "1000 Case Study",
        "tags": [
            "knowledge"
        ],
        "content1": "",
        "enterUrl": "",
        "description": "Học tập kỹ năng , phản ứng tình huống thực chiến với 1000+ case study và 15 chuyên đề chuyên môn kinh doanh",
        "viewCount": 120
    },
    {
        "id": "k9",
        "tag": "Working",
        "icon": "case-file_10256079",
        "name": "DLTC",
        "tags": [
            "data-service",
            "knowledge"
        ],
        "title": "",
        "content1": "",
        "description": "Dữ liệu tài chính, chỉ số kinh doanh, báo cáo phân tích toàn diện của các doanh nghiệp niêm yết Việt Nam",
        "viewCount": 120
    },
    {
        "id": "x-app",
        "tag": null,
        "icon": "icon_63",
        "name": "Trợ lý sự kiện (F&B)",
        "content1": "",
        "description": "Cập nhập các sự kiện về thời tiết, sự kiện kinh tế chính trị sắp diễn ra nhằm có sự chuẩn bị cho chuỗi cung ứng, bán hàn",
        "viewCount": 120
    },
    {
        "id": "scrape",
        "tag": "Working",
        "icon": "cubes_741101",
        "name": "B-Crawler",
        "content1": "",
        "description": "Sử dụng để kéo dữ liệu từ các trang Facebook về nhằm phân tích, nắm bắt tình hình thị trường, khách hàng, đối thủ",
        "viewCount": 120
    },
    {
        "id": "metric-map",
        "tag": "Working",
        "icon": "icon_41",
        "name": "KPI Map",
        "tags": [
            "bi-reporting",
            "knowledge"
        ],
        "content1": "",
        "shortcut": "Shift 4",
        "description": "Tổng quan hóa bức tranh liên kết giữa năng lực cạnh tranh và các chỉ số đo lường, tùy biến theo từng ngành/ mô hình kinh",
        "viewCount": 120
    },
    {
        "id": "proposal-maker",
        "tag": "Working",
        "icon": "business-report_9461193",
        "name": "Proposal Maker",
        "description": "Hệ thống chỉ số theo mô hình kinh doanh",
        "viewCount": 120
    },
    {
        "id": "adminApp",
        "tag": "Working",
        "icon": "cloud-protection_9545331",
        "name": "Admin",
        "tags": [
            "other-tools"
        ],
        "title": "",
        "content1": "",
        "description": "Sử dụng để cài đặt thêm mới/ sửa xóa quyền hạn của User và setup công ty cho công cụ HQTC",
        "viewCount": 120
    },
    {
        "id": "survey-app",
        "tag": "Working",
        "icon": "icon_44",
        "name": "Khảo sát & Thông tin bán hàng",
        "description": "Tạo và quản lý khảo sát khách hàng với template tùy chỉnh",
        "viewCount": 120
    },
    {
        "id": "crm",
        "tag": "Working",
        "icon": "icon_52",
        "name": "Mini CRM",
        "description": "Phần mềm/ứng dụng để quản lý khách hàng, lưu trữ thông tin liên hệ, lịch sử mua hàng, chăm sóc khách hàng.",
        "viewCount": 120
    },
    {
        "id": "storage-tool",
        "tag": "Working",
        "icon": "folder-setting_15554314",
        "name": "Storage",
        "description": "Kho dữ liệu đơn giản, sử dụng để tải lên file nhằm lưu trữ chung hoặc lấy link file/ ảnh (URL online)",
        "viewCount": 120
    },
    {
        "id": "ai-work-automation",
        "tag": "Working",
        "icon": "gear_15714810",
        "name": "Data Bot",
        "tags": [
            "ai-automation"
        ],
        "content1": "",
        "description": "Công cụ AI Agent Chat hub và quản lý chung các luồng tự động hóa (Robotic Process) thiết lập với Make/n8n",
        "viewCount": 120
    },
    {
        "id": "khkd",
        "tag": "Working",
        "icon": "icon_43",
        "name": "KHKD",
        "viewCount": 120
    },
    // {
    //   "id": "process-guide",
    //   "tag": "Working",
    //   "icon": "icon_66",
    //   "name": "TLSD BCanvas",
    //   "content1": "Giới thiệu chung về Bcanvas Giới thiệu về các công cụ Mô tả cách sử dụng các chức năng",
    //   "description": "Hướng dẫn quy trình và tài liệu chi tiết",
    //   "viewCount": 120
    // },
    {
        "id": "process-guide",
        "tag": "Working",
        "icon": "icon_66",
        "name": "TLSD BCanvas",
        "description": "Hướng dẫn quy trình và các tài liệu sử dụng platform BCanvas",
        "viewCount": 120
    }
];