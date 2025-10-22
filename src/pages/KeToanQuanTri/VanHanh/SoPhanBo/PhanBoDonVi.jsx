import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
// Ag Grid Function
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ModuleRegistry } from '@ag-grid-community/core';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';


// ----- MUI -----
import { getAllKmf } from '../../../../apisKTQT/kmfService.jsx';
import { getAllProject } from '../../../../apisKTQT/projectService.jsx';
import { createNewUnit, getAllUnits } from '../../../../apisKTQT/unitService.jsx';
import { getAllCoCauPhanBo } from '../../../../apisKTQT/coCauPhanBoService.jsx';
import { MyContext } from '../../../../MyContext.jsx';
import { SortMoi } from '../../functionKTQT/SortMoi.jsx';
import AG_GRID_LOCALE_VN from '../../../Home/AgridTable/locale.jsx';
import { formatCurrency, formatCurrencyString } from '../../functionKTQT/formatMoney.js';
import { handleSaveAgl } from '../../functionKTQT/handleSaveAgl.js';
import css from '../../KeToanQuanTriComponent/KeToanQuanTri.module.css';
import { getAllSoKeToan } from '../../../../apisKTQT/soketoanService.jsx';
import TooltipHeaderIcon from '../../HeaderTooltip/TooltipHeaderIcon.jsx';
import pLimit from 'p-limit';
import '../../../Home/AgridTable/agComponent.css';
import { onFilterTextBoxChanged } from '../../../../generalFunction/quickFilter.js';
import { EllipsisIcon, RefIcon } from '../../../../icon/IconSVG.js';
import { getItemFromIndexedDB2 } from '../../storage/storageService.js';
import Loading from '../../../Loading/Loading.jsx';

