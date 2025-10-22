import React, {useEffect, useMemo, useState} from "react";
import {Modal, Row} from "antd";
import {AgGridReact} from "ag-grid-react";
import AG_GRID_LOCALE_VN from "../../AgridTable/locale.jsx";
import {getAllDonHang} from "../../../../apis/donHangService.jsx";
import {toast} from "react-toastify";
import {getAllDonHangDetailByDonHangId} from "../../../../apis/donHangDetailService.jsx";
import {getAllDonMuaHang} from "../../../../apis/donMuaHangService.jsx";
import {getAllDonMuaHangDetailByDonMuaHangId} from "../../../../apis/donMuaHangDetailService.jsx";
import {getAllDeNghiThanhToan} from "../../../../apis/deNghiThanhToanService.jsx";
import {getDeNghiThanhToanDetailByDeNghiThanhToanIdService} from "../../../../apis/deNghiThanhToanDetailService.jsx";
import {getAllNhanVien} from "../../../../apis/nhanVienService.jsx";
import {getAllHangHoa} from "../../../../apis/hangHoaService.jsx";
import {getAllBusinessUnit} from "../../../../apis/businessUnitService.jsx";
import {getAllKmf} from "../../../../apis/kmfService.jsx";
import {getAllKmtc} from "../../../../apis/kmtcService.jsx";
import {getAllTamUng} from "../../../../apis/tamUngService.jsx";
import {getDetailTamUngByTamUngIdService} from "../../../../apis/tamUngDetailService.jsx";
import {getAllPhieuChi2} from "../../../../apis/phieuChi2Service.jsx";
import {getPhieuChi2Detail} from "../../../../apis/phieuChi2DetailService.jsx";
import {getAllPhieuThu} from "../../../../apis/phieuThuService.jsx";
import {getDetailPhieuThuByPhieuThuIdService} from "../../../../apis/detailPhieuThuService.jsx";
import {getAllPhieuNhap} from "../../../../apis/phieuNhapService.jsx";
import {getDetailPhieuNhapDataByPhieuNhapId} from "../../../../apis/detailPhieuNhapService.jsx";
import {getAllKho} from "../../../../apis/khoService.jsx";
import {getAllLo} from "../../../../apis/loService.jsx";
import {getAllNhaCungCap} from "../../../../apis/nhaCungCapService.jsx";
import {getAllPhieuXuat} from "../../../../apis/phieuXuatService.jsx";
import {getDetailPhieuXuatDataByPhieuXuatId} from "../../../../apis/detailPhieuXuatService.jsx";
import {getAllKhachHang} from "../../../../apis/khachHangService.jsx";
import {getAllHoaDon} from "../../../../apis/hoaDonService.jsx";
import {getAllHoaDonSanPhamByHoaDonId} from "../../../../apis/hoaDonSanPhamService.jsx";
import {getAllDieuChuyenKho} from "../../../../apis/dieuChuyenKhoService.jsx";

