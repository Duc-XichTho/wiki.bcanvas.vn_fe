import React, {useEffect, useState, useContext} from 'react';
import {useParams} from "react-router-dom";
import {message, Typography} from "antd";
import {MyContext} from "../../../../../MyContext.jsx";
import {AgCharts} from "ag-charts-react";
// API
import {setItemInIndexedDB2} from "../../../../KeToanQuanTri/storage/storageService.js";
import {getFullDetailPhieuNhapService} from "../../../../../apis/detailPhieuNhapService.jsx";
import {getFullDetailPhieuXuatService} from "../../../../../apis/detailPhieuXuatService.jsx";
import {getAllHangHoa} from "../../../../../apis/hangHoaService.jsx";
import {getAllVas} from "../../../../../apisKTQT/vasService.jsx";
// LOGIC
import {calNhapXuatTon} from "../../../../Home/AgridTable/SoLieu/TonKho/logicTonKho.js";
import {createSectionData, createSeries} from "../../Logic/SetupChart.js";
import {loadBCCCTC} from '../../../../KeToanQuanTri/BaoCao/CDTC/logicBCCDTC.js';
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {getPermissionDataCty} from "../../../getPermissionDataNhomBC.js";
import {CANVAS_DATA_PACK} from "../../../../../CONST.js";
import {KHONG_THE_TRUY_CAP} from "../../../../../Consts/TITLE_HEADER.js";
import ActionSelectCompanyBaoCao from "../../../../KeToanQuanTri/ActionButton/ActionSelectCompanyBaoCao.jsx";

export default function ChartCanDoiTaiChinh() {
    let {tabSelect, companySelect} = useParams();
    const [options, setOptions] = useState([]);
    let {loadDataSoKeToan, currentMonthCanvas, currentYearCanvas} = useContext(MyContext);
    const key = "CHART_CANDOITAICHINH";
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
                if (tabSelect == 'daas') {
                    currentMonthCanvas = 12;
                }
                let data = await getAllVas();
                data = data.filter(e => e.year == currentYearCanvas)
                if (companySelected.some(e => e.code != 'HQ')) {
                    data = data.filter(e => companySelected.some(c => c.code == e.company));
                }
                let data_for_chart_stack_CDTC = [];
                let dataCDTC = loadBCCCTC(data, currentMonthCanvas);
                data_for_chart_stack_CDTC = Array.from({
                    length: currentMonthCanvas
                }, (_, index) => ({
                    month: `T${index + 1}`,
                    pl_TSNH: 0,
                    pl_TSDH: 0,
                    pl_NGH: 0,
                    pl_NDH: 0,
                    pl_VCSH: 0,
                }));
                dataCDTC.forEach((item) => {
                    for (let i = 1; i <= currentMonthCanvas; i++) {
                        const key = `t${i}_tien`;
                        if (item.header === 'Tài sản ngắn hạn') {
                            data_for_chart_stack_CDTC[i - 1].pl_TSNH = parseFloat(item[key]) || 0;
                        } else if (item.header === 'Tài sản dài hạn') {
                            data_for_chart_stack_CDTC[i - 1].pl_TSDH = parseFloat(item[key]) || 0;
                        } else if (item.header === 'Nợ ngắn hạn') {
                            data_for_chart_stack_CDTC[i - 1].pl_NGH = parseFloat(item[key]) || 0;
                        } else if (item.header === 'Nợ dài hạn') {
                            data_for_chart_stack_CDTC[i - 1].pl_NDH = parseFloat(item[key]) || 0;
                        } else if (item.header === 'Vốn chủ sở hữu') {
                            data_for_chart_stack_CDTC[i - 1].pl_VCSH = parseFloat(item[key]) || 0;
                        }
                    }
                });
                let cdtc = createSectionData('C18- Cân đối tài chính', data_for_chart_stack_CDTC,
                    [{
                        type: 'bar',
                        xKey: 'month',
                        yKey: 'pl_TSNH',
                        yName: 'Tài sản ngắn hạn',
                        stackGroup: 'COL1',
                    },
                        {
                            type: 'bar',
                            xKey: 'month',
                            yKey: 'pl_TSDH',
                            yName: 'Tài sản dài hạn',
                            stackGroup: 'COL1',
                        }, {
                        type: 'bar',
                        xKey: 'month',
                        yKey: 'pl_NGH',
                        yName: 'Nợ ngắn hạn',
                        stackGroup: 'COL2',
                    }, {
                        type: 'bar',
                        xKey: 'month',
                        yKey: 'pl_NDH',
                        yName: 'Nợ dài hạn',
                        stackGroup: 'COL2',
                    }, {
                        type: 'bar',
                        xKey: 'month',
                        yKey: 'pl_VCSH',
                        yName: 'VCSH',
                        stackGroup: 'COL2',
                    },
                    ], 'C18- Cân đối tài chính');
                await setItemInIndexedDB2(key, data_for_chart_stack_CDTC);
                setOptions(cdtc);
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
    );
}