const limit = pLimit(5);
ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function PhanBoDonVi({company, call}) {
    const [editCount, setEditCount] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const {listCCPB, loadDataSoKeToan, currentYearKTQT, currentCompanyKTQT} = useContext(MyContext);
    const [donViList, setDonViList] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const table = 'SoPhanBoDonVi';
    const [selectedYear, setSelectedYear] = useState(`${currentYearKTQT}`);
    const [listYear, setListYear] = useState([]);
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);
    const [listUnit, setListUnit] = useState([]);
    const [listProject, setListProject] = useState([]);
    const [listKMF, setListKMF] = useState([]);
    const [listCoChePhanBo, setListCoChePhanBo] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const tableStatusButton = 'SPBDonViStatusButton';

    const [selectedButton, setSelectedButton] = useState(null);
    const [isSortByDay, setIsSortByDay] = useState(true);

    useEffect(() => {
        setSelectedYear(currentYearKTQT)
    }, [currentYearKTQT])

    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getItemFromIndexedDB2(tableStatusButton);
            setIsSortByDay(settings?.isSortByDay ?? true);
            setSelectedButton(settings?.selectedButton ?? null);

        };
        fetchSettings();
    }, []);

    const handleFilterText = (event) => {
        setSearchInput(event.target.value)
    };
    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

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
        getAllCoCauPhanBo().then((data) => {
            data.push({type: 'Đơn vị'})
            setListCoChePhanBo(data);
        });
    }, []);

    const defaultColDef = useMemo(() => {
        return {
            filter: true,
            cellStyle: {fontSize: '14.5px'},
            editable: false,
            cellClassRules: {
                'cell-small': (params) => params.colDef.width < 150,
            },
            wrapHeaderText: true,
            autoHeaderHeight: true,
        };
    });
    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    async function loadData() {
        setLoading(true);
        let listYearsss
        let data = await getAllSoKeToan();
        if (currentCompanyKTQT === 'HQ') data = data.filter((e) => e.consol?.toLowerCase() === 'consol');
        else data = data.filter((e) => e.company?.toLowerCase() === currentCompanyKTQT.toLowerCase())
        data = data.sort((a, b) => b.id - a.id).filter((e) => e.pl_type !== null && e.pl_type !== '');
        if (selectedYear != 'toan-bo') {
            data = data.filter(e => e.year == selectedYear)
        }
        listYearsss = [...new Set(data.filter(e => e.year && e.year !== '').map(e => e.year))]
        setListYear([currentYearKTQT, ...listYearsss]);
        let listUnit = await getAllUnits();
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < listUnit.length; j++) {
                let unitCode = listUnit[j].code;
                data[i]['pb' + unitCode] = null;
            }
        }
        for (let i = 0; i < data.length; i++) {
            if (data[i].PBDV !== null && data[i].PBDV !== '') {
                let parsedPBDV = JSON.parse(data[i].PBDV);
                parsedPBDV.teams.forEach((team) => {
                    data[i]['pb' + team.team] = +team.tien || 0;
                });
                let sumTien = parsedPBDV.teams.reduce((total, team) => {
                    const tien = parseFloat(team.tien);
                    return total + (isNaN(tien) ? 0 : tien);
                }, 0);
                if (Math.abs(sumTien - data[i].pl_value) > 10) {
                    data[i].check = 'Lệch ' + formatCurrency(data[i].pl_value - sumTien);
                }
            }
            if (data[i].unit_code !== null && data[i].unit_code !== '' && (!data[i].CCPBDV || data[i].CCPBDV === '')) {
                data[i]['pb' + data[i].unit_code2] = +data[i].pl_value || 0;
                data[i].CCPBDV = 'Trực tiếp';
            }
        }
        if (selectedButton) {
            if (selectedButton) {
                if (selectedButton === 'Gián tiếp') {
                    data = data.filter(item => item.CCPBDV !== 'Tùy chỉnh' && item.CCPBDV !== 'Trực tiếp');
                } else {
                    data = data.filter(item => item.CCPBDV === selectedButton);
                }
            }
        }
        if (isSortByDay) {
            // Sắp xếp theo id
            data = data.sort((a, b) => b.id - a.id);
        } else {
            // Sắp xếp theo day, month, year từ ngày gần nhất đến xa nhất
            data = data.sort((a, b) => {
                // Chuyển đổi các giá trị thành số nguyên để so sánh
                let dateA = new Date(a.year, a.month - 1, a.day);
                let dateB = new Date(b.year, b.month - 1, b.day);
                return dateB - dateA; // Ngày mới nhất đứng trước
            });
        }
        setRowData(data);
        setLoading(false);
    }

    useEffect(() => {
        loadData();
    }, [selectedButton, isSortByDay , selectedYear, currentCompanyKTQT]);

    const onGridReady = useCallback(async () => {
        loadData();
    }, []);
    useEffect(() => {
        loadData();
        setLoading(true);
        getAllProject().then((data) => {
            setListProject(data);
        });
        getAllKmf().then((data) => {
            setListKMF(data);
        });
        getAllUnits().then((data) => {
            setListUnit(data);
        });
        getAllCoCauPhanBo().then((data) => {
            data.push({name: 'Trực tiếp', type: 'Đơn vị', dp2: 1})
            setListCoChePhanBo(data);
        });
    }, []);

    const handleCheckPhanbo = async () => {
        try {
            let data = await getAllSoKeToan();
            let dataKmf = await getAllKmf();
            const dataFilter = data.filter(
                (item) =>
                    (item.CCPBDV === null || item.CCPBDV === undefined || item.CCPBDV === '') &&
                    (item.unit_code2 === null || item.unit_code2 === undefined || item.unit_code2 === ''
                        && item.pl_type !== null && item.pl_type !== '')
            );
            const updatedData = dataFilter.map((item) => {
                const kmfMatch = dataKmf.find((kmf) => kmf.name === item.kmf);
                if (kmfMatch) {
                    item.CCPBDV = kmfMatch.dp1;
                    let ccpb = listCoChePhanBo.find((e) => e.name === kmfMatch.dp1);
                    updateCCPBDVData({data: item}, ccpb);
                }

                return item;
            });
            for (let item of updatedData) {
                if (item.CCPBDV) {
                    await handleSaveAgl([item], table, setUpdatedData);
                }
            }
            loadData();
        } catch (error) {
            console.error('Error processing data: ', error);
        }
    };

    function createDonViField() {
        let dvField = [];
        listUnit.filter((item) => (item.company !== "Group")).map((unit) => {
            dvField.push({
                field: `pb${unit.code}`,
                headerClass: 'right-align-important',
                width: 110,
                headerName: unit.code,
                cellStyle: {textAlign: 'right'},
                editable: true,
                valueFormatter: (params) => formatCurrency(params.value),
                ...filter()
            });
        });
        if (searchInput) {
            dvField = dvField.filter((field) =>
                field.headerName.toLowerCase().includes(searchInput.toLowerCase())
            );
        }
        return dvField;
    }

    function filter() {
        return {
            filter: 'agMultiColumnFilter',
            floatingFilter: true,
            filterParams: {
                filters: [
                    {
                        filter: 'agTextColumnFilter',
                    },
                    {
                        filter: 'agSetColumnFilter',
                    },
                ],
            },
        };
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setColDefs([
                    {
                        field: 'id',
                        width: 70,
                        headerName: 'ID',
                        hide: false,
                    },
                    {
                        field: 'company',
                        headerName: 'Công ty',
                        width: 110,
                        pinned: 'left',
                        suppressHeaderMenuButton: true,
                        ...filter(),
                        editable: false
                    },
                    {
                        field: 'diengiai',
                        headerName: 'Diễn Giải',
                        width: 350,
                        ...filter()
                    },
                    {
                        field: 'month',
                        headerName: 'Tháng',
                        width: 70,
                        suppressHeaderMenuButton: true,
                        ...SortMoi(),
                        ...filter()
                    },
                    {
                        field: 'year',
                        headerName: 'Năm',
                        width: 70,
                        suppressHeaderMenuButton: true,
                        ...SortMoi(),
                        ...filter()
                    },
                    {
                        field: 'pl_type',
                        headerName: 'PL Type',
                        width: 70,
                        suppressHeaderMenuButton: true,
                        ...filter()
                    },
                    {
                        field: 'unit_code',
                        headerName: 'Business Unit',
                        suppressHeaderMenuButton: true,
                        width: 120,
                        ...filter(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listUnit.map((p) => p.name),
                        },
                        editable: true
                    },
                    {
                        field: 'pl_value',
                        headerName: 'Số tiền',
                        width: 160,
                        headerClass: 'right-align-important',
                        valueFormatter: (params) => formatCurrency(params.value),
                        cellStyle: {textAlign: 'right'},
                        ...SortMoi(),
                        ...filter()
                    },
                    {
                        field: 'CCPBDV',
                        headerName: 'Cơ Chế Phân Bổ',
                        width: 140,
                        editable: true,
                        ...filter(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listCoChePhanBo.filter((e) => e.type === 'Đơn vị').map((p) => p.name),
                        },
                    },
                    {
                        field: 'kmf',
                        headerName: 'Khoản mục phí',
                        width: 200,
                        suppressHeaderMenuButton: true,
                        ...filter(),
                        editable: true,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listKMF.map((p) => p.name),
                        },
                    },
                    ...createDonViField(),
                    {
                        field: 'check',
                        headerName: 'Check',
                        width: 150,
                        suppressHeaderMenuButton: true,
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellStyle: {textAlign: 'right'},
                        valueFormatter: (params) => formatCurrencyString(params.value),
                    },
                ]);
            } catch (error) {
                console.log(error)
               console.log(error)
            }
        };
        fetchData();
    }, [onGridReady, rowData, table, searchInput]);

    function calculateTeamsPBDV(teams, soTien) {
        let totalSoChot = teams.reduce((sum, team) => sum + (parseInt(team.so_chot) || 0), 0);
        teams.forEach((team) => {
            team.tien = (parseFloat(soTien) / totalSoChot) * parseInt(team.so_chot, 10);
        });
    }

    function updateCCPBDVData(event, ccpb) {
        const teamsMap = {};
        ccpb.PB.forEach((item) => {
            const team = item.ten_don_vi;
            const thangValue = item[`thang_${+event.data.month}`];
            if (thangValue !== null) {
                teamsMap[team] = teamsMap[team] || {team: team, so_chot: 0, tien: 0};
                teamsMap[team].so_chot = thangValue;
            }
        });

        const teamsArray = Object.values(teamsMap);
        calculateTeamsPBDV(teamsArray, event.data.pl_value);

        event.data.PBDV = JSON.stringify({teams: teamsArray});
    }

    function updateTeamValue(teams, unit, newValue) {
        const existingTeam = teams.find((team) => team.team === unit);

        if (existingTeam) {
            existingTeam.tien = newValue;
        } else {
            teams.push({team: unit, tien: newValue});
        }
    }

    const handleCellValueChanged = async (event) => {
        try {
            let updateField = event.colDef.field;
            if (updateField === 'CCPBDV') {
                if (event.newValue === 'Trực tiếp') {
                    event.data.PBDV = null;
                } else {
                    let ccpb = listCoChePhanBo.find((e) => e.name === event.newValue);
                    updateCCPBDVData(event, ccpb);
                }
            }
            if (updateField.startsWith('pb')) {
                let unit = updateField.split('pb')[1];
                let newValue = event.newValue;
                if (!event.data.PBDV) {
                    event.data.PBDV = '{"teams":[]}';
                }

                let teams = JSON.parse(event.data.PBDV).teams;
                updateTeamValue(teams, unit, newValue);
                event.data.PBDV = JSON.stringify({teams: teams});
                event.data.CCPBDV = 'Tùy chỉnh';
            }
            if (updateField === 'unit_code') {
                event.data.PBDV = null;
                event.data.CCPBDV = 'Trực tiếp';
                if (event.data.company != null && event.data.company !== "" && event.data.company !== undefined) {
                    if (event.data.unit_code != null && event.data.unit_code !== "" && event.data.unit_code !== undefined) {
                        event.data.unit_code2 = `${event.data.unit_code}-${event.data.company}`
                    }
                }
                if (event.data.unit_code === '' || !event.data.unit_code) {
                    event.data.unit_code2 = null
                }
                let listUnit = await getAllUnits();
                let isExistUnit = listUnit.some(e => e.code === event.data.unit_code2)
                if (!isExistUnit) {
                    await createNewUnit({
                        code: event.data.unit_code2,
                        name: event.data.unit_code,
                        dp: event.data.unit_code,
                        company: event.data.company,
                        group: 'Khác'
                    });
                }
            }
            // Chỉ cập nhật data local, không lưu tự động
            setRowData([...rowData]);
            setHasUnsavedChanges(true);
        } catch (error) {
            console.error('Error updating cell value:', error);
        }
    };
    // Theo dõi khi `editCount` đạt 0, không lặp lại `loadData` nếu đã gọi trước đó
    useEffect(() => {
        if (editCount === 0 && !isLoaded) {
            setLoading(false);
            setIsLoaded(true); // Đặt cờ để biết loadData đã được gọi
            loadData();
        }
        // Đặt lại isLoaded khi `editCount` không còn 0 để sẵn sàng cho lần thay đổi tiếp theo
        if (editCount !== 0) {
            setIsLoaded(false);
        }
    }, [editCount, isLoaded]);
    const handleSortByDay = () => {
        setIsSortByDay(!isSortByDay);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Lưu tất cả data đã thay đổi
            await handleSaveAgl(rowData, 'SoKeToan-KTQT');
            // Refresh data sau khi lưu
            setTimeout(()=> {
                loadData();
                loadDataSoKeToan();
            }, 500)
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error('Error saving data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className={'header-powersheet'}>

                <div className={css.headerTitle}>
                    {!call &&
                        <span>Phân Bổ Đơn Vị <TooltipHeaderIcon table={table}/></span>
                    }

                    <button
                        className={`${css.headerActionButton} ${hasUnsavedChanges ? css.buttonOn : css.buttonOff}`}
                        onClick={handleSave}
                        disabled={loading || !hasUnsavedChanges}
                    >
                        <span>{loading ? 'Đang lưu...' : hasUnsavedChanges ? 'Lưu' : 'Đã lưu'}</span>
                    </button>
                </div>


                {!call &&
                    <div className={css.headerAction}>
                        {/*<div className={`${css.headerActionButton} ${css.selectItem}`}>*/}
                        {/*    <select className={css.selectContent}*/}
                        {/*            value={selectedYear}*/}
                        {/*            onChange={(e) => setSelectedYear(e.target.value)}*/}
                        {/*    >*/}
                        {/*        {listYear.map((year) => (<option key={year} value={year}>*/}
                        {/*            {year}*/}
                        {/*        </option>))}*/}
                        {/*        <option value="toan-bo">Toàn bộ</option>*/}
                        {/*    </select>*/}
                        {/*</div>*/}
                        <div className={`${css.headerActionButton} ${isSortByDay ? css.buttonOn : css.buttonOn}`}
                             onClick={handleSortByDay}>
                            {isSortByDay ? <span>Sắp xếp theo ngày tạo</span> : <span>Sắp xếp theo ngày nhập</span>}
                        </div>
                        <div
                            className={`${css.headerActionButton} ${selectedButton === 'Trực tiếp' ? css.buttonOn : css.buttonOff}`}
                            onClick={() => setSelectedButton(selectedButton === 'Trực tiếp' ? '' : 'Trực tiếp')}>
                            <span>PB trực tiếp</span>
                        </div>

                        <div
                            className={`${css.headerActionButton} ${selectedButton === 'Gián tiếp' ? css.buttonOn : css.buttonOff}`}
                            onClick={() => setSelectedButton(selectedButton === 'Gián tiếp' ? '' : 'Gián tiếp')}>
                            <span>PB gián tiếp</span>
                        </div>

                        <div
                            className={`${css.headerActionButton} ${selectedButton === 'Tùy chỉnh' ? css.buttonOn : css.buttonOff}`}
                            onClick={() => setSelectedButton(selectedButton === 'Tùy chỉnh' ? '' : 'Tùy chỉnh')}>
                            <span>Tùy chỉnh</span>
                        </div>
                        {/*<button*/}
                        {/*    className={`button-header-sheet-2 ${show ? 'button-active-2' : ''}`}*/}
                        {/*    onClick={() => handleCheckPhanbo()}*/}
                        {/*>*/}
                        {/*    Phân bổ đơn vị*/}
                        {/*</button>*/}
                        <div className="navbar-item" ref={dropdownRef}>
                            <img
                                src={EllipsisIcon}
                                style={{width: 32, height: 32}}
                                alt="Ellipsis Icon"
                                onClick={handleDropdownToggle}
                            />
                            {isDropdownOpen && (
                                <div className="dropdown-menu-button1">
                                    <button className="dropdown-item-button1">Xuất Excel</button>
                                </div>
                            )}
                        </div>
                    </div>}

            </div>
            {/*<div style={{width: '100%', height: 'max-content', boxSizing: "border-box"}}>*/}
            {/*    <RichNoteKTQTRI table={`${table + '-' + company}`}/>*/}
            {/*</div>*/}
            <div
                style={{
                    height: call === 'cdsd' ? '98%' : '77.5vh',
                    display: 'flex',
                    flexDirection: 'column',
                    // position: 'relative',
                    marginTop: '15px',
                }}
            >
                <Loading loading={loading}/>
                <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
                    <AgGridReact
                        statusBar={statusBar}
                        enableRangeSelection
                        ref={gridRef}
                        rowData={rowData}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        rowSelection="multiple"
                        // pagination={true}
                        onCellValueChanged={handleCellValueChanged}
                        // paginationPageSize={1000}
                        animateRows={true}
                        // paginationPageSizeSelector={[1000, 5000, 10000, 30000, 50000]}
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                        domLayout={'normal'}
                    />
                </div>
            </div>
        </>
    );
}
