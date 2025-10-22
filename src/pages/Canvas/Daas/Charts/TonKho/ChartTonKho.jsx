import React, { useEffect, useState, useParams, useContext } from "react";
import { message } from "antd";
import { MyContext } from "../../../../../MyContext.jsx";
import { AgCharts } from "ag-charts-react";
import css from './ChartTonKho.module.css'
import { DatePicker, Spin } from "antd";
import dayjs from "dayjs";
// FUNCTION
import ActionChangeFilter from "../../../../Home/AgridTable/actionButton/ActionChangeFilter.jsx";
// API
import { setItemInIndexedDB2 } from "../../../../KeToanQuanTri/storage/storageService";
import { getFullDetailPhieuNhapService } from "../../../../../apis/detailPhieuNhapService";
import { getFullDetailPhieuXuatService } from "../../../../../apis/detailPhieuXuatService";
import { getAllHangHoa } from "../../../../../apis/hangHoaService.jsx";
// LOGIC
import { calNhapXuatTon } from "../../../../Home/AgridTable/SoLieu/TonKho/logicTonKho.js";
import { createSectionData } from "../../Logic/SetupChart.js";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {getPermissionDataCty} from "../../../getPermissionDataNhomBC.js";
import {CANVAS_DATA_PACK} from "../../../../../CONST.js";
import {KHONG_THE_TRUY_CAP} from "../../../../../Consts/TITLE_HEADER.js";
import ActionSelectCompanyBaoCao from "../../../../KeToanQuanTri/ActionButton/ActionSelectCompanyBaoCao.jsx";

const { RangePicker } = DatePicker;

