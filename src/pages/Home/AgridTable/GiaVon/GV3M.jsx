import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import React, {useEffect, useMemo, useRef, useState} from 'react';
// Ag Grid Function
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {ModuleRegistry} from '@ag-grid-community/core';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {AgGridReact} from 'ag-grid-react';
import '../agComponent.css';
import AG_GRID_LOCALE_VN from '../locale.jsx';
import {createTimestamp, formatMoney} from "../../../../generalFunction/format.js";
import css from "./KeToanQuanTri.module.css";
import {GV3M_TITLE} from "../../../../Consts/TITLE_HEADER.js";
import {
    createNewSoKeToan,
    deleteAccountingJournalByDaDung1,
    getAllSoKeToan
} from "../../../../apis/soketoanService.jsx";
import {getSettingByType} from "../../../../apis/settingService.jsx";
import {createNewPBGV3, getAllPBGV3, updatePBGV3} from "../../../../apis/pbgv3Service.jsx";
import {getAllCCPB} from "../../../../apis/ccpbService.jsx";
import {getAllPBGV2B} from "../../../../apis/pbgv2BService.jsx";
import {Button, DatePicker, message, Segmented, Typography} from "antd";
import {genDataM, isEditable, mergeDataGV3M, processDataGV3M} from "./logicGV3M.js";
import {CPB, LSX, LSXD} from "../../../../Consts/GIA_VON.js";
import {getAllLenhSanXuat} from "../../../../apis/lenhSanXuatService.jsx";
import ActionViewTPB from "../actionButton/ActionViewTPBVuViec.jsx";
import DialogThePhanBo from "../detail/dialog/DialogThePhanBo.jsx";
import Menu from "@mui/material/Menu";
import {getCurrentUserLogin} from "../../../../apis/userService.jsx";
import ActionKetChuyen from "../actionButton/ActionKetChuyen.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function GV3M() {
    const headerTitle = GV3M_TITLE;
    const table = 'GV3M';
    const tableCol = 'GV3MCol';
    const tableFilter = 'GV3MFilter';
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [rowData2, setRowData2] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [colDefs2, setColDefs2] = useState([]);
    const [dataSoKeToan, setDataSoKeToan] = useState([]);
    const [dataPBGV3, setDataPBGV3] = useState([]);
    const [dataPBGV2B, setDataPBGV2B] = useState([]);
    const [dataCCPB, setCCPB] = useState([]);
    const [dataLSX, setLSX] = useState([]);
    const [dataSettingPPTGT, setDataSettingPPTGT] = useState({});
    const [isStatusFilter, setIsStatusFilter] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const [currentUser, setCurrentUser] = useState(null);

    const [valueTimeRange, setValueTimeRange] = useState('full');
    const [filterMode, setFilterMode] = useState(false);
    const [valueDate, setValueDate] = useState(null);
    const [valueMonth, setValueMonth] = useState(null);
    const [valueYear, setValueYear] = useState(null);

    const onChangeDatePicker = (date, _) => {
        setValueDate(date);
        setValueMonth(date?.$M + 1);
        setValueYear(date?.$y);
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };
    const fetchCurrentUser = async () => {
        const {data, error} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    const fetchAllSoKeToan = async () => {
        try {
            const data = await getAllSoKeToan();
            const filteredData = data.filter(item =>
                item.tk_no && (item.tk_no.startsWith('6') || item.tk_no.startsWith('8') || item.tk_no == '1549')
            );
            setDataSoKeToan(filteredData);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error);
        }
    };

    const fetchAllPBGV3 = () => {
        try {
            getAllPBGV3().then(e => setDataPBGV3(e))
        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error);
        }
    }
    const fetchAllCCPB = () => {
        try {
            getAllCCPB().then(e => setCCPB(e))
        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error);
        }
    }
    const fetchAllLSX = () => {
        try {
            getAllLenhSanXuat().then(e => setLSX(e))
        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error);
        }
    }

    const fetchAllPBGV2B = async () => {
        try {
            const data = await getAllPBGV2B();
            setDataPBGV2B(data);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error);

        }
    }

    const fetchSettingPPTGT = async () => {
        try {
            const data = await getSettingByType('PhuongPhapTinhGiaThanh');
            setDataSettingPPTGT(data);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error);
        }
    };

    const handleClearFilter = () => {
        setFilterMode(false);
        setValueDate(null);
        setValueMonth(null);
        setValueYear(null);
    };

    const defaultColDef = useMemo(() => ({
        editable: false,
        filter: true,
        suppressMenu: true,
        cellStyle: {fontSize: '14.5px'},
    }), []);

    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    const filter = useMemo(() => {
        if (isStatusFilter) {
            return {
                filter: 'agMultiColumnFilter',
                floatingFilter: true,
                filterParams: {
                    filters: [
                        {filter: 'agTextColumnFilter'},
                        {filter: 'agSetColumnFilter'},
                    ],
                },
            };
        }
        return {};
    }, [isStatusFilter]);

  async  function  loadData() {
        let listLSX = await getAllLenhSanXuat()
      let newData = genDataM(dataSoKeToan, dataPBGV3, dataSettingPPTGT, dataCCPB)
        if (valueYear && valueMonth && valueTimeRange) {
            newData = newData.filter(item => item.month == valueMonth && item.year == valueYear);
            setFilterMode(true);
            if (valueTimeRange == 'p1') {
                newData = newData.filter(item => parseInt(item.day) <= 15);
            } else if (valueTimeRange == 'p2') {
                newData = newData.filter(item => parseInt(item.day) > 15);
            }
        }
        let rowData = newData.filter(item => item.mo_hinh_tinh_gia === CPB);
        rowData = mergeDataGV3M(rowData, dataPBGV2B, dataCCPB)
        let dataW = newData.filter(item => item.mo_hinh_tinh_gia === LSX);
        setRowData([...processDataGV3M(dataW, listLSX), ...rowData]);
    }

    const isNull = (field) => {
        return field == null || field == "" ? '-' : field
    }

    function genVVField(listVV) {
        let fields = [];
        listVV.forEach(item => {
            fields.push({
                field: item.code,
                headerName: item.code,
                width: 120, ...filter,
                cellStyle: {textAlign: 'right'},
                headerClass: 'right-align-important',
                cellRenderer: params => formatMoney(params.value)

            });
        })
        return fields
    }

    const fetchData = async () => {
        try {
            setColDefs([
                {
                    field: 'kmf',
                    headerName: 'KMF',
                    width: 80, ...filter,
                    cellRenderer: params => isNull(params.value),
                },
                {
                    field: 'ky',
                    headerName: 'Kỳ',
                    width: 120, ...filter,
                },
                {
                    field: 'so_tien_VND',
                    headerName: 'Số tiền',
                    width: 120, ...filter,
                    cellStyle: {textAlign: 'right'},
                    headerClass: 'right-align-important',
                    cellRenderer: params => formatMoney(params.value)
                },
                {
                    field: 'CCPBLSX',
                    headerName: 'CCPBLSX',
                    width: 120,
                    ...filter,
                    cellEditor: 'agRichSelectCellEditor',
                    cellEditorParams: {
                        allowTyping: true,
                        filterList: true,
                        highlightMatch: true,
                        values: async (params) => {
                            let listCCPB = await getAllCCPB()
                            return listCCPB.filter(e => e.type.includes(LSXD)).map(d => d?.name)
                        }
                    },
                    editable: (params) => editMode && isEditable(params.data),
                },
                ...genVVField(dataLSX)
            ]);
        } catch (error) {
            console.log('Error fetching data:', error);
        }
    };

    const turnOnEditMode = () => {
        setEditMode(true);
    };

    const turnOffEditMode = () => {
        setEditMode(false);
    };

    useEffect(() => {
        fetchSettingPPTGT();
        fetchAllSoKeToan();
        fetchAllPBGV2B()
        fetchAllPBGV3()
        fetchAllCCPB()
        fetchAllLSX()
        fetchCurrentUser()
    }, []);

    useEffect(() => {
        loadData()
        fetchData();
    }, [dataSoKeToan, isStatusFilter, editMode, dataPBGV3, dataPBGV2B, dataSettingPPTGT, dataCCPB, dataLSX, valueYear, valueMonth, valueTimeRange, filterMode,]);

    const handleSaveSetting = async () => {
        try {
            let allRowData = [];
            if (gridRef.current) {
                gridRef.current.api.forEachNode(node => allRowData.push(node.data));
            }
            const payload = allRowData.map(row => {
                return {
                    KMF: row.kmf,
                    CCPBLSX: row.CCPBLSX,
                    ky: row.ky,
                };
            });

            for (const row of payload) {
                if (dataPBGV3.length === 0) {
                    await createNewPBGV3(row);
                    await fetchAllPBGV3();
                    continue;
                }
                const existingRow = dataPBGV3.find(item => item.KMF === row.KMF);
                if (existingRow) {
                    await updatePBGV3({...row, id: existingRow.id});
                    await fetchAllPBGV3();
                } else {
                    await createNewPBGV3(row);
                    await fetchAllPBGV3();
                }
            }

            message.success('Cập nhật thành công');
            turnOffEditMode();
        } catch (error) {
            console.error('Có lỗi rồi TUẤN ơi !!!:', error);
        }
    };

    const handleCreateToSKT = async () => {
        let listLSX = await getAllLenhSanXuat()
        const result = []
        if(!valueTimeRange || !valueMonth || !valueYear){
            message.error('Bắt buộc phải chon kỳ!')
            return
        }
        await listLSX.forEach(v => {
            rowData.forEach(row => {
                if (!isNaN(row?.[v?.code]) && row?.[v?.code] > 0) {
                    result.push({
                        tk_no: '998',
                        tk_co: '1543',
                        kmf: null,
                        lenh_sx: v?.lenh_sx,
                        so_tien_VND: row?.[v?.code],
                        dien_giai: `Kết chuyển Kỳ(${row?.ky})`,
                        day: new Date().getDate(),
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear(),
                        created_at: createTimestamp(),
                        user_create: currentUser.email,
                        ps_no: 0,
                        ps_co: 0,
                        show: true,
                        da_dung_1: `GV3M_(${row?.ky})`
                    })
                }
            })
        })
        const uniqueDaDung1Values = Array.from(new Set(result.map(item => item.da_dung_1)));
        if (uniqueDaDung1Values.length > 0) {
            for (const resultElement of uniqueDaDung1Values) {
                await deleteAccountingJournalByDaDung1(resultElement)
            }
        }

        if(result.length>0){
            try {
                for (const resultElement of result) {
                    await createNewSoKeToan(resultElement)
                }
                message.success('Tạo kết chuyển vào sổ kế toán thành công')
                handleClose()
            }catch (e) {
                message.error('Có lỗi khi tạo kết chuyển vào sổ kế toán')
            }


        }


    };

    const handleCellValueChanged = (event) => {

    };

    const [openView, setIsOpenView] = useState(false);
    const handleOpenView = () => {
        setIsOpenView(true)
    }
    const handleCloseView = () => {
        setIsOpenView(false)
    }

    return (
        <>
            <div className={css.headerPowersheet}>
                {/*<div className={css.headerTitle}>*/}
                {/*    <span>{headerTitle}</span>*/}
                {/*</div>*/}
                <div className={css.headerActionFilter}>
                    {/*<ActionBookMark headerTitle={headerTitle}/>*/}
                    <div className={css.filterDatePicker}>
                        <DatePicker
                            placeholder="Chọn kỳ"
                            onChange={onChangeDatePicker}
                            picker="month"
                            value={valueDate}
                        />
                        {valueDate
                            && (
                                <>
                                    <Segmented
                                        options={[
                                            {label: 'Đủ tháng', value: 'full'},
                                            {label: 'P1', value: 'p1'},
                                            {label: 'P2', value: 'p2'},
                                        ]}
                                        value={valueTimeRange}
                                        onChange={value => setValueTimeRange(value)}
                                    />
                                    {filterMode &&
                                        <Button
                                            onClick={handleClearFilter}
                                        >
                                            Bỏ lọc
                                        </Button>
                                    }
                                </>
                            )
                        }
                    </div>
                </div>

                <div className={css.headerAction}>
                    <ActionKetChuyen open={open} anchorEl={anchorEl} handleCreateToSKT={handleCreateToSKT}
                                     handleClick={handleClick} handleClose={handleClose}/>
                    <ActionViewTPB handleOpenView={handleOpenView}/>
                    {!editMode
                        ? (
                            <Button type="primary" onClick={turnOnEditMode}>Cập nhật</Button>
                        ) : (
                            <>
                                <Button onClick={turnOffEditMode}>Hủy bỏ</Button>
                                <Button type="primary" onClick={handleSaveSetting}>Lưu lại</Button>
                            </>
                        )
                    }
                </div>
            </div>
            <div
                style={{
                    height: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    marginTop: '15px',
                }}
            >
                <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
                    <AgGridReact
                        statusBar={statusBar}
                        enableRangeSelection={true}
                        ref={gridRef}
                        rowData={rowData}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        localeText={AG_GRID_LOCALE_VN}
                        className="ag-theme-quartz"
                        onCellValueChanged={handleCellValueChanged}
                    />
                </div>
            </div>
            {
                openView &&
                <DialogThePhanBo
                    open={openView}
                    onClose={handleCloseView}
                    headerTitle={headerTitle}
                />
            }
        </>
    );
}


