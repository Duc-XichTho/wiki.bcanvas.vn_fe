import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import {calculateTotal} from "../CDPS/logicCDPS.js";
dayjs.extend(isBetween);

export function calNhapXuatTon(nhap, xuat, startDate, endDate) {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    if (startDate && endDate) {
        const beginningNhap = nhap.filter(item => item.ngay_nhap && dayjs(item.ngay_nhap).isBefore(start));
        const beginningXuat = xuat.filter(item => item.ngay_nhap && dayjs(item.ngay_nhap).isBefore(start));
        let result = [];
        let result1 = [];
        beginningNhap.forEach(n => {
            const existingItem = result.find(r => r.code === n.code && r.lo === n.lo && r.kho === n.kho);
            if (existingItem) {
                existingItem.DonGiaNhapDauKy = existingItem.DonGiaNhapDauKy + parseFloat(n.gia_nhap) || 0;
                existingItem.SoLuongNhapDauKy = existingItem.SoLuongNhapDauKy + parseFloat(n.so_luong) || 0;
                existingItem.tong_nhap_dau_ky = existingItem.tong_nhap_dau_ky + existingItem.DonGiaNhapDauKy * existingItem.SoLuongNhapDauKy
            } else {
                result1.push({
                    code: n.code,
                    lo: n.lo,
                    kho: n.kho,
                    dvt: n.dvt,
                    name: n.name,
                    DonGiaNhapDauKy: parseFloat(n.gia_nhap) || 0,
                    SoLuongNhapDauKy: parseFloat(n.so_luong) || 0,
                    tong_nhap_dau_ky: n.gia_xuat * n.so_luong,
                    tk_hang_ton: n.tk_hang_ton || null,
                });
            }

        });

        beginningXuat.forEach(n => {
            const existingItem = result.find(r => r.code === n.code && r.lo === n.lo && r.kho === n.kho);
            if (existingItem) {
                existingItem.DonGiaXuatDauKy = parseFloat(existingItem.DonGiaXuatDauKy) + parseFloat(n.gia_xuat) || 0;
                existingItem.SoLuongXuatDauKy = parseFloat(existingItem.SoLuongXuatDauKy) + parseFloat(n.so_luong) || 0;
                existingItem.tong_gia_xuat_dau_ky = parseFloat(existingItem.tong_gia_xuat_dau_ky) + n.so_luong * n.gia_xuat;
            } else {
                result1.push({
                    code: n.code,
                    lo: n.lo,
                    kho: n.kho,
                    dvt: n.dvt,
                    name: n.name,
                    DonGiaXuatDauKy: parseFloat(n.gia_xuat) || 0,
                    SoLuongTonDauKy: parseFloat(n.so_luong) || 0,
                    tong_gia_xuat_dau_ky: n.gia_xuat * n.so_luong
                });
            }

        });

        result1.forEach(e => {
            e.DonGiaXuatDauKy = parseInt(e.tong_gia_xuat_dau_ky / e.SoLuongXuatDauKy)
            e.GiaTriXuatDauKy = e.tong_gia_xuat_dau_ky
        })
        result1.forEach(e => {
            let SoLuongNhapDauKy = parseFloat(e.SoLuongNhapDauKy || 0);
            let SoLuongXuatDauKy = parseFloat(e.SoLuongXuatDauKy || 0);
            let DonGiaNhapDauKy = parseFloat(e.DonGiaNhapDauKy || 0);
            e.SoLuongTonDauKy = SoLuongNhapDauKy - SoLuongXuatDauKy;
            e.DonGiaTonDauKy = DonGiaNhapDauKy;
            e.tong_gia_dau_ky = e.DonGiaTonDauKy * e.SoLuongTonDauKy;
            e.GiaTriTonDauKy = e.tong_gia_dau_ky
            result.push(e);
        });
        let nhapTrongKy = nhap.filter(item => item.ngay_nhap && dayjs(item.ngay_nhap).isBetween(start, end, null, '[]'));
        nhapTrongKy.forEach(n => {
            // Check if the item is already in the result array
            const existingItem = result.find(r => r.code === n.code && r.lo === n.lo && r.kho === n.kho);
            if (existingItem) {

                existingItem.DonGiaNhapTrongKy = existingItem.DonGiaNhapTrongKy + parseFloat(n.gia_nhap) || 0;
                existingItem.SoLuongNhapTrongKy = existingItem.SoLuongNhapTrongKy + parseFloat(n.so_luong) || 0;
                existingItem.GiaTriNhapTrongKy = existingItem.GiaTriNhapTrongKy + existingItem.DonGiaNhapTrongKy * existingItem.SoLuongNhapTrongKy

            } else {
                // If it doesn't exist, create a new entry
                result.push({
                    code: n.code,
                    lo: n.lo,
                    kho: n.kho,
                    dvt: n.dvt,
                    name: n.name,
                    DonGiaNhapTrongKy: parseFloat(n.gia_nhap) || 0,
                    SoLuongNhapTrongKy: parseFloat(n.so_luong) || 0,
                    GiaTriNhapTrongKy: n.so_luong * n.gia_nhap
                });
            }

        });
        let xuatTrongKy = xuat.filter(item => item.ngay_xuat && dayjs(item.ngay_xuat).isBetween(start, end, null, '[]'));
        xuatTrongKy.forEach(xu => {
            // Check if the item is already in the result array
            const existingItem = result.find(r => r.code === xu.code && r.lo === xu.lo && r.kho === xu.kho);
            if (existingItem) {

                existingItem.GiaTriXuatTrongKy = parseFloat(existingItem.GiaTriXuatTrongKy || 0) + parseFloat(xu.gia_xuat || 0);
                existingItem.SoLuongXuatTrongKy = parseFloat(existingItem.SoLuongXuatTrongKy || 0) + parseFloat(xu.so_luong || 0);

                existingItem.DonGiaXuatTrongKy =parseFloat( existingItem.DonGiaXuatTrongKy || 0)  + ((xu.so_luong || 0) * (xu.gia_xuat || 0));

                // existingItem.SoLuongXuatTrongKy = existingItem.SoLuongXuatTrongKy + parseFloat(xu.so_luong);
                //
                // existingItem.GiaTriXuatTrongKy = existingItem.GiaTriXuatTrongKy + existingItem.DonGiaXuatTrongKy * existingItem.SoLuongXuatTrongKy


            } else {
                // If it doesn't exist, create a new entry
                result.push({
                    code: xu.code,
                    lo: xu.lo,
                    kho: xu.kho,
                    dvt: xu.dvt,
                    name: xu.name,
                    SoLuongXuatTrongKy: parseFloat(xu.so_luong) || 0 ,
                    GiaTriXuatTrongKy: parseFloat(xu.gia_xuat) || 0,
                    DonGiaXuatTrongKy: (parseFloat(xu.so_luong) || 0) * (parseFloat(xu.gia_xuat) || 0) ,
                });
            }

        });
        result.forEach(e => {
            // Initialize variables for calculations
            const SoLuongNhapTrongKy = parseFloat(e.SoLuongNhapTrongKy || 0);
            const SoLuongXuatTrongKy = parseFloat(e.SoLuongXuatTrongKy || 0);
            const SoLuongTonDauKy = parseFloat(e.SoLuongTonDauKy || 0);

            // Calculate SoLuongTonCuoiKy
            e.SoLuongTonCuoiKy = SoLuongTonDauKy + SoLuongNhapTrongKy - SoLuongXuatTrongKy;

            // Initialize GiaTriTonCuoiKy
            const GiaTriNhapTrongKy = parseFloat(e.GiaTriNhapTrongKy || 0);
            const GiaTriXuatTrongKy = parseFloat(e.GiaTriXuatTrongKy || 0);
            const GiaTriTonDauKy = parseFloat(e.GiaTriTonDauKy || 0);

            // Calculate GiaTriTonCuoiKy
            // e.GiaTriTonCuoiKy = GiaTriTonDauKy + GiaTriNhapTrongKy - GiaTriXuatTrongKy;

            // Calculate DonGiaTonCuoiKy
            if (e.SoLuongTonCuoiKy > 0) {
                // e.DonGiaTonCuoiKy = e.GiaTriTonCuoiKy / e.SoLuongTonCuoiKy;
                if (e.DonGiaTonDauKy) {
                    e.DonGiaTonCuoiKy = e.DonGiaTonDauKy
                } else if (e.DonGiaNhapTrongKy) {
                    e.DonGiaTonCuoiKy = e.DonGiaNhapTrongKy
                } else {
                    e.DonGiaTonCuoiKy = 0
                }
                // e.DonGiaTonCuoiKy = parseInt(e.GiaTriTonCuoiKy / e.SoLuongTonCuoiKy || 0) ;
            } else {
                // If no quantity, set unit price to 0
                e.DonGiaTonCuoiKy = 0;
            }
            e.GiaTriTonCuoiKy = e.DonGiaTonCuoiKy * e.SoLuongTonCuoiKy
            // If there are no incoming transactions and beginning stock is zero, set ending stock to zero
            // if (SoLuongTonDauKy === 0 && SoLuongNhapTrongKy === 0) {
            //     e.SoLuongTonCuoiKy = 0;
            //     e.GiaTriTonCuoiKy = 0;
            //     e.DonGiaTonCuoiKy = 0;
            // }
        });
        return result;
    }
}

export function calGiaBan(nhap, xuat, hh, kho, cauHinh) {
    let ton = calNhapXuatTon(nhap, xuat, '2024-01-01', '2025-12-31');
    ton = ton.filter(item => item.code == hh)
    if (cauHinh.value == 'Theo kho') {
        ton = ton.filter(item => item.kho == kho)
    }
    let giaTri = calculateTotal(ton, 'GiaTriTonCuoiKy') || 0
    let sl = calculateTotal(ton, 'SoLuongTonCuoiKy') || 1
    return giaTri / sl

}