export default function ViewCardTable({open, onClose, listCard, name}) {
    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);
    const [colDefs, setColDefs] = useState([]);


    const getDisplayValue = (params, codeKey, nameKey) => `${params.data?.[codeKey] || ""} - ${params.data?.[nameKey] || "Không có tên"}`;
    const findItemById = (list, id, key = "name") => list.find(e => e.id == id)?.[key] || "";
    const formatMoney = (value) =>  parseInt(value).toLocaleString('en-US') || 0;

    useEffect(() => {
        const fetchColumn = async () => {
            try {
                let columns = [];
                const requiredAPIs = {
                    "Đơn hàng": {listNhanVien: getAllNhanVien, listHangHoa: getAllHangHoa},
                    "Đề nghị mua": {
                        listNhanVien: getAllNhanVien,
                        listHangHoa: getAllHangHoa,
                        listBoPhan: getAllBusinessUnit,
                        listKmf: getAllKmf,
                        listKmtc: getAllKmtc
                    },
                    "Đề nghị thanh toán": {
                        listNhanVien: getAllNhanVien,
                        listBoPhan: getAllBusinessUnit,
                        listKmf: getAllKmf,
                        listKmtc: getAllKmtc,
                        listHangHoa: getAllHangHoa
                    },
                    "Tạm ứng": {
                        listNhanVien: getAllNhanVien,
                        listBoPhan: getAllBusinessUnit,
                        listHangHoa: getAllHangHoa,
                        listKmf: getAllKmf,
                        listKmtc: getAllKmtc,
                    },
                    "Phiếu chi / UN chi": {listNhanVien: getAllNhanVien, listHangHoa: getAllHangHoa},
                    "Phiếu thu / Báo có": {listHangHoa: getAllHangHoa},
                    "Nhập kho": {
                        listNhanVien: getAllNhanVien,
                        listHangHoa: getAllHangHoa,
                        listNhaCungCap: getAllNhaCungCap,
                        listKho: getAllKho,
                        listLo: getAllLo
                    },
                    "Xuất kho": {
                        listNhanVien: getAllNhanVien,
                        listHangHoa: getAllHangHoa,
                        listKhachHang: getAllKhachHang,
                        listKho: getAllKho,
                        listLo: getAllLo
                    },
                    "Hóa đơn": {
                        listKhachHang: getAllKhachHang,
                        listHangHoa: getAllHangHoa,
                    },
                    "Điều chuyển kho": {
                        listKho: getAllKho,
                        listLo: getAllLo,
                        listHangHoa: getAllHangHoa,
                        listNhaCungCap: getAllNhaCungCap,
                        listNhanVien: getAllNhanVien,


                    }
                };

                const apisToCall = requiredAPIs[name] || {};

                const results = await Promise.all(Object.entries(apisToCall).map(([key, api]) => api().then(data => [key, data])));

                const data = Object.fromEntries(results);

                const listNhanVien = data.listNhanVien || [];
                const listHangHoa = data.listHangHoa || [];
                const listBoPhan = data.listBoPhan || [];
                const listKmf = data.listKmf || [];
                const listKmtc = data.listKmtc || [];
                const listKho = data.listKho || [];
                const listLo = data.listLo || [];
                const listNhaCungCap = data.listNhaCungCap || [];
                const listKhachHang = data.listKhachHang || [];
                switch (name) {
                    case "Đơn hàng":
                        columns = [
                            {field: 'code2', headerName: 'Mã đơn hàng', width: 160},
                            {field: "ngay_dat_hang", headerName: "Ngày bán hàng"},
                            {
                                field: "vu_viec",
                                headerName: "Vụ việc",
                                valueGetter: (params) => {
                                    const code = params.data?.code_vu_viec || "";
                                    const name = params.data?.name_vu_viec || "Không có tên";
                                    return `${code} - ${name}`;
                                }
                            },
                            {
                                field: "khach_hang",
                                headerName: "Khách hàng",
                                valueGetter: (params) => {
                                    const code = params.data?.code_khach_hang || "";
                                    const name = params.data?.name_khach_hang || "Không có tên";
                                    return `${code} - ${name}`;
                                }
                            },
                            {field: "dia_diem_giao_hang", headerName: "Địa điểm giao hàng"},
                            {field: "dieu_khoan_thanh_toan", headerName: "Điều khoản thanh toán"},
                            {
                                field: "hinh_thuc_thanh_toan",
                                headerName: "Hình thức thanh toán",
                                valueGetter: (params) => params.data?.hinh_thuc_thanh_toan === 'chuyen_khoan' ? 'Chuyển khoản' : 'Tiền mặt'
                            },
                            {
                                field: "ten_hang_hoa",
                                headerName: "Tên hàng hóa",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.id == params.data?.id_hang_hoa);
                                    return hangHoa ? `${hangHoa.code} - ${hangHoa.name}` : "";
                                }
                            },


                            {
                                field: "dvt",
                                headerName: "Đơn vị tính",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.id == params.data?.id_hang_hoa);
                                    return hangHoa?.dvt || "";
                                }
                            },
                            {
                                field: "so_luong",
                                headerName: "Số lượng",
                            },
                            {
                                field: "gia_ban",
                                headerName: "Giá bán",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.id == params.data?.id_hang_hoa);
                                    const giaNhap = Number(hangHoa?.gia_ban) || 0;
                                    return formatMoney(giaNhap);
                                },
                            },
                            {
                                field: "tong_tien",
                                headerName: "Tổng tiền",
                                valueGetter: (params) => {
                                    const soLuong = Number(params.data?.so_luong) || 0;
                                    const hangHoa = listHangHoa.find(e => e.id == params.data?.id_hang_hoa);
                                    const donGia = Number(hangHoa?.gia_ban) || 0;
                                    return formatMoney(donGia * soLuong) ;
                                }
                            },
                            // {
                            //     field: "tien_thue",
                            //     headerName: "Tiền thuế",
                            //     valueGetter: (params) => (Number(params.data?.tien_thue) || 0).toLocaleString('vi-VN')
                            // },
                            // {
                            //     field: "tien_truoc_thue",
                            //     headerName: "Tiền trước thuế",
                            //     valueGetter: (params) => (Number(params.data?.tien_truoc_thue) || 0).toLocaleString('vi-VN')
                            // },
                            // {
                            //     field: "tien_sau_thue",
                            //     headerName: "Tiền sau thuế",
                            //     valueGetter: (params) => {
                            //         return ((Number(params.data?.tien_truoc_thue) || 0) + (Number(params.data?.tien_thue) || 0)).toLocaleString('vi-VN');
                            //     }
                            // },
                        ];
                        break;
                    case "Đề nghị mua":
                        columns = [
                            {field: 'code2', headerName: 'Mã đơn hàng', width: 160},
                            {field: "ngay_mua_hang", headerName: "Ngày mua hàng"},
                            {field: "dien_giai", headerName: "Diễn giải"},
                            {
                                field: "bo_phan_de_nghi",
                                headerName: "Bộ phận đề nghị",
                                valueGetter: (params) => getDisplayValue(params, "code_bo_phan_de_nghi", "name_bo_phan_de_nghi")
                            },
                            {
                                field: "nhan_vien",
                                headerName: "Tạo bởi nhân viên",
                                valueGetter: (params) => getDisplayValue(params, "code_nhan_vien", "name_nhan_vien")
                            },
                            {
                                field: "hang_hoa",
                                headerName: "Tên hàng hóa",
                                valueGetter: (params) => getDisplayValue(params, "code_hang_hoa", "name_hang_hoa")
                            },
                            {
                                field: "kmf",
                                headerName: "KMF",
                                valueGetter: (params) => getDisplayValue(params, "code_kmf", "name_kmf")
                            },
                            {
                                field: "kmns",
                                headerName: "KMTC",
                                valueGetter: (params) => getDisplayValue(params, "code_kmns", "name_kmns")
                            },
                            {
                                field: "vu_viec",
                                headerName: "Vụ việc",
                                valueGetter: (params) => getDisplayValue(params, "code_vu_viec", "name_vu_viec")
                            },
                            {
                                field: "ten_hang_hoa",
                                headerName: "Tên hàng hóa",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.id == params.data?.id_hang_hoa);
                                    return hangHoa ? `${hangHoa.code} - ${hangHoa.name}` : "";
                                }
                            },


                            {
                                field: "dvt",
                                headerName: "Đơn vị tính",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.id == params.data?.id_hang_hoa);
                                    return hangHoa?.dvt || "";
                                }
                            },
                            {
                                field: "so_luong",
                                headerName: "Số lượng",
                            },
                            {
                                field: "gia_ban",
                                headerName: "Giá bán",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.id == params.data?.id_hang_hoa);
                                    const giaNhap = Number(hangHoa?.gia_ban) || 0;
                                    return formatMoney(giaNhap);
                                },
                            },
                            {
                                field: "tong_tien",
                                headerName: "Tổng tiền",
                                valueGetter: (params) => {
                                    const soLuong = Number(params.data?.so_luong) || 0;
                                    const hangHoa = listHangHoa.find(e => e.id == params.data?.id_hang_hoa);
                                    const donGia = Number(hangHoa?.gia_ban) || 0;
                                    return formatMoney(donGia * soLuong);
                                }
                            },
                        ];
                        break;
                    case "Đề nghị thanh toán":
                        columns = [
                            {
                                field: 'code',
                                headerName: 'Mã đề nghị', width: 120,
                                valueGetter: (params) => {
                                    const name = params.data?.id || "Không có tên";
                                    return `DNTT-${name}`;
                                }
                            },
                            {
                                field: "ngay_du_kien_thanh_toan",
                                headerName: "Ngày dự kiến thanh toán"
                            },
                            {
                                field: "bo_phan",
                                headerName: "Bộ phận",
                                valueGetter: (params) => findItemById(listBoPhan, params.data.id_bo_phan)
                            },
                            {
                                field: "nhan_vien",
                                headerName: "Nhân viên",
                                valueGetter: (params) => findItemById(listNhanVien, params.data.id_nhan_vien)
                            },
                            {field: "tk_nhan_tien", headerName: "Tài khoản nhận tiền"},
                            {field: "mo_ta", headerName: "Mô tả"},
                            {
                                field: "ten_hang_hoa",
                                headerName: "Tên hàng hóa",
                                valueGetter: (params) => {
                                    const item = listHangHoa.find(e => e.id == params.data.id_hang_hoa);
                                    return item ? `${item.code} - ${item.name}` : "";
                                }
                            },
                            {
                                field: "kmf",
                                headerName: "KMF",
                                valueGetter: (params) => {
                                    const item = listKmf.find(e => e.id == params.data.id_kmf);
                                    return item ? `${item.code} - ${item.name}` : "";
                                }
                            },
                            {
                                field: "kmns",
                                headerName: "KMTC",
                                valueGetter: (params) => {
                                    const item = listKmtc.find(e => e.id == params.data.id_kmns);
                                    return item ? `${item.code} - ${item.name}` : "";
                                }
                            },
                            {
                                field: "dvt",
                                headerName: "Đơn vị tính",
                                valueGetter: (params) => findItemById(listHangHoa, params.data.id_hang_hoa, "dvt")
                            },
                            {field: "so_luong", headerName: "Số lượng"},
                            {field: "thue", headerName: "Thuế"},
                            {
                                field: "don_gia",
                                headerName: "Đơn giá",
                                valueGetter: (params) => formatMoney(params.data.don_gia || 0)
                            },
                            {
                                field: "tong_tien",
                                headerName: "Tổng tiền",
                                valueGetter: (params) => {
                                    const donGia = Number(params.data?.don_gia) || 0;
                                    const soLuong = Number(params.data?.so_luong) || 0;
                                    return formatMoney(donGia * soLuong);
                                }
                            }
                        ];
                        break;
                    case "Tạm ứng":
                        columns = [
                            {
                                field: 'code',
                                headerName: 'Mã đề nghị', width: 120,
                            },
                            {
                                field: "ngay_du_kien_tam_ung",
                                headerName: "Ngày dự kiến tạm ứng"
                            },
                            {
                                field: "ngay_du_kien_hoan_ung",
                                headerName: "Ngày dự kiến hoàn ứng"
                            },
                            {
                                field: "bo_phan",
                                headerName: "Bộ phận",
                                valueGetter: (params) => findItemById(listBoPhan, params.data?.bo_phan?.id)
                            },
                            {
                                field: "nhan_vien",
                                headerName: "Nhân viên",
                                valueGetter: (params) => findItemById(listNhanVien, params.data?.nhan_vien?.id)
                            },
                            {field: "tk_nhan_tien", headerName: "Tài khoản nhận tiền"},
                            {field: "mo_ta", headerName: "Mô tả"},
                            {
                                field: "ten_hang_hoa",
                                headerName: "Tên hàng hóa",
                                valueGetter: (params) => findItemById(listHangHoa, params.data?.id_hang_hoa)
                            },
                            {
                                field: "kmf",
                                headerName: "KMF",
                                valueGetter: (params) => findItemById(listKmf, params.data?.id_kmf)
                            },
                            {
                                field: "kmns",
                                headerName: "KMTC",
                                valueGetter: (params) => findItemById(listKmtc, params.data?.id_kmns)
                            },
                            {
                                field: "dvt",
                                headerName: "Đơn vị tính",
                                valueGetter: (params) => findItemById(listHangHoa, params.data?.id_hang_hoa, "dvt")
                            },
                            {field: "so_luong", headerName: "Số lượng"},
                            {field: "thue", headerName: "Thuế"},
                            {
                                field: "don_gia",
                                headerName: "Đơn giá",
                                valueGetter: (params) => formatMoney(params.data?.don_gia || 0)
                            },
                            {
                                field: "tong_tien",
                                headerName: "Tổng tiền",
                                valueGetter: (params) => {
                                    const donGia = Number(params.data?.don_gia) || 0;
                                    const soLuong = Number(params.data?.so_luong) || 0;
                                    return formatMoney(donGia * soLuong);
                                }
                            }
                        ];
                        break;
                    case "Phiếu chi / UN chi":
                        columns = [
                            {
                                field: 'code',
                                headerName: 'Mã phiếu chi', width: 120,
                            },
                            {
                                field: 'type',
                                headerName: 'Kiểu phiếu',
                                valueGetter: (params) => {
                                    if (params.data?.type == 'PHIEU_CHI') {
                                        return "Phiếu chi"
                                    } else if (params.data?.type == 'UN_CHI') {
                                        return "Ủy nhiệm chi"
                                    }
                                    ;
                                }

                            },
                            {
                                field: "ngay_chi",
                                headerName: "Ngày chi"
                            },
                            {
                                field: "nhan_vien", headerName: "Nhân viên", valueGetter: (params) => {
                                    const nhanVien = listNhanVien.find(e => e.id == params.data?.nhan_vien?.id);
                                    return nhanVien ? `${nhanVien.code} - ${nhanVien.name}` : "";
                                }
                            },
                            {field: "tai_khoan_nhan_tien", headerName: "Tài khoản nhận tiền"},
                            {field: "ten_chu_tai_khoan", headerName: "Tên chủ tài khoản"},
                            {field: "ly_do", headerName: "Lý do"},
                            {field: "thanh_toan_cong_no", headerName: "Thanh toán công nợ"},
                            {
                                field: "ten_hang_hoa", headerName: "Tên hàng hóa", valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.id == params.data?.id_hang_hoa);
                                    return hangHoa ? `${hangHoa.code} - ${hangHoa.name}` : "";
                                }
                            },
                            {
                                field: "dvt",
                                headerName: "Đơn vị tính",
                                valueGetter: (params) => findItemById(listHangHoa, params.data?.id_hang_hoa, "dvt")
                            },
                            {field: "so_luong", headerName: "Số lượng"},
                            {
                                field: "gia_ban",
                                headerName: "Giá bán",
                                valueGetter: (params) => formatMoney(params.data?.gia_ban || 0)
                            },
                            {
                                field: "tong_tien", headerName: "Tổng tiền", valueGetter: (params) => {
                                    const donGia = Number(params.data?.gia_ban) || 0;
                                    const soLuong = Number(params.data?.so_luong) || 0;
                                    return formatMoney(donGia * soLuong)
                                }
                            }
                        ];
                        break;
                    case "Phiếu thu / Báo có":
                        columns = [
                            {
                                field: 'code',
                                headerName: 'Mã phiếu thu', width: 120,
                            },
                            {
                                field: 'type',
                                headerName: 'Kiểu phiếu',
                                valueGetter: (params) => {
                                    if (params.data?.type == 'PHIEU_THU') {
                                        return 'Phiếu thu'
                                    } else if (params.data?.type == 'BAO_NO') {
                                        return 'Báo nợ'
                                    }
                                    ;
                                }

                            },
                            {
                                field: "ngay_thu",
                                headerName: "Ngày thu"
                            },
                            {
                                field: "hinh_thuc",
                                headerName: "Hình thức"
                            },
                            {
                                field: "nguoi_chuyen_tien",
                                headerName: "Người chuyển tiền"
                            },
                            {
                                field: "ly_do",
                                headerName: "Lý do ",
                            },

                            {
                                field: "ten_hang_hoa",
                                headerName: "Tên hàng hóa",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.id == params.data?.id_hang_hoa);
                                    return hangHoa ? `${hangHoa.code} - ${hangHoa.name}` : "";
                                }
                            },

                            {
                                field: "dvt",
                                headerName: "Đơn vị tính",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.id === params.data?.id_hang_hoa);
                                    return hangHoa?.dvt || "";
                                }
                            },

                            {
                                field: "so_luong",
                                headerName: "Số lượng",
                            },
                            {
                                field: "don_gia",
                                headerName: "Giá bán",
                                valueGetter: (params) => {
                                    return formatMoney(params.data.don_gia || 0)
                                },
                            },
                            {
                                field: "tong_tien",
                                headerName: "Tổng tiền",
                                valueGetter: (params) => {
                                    const donGia = Number(params.data?.don_gia) || 0;
                                    const soLuong = Number(params.data?.so_luong) || 0;
                                    return formatMoney(donGia * soLuong);
                                }
                            }
                        ];
                        break;
                    case "Nhập kho":
                        columns = [
                            {
                                field: 'code',
                                headerName: 'Mã nhập',
                                width: 120,
                            },
                            {
                                field: "nhan_vien",
                                headerName: "Nhân viên",
                                valueGetter: (params) => {
                                    if (!params.data?.id_nhan_vien) return "";
                                    const code = listNhanVien.find(e => e.id == params.data.id_nhan_vien);
                                    return code ? `${code.code} - ${code.name}` : "";
                                }
                            },
                            {
                                field: 'nhom_hang_hoa',
                                headerName: 'Nhóm hàng hóa',
                            },
                            {
                                field: "ngay",
                                headerName: "Ngày nhập"
                            },
                            {
                                field: "lenh_san_xuat",
                                headerName: "Lệnh sản xuất",
                                valueGetter: (params) => {
                                    const code = params.data?.lenh_san_xuat?.code || "";
                                    return `${code}`;
                                }
                            },

                            {
                                field: "ten_hang_hoa",
                                headerName: "Tên hàng hóa",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.id === params.data?.id_hang_hoa);
                                    return hangHoa ? `${hangHoa.code} - ${hangHoa.name}` : "";
                                }
                            },
                            {
                                field: "nha_cung_cap",
                                headerName: "Nhà cung cấp",
                                valueGetter: (params) => {
                                    const nhaCungCap = listNhaCungCap.find(e => e.id === params.data?.id_nha_cung_cap);
                                    return nhaCungCap ? `${nhaCungCap.code} - ${nhaCungCap.name}` : "";
                                }
                            },
                            {
                                field: "kho",
                                headerName: "Kho",
                                valueGetter: (params) => {
                                    const kho = listKho.find(e => e.id === params.data?.id_kho);
                                    return kho ? `${kho.code} - ${kho.name}` : "";
                                }
                            },
                            {
                                field: "lo",
                                headerName: "Lô",
                                valueGetter: (params) => {
                                    const lo = listLo.find(e => e.id === params.data?.id_lo);
                                    return lo ? `${lo.code} - ${lo.name}` : "";
                                }
                            },

                            {
                                field: "dvt",
                                headerName: "Đơn vị tính",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.id === params.data?.id_hang_hoa);
                                    return hangHoa?.dvt || "";
                                }
                            },

                            {
                                field: "so_luong",
                                headerName: "Số lượng",
                            },
                            {
                                field: "thue",
                                headerName: "Thuế",
                            },
                            {
                                field: "gia_nhap",
                                headerName: "Giá nhập",
                                valueGetter: (params) => {
                                    const giaNhap = Number(params.data?.gia_nhap) || 0;
                                    return formatMoney(giaNhap)
                                },
                            },
                            {
                                field: "tong_tien",
                                headerName: "Tổng tiền",
                                valueGetter: (params) => {
                                    const donGia = Number(params.data?.gia_nhap) || 0;
                                    const soLuong = Number(params.data?.so_luong) || 0;
                                    return formatMoney(donGia * soLuong)
                                }
                            }
                        ]
                        break;
                    case "Xuất kho":
                        columns = [
                            {
                                field: 'code',
                                headerName: 'Mã xuất',
                                width: 120,
                            },
                            {
                                field: "khach_hang",
                                headerName: "Khách hàng",
                                valueGetter: (params) => {
                                    if (!params.data?.id_khach_hang) return "";
                                    const code = listKhachHang.find(e => e.id == params.data.id_khach_hang);
                                    return code ? `${code.code} - ${code.name}` : "";
                                }
                            },
                            {
                                field: "nhan_vien",
                                headerName: "Nhân viên",
                                valueGetter: (params) => {
                                    if (!params.data?.id_nhan_vien) return "";
                                    const code = listNhanVien.find(e => e.id == params.data.id_nhan_vien);
                                    return code ? `${code.code} - ${code.name}` : "";
                                }
                            },
                            {
                                field: "ngay",
                                headerName: "Ngày xuất",
                            },
                            {
                                field: "ten_hang_hoa",
                                headerName: "Tên hàng hóa",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.id === params.data?.id_hang_hoa);
                                    return hangHoa ? `${hangHoa.code} - ${hangHoa.name}` : "";
                                }
                            },
                            {
                                field: "kho",
                                headerName: "Kho",
                                valueGetter: (params) => {
                                    const kho = listKho.find(e => e.id === params.data?.id_kho);
                                    return kho ? `${kho.code} - ${kho.name}` : "";
                                }
                            },
                            {
                                field: "lo",
                                headerName: "Lô",
                                valueGetter: (params) => {
                                    const lo = listLo.find(e => e.id === params.data?.id_lo);
                                    return lo ? `${lo.code} - ${lo.name}` : "";
                                }
                            },

                            {
                                field: "dvt",
                                headerName: "Đơn vị tính",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.id === params.data?.id_hang_hoa);
                                    return hangHoa?.dvt || "";
                                }
                            },

                            {
                                field: "so_luong",
                                headerName: "Số lượng",
                            },
                            {
                                field: "gia_xuat",
                                headerName: "Giá xuất",
                                valueGetter: (params) => {
                                    const giaNhap = Number(params.data?.gia_xuat) || 0;
                                    return formatMoney(giaNhap);
                                },
                            },
                            {
                                field: "tong_tien",
                                headerName: "Tổng tiền",
                                valueGetter: (params) => {
                                    const donGia = Number(params.data?.gia_xuat) || 0;
                                    const soLuong = Number(params.data?.so_luong) || 0;
                                    return formatMoney(donGia * soLuong)
                                }
                            }

                        ];
                        break;
                    case "Hóa đơn":
                        columns = [
                            {
                                field: 'id',
                                headerName: 'id',
                                width: 120,
                            },
                            {
                                field: 'code',
                                headerName: 'Mã hóa đơn',
                                width: 120,
                            },
                            {
                                field: "khach_hang",
                                headerName: "Khách hàng",
                                valueGetter: (params) => {
                                    if (!params.data?.khach_hang) return "";
                                    const code = listKhachHang.find(e => e.code == params.data.khach_hang);
                                    return code ? `${code.code} - ${code.name}` : "";
                                }
                            },
                            {
                                field: 'hinh_thuc_tt',
                                headerName: 'Phương thức thanh toán',
                                width: 120,
                            },
                            {
                                field: "date",
                                headerName: "Ngày hóa đơn",
                            },
                            {
                                field: "ky_hieu_hd",
                                headerName: "Kí hiệu hóa đơn",
                            },
                            {
                                field: "mau_so",
                                headerName: "Mẫu số",
                            },
                            {
                                field: "ten_hang_hoa",
                                headerName: "Tên hàng hóa",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.code === params.data?.productCode);
                                    return hangHoa ? `${hangHoa.code} - ${hangHoa.name}` : "";
                                }
                            },

                            {
                                field: "dvt",
                                headerName: "Đơn vị tính",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.code === params.data?.productCode);
                                    return hangHoa?.dvt || "";
                                }
                            },
                            {
                                field: "soLuong",
                                headerName: "Số lượng",
                            },
                            {
                                field: "gia_ban",
                                headerName: "Giá bán",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.code === params.data?.productCode);
                                    const giaNhap = Number(hangHoa?.gia_ban) || 0;
                                    return formatMoney(giaNhap);
                                },
                            },
                            {
                                field: "tong_tien",
                                headerName: "Tổng tiền",
                                valueGetter: (params) => {
                                    const soLuong = Number(params.data?.soLuong) || 0;
                                    const hangHoa = listHangHoa.find(e => e.code === params.data?.productCode);
                                    const donGia = Number(hangHoa?.gia_ban) || "";
                                    return formatMoney(donGia * soLuong)
                                }
                            }

                        ];
                        break;

                    case "Điều chuyển kho":
                        columns = [
                            {
                                field: 'code',
                                headerName: 'Mã diều chuyển',
                                width: 120,
                            },
                            {
                                field: 'ngay',
                                headerName: 'Ngày điều chuyyển',
                                width: 140,
                            },
                            {
                                field: "kho_nguon",
                                headerName: "Kho nguồn",
                                valueGetter: (params) => {
                                    const hangHoa = listKho.find(e => e.id == params.data?.id_kho_nguon);
                                    return hangHoa ? `${hangHoa.code} - ${hangHoa.name}` : "";
                                }
                            },
                            {
                                field: "kho_dich",
                                headerName: "Kho đích",
                                valueGetter: (params) => {
                                    const hangHoa = listKho.find(e => e.id == params.data?.id_kho_dich);
                                    return hangHoa ? `${hangHoa.code} - ${hangHoa.name}` : "";
                                }
                            },
                            {
                                field: "nha_cung_cap",
                                headerName: "Nhà cung cấp",
                                valueGetter: (params) => {
                                    const hangHoa = listNhaCungCap.find(e => e.id == params.data?.id_nha_cung_cap);
                                    return hangHoa ? `${hangHoa.code} - ${hangHoa.name}` : "";
                                }
                            },
                            {
                                field: "nhan_vien",
                                headerName: "Nhân viên",
                                valueGetter: (params) => {
                                    const hangHoa = listNhanVien.find(e => e.id == params.data?.id_nhan_vien);
                                    return hangHoa ? `${hangHoa.code} - ${hangHoa.name}` : "";
                                }
                            },
                            {
                                field: "lo",
                                headerName: "Lô",
                                valueGetter: (params) => {
                                    const hangHoa = listLo.find(e => e.id == params.data?.id_lo);
                                    return hangHoa ? `${hangHoa.code} - ${hangHoa.name}` : "";
                                }
                            },
                            {
                                field: "ten_hang_hoa",
                                headerName: "Tên hàng hóa",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.id == params.data?.id_hang_hoa);
                                    return hangHoa ? `${hangHoa.code} - ${hangHoa.name}` : "";
                                }
                            },


                            {
                                field: "dvt",
                                headerName: "Đơn vị tính",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.id == params.data?.id_hang_hoa);
                                    return hangHoa?.dvt || "";
                                }
                            },
                            {
                                field: "so_luong",
                                headerName: "Số lượng",
                            },
                            {
                                field: "gia_ban",
                                headerName: "Giá bán",
                                valueGetter: (params) => {
                                    const hangHoa = listHangHoa.find(e => e.id == params.data?.id_hang_hoa);
                                    const giaNhap = Number(hangHoa?.gia_ban) || 0;
                                    return formatMoney(giaNhap);
                                },
                            },
                            {
                                field: "tong_tien",
                                headerName: "Tổng tiền",
                                valueGetter: (params) => {
                                    const soLuong = Number(params.data?.so_luong) || 0;
                                    const hangHoa = listHangHoa.find(e => e.id == params.data?.id_hang_hoa);
                                    const donGia = Number(hangHoa?.gia_ban) || 0;
                                    return formatMoney(donGia * soLuong);
                                }
                            }

                        ];

                        break;
                }
                setColDefs(columns);
            } catch (error) {
               console.log(error)
            }
        };
        fetchColumn();
    }, [name, open]);

    const defaultColDef = useMemo(() => {
        return {
            editable: false,
            filter: true,
            suppressMenu: true,
            cellStyle: {fontSize: '14.5px'},
            wrapHeaderText: true,
            autoHeaderHeight: true,
            width: 120,
        };
    });


    const [rowData, setRowData] = useState([]);

    const fetchDonHang = async () => {
        try {
            let getDataFunc, getDetailFunc;
            switch (name) {
                case "Đơn hàng":
                    getDataFunc = getAllDonHang;
                    getDetailFunc = getAllDonHangDetailByDonHangId;
                    break;
                case "Đề nghị mua":
                    getDataFunc = getAllDonMuaHang;
                    getDetailFunc = getAllDonMuaHangDetailByDonMuaHangId;
                    break;
                case "Đề nghị thanh toán":
                    getDataFunc = getAllDeNghiThanhToan;
                    getDetailFunc = getDeNghiThanhToanDetailByDeNghiThanhToanIdService;
                    break;
                case "Tạm ứng":
                    getDataFunc = getAllTamUng;
                    getDetailFunc = getDetailTamUngByTamUngIdService;
                    break;
                case "Phiếu chi / UN chi":
                    getDataFunc = getAllPhieuChi2;
                    getDetailFunc = getPhieuChi2Detail;
                    break;
                case "Phiếu thu / Báo có":
                    getDataFunc = getAllPhieuThu
                    getDetailFunc = getDetailPhieuThuByPhieuThuIdService;
                    break;
                case "Nhập kho":
                    getDataFunc = getAllPhieuNhap
                    getDetailFunc = getDetailPhieuNhapDataByPhieuNhapId
                    break;
                case "Xuất kho":
                    getDataFunc = getAllPhieuXuat
                    getDetailFunc = getDetailPhieuXuatDataByPhieuXuatId
                    break;
                case "Hóa đơn":
                    getDataFunc = getAllHoaDon
                    getDetailFunc = getAllHoaDonSanPhamByHoaDonId
                    break;
                case "Điều chuyển kho":
                    const dieuChuyenList = await getAllDieuChuyenKho();
                    const phieuNhapList = await getAllPhieuNhap();

                    const dieuChuyenKhoWithDetails = await Promise.all(
                        dieuChuyenList.map(async (dc) => {
                            const phieuNhapFiltered = phieuNhapList.filter(pn => pn.id_dieu_chuyen_kho == dc.id);
                            if (!phieuNhapFiltered?.length) return [dc];

                            const dieuChuyenKhoWithPhieuNhapDetails = await Promise.all(
                                phieuNhapFiltered.map(async (pn) => {
                                    const details = await getDetailPhieuNhapDataByPhieuNhapId(pn.id);
                                    return details?.data.map(({id, code, ...detail}) => ({
                                        ...dc,
                                        ...detail,
                                    })) || [];
                                })
                            );
                            return dieuChuyenKhoWithPhieuNhapDetails.flat();
                        })
                    );

                    const finalResult = dieuChuyenKhoWithDetails.flat();
                    finalResult.sort((a,b) => b.id - a.id)
                    setRowData(finalResult);
                    break;
                default:
                    setRowData([]);
                    return;
            }
            if (name != 'Điều chuyển kho') {
                const dataList = await getDataFunc();
                const detailsList = await Promise.all(
                    dataList?.map(async (donHang) => {
                        const details = await getDetailFunc(donHang.id);
                        if (!details?.data?.length) return [donHang];

                        return details.data.map(({id, code, ...restDetail}) => ({
                            ...donHang,
                            ...restDetail,
                        }));
                    })
                );
                const mergedList = detailsList.flat();
                mergedList.sort((a,b) => b.id - a.id)
                setRowData(mergedList);
            }
        } catch (error) {
            console.error(`Lỗi khi lấy dữ liệu ${name}:`, error);
        }
    };

    useEffect(() => {
        fetchDonHang();
    }, [name]);

    return (
        <Modal
            title={`Danh sách chi tiết ${name}`}
            open={open}
            onCancel={onClose}
            centered
            width={1200}
            bodyStyle={{height: '80vh', overflowY: 'auto'}}
            footer={null}

        >
            <Row aria-colspan={12}>
                <div className="ag-theme-quartz" style={{height: '650px', width: '100%', marginTop: '40px'}}>
                    <AgGridReact
                        statusBar={statusBar}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        rowData={rowData}
                        enableRangeSelection
                        localeText={AG_GRID_LOCALE_VN}

                    />
                </div>
            </Row>

        </Modal>
    );
}