export default function ChartTonKho() {
    const [options, setOptions] = useState([]);
    const key = "CHART_TONKHO";
    const [dateRange, setDateRange] = useState([null, null]);

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

    const [isStatusFilter, setIsStatusFilter] = useState(getLocalStorageSettings().isStatusFilter);

    useEffect(() => {
        const today = new Date();
        const fortyFiveDaysAgo = new Date();
        fortyFiveDaysAgo.setDate(today.getDate() - 45);

        const formattedToday = today.toISOString().split('T')[0];
        const formattedFortyFiveDaysAgo = fortyFiveDaysAgo.toISOString().split('T')[0];

        setDateRange([formattedFortyFiveDaysAgo, formattedToday]);
    }, []);

    const handleDateChange = (dates) => {
        if (dates) {
            setDateRange(dates);
        }
    };

    useEffect(() => {
        loadChart(dateRange[0], dateRange[1]);
        const tableSettings = {
            companySelected: companySelected
        }
        localStorage.setItem(table, JSON.stringify(tableSettings));
    }, [dateRange, companySelected])

    const loadChart = async (startDate, endDate) => {

        if (companySelected && companySelected.length > 0) {
            try {
                let nhap = await getFullDetailPhieuNhapService();
                let xuat = await getFullDetailPhieuXuatService();
                let hangHoa = await getAllHangHoa();
                if (companySelected.some(e => e.code != 'HQ')) {
                    nhap = nhap.filter(e => companySelected.some(c => c.code == e.company));
                    xuat = xuat.filter(e => companySelected.some(c => c.code == e.company));
                    hangHoa = hangHoa.filter(e => companySelected.some(c => c.code == e.company));
                }
                const result = calNhapXuatTon(nhap, xuat, startDate, endDate);
                const allowedTkGiaVon = ['152', '153', '154', '155', '156'];
                const filteredResult = result?.map(item => {
                    const matchingHangHoa = hangHoa.find(hh => hh.code === item.code);
                    return {
                        ...item,
                        tk_hang_ton: matchingHangHoa ? matchingHangHoa.tk_hang_ton : null
                    };
                }).filter(item => item.tk_hang_ton && allowedTkGiaVon.includes(item.tk_hang_ton));
                const summary = [
                    // {
                    //     type: "Số lượng",
                    //     "152": 0,
                    //     "153": 0,
                    //     "154": 0,
                    //     "155": 0,
                    //     "156": 0
                    // },
                    // {
                    //     type: "Đơn giá",
                    //     "152": 0,
                    //     "153": 0,
                    //     "154": 0,
                    //     "155": 0,
                    //     "156": 0
                    // },
                    {
                        type: "Giá trị",
                        "152": 0,
                        "153": 0,
                        "154": 0,
                        "155": 0,
                        "156": 0
                    }
                ];

                filteredResult?.forEach(item => {
                    const tk = item.tk_hang_ton;
                    // summary[0][tk] = summary[0][tk] + (item.SoLuongTonCuoiKy || 0);
                    // summary[1][tk] = summary[1][tk]+(item.DonGiaTonCuoiKy || 0);
                    summary[0][tk] = summary[0][tk] + (item.GiaTriTonCuoiKy || 0);
                });
                let sectionData = createSectionData(
                    "C1240 - Tồn kho",
                    summary,
                    [{
                        type: "bar",
                        xKey: "type",
                        yKey: "152",
                        yName: "Tài khoản 152",
                        stacked: true,
                        tooltip: {
                            renderer: (params) => {
                                return {
                                    content: ` ${new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND',
                                        maximumFractionDigits: 0,
                                    }).format(params.datum[params.yKey])}`,
                                };
                            },
                        },
                        interpolation: {
                            type: 'smooth',
                        },
                        strokeWidth: 1,
                    },
                        {
                            type: "bar",
                            xKey: "type",
                            yKey: "153",
                            yName: "Tài khoản 153",
                            stacked: true,
                            tooltip: {
                                renderer: (params) => {
                                    return {
                                        content: ` ${new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND',
                                            maximumFractionDigits: 0,
                                        }).format(params.datum[params.yKey])}`,
                                    };
                                },
                            },
                            interpolation: {
                                type: 'smooth',
                            },
                            strokeWidth: 1,
                        },
                        {
                            type: "bar",
                            xKey: "type",
                            yKey: "154",
                            yName: "Tài khoản 154",
                            stacked: true,
                            tooltip: {
                                renderer: (params) => {
                                    return {
                                        content: ` ${new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND',
                                            maximumFractionDigits: 0,
                                        }).format(params.datum[params.yKey])}`,
                                    };
                                },
                            },
                            interpolation: {
                                type: 'smooth',
                            },
                            strokeWidth: 1,
                        },
                        {
                            type: "bar",
                            xKey: "type",
                            yKey: "155",
                            yName: "Tài khoản 155",
                            stacked: true,
                            tooltip: {
                                renderer: (params) => {
                                    return {
                                        content: ` ${new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND',
                                            maximumFractionDigits: 0,
                                        }).format(params.datum[params.yKey])}`,
                                    };
                                },
                            },
                            interpolation: {
                                type: 'smooth',
                            },
                            strokeWidth: 1,
                        },
                        {
                            type: "bar",
                            xKey: "type",
                            yKey: "156",
                            yName: "Tài khoản 156",
                            stacked: true,
                            tooltip: {
                                renderer: (params) => {
                                    return {
                                        content: ` ${new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND',
                                            maximumFractionDigits: 0,
                                        }).format(params.datum[params.yKey])}`,
                                    };
                                },
                            },
                            interpolation: {
                                type: 'smooth',
                            },
                            strokeWidth: 1,
                        }],
                    "C1240 - Tồn kho"
                )
                await setItemInIndexedDB2(key, summary);
                setOptions(sectionData);
            } catch (error) {
                console.log(error);
                // message.error("Lỗi khi load chart");
            }
        }
    }

    const handleChangeStatusFilter = () => {
        setIsStatusFilter(!isStatusFilter);
    };

    return (
        <div>
            {/*<div className={css.headerAction}>*/}
            {/*    <div className={css.pickDate}>*/}
            {/*        Chọn kỳ*/}
            {/*        <RangePicker*/}
            {/*            size={'middle'}*/}
            {/*            format={'DD/MM/YYYY'}*/}
            {/*            value={dateRange.map(date => (date ? dayjs(date) : null))}*/}
            {/*            onChange={handleDateChange}*/}
            {/*        />*/}
            {/*    </div>*/}

            {/*    <ActionChangeFilter isStatusFilter={isStatusFilter}*/}
            {/*        handleChangeStatusFilter={handleChangeStatusFilter} />*/}

            {/*</div>*/}
            {options && <AgCharts style={{ width: '100%', height: '90%' }} options={options}/>}
            <div style={{position: "absolute", top: 30, left: 40}}>
                <ActionSelectCompanyBaoCao options={listCom} handlers={setCompanySelected}
                                           valueSelected={companySelected}/>
            </div>
        </div>
    )
}
