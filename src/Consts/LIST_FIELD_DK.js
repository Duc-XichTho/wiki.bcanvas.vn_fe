export const LIST_FIELD_DK = [
    {
        field: 'date',
        hide: false,
        name: 'Ngày',
    },
    {
        field: 'phieuKT',
        hide: false,
        name: 'Phiếu kế toán',
    },
    {
        field: 'phieu_thu_chi',
        hide: false,
        name: 'Phiếu thu chi',
    },
    {
        field: 'phieu_lq',
        hide: false,
        name: 'Chứng từ liên quan',
    },
    {
        field: 'soChungTu',
        hide: false,
        name: 'Chứng từ',
    },
    {
        field: 'note',
        hide: false,
        name: 'Diễn giải',
    },
    {
        field: 'temCode',
        hide: false,
        name: 'Phòng ban',
    },
    {
        field: 'tkNo',
        hide: false,
        name: 'Tài khoản nợ',
    },
    {
        field: 'tkCo',
        hide: false,
        name: 'Tài khoản có',
    },
    {
        field: 'soTien',
        hide: false,
        name: 'Số tiền',
    },
    {
        field: 'kmf',
        hide: false,
        name: 'Khoản mục phí',
    },
    {
        field: 'kmtc',
        hide: false,
        name: 'Khoản mục thu chi',
    },
    {
        field: 'duAn',
        hide: false,
        name: 'Dự án',
    },
    {
        field: 'sanPham',
        hide: false,
        name: 'Sản phẩm',
    },
    {
        field: 'nhaCungCap',
        hide: false,
        name: 'Nhà cung cấp',
    },
    {
        field: 'hopDong',
        hide: false,
        name: 'Hợp đồng',
    },
    {
        field: 'khachHang',
        hide: false,
        name: 'Khách hàng',
    },
]

export function hideFieldDK(settingData, field) {
    if (!settingData) return false;
    let settings = settingData.setting;
    let fieldSetting = settings.find(e => e.field === field);
    if (!fieldSetting) return false;
    return fieldSetting.hide
}


export function requiredFieldDK(settingData, field) {
    if (!settingData) return false;
    let settings = settingData.setting;
    let fieldSetting = settings.find(e => e.field === field);
    if (!fieldSetting) return false;
    return fieldSetting.required
}
