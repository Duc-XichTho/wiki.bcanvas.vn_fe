import '../../../index.css';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';

import {getAllVas} from '../../../apisKTQT/vasService.jsx';
import {getAllKmf} from '../../../apisKTQT/kmfService.jsx';
import {AgCharts} from "ag-charts-react";
import "ag-charts-enterprise";
import {MyContext} from "../../../MyContext.jsx";
import HsfsVas from "./HsfsVas.jsx";
import HsfsSKT from "./HsfsSKT.jsx";
import {loadBCCCTC} from "./CDTC/logicBCCDTC.js";
import {getNoteChartData, updateNoteChart} from "../../../apis/noteChartService.jsx";
import {toast} from "react-toastify";
import TooltipIconForHSFS from "../HeaderTooltip/TooltipIconForHSFS.jsx";
import AG_GRID_LOCALE_VN from "../../Home/AgridTable/locale.jsx";
import {formatCurrency} from "../functionKTQT/formatMoney.js";
import {onFilterTextBoxChanged} from "../../../generalFunction/quickFilter.js";
import Loading from '../../Loading/Loading.jsx';

export default function HSFS({ company }) {
    const table = 'HSFS';
    const { currentMonthKTQT, currentYearKTQT ,  loadDataSoKeToan } = useContext(MyContext)
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFullView, setIsFullView] = useState(false);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dataHSFS, setDataHSFS] = useState([])
    const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);
    const [listNoteChart, setListNoteChart] = useState([]);
    const [noteContent, setNoteContent] = useState('');
    const [noteId, setNoteId] = useState();
    const textAreaRef = useRef(null);

    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };
    const dropdownRef = useRef(null);
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsDropdownOpen(false);
        }
    };
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [noteContent]);
    const getNoteForChart = () => {
        if (Array.isArray(listNoteChart)) {
            const note = listNoteChart.find(note => note.chartTitle == table);
            setNoteId(note?.id);
            return note?.content;
        } else {
            return 'Dữ liệu biểu đồ không hợp lệ';
        }
    };
    useEffect(() => {
        getNoteChartData(table).then((data) => {
            setListNoteChart(data)
        })
    }, []);

    useEffect(() => {
        setNoteContent(getNoteForChart());
    }, [listNoteChart])
        ;
    const updateNoteForChart = async (e) => {
        try {
            const inputValue = e.target.value;
            setNoteContent(inputValue);
            const updatedNote = {
                content: inputValue,
            };
            await updateNoteChart(noteId, updatedNote);
        } catch (e) {
            toast.error('Lỗi khi update');
        }

    }
    const defaultColDef = useMemo(
        () => ({
            editable: false,
            filter: true,
            cellStyle: {
                fontSize: '14.5px',
                color: 'var(--text-color)',
                fontFamily: 'var(--font-family)',
            },
            resizeable: true,
        }),
        []
    );
    const [options, setOptions] = useState({
        data: [],
        title: {
            text: "",
        },
        series: [
            {
                type: "radar-area",
                angleKey: "header",
                radiusKey: "so",
                radiusName: "Đánh giá",
                label: {
                    formatter: (params) => {
                        const value = params.value;
                        return value === 1 ? 'Thấp' : value === 2 ? 'TB' : 'Cao';
                    }
                }
            }
        ],
        axes: [
            {
                type: "angle-category",
                shape: "circle",
            },
            {
                type: 'radius-number',
                shape: "circle",
                min: 0,
                max: 4,
                label: {
                    formatter: (params) => {
                        return '';
                    }
                },
            },
        ],
        height: 600, // Chiều cao lớn hơn
        width: 700,
        theme: "ag-vivid",
    });
    const onGridReady = useCallback(async () => {
        loadData();
    }, [company]);

    function createColumn({ field, headerName, width, hide = false, isDauKi = false, additionalProps = {} }) {
        return {
            field,
            headerName,
            valueFormatter: (params) => {
                if (params.value !== null && params.value !== undefined) {
                    if (params?.data?.refercode?.startsWith('4') || params?.data?.refercode?.startsWith('6')) {
                        return `${(params.value.toFixed(2) * 100).toFixed(0)}%`;
                    }
                    if (params?.data?.header === 'Giá trị sổ sách / 1 cổ phần') {
                        return `${formatCurrency(params.value)}`;
                    }
                    return params.value.toFixed(2);
                }
                return '';
            },
            headerClass: 'right-align-important',
            width,
            cellStyle : (params) => { return {...isBold(params), textAlign: 'right'}},
            hide,
            ...additionalProps,
        };
    }

    function isBold(params) {
        const isBold = params.data.refercode.toString()?.includes('.');
        return {
            textAlign: 'left', paddingRight: 10,
        };
    }

    const getColumnDefs = () => {
        let cols = [
            { field: 'id', headerName: 'ID', hide: true },
            {
                field: 'header', headerName: 'Nhóm chỉ số', width: 300, pinned: 'left',
                cellStyle: isBold,
                cellRenderer: ((params) => {
                    return (
                        <TooltipIconForHSFS {...params} />
                    );
                }),

            },
            createColumn({ field: 'quy1', headerName: 'Quý 1', width: 65, hide: currentMonthKTQT < 3 }),
            createColumn({ field: 'quy2', headerName: 'Quý 2', width: 65, hide: currentMonthKTQT < 6 }),
            createColumn({ field: 'quy3', headerName: 'Quý 3', width: 65, hide: currentMonthKTQT < 9 }),
            createColumn({ field: 'quy4', headerName: 'Quý 4', width: 65, hide: currentMonthKTQT < 12 }),
            createColumn({field: 'dauki', headerName: `${currentYearKTQT} YTM`, width: 90, hide: false, isDauKi: true,}),
            {
                field: 'thamchieu',
                headerName: 'Tham chiếu',
                headerClass: 'right-align-important',
                valueFormatter: (params) => {
                    if (params.value) {
                        if (params?.data?.header === 'Tỷ suất lãi gộp' || params?.data?.header === 'Tỷ suất lãi ròng') {
                            let value = params?.value?.split('-')
                            return `${value[0] * 100}%-${value[1] * 100}%`
                        }
                        return params.value;
                    }
                },
                width: 100,
                cellStyle : (params) => { return {...isBold(params), textAlign: 'right'}},
            },
            {
                field: 'danhgia',
                headerName: 'Đánh giá',
                headerClass: 'right-align-important',
                width: 100,
                cellStyle : (params) => { return {...isBold(params), textAlign: 'right'}},
            }
        ];
        return cols;
    };

    function calculateTotalByField(list, field) {
        return list.reduce((total, item) => {
            let value = parseInt(item[field]) || 0;
            return total + value;
        }, 0);
    }

    function filterBetweenLists(listA, listB, code) {
        return listA.filter(itemA =>
            listB.some(itemB =>
                itemA.kmf === itemB.name && itemB.code === code
            )
        );
    }

    function calculateHS(soKeToanList, vasList, kmfList, startMonth, endMonth, isYTM) {
        if (!startMonth) {
            startMonth = 0;
        }
        let dauKy = `t${startMonth}_tien`;
        let cuoiKy = `t${endMonth}_tien`;
        let tienList = vasList.filter(e =>
            ['M111', 'M112'].includes(e?.code)
        );
        let noNganHanList = vasList.filter(e => e?.header === 'Nợ ngắn hạn');
        let taiSanNganHanList = vasList.filter(e => e?.header === 'Tài sản ngắn hạn');
        let nganHanList = [...noNganHanList, ...taiSanNganHanList];
        let noDaiHanList = vasList.filter(e => e?.header === 'Nợ dài hạn');
        let taiSanDaiHanList = vasList.filter(e => e?.header === 'Tài sản dài hạn');

        let tienDauKi = calculateTotalByField(tienList, dauKy);
        let tienCuoiKi = calculateTotalByField(tienList, cuoiKy);
        let noNHDauKi = calculateTotalByField(noNganHanList, dauKy);
        let noNHCuoiKi = calculateTotalByField(noNganHanList, cuoiKy);
        let tsNHDauKi = calculateTotalByField(taiSanNganHanList, dauKy);
        let tsNHCuoiKi = calculateTotalByField(taiSanNganHanList, cuoiKy);

        let noDHDauKi = calculateTotalByField(noDaiHanList, dauKy);
        let noDHCuoiKi = calculateTotalByField(noDaiHanList, cuoiKy);
        let tsDHDauKi = calculateTotalByField(taiSanDaiHanList, dauKy);
        let tsDHCuoiKi = calculateTotalByField(taiSanDaiHanList, cuoiKy);

        let noDauKi = calculateTotalByField([...noNganHanList, ...noDaiHanList], dauKy);
        let noCuoiKi = calculateTotalByField([...noNganHanList, ...noDaiHanList], cuoiKy);
        let tsDauKi = calculateTotalByField([...taiSanNganHanList, ...taiSanDaiHanList], dauKy);
        let tsCuoiKi = calculateTotalByField([...taiSanNganHanList, ...taiSanDaiHanList], cuoiKy);

        let congNoPhaiThuList = vasList.filter(e =>
            ['M131', 'M137', 'M132', 'M1552'].includes(e?.code)
        );
        let congNoPhaiTraList = vasList.filter(e =>
            ['M311', 'M312', 'M313', 'M314', 'M3151'].includes(e?.code)
        );
        let congNoPhaiThuDau = calculateTotalByField(congNoPhaiThuList, dauKy);
        let congNoPhaiThuCuoi = calculateTotalByField(congNoPhaiThuList, cuoiKy);
        let congNoPhaiTraDau = calculateTotalByField(congNoPhaiTraList, dauKy);
        let congNoPhaiTraCuoi = calculateTotalByField(congNoPhaiTraList, cuoiKy);


        // VCSH
        let vas4List = vasList.filter(e => e?.header?.startsWith('Vốn chủ sở hữu'));
        let giaTriVas4DauKi = calculateTotalByField(vas4List, dauKy);
        let giaTriVas4 = calculateTotalByField(vas4List, cuoiKy);

        // VDL
        let vas4111List = vasList.filter(e => e?.code?.startsWith('M4111'));
        let giaTriVas4444DauKi = calculateTotalByField(vas4111List, dauKy);
        let giaTriVas4444 = calculateTotalByField(vas4111List, cuoiKy);

        soKeToanList = soKeToanList.filter((e) => (parseInt(e.month) > startMonth && parseInt(e.month) <= endMonth));
        let doanhThuList = soKeToanList.filter(e => e.pl_type === 'DT');
        let doanhThuLuyKe = calculateTotalByField(doanhThuList, 'pl_value');
        let cfList = soKeToanList.filter(e => e?.pl_type?.startsWith('CF') || e?.pl_type === 'GV');
        let cfLuyKe = calculateTotalByField(cfList, 'pl_value');
        let HSAnnualized = endMonth;
        if (!isYTM) {
            HSAnnualized = 3;
        }
        let doanhThuAnnualized = (doanhThuLuyKe * 12 / HSAnnualized);
        let cfAnnualized = -(cfLuyKe * 12 / HSAnnualized);

        let netProfitList = soKeToanList.filter(e => e.pl_type !== null && e.pl_type !== '');
        let netProfit = calculateTotalByField(netProfitList, 'pl_value');

        let giaVonList = soKeToanList.filter(e => e.pl_type === 'GV');
        let giaVonLuyKe = calculateTotalByField(giaVonList, 'pl_value');

        let chiPhiBanHangList = soKeToanList.filter(e => e.pl_type === 'CFBH');
        let chiPhiBanHangLuyKe = calculateTotalByField(chiPhiBanHangList, 'pl_value');

        let chiPhiQuanLyList = soKeToanList.filter(e => e.pl_type === 'CFQL');
        let chiPhiQuanLyLuyKe = calculateTotalByField(chiPhiQuanLyList, 'pl_value');

        let KHList = filterBetweenLists(soKeToanList, kmfList, 'KH');
        let KH = calculateTotalByField(KHList, 'pl_value');

        let VCList = filterBetweenLists(soKeToanList, kmfList, 'VC');
        let VC = calculateTotalByField(VCList, 'pl_value');

        let FCList = filterBetweenLists(soKeToanList, kmfList, 'FC');
        let FC = calculateTotalByField(FCList, 'pl_value');

        return {
            tienDauKi, tienCuoiKi,
            congNoPhaiThuDau,
            congNoPhaiThuCuoi,
            noNHDauKi,
            noNHCuoiKi,
            tsNHDauKi,
            tsNHCuoiKi,
            noDHDauKi,
            noDHCuoiKi,
            tsDHDauKi,
            tsDHCuoiKi,
            noDauKi,
            noCuoiKi,
            tsDauKi,
            tsCuoiKi,
            congNoPhaiTraDau,
            congNoPhaiTraCuoi,
            cfAnnualized,
            netProfit,
            doanhThuAnnualized,
            doanhThuLuyKe,
            giaVonLuyKe,
            chiPhiBanHangLuyKe,
            chiPhiQuanLyLuyKe,
            KH,
            giaTriVas4,
            giaTriVas4444,
            VC,
            FC,
            giaTriVas4DauKi,
            giaTriVas4444DauKi
        }
    }

    async function loadData() {
        setSidebarVisible(false);
        setLoading(true);
        let vasList = await getAllVas();
        let soKeToanList = await loadDataSoKeToan();
        soKeToanList = soKeToanList.filter(e => e.year == currentYearKTQT);
        vasList = loadBCCCTC(vasList, currentMonthKTQT)
        soKeToanList = soKeToanList.filter(e => e.consol?.toLowerCase() == 'consol');
        let kmfList = await getAllKmf();

        const metricsConfig = [
            { header: 'Hệ số thanh khoản', refercode: '1' },
            {
                header: 'Tỷ số thanh toán nhanh',
                refercode: '1.1',
                min: 0.75,
                max: 1.25,
                calculate: (data) => ((data.tienDauKi + data.tienCuoiKi) / 2 + (data.congNoPhaiThuDau + data.congNoPhaiThuCuoi) / 2) / ((data.noNHDauKi + data.noNHCuoiKi) / 2)
            },
            {
                header: 'Tỷ số vốn ngắn hạn/ nợ ngắn hạn',
                refercode: '1.2',
                min: 1.5,
                max: 2,
                calculate: (data) => ((data.tsNHDauKi + data.tsNHCuoiKi) / 2) / ((data.noNHDauKi + data.noNHCuoiKi) / 2)
            },
            { header: 'Hệ số đòn bẩy', refercode: '2' },
            {
                header: 'Tỷ số nợ (Nợ/ Tổng tài sản)',
                refercode: '2.1',
                min: 0.3,
                max: 0.6,
                calculate: (data) => ((data.noDauKi + data.noCuoiKi) / 2) / ((data.tsDauKi + data.tsCuoiKi) / 2)
            },
            { header: 'Hệ số hiệu suất', refercode: '3' },
            {
                header: 'Vòng quay tài sản',
                refercode: '3.1',
                min: 2.5,
                max: 3,
                calculate: (data) => data.doanhThuAnnualized / ((data.tsDauKi + data.tsCuoiKi) / 2)
            },
            {
                header: 'Ngày phải thu công nợ ',
                refercode: '3.2',
                min: 20,
                max: 30,
                calculate: (data) => 365 * ((data.congNoPhaiThuDau + data.congNoPhaiThuCuoi) / 2) / data.doanhThuAnnualized
            },
            {
                header: 'Ngày phải trả công nợ',
                refercode: '3.3',
                min: 25,
                max: 35,
                calculate: (data) => 365 * ((data.congNoPhaiTraDau + data.congNoPhaiTraCuoi) / 2) / data.cfAnnualized
            },
            { header: 'Hệ số hiệu quả sinh lời', refercode: '4' },
            {
                header: 'Tỷ suất lãi ròng',
                refercode: '4.2',
                min: 0.05,
                max: 0.20,
                calculate: (data) => data.netProfit / data.doanhThuLuyKe
            },
            {
                header: 'Operation margin',
                refercode: '4.3',
                min: 0.08,
                max: 0.20,
                calculate: (data) => (data.doanhThuLuyKe + data.giaVonLuyKe + data.chiPhiBanHangLuyKe + data.chiPhiQuanLyLuyKe - data.KH) / data.doanhThuLuyKe
            },
            {
                header: 'EBITDA margin',
                refercode: '4.4',
                min: 0.08,
                max: 0.20,
                calculate: (data) => (data.doanhThuLuyKe + data.giaVonLuyKe + data.chiPhiBanHangLuyKe + data.chiPhiQuanLyLuyKe) / data.doanhThuLuyKe
            },
            { header: 'Chỉ số giá trị', refercode: '5' },
            {
                header: 'Giá trị sổ sách / 1 cổ phần',
                refercode: '5.1',
                calculate: (data) => data.giaTriVas4 / (data.giaTriVas4444 / 10000)
            },
            { header: 'Tỷ trọng biến phí định phí', refercode: '6' },
            {
                header: 'Tổng biến phí / Doanh thu',
                refercode: '6.1',
                calculate: (data) => data.VC / data.doanhThuLuyKe
            },
            {
                header: 'Tổng định phí / Doanh thu',
                refercode: '6.2',
                calculate: (data) => (data.FC + data.KH) / data.doanhThuLuyKe
            },
        ];
        const baseData = calculateHS(soKeToanList, vasList, kmfList, null, currentMonthKTQT, true);
        const quy1Data = calculateHS(soKeToanList, vasList, kmfList, null, 3);
        const quy2Data = calculateHS(soKeToanList, vasList, kmfList, 3, 6);
        const quy3Data = calculateHS(soKeToanList, vasList, kmfList, 6, 9);
        const quy4Data = calculateHS(soKeToanList, vasList, kmfList, 9, 12);
        const quarters = [
            { key: 'quy0', data: baseData },
            { key: 'quy1', data: quy1Data },
            { key: 'quy2', data: quy2Data },
            { key: 'quy3', data: quy3Data },
            { key: 'quy4', data: quy4Data },
        ];
        setDataHSFS(quarters);

        function createMetricRow(metric, baseData, quarters) {
            if (!metric.refercode.includes('.')) {
                return {
                    header: metric.header,
                    refercode: metric.refercode
                };
            }
            const row = {
                header: metric.header,
                refercode: metric.refercode,
                dauki: metric.calculate(baseData),
            };
            quarters.forEach(quy => {
                row[quy.key] = metric.calculate(quy.data);
            });

            // Thêm min và max nếu có
            if (metric.min !== undefined) row.min = metric.min;
            if (metric.max !== undefined) row.max = metric.max;

            return row;
        }

        let rowDataList = metricsConfig.map(metric => createMetricRow(metric, baseData, quarters));

        // Chart & %
        let chartData = [];
        rowDataList.map(e => {
            if (e.min && e.max) {
                e.thamchieu = e.min + '-' + e.max;
                if (e.dauki < e.min) {
                    e.danhgia = 'Thấp'
                } else if (e.dauki <= e.max) {
                    e.danhgia = 'Trung bình'
                } else {
                    e.danhgia = 'Cao'
                }
            }
        })
        let r1 = rowDataList.find(e => e.refercode === '1');
        let r11 = rowDataList.find(e => e.refercode === '1.1');
        r1.danhgia = r11.danhgia;
        let r2 = rowDataList.find(e => e.refercode === '2');
        let r21 = rowDataList.find(e => e.refercode === '2.1');
        r2.danhgia = r21.danhgia;
        let r3 = rowDataList.find(e => e.refercode === '3');
        let r31 = rowDataList.find(e => e.refercode === '3.1');
        r3.danhgia = r31.danhgia;
        let r4 = rowDataList.find(e => e.refercode === '4');
        let r42 = rowDataList.find(e => e.refercode === '4.2');
        r4.danhgia = r42.danhgia;
        rowDataList.map(e => {
            if (!e.refercode.includes('.') && e.refercode !== '5' && e.refercode !== '6') {
                if (e.danhgia === 'Thấp') {
                    e.so = 1;
                }
                if (e.danhgia === 'Trung bình') {
                    e.so = 2;
                }
                if (e.danhgia === 'Cao') {
                    e.so = 3;
                }
                let newHeader = e.header.replace('Hệ số', '').trim()
                newHeader = newHeader.charAt(0).toUpperCase() + newHeader.slice(1)
                chartData.push({ ...e, header: newHeader });
            }
        })
        setOptions({ ...options, data: chartData })
        setRowData(rowDataList);
        setLoading(false);
    }

    const updateColDefs = useCallback(() => {
        setColDefs(getColumnDefs(isFullView));
    }, [currentMonthKTQT, isFullView , currentYearKTQT]);

    useEffect(() => {
        updateColDefs();
    }, [updateColDefs]);

    useEffect(() => {
        loadData();
    }, [company]);

    return (
        <>
            <div style={{ display: 'flex', position: 'relative', }}>
                <Loading loading={loading}/>

                <div style={{ width: '47%' }}>
                    <AgCharts options={options} />
                    {/*<textarea*/}
                    {/*    ref={textAreaRef}*/}
                    {/*    className={`${styles.auto_line_break} ${noteContent ? styles.marginWithContent : styles.marginDefault}`}*/}
                    {/*    value={noteContent || ""}*/}
                    {/*    onChange={(e) => updateNoteForChart(e)}*/}
                    {/*    rows={1}*/}
                    {/*    style={{ width: '100%', }}*/}
                    {/*    placeholder={"Ghi chú"}*/}
                    {/*/>*/}
                </div>
                <div className="ag-theme-quartz"
                    style={{ height: '80vh', width: '54%', display: 'flex', marginTop: 20, overflow: 'auto' }}>
                    <div
                        style={{
                            flex: isSidebarVisible ? '75%' : '100%',
                            transition: 'flex 0.3s',
                            height: 'max-content'
                        }}
                    >
                        <AgGridReact
                            treeData={true}
                            groupDefaultExpanded={-1}
                            getDataPath={(data) => data.refercode?.toString().split('.')}
                            statusBar={statusBar}
                            enableRangeSelection
                            ref={gridRef}
                            rowData={rowData}
                            defaultColDef={defaultColDef}
                            columnDefs={colDefs}
                            rowSelection="multiple"
                            animateRows
                            localeText={AG_GRID_LOCALE_VN}
                            onGridReady={onGridReady}
                            autoGroupColumnDef={{
                                headerName: '',
                                maxWidth: 30,
                                editable: false,
                                floatingFilter: false,
                                cellRendererParams: {
                                    suppressCount: true,
                                },
                                pinned: 'left',
                            }}
                            rowClassRules={{
                                'row-head': (params) => {
                                    return params.data.refercode?.toString().split('.').length === 1;
                                },
                            }}
                            domLayout={'autoHeight'}
                        />
                        <HsfsVas data={dataHSFS} />
                        <HsfsSKT data={dataHSFS} />
                    </div>
                </div>
                {/*{isSidebarVisible && <AnalysisSideBar table={table + ` - ${table}`} gridRef={gridRef} />}*/}
            </div>
        </>
    );
}
