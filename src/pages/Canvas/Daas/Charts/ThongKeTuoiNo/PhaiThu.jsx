import React, { useEffect, useState, useParams, useContext } from "react";
import { message } from "antd";
import { MyContext } from "../../../../../MyContext.jsx";
import { AgCharts } from "ag-charts-react";
import moment from "moment";
import { LIST_TD_TKKT } from "../../../../../Consts/LIST_TD_TKKT.js";
// CHART
import { createSeriesPie, createSectionData } from "../../Logic/SetupChart.js";
// API
import { getAllKhachHang } from "../../../../../apis/khachHangService.jsx";
import { getAllSoKeToan } from "../../../../../apisKTQT/soketoanService.jsx";
import { getAllKhaiBaoDauKy } from "../../../../../apis/khaiBaoDauKyService.jsx";
import { getAllHoaDon } from "../../../../../apis/hoaDonService.jsx";
import { setItemInIndexedDB2 } from "../../../../KeToanQuanTri/storage/storageService.js";
// LOGIC
import { logicListT, calSTKDT2 } from "../../../../Home/AgridTable/SoLieu/CDPS/logicCDPS.js";
import { createSDT2 } from "../../../../Home/AgridTable/SoLieu/SoTaiKhoanDT/logicSDT.js";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {getPermissionDataCty} from "../../../getPermissionDataNhomBC.js";
import {CANVAS_DATA_PACK} from "../../../../../CONST.js";
import {KHONG_THE_TRUY_CAP} from "../../../../../Consts/TITLE_HEADER.js";
import ActionSelectCompanyBaoCao from "../../../../KeToanQuanTri/ActionButton/ActionSelectCompanyBaoCao.jsx";

