import React, {useContext, useEffect, useState} from "react";
import {message, Typography} from "antd";
import {MyContext} from "../../../../../MyContext";
import {AgCharts} from "ag-charts-react";
// LOGIC
// CHART FUNCTION
import {createSectionData, createSeries} from '../../Logic/SetupChart';
import {calculateValueTotalYear} from "../../../../KeToanQuanTri/BaoCao/logic/logicActual";
import {calSupAndT0, mergeDataByHeader,} from '../../../../KeToanQuanTri/BaoCao/Plan2/logicPlan2';
import {convertToArrayForSection1, filterGroup, sumColumns,} from "../../../../KeToanQuanTri/BaoCao/KQKD/setUpSection";
// API
import {getAllPlan} from "../../../../../apisKTQT/planService";
import {getAllKmf} from "../../../../../apisKTQT/kmfService";
import {setItemInIndexedDB2} from "../../../../KeToanQuanTri/storage/storageService";
import {useParams} from "react-router-dom";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {getPermissionDataCty} from "../../../getPermissionDataNhomBC.js";
import {CANVAS_DATA_PACK} from "../../../../../CONST.js";
import {KHONG_THE_TRUY_CAP} from "../../../../../Consts/TITLE_HEADER.js";
import ActionSelectCompanyBaoCao from "../../../../KeToanQuanTri/ActionButton/ActionSelectCompanyBaoCao.jsx";
import VasDataPopup from "../../../../KeToanQuanTri/popUp/cellAction/VasDataPopUp.jsx";

export default function TienThuTrongKy() {
    let {tabSelect, companySelect} = useParams();
    let {loadDataSoKeToan, currentYearCanvas, currentMonthCanvas} = useContext(MyContext);
    const [options, setOptions] = useState([]);
    const key = "CHART_TIENTHUTRONGKY";
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
                let data_for_chart_stack_TT = []
                let data = await loadDataSoKeToan();
                if (companySelected.some(e => e.code != 'HQ')) {
                    data = data.filter(e => companySelected.some(c => c.code == e.company));
                }
                data.filter(e => e.year == currentYearCanvas).map((item) => {
                    for (let i = 1; i <= currentMonthCanvas; i++) {
                        if (item.month == i && item.cash_value >= 0 && item.cash_value) {
                            if (!data_for_chart_stack_TT[i - 1]) {
                                data_for_chart_stack_TT[i - 1] = {month: i, soTien: 0}
                            } else {
                                data_for_chart_stack_TT[i - 1].soTien += parseFloat(item.cash_value)
                            }
                        }
                    }
                })

                let seriesArr = [{
                    type: 'bar',
                    xKey: 'month',
                    yKey: 'soTien',
                    yName: 'Tiền thu',
                    stackGroup: 'COL1',
                }];
                let doanhThuTong = createSectionData('C1060 - Tiền thu trong kỳ', data_for_chart_stack_TT, seriesArr, 'C1060 - Tiền thu trong kỳ')
                await setItemInIndexedDB2(key, data_for_chart_stack_TT);
                setOptions(doanhThuTong)
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
};
