import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
// Ag Grid Function
import {AgGridReact} from 'ag-grid-react';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {ModuleRegistry} from '@ag-grid-community/core';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {toast} from 'react-toastify';
import '../../../Home/AgridTable/agComponent.css';

// ----- MUI -----
import {createNewProject, getAllProject} from '../../../../apisKTQT/projectService.jsx';
import {createNewProduct, getAllProduct} from '../../../../apisKTQT/productService.jsx';
import {getAllCoCauPhanBo} from '../../../../apisKTQT/coCauPhanBoService.jsx';
import {IoIosSearch} from 'react-icons/io';
import {EllipsisIcon, RefIcon} from '../../../../icon/IconSVG.js';
import css from "../../KeToanQuanTriComponent/KeToanQuanTri.module.css";
import TooltipHeaderIcon from "../../HeaderTooltip/TooltipHeaderIcon.jsx";
import pLimit from 'p-limit';

import ActionResetColumn from "../../ActionButton/ActionResetColumn.jsx";
import {MyContext} from "../../../../MyContext.jsx";
import {SortMoi} from "../../functionKTQT/SortMoi.jsx";
import {onFilterTextBoxChanged} from "../../../../generalFunction/quickFilter.js";
import {getItemFromIndexedDB2, setItemInIndexedDB2} from "../../storage/storageService.js";
import AG_GRID_LOCALE_VN from "../../../Home/AgridTable/locale.jsx";
import {loadColumnState, saveColumnStateToLocalStorage} from "../../functionKTQT/coloumnState.jsx";
import {formatCurrency, formatCurrencyString} from "../../functionKTQT/formatMoney.js";
import {handleSaveAgl} from "../../functionKTQT/handleSaveAgl.js";
import {createNewKenh, getAllKenh} from "../../../../apisKTQT/kenhService.jsx";
import RichNoteKTQTRI from "../../../Home/SelectComponent/RichNoteKTQTRI.jsx";
import Loading from '../../../Loading/Loading.jsx';
import { getAllSoKeToan } from '../../../../apisKTQT/soketoanService.jsx';

