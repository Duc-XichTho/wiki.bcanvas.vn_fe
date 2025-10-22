let maTKs = ["131", "331", "138", "338"]
export function createSTDinhDanh(list, listNV, listKh, listNCC) {
    list = list.filter(item => (item.customer || item.employee || item.supplier) && maTKs.includes(item.tkkt));
    list.forEach(item => {
        let dinhDanhKH = getDinhDanh(listKh, item.customer);
        let dinhDanhNV = getDinhDanh(listNV, item.employee);
        let dinhDanhNCC = getDinhDanh(listNCC, item.supplier);
        if (dinhDanhKH) {
            item.dinh_danh = dinhDanhKH
        } else if (dinhDanhNCC) {
            item.dinh_danh = dinhDanhNCC
        } else {
            item.dinh_danh = dinhDanhNV
        }
    })
    return list
}
export function createSoDauKyDinhDanh(list, listNV, listKh, listNCC) {
    list = list.filter(item => (item.TD_KhachHang || item.TD_NCC || item.TD_NhanVien));
    list.forEach(item => {
        let dinhDanhKH = getDinhDanh(listKh, item.TD_KhachHang);
        let dinhDanhNV = getDinhDanh(listNV, item.TD_NhanVien);
        let dinhDanhNCC = getDinhDanh(listNCC, item.TD_NCC);
        if (dinhDanhKH) {
            item.dinh_danh = dinhDanhKH
        } else if (dinhDanhNCC) {
            item.dinh_danh = dinhDanhNCC
        } else {
            item.dinh_danh = dinhDanhNV
        }
    })
    return list
}

function getDinhDanh(list, code) {
    let item = list.find((item) => item.code === code);
    if (item) {
        return item.dinh_danh;
    }
    return null
}
