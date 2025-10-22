export function gomPX(data)  {
    return Object.values(
        data.reduce((acc, item) => {
            if (!acc[item.gom]) {
                acc[item.gom] = {
                    gom: item.gom,
                    ngay_xuat: item.ngay_xuat,
                    code_nhan_vien: item.code_nhan_vien,
                    name_nhan_vien: item.name_nhan_vien,
                    code_khach_hang: item.code_khach_hang,
                    name_khach_hang: item.name_khach_hang,
                    danh_sach_hang_hoa: [],
                    phieus: []
                };
            }

            if (!acc[item.gom].phieus.includes(item.id_phieu_xuat)) {
                acc[item.gom].phieus.push('PX'+item.id_phieu_xuat);
            }

            item.danh_sach_hang_hoa.forEach(hh => {
                const existing = acc[item.gom].danh_sach_hang_hoa.find(
                    x => x.code === hh.code && x.kho_code === hh.kho_code
                );

                if (existing) {
                    existing.so_luong += hh.so_luong;
                } else {
                    acc[item.gom].danh_sach_hang_hoa.push({ ...hh });
                }
            });

            return acc;
        }, {})
    );
}

export function gomPN(data)  {
    return Object.values(
        data.reduce((acc, item) => {
            if (!acc[item.gom]) {
                acc[item.gom] = {
                    gom: item.gom,
                    ngay_nhap: item.ngay_nhap,
                    code_nhan_vien: item.code_nhan_vien,
                    name_nhan_vien: item.name_nhan_vien,
                    code_khach_hang: item.code_khach_hang,
                    name_khach_hang: item.name_khach_hang,
                    danh_sach_hang_hoa: [],
                    phieus: []
                };
            }

            if (!acc[item.gom].phieus.includes(item.id_phieu_nhap)) {
                acc[item.gom].phieus.push('PX'+item.id_phieu_nhap);
            }

            item.danh_sach_hang_hoa.forEach(hh => {
                const existing = acc[item.gom].danh_sach_hang_hoa.find(
                    x => x.code === hh.code && x.kho_code === hh.kho_code
                );

                if (existing) {
                    existing.so_luong += hh.so_luong;
                } else {
                    acc[item.gom].danh_sach_hang_hoa.push({ ...hh });
                }
            });

            return acc;
        }, {})
    );
}