const limit = pLimit(5);
ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function PhanBoVuViec({company, call}) {
    const [editCount, setEditCount] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const table = 'SoPhanBoVuViec';
    const tableCol = 'SPBVuViecCol';
    const gridRef = useRef();
    const {listCCPB, loadDataSoKeToan, currentYearKTQT, currentCompanyKTQT} = useContext(MyContext);
    const [selectedYear, setSelectedYear,] = useState(`${currentYearKTQT}`);
    const [listYear, setListYear] = useState([]);
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [listProduct, setListProduct] = useState([]);
    const [listProject, setListProject] = useState([]);
    const [show, setShow] = useState(false);
    const [listCoChePhanBo, setListCoChePhanBo] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [checkColumn, setCheckColumn] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const tableStatusButton = 'SPBVuViecStatusButton';

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

    useEffect(() => {
        const saveSettings = async () => {
            const settings = {
                isSortByDay,
                selectedButton
            };
            await setItemInIndexedDB2(tableStatusButton, settings);
        };

        saveSettings();
    }, [isSortByDay, selectedButton]);


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
        let listProduct = await getAllProject();
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < listProduct.length; j++) {
                let unitCode = listProduct[j].code;
                data[i]['pb' + unitCode] = null;
            }
        }
        for (let i = 0; i < data.length; i++) {
            if (data[i].PBPROJECT) {
                let parsedPBSP = JSON.parse(data[i].PBPROJECT);
                parsedPBSP.teams.forEach((team) => {
                    data[i]['pb' + team.team] = +team.tien || 0;
                });
                let sumTien = parsedPBSP.teams.reduce((total, team) => {
                    const tien = parseFloat(team.tien);
                    return total + (isNaN(tien) ? 0 : tien);
                }, 0);
                if (Math.abs(sumTien - data[i].pl_value) > 10) {
                    data[i].check = 'Lệch ' + formatCurrency(data[i].pl_value - sumTien);
                }
            }
            if (data[i].project2 !== null && data[i].project2 !== '' && (!data[i].PBPROJECT || data[i].PBPROJECT === '')) {
                data[i]['pb' + data[i].project2] = +data[i].pl_value || 0;
                data[i].CCPBPROJECT = 'Trực tiếp';
            }
        }
        if (selectedButton) {
            if (selectedButton === 'Gián tiếp') {
                data = data.filter(item => item.CCPBPROJECT !== 'Tùy chỉnh' && item.CCPBPROJECT !== 'Trực tiếp');
            } else {
                data = data.filter(item => item.CCPBPROJECT === selectedButton);
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
        setLoading(false)
    }

    useEffect(() => {
        loadData();
    }, [selectedButton, isSortByDay, currentCompanyKTQT]);
    const onGridReady = useCallback(async () => {
        loadData();
    }, []);
    useEffect(() => {
        loadData();
        setLoading(true);
        getAllProject().then((data) => {
            setListProduct(data);
        });
        getAllCoCauPhanBo().then((data) => {
            data.push({name: 'Trực tiếp', type: 'Vụ việc', dp2: 1})
            setListCoChePhanBo(data);
        });
    }, [selectedYear]);

    function createDonViField() {
        let dvField = [];
        listProduct.map((unit) => {
            dvField.push({
                field: `pb${unit.code}`,
                headerClass: 'right-align-important',
                width: 110,
                headerName: `${unit.code}`,
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
                let updatedColDefs = [
                    {
                        field: 'id',
                        width: 70,
                        headerName: 'ID',
                        hide: false,
                    },
                    {
                        field: 'company',
                        width: 70,
                        headerName: 'Company',
                        ...filter()
                    },
                    {
                        field: 'unit_code',
                        width: 70,
                        editable: true,
                        headerName: 'Unit',
                        ...filter()
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
                        ...filter(),
                        ...SortMoi(),
                    },
                    {
                        field: 'year',
                        headerName: 'Năm',
                        width: 70,
                        suppressHeaderMenuButton: true,
                        ...filter(),
                        ...SortMoi(),

                    },
                    {
                        field: 'pl_type',
                        headerName: 'PL Type',
                        width: 70,
                        suppressHeaderMenuButton: true,
                        ...filter()
                    },
                    {
                        field: 'project',
                        headerName: 'Vụ việc',
                        suppressHeaderMenuButton: true,
                        width: 110,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listProduct.map((p) => p.name),
                        },
                        ...filter(),
                        editable: true
                    },
                    {
                        field: 'pl_value',
                        headerName: 'Số tiền',
                        width: 140,
                        headerClass: 'right-align-important',
                        valueFormatter: (params) => formatCurrency(params.value),
                        cellStyle: {textAlign: 'right'},
                        ...filter(),
                        ...SortMoi(),

                    },
                    {
                        field: 'CCPBPROJECT',
                        headerName: 'Cơ Chế Phân Bổ',
                        width: 140,
                        editable: true,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listCoChePhanBo.filter((e) => e.type === 'Vụ việc').map((p) => p.name),
                        },
                        ...filter()
                    },
                    {
                        field: 'kmf',
                        headerName: 'Khoản mục phí',
                        width: 200,
                        suppressHeaderMenuButton: true,
                        ...filter()
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
                ];
                const savedColumnState = await getItemFromIndexedDB2(tableCol);
                if (savedColumnState.length) {
                    setColDefs(loadColumnState(updatedColDefs, savedColumnState));
                } else {
                    const simplifiedColumnState = updatedColDefs.map(({field, pinned, width, hide}) => ({
                        colId: field,
                        pinned,
                        width,
                        hide,
                    }));
                    await setItemInIndexedDB2(tableCol, simplifiedColumnState);
                    setColDefs(updatedColDefs);
                }
                ;
            } catch (error) {
               console.log(error)
            }
        };
        fetchData();
    }, [onGridReady, rowData, table, searchInput, checkColumn]);

    function calculateTeamsPBSP(teams, soTien) {
        let totalSoChot = teams.reduce((sum, team) => sum + (parseInt(team.so_chot) || 0), 0);
        teams.forEach((team) => {
            team.tien = (parseFloat(soTien) / totalSoChot) * parseInt(team.so_chot, 10);
        });
    }

    function updateCCPBSPData(event, ccpb) {
        const teamsMap = {};
        ccpb.PB.forEach((item) => {
            const team = item.ten_don_vi;
            const thangValue = item[`thang_${+event.data.month}`];
            if (thangValue !== null) {
                teamsMap[team] = teamsMap[team] ? teamsMap[team] : {team: team, so_chot: 0, tien: 0};
                teamsMap[team].so_chot = thangValue;
            }
        });
        const teamsArray = Object.values(teamsMap);
        calculateTeamsPBSP(teamsArray, event.data.pl_value);
        event.data.PBPROJECT = JSON.stringify({teams: teamsArray});
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

            if (updateField === 'CCPBPROJECT') {
                if (event.newValue === 'Trực tiếp') {
                    event.data.PBPROJECT = null;
                } else {
                    let ccpb = listCoChePhanBo.find((e) => e.name === event.newValue);
                    updateCCPBSPData(event, ccpb);
                }
            }

            if (updateField.startsWith('pb')) {
                let unit = updateField.split('pb')[1];
                let newValue = event.newValue;
                if (!event.data.PBPROJECT) {
                    event.data.PBPROJECT = '{"teams":[]}';
                }
                let teams = JSON.parse(event.data.PBPROJECT).teams;
                updateTeamValue(teams, unit, newValue);
                event.data.PBPROJECT = JSON.stringify({teams});
                event.data.CCPBPROJECT = 'Tùy chỉnh';
            }

            if (updateField === 'project') {
                if (event.data.company && event.data.project && event.data.project) {
                    event.data.project2 = `${event.data.project}-${event.data.company}-${event.data.unit_code}`;
                    event.data.PBPROJECT = null;
                    event.data.CCPBPROJECT = 'Trực tiếp';

                    let listProduct = await getAllProject();
                    let isExistProduct = listProduct.some(e => e.code === event.data.project2);

                    if (!isExistProduct) {
                        await createNewProject({
                            code: event.data.project2,
                            name: event.data.project,
                            dp: event.data.project,
                            unit_code: event.data.unit_code,
                            company: event.data.company,
                            group: 'Khác',
                        });
                    }
                }
            }
            // Chỉ cập nhật data local, không lưu tự động
            setRowData([...rowData]);
            setHasUnsavedChanges(true);
        } catch (error) {
            console.error('Error updating cell value:', error);
        }
    };

    const handleSortByDay = () => {
        setIsSortByDay(!isSortByDay);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Lưu tất cả data đã thay đổi
            await handleSaveAgl(rowData, 'SoKeToan-KTQT');
            // Refresh data sau khi lưu
            loadData();
            loadDataSoKeToan();
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error('Error saving data:', error);
        } finally {
            setLoading(false);
        }
    };

    function handleUpdate() {
        loadData();
        loadDataSoKeToan()
    }

    return (
        <>
            <div className={'header-powersheet'}>
                <div className={css.headerTitle}>
                    {!call &&
                        <>
                            <span>Phân Bổ Vụ việc<TooltipHeaderIcon table={table}/> </span>
                            <div style={{marginLeft: '10px'}}>
                                <ActionResetColumn tableCol={tableCol} checkColumn={checkColumn}
                                                   setCheckColumn={setCheckColumn}/>
                            </div>
                        </>
                    }
                    <button
                        className={`${css.headerActionButton} ${hasUnsavedChanges ? css.buttonOn : css.buttonOff}`}
                        onClick={handleSave}
                        disabled={loading || !hasUnsavedChanges}
                        style={{
                            marginLeft: '5px'
                        }}
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
                        {/*    Phân bổ sản phẩm*/}
                        {/*</button>*/}
                        <div className={css.inputSearch}>
                            <IoIosSearch style={{width: 24, height: 24}}/>
                            <input
                                type="text"
                                id="filter-text-box"
                                className={css.quickFilterInput}
                                placeholder="Tìm kiếm bảng"
                                onInput={handleFilterText}
                            />
                        </div>
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
                        paginationPageSize={1000}
                        animateRows={true}
                        paginationPageSizeSelector={[1000, 5000, 10000, 30000, 50000]}
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                        domLayout={'normal'}
                        onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                        onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                    />
                </div>
            </div>
        </>
    );
}
