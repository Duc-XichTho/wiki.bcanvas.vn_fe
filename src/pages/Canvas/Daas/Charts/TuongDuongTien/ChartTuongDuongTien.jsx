import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import {message, Typography} from "antd";
import { MyContext } from "../../../../../MyContext.jsx";
import { AgCharts } from "ag-charts-react";
// FUNCTION
import ActionChangeFilter from "../../../../Home/AgridTable/actionButton/ActionChangeFilter.jsx";
// API
import { setItemInIndexedDB2 } from "../../../../KeToanQuanTri/storage/storageService.js";
import { getFullDetailPhieuNhapService } from "../../../../../apis/detailPhieuNhapService.jsx";
import { getFullDetailPhieuXuatService } from "../../../../../apis/detailPhieuXuatService.jsx";
import { getAllHangHoa } from "../../../../../apis/hangHoaService.jsx";
import { getAllVas } from "../../../../../apisKTQT/vasService.jsx";
// LOGIC
import { calNhapXuatTon } from "../../../../Home/AgridTable/SoLieu/TonKho/logicTonKho.js";
import { createSectionData, createSeries } from "../../Logic/SetupChart.js";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {getPermissionDataCty} from "../../../getPermissionDataNhomBC.js";
import {CANVAS_DATA_PACK} from "../../../../../CONST.js";
import {KHONG_THE_TRUY_CAP} from "../../../../../Consts/TITLE_HEADER.js";
import ActionSelectCompanyBaoCao from "../../../../KeToanQuanTri/ActionButton/ActionSelectCompanyBaoCao.jsx";


export default function ChartTuongDuongTien() {
    const { companySelect } = useParams();
    const [options, setOptions] = useState([]);
    let { currentYearCanvas } = useContext(MyContext);
    const key = "CHART_TIEN_VA_TUONGDUONGTIEN";
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

    useEffect(()=> {
        fetchAndSetTitleName();
    }, [])

    useEffect(() => {
        loadChart();
        const tableSettings = {
            companySelected: companySelected
        }
        localStorage.setItem(table, JSON.stringify(tableSettings));
    }, [currentYearCanvas, companySelected])


    const loadChart = async () => {

        if (companySelected && companySelected.length > 0) {
            try {
                let VasData = await getAllVas();
                if (companySelected.some(e => e.code != 'HQ')) {
                    VasData = VasData.filter(e => companySelected.some(c => c.code == e.company));
                }
                let filteredData = VasData
                    .filter((e) => companySelect === 'HQ' ? e.consol?.toLowerCase() == 'consol' : e.company === companySelect)
                    .filter((e) => ['111', '112', '128'].some(prefix => e.ma_tai_khoan && e.ma_tai_khoan.startsWith(prefix)))
                    .filter((e) => e.year == currentYearCanvas);

                const groupedData = {
                    '111': filteredData.filter(e => e.ma_tai_khoan && e.ma_tai_khoan.startsWith('111')),
                    '112': filteredData.filter(e => e.ma_tai_khoan && e.ma_tai_khoan.startsWith('112')),
                    '128': filteredData.filter(e => e.ma_tai_khoan && e.ma_tai_khoan.startsWith('128'))
                };

                const summary = Array.from({length: 12}, (_, index) => {
                    const month = index + 1;
                    const monthKey = `t${month}_ending_net`;

                    return {
                        month: `T${month}`,
                        '111': groupedData['111'].reduce((sum, account) => sum + (Number(account[monthKey]) || 0), 0),
                        '112': groupedData['112'].reduce((sum, account) => sum + (Number(account[monthKey]) || 0), 0),
                        '128': groupedData['128'].reduce((sum, account) => sum + (Number(account[monthKey]) || 0), 0)
                    };
                });

                const groups = ['111', '112', '128']

                let series = []

                groups.forEach(group => {
                    const yKey = group;
                    const yName = `Tài khoản bắt đầu với ${group}`;
                    const serie = createSeries('month', yKey, yName, 'area', true, false);
                    series.push(serie);
                })
                const areaChart = createSectionData("C1190 - Tiền và tương đương tiền các tháng", summary, series, "C1190 - Tiền và tương đương tiền các tháng");
                await setItemInIndexedDB2(key, summary);
                setOptions(areaChart);
            } catch (error) {
                console.log(error);
                message.error("Lỗi khi load chart");
            }
        }
    }

    return (
        <div style={{height: '90%'}}>
            {options && <AgCharts style={{ width: '100%', height: '90%' }} options={options}/>}
            <div style={{position: "absolute", top: 30, left: 40}}>
                <ActionSelectCompanyBaoCao options={listCom} handlers={setCompanySelected}
                                           valueSelected={companySelected}/>
            </div>
        </div>
    )
}