export default function ChartTuoiNoPhaiThu() {
    let { loadDataSoKeToan, currentYearCanvas, currentMonthCanvas } = useContext(MyContext);
    const [options, setOptions] = useState([]);
    const key = "TUOINO_PHAITHU_CHART";
    const selectedTD = "TD_HoaDon";
    const selectedTD2 = "TD_HoaDon"
    const table = key+ "_COMPANY";
    const getLocalStorageSettings = () => {
        const storedSettings = JSON.parse(localStorage.getItem(table));
        return {
            companySelected: storedSettings?.companySelected ?? [],
        };
    };

    const [titleName, setTitleName] = useState('');
    const [listCom, setListCom] = useState([])
    const [companySelected, setCompanySelected] = useState(getLocalStorageSettings().companySelected || [])
    const {
        userClasses,
        fetchUserClasses,
        uCSelected_CANVAS,
    } = useContext(MyContext) || {};

    const fetchAndSetTitleName = async () => {
        try {
            const user = await getCurrentUserLogin();
            const listComs = await getPermissionDataCty('cty', user, userClasses, fetchUserClasses, uCSelected_CANVAS)
            if (listComs?.length > 0 || user.data.isAdmin || listComs.some(e => e.code == 'HQ')) {
                setListCom(listComs);
                setTitleName(CANVAS_DATA_PACK.find(e => e.value == key)?.name)
            } else {
                setTitleName(KHONG_THE_TRUY_CAP)
            }

        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu:', error);
        }
    };

    useEffect(() => {
        fetchAndSetTitleName();
    }, [])

    useEffect(() => {
        loadChart();
        const tableSettings = {
            companySelected: companySelected
        }
        localStorage.setItem(table, JSON.stringify(tableSettings));
    }, [currentYearCanvas, currentMonthCanvas, companySelected])

    const loadChart = async () => {
        if (companySelected && companySelected.length > 0) {
            try {
                const selectedTK = "1311";
                let khachHangData = await getAllKhachHang();
                let listSKT = await getAllSoKeToan();
                let listDauKy = await getAllKhaiBaoDauKy();

                if (companySelected.some(e => e.code != 'HQ')) {
                    khachHangData = khachHangData.filter(e => companySelected.some(c => c.code == e.company));
                    listSKT = listSKT.filter(e => companySelected.some(c => c.code == e.company));
                    listDauKy = listDauKy.filter(e => companySelected.some(c => c.code == e.company));
                }
                if (khachHangData.length <= 0 || listDauKy.length <= 0 ) return;
                const khachHangMapping = khachHangData.reduce((acc, khachHang) => {
                    acc[khachHang.id] = khachHang;
                    return acc;
                }, {});
                let sktT = logicListT(listSKT);
                let listSTKDT = []
                let rowDataList = []
                sktT = sktT.filter(item => item.tkkt == selectedTK);
                if (selectedTD) {
                    let dt = LIST_TD_TKKT.find(item => item.field == selectedTD);
                    let sktT1 = sktT.filter(item => item[dt.fieldSKT] && item[dt.fieldSKT] !== '');
                    let listDauKy1 = listDauKy.filter(item => item[selectedTD] && item[selectedTD] !== '');
                    listSTKDT = calSTKDT2(sktT1, JSON.parse(JSON.stringify(listDauKy1)), selectedTD, dt.fieldSKT, 1, 12, selectedTK);
                    if (selectedTD2) {
                        let dt2 = LIST_TD_TKKT.find(item => item.field == selectedTD2);
                        let sktT2 = sktT.filter(item => item[dt2.fieldSKT] && item[dt2.fieldSKT] !== '');
                        let listDauKy2 = listDauKy.filter(item => item[selectedTD] && item[selectedTD] !== '');
                        let listSTKDT2 = calSTKDT2(sktT2, JSON.parse(JSON.stringify(listDauKy2)), selectedTD2, dt2.fieldSKT, 1, 12, selectedTK);
                        rowDataList = createSDT2(listSTKDT, listSTKDT2, selectedTD, selectedTD2, listDauKy);
                    }
                }
                const type = 'co';
                rowDataList = rowDataList.filter(item =>
                    item[type] != null &&
                    item[type] != 0 &&
                    !item.id
                );
                const currentDate = moment();
                let hoaDonData = await getAllHoaDon();
                hoaDonData = hoaDonData.filter(item => item.type == 'dau_vao');
                const processedData = hoaDonData.map(item => {
                    const KHData = khachHangMapping[item.id_khach_hang];
                    item.so_tien_phai_thu = item.tong_gia_tri;
                    const matchingRow = rowDataList.find(row => row.doiTuong === item.code);
                    if (matchingRow) {
                        item.so_tien_da_thu = matchingRow.co;
                    } else {
                        item.so_tien_da_thu = 0;
                    }
                    const term = KHData.dieu_khoan_tt === null ? 45 : KHData.dieu_khoan_tt;
                    const ngay_den_han = moment(item.date).add(term, 'days').format('YYYY-MM-DD');
                    const ngayDenHanMoment = moment(ngay_den_han, 'YYYY-MM-DD');
                    const diffInDays = ngayDenHanMoment.diff(currentDate, 'days');
                    const remainPaid = item.so_tien_phai_thu - item.so_tien_da_thu;
                    if (remainPaid > 0) {
                        if (diffInDays >= 3) {
                            item.no_trong_han = remainPaid
                        } else if (diffInDays >= 0) {
                            item.sap_toi_han = remainPaid
                        } else if (diffInDays >= -7) {
                            item.qua_han_7 = remainPaid
                        } else if (diffInDays >= -30) {
                            item.qua_han_30 = remainPaid
                        } else if (diffInDays >= -60) {
                            item.qua_han_60 = remainPaid
                        } else {
                            item.qua_han_over = remainPaid
                        }
                    }
                    item.so_tien_phai_thu = item.so_tien_phai_thu * 1
                    return {
                        ...item,
                        term,
                        ngay_den_han,
                        khachHang: khachHangMapping[item.id_khach_hang] || null,
                    };
                });
                const paymentStatusData = aggregatePaymentStatus(processedData);
                const pieChartSeries = createSeriesPie("amount", "asset")
                const options = createSectionData('C1220 - Giá trị phải thu theo các ngày trong hạn/ đáo hạn', paymentStatusData, [pieChartSeries], "C1220 - Giá trị phải thu theo các ngày trong hạn/ đáo hạn")
                await setItemInIndexedDB2(key, paymentStatusData);
                setOptions(options)
            } catch (error) {
                console.log(error);
                message.error("Lỗi khi load chart");
            }
        }
    }

    const aggregatePaymentStatus = (processedData) => {
        const sums = {
            no_trong_han: 0,
            sap_toi_han: 0,
            qua_han_7: 0,
            qua_han_30: 0,
            qua_han_60: 0,
            qua_han_over: 0
        };

        processedData.forEach(item => {
            Object.keys(sums).forEach(key => {
                sums[key] += item[key] || 0;
            });
        });

        return [
            { asset: "Nợ trong hạn", amount: sums.no_trong_han },
            { asset: "Sắp tới hạn", amount: sums.sap_toi_han },
            { asset: "Quá hạn 1-7 ngày", amount: sums.qua_han_7 },
            { asset: "Quá hạn 7-30 ngày", amount: sums.qua_han_30 },
            { asset: "Quá hạn 30-60 ngày", amount: sums.qua_han_60 },
            { asset: "Quá hạn > 60 ngày", amount: sums.qua_han_over }
        ];
    };

    return (
        <div style={{height: '90%'}}>
            {options && <AgCharts style={{ width: '100%', height: '90%' }} options={options}/>}
            <div style={{position: "absolute", top: 30, left: 40}}>
                <ActionSelectCompanyBaoCao options={listCom} handlers={setCompanySelected}
                                           valueSelected={companySelected}/>
            </div>
        </div>
    );
}
