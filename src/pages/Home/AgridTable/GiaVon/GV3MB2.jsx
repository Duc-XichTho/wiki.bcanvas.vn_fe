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
import ActionBookMark from "../actionButton/ActionBookMark.jsx";
import {GV3M_TITLE} from "../../../../Consts/TITLE_HEADER.js";
import {
    createNewSoKeToan,
    deleteAccountingJournalByDaDung1,
    getAllSoKeToan
} from "../../../../apis/soketoanService.jsx";
import {createNewPBGV3, getAllPBGV3, updatePBGV3} from "../../../../apis/pbgv3Service.jsx";
import {getAllCCPB} from "../../../../apis/ccpbService.jsx";
import {getAllPBGV2B} from "../../../../apis/pbgv2BService.jsx";
import {getSettingByType} from "../../../../apis/settingService.jsx";
import {genDataM, isEditable, mergeDataGV3M, processDataGV3M} from "./logicGV3M.js";
import {CPB, LSX, LSXD} from "../../../../Consts/GIA_VON.js";
import {Button, DatePicker, message, Segmented, Typography} from "antd";
import {getAllLenhSanXuat, getLenhSanXuatSPByLSXId} from "../../../../apis/lenhSanXuatService.jsx";
import {calculateTotal} from "../SoLieu/CDPS/logicCDPS.js";
import {getAllHangHoa} from "../../../../apis/hangHoaService.jsx";
import {createNewPBLSX, getAllPBLSX, updatePBLSX} from "../../../../apis/pblsxService.jsx";
import {getAllDinhMucNLBySPId, getAllDinhMucSP} from "../../../../apis/dinhMucBomService.jsx";
import {getCurrentUserLogin} from "../../../../apis/userService.jsx";
import Menu from "@mui/material/Menu";
import LSXSelect from "../../SelectComponent/LSXSelect.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function GV3MB2() {
    const headerTitle = GV3M_TITLE;
    const table = 'GV3M';
    const tableCol = 'GV3MCol';
    const tableFilter = 'GV3MFilter';
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [dataSoKeToan, setDataSoKeToan] = useState([]);
    const [dataPBGV3, setDataPBGV3] = useState([]);
    const [dataPBLSX, setDataPBLSX] = useState([]);
    const [dataPBGV2B, setDataPBGV2B] = useState([]);
    const [dataCCPB, setCCPB] = useState([]);
    const [dataLSX, setLSX] = useState([]);
    const [dataHH, setHH] = useState([]);
    const [dataSettingPPTGT, setDataSettingPPTGT] = useState({});
    const [isStatusFilter, setIsStatusFilter] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedLSX, setSelectedLSX] = useState(null);
    const [selectedPBLSX, setSelectedPBLSX] = useState(null);
    const [valueTimeRange, setValueTimeRange] = useState('full');
    const [filterMode, setFilterMode] = useState(false);
    const [valueDate, setValueDate] = useState(null);
    const [valueMonth, setValueMonth] = useState(null);
    const [valueYear, setValueYear] = useState(null);


    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const [currentUser, setCurrentUser] = useState(null);

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
    const fetchAllPBLSX = () => {
        try {
            getAllPBLSX().then(e => setDataPBLSX(e))
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
    const fetchAllHH = () => {
        try {
            getAllHangHoa().then(e => setHH(e))
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

    const defaultColDef = useMemo(() => ({
        editable: false,
        filter: true,
        suppressMenu: true,
        width: 160,
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

    function genKy(ky, month, year) {
        return ky.toUpperCase() + '_T' + month + '_' + year;
    }

    async function loadData() {
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
        let dataGVM2 = newData.filter(item => item.mo_hinh_tinh_gia === CPB);
        dataGVM2 = mergeDataGV3M(dataGVM2, dataPBGV2B, dataCCPB)
        let dataW = newData.filter(item => item.mo_hinh_tinh_gia === LSX);
        dataGVM2 = [...processDataGV3M(dataW), ...dataGVM2]
        if (selectedLSX) {
            let lsx = dataLSX.find(e => e.code == selectedLSX);
            lsx.total = calculateTotal(dataGVM2, selectedLSX);
            setSelectedPBLSX(lsx)
            let rowData = []
            let rowData2 = []
            let ky = genKy(valueTimeRange, valueMonth, valueYear);
            let pblsx = dataPBLSX.find(e => e.ky == ky && e.LSX == selectedLSX);
            if (pblsx) {
                rowData = pblsx.PBSP
                rowData.forEach(item => {
                    let hh = dataHH.find(e => e.code == item.code);
                    if (hh) {
                        item.name = hh.name
                    }
                });
            } else {
                let lsxSPs = await getLenhSanXuatSPByLSXId(lsx.id);
                for (const item of lsxSPs) {
                    let hh = dataHH.find(e => e.id == item.idSP);
                    let dinhMucs = await getAllDinhMucSP();
                    let dinhMuc = dinhMucs.find(item => item.idHangHoa == hh.id);
                    let nls = await getAllDinhMucNLBySPId(dinhMuc?.id || 0)
                    nls.forEach(nl => {
                        let hhnl = dataHH.find(e => e.id == nl.idNL)
                        if (hhnl) {
                            nl.cf = hhnl.gia_ban * nl.SoLuong;
                        }
                    })
                    let pb = calculateTotal(nls, 'cf')
                    if (hh) {
                        rowData2.push({
                            code: hh.code,
                            name: hh.name,
                            pb: pb * item.SoLuong,
                            sl: item.SoLuong,
                            ky: item?.ky
                        })
                    }
                }
            }
            rowData2.forEach(item => {
                if (!rowData.find(row => row.code == item.code)) {
                    rowData.push(item)
                }
            })
            let totalTyLe = calculateTotal(rowData, 'pb')
            rowData.forEach(item => {
                item.cf = lsx.total * item.pb / totalTyLe;
                item.dg = item.cf / item.sl;
            })
            setRowData(rowData)
        }
    }

    const isNull = (field) => {
        return field == null || field == "" ? '-' : field
    }

    const fetchData = async () => {
        try {
            setColDefs([
                {
                    field: 'code',
                    headerName: 'Mã hàng hóa',
                    ...filter,
                    cellRenderer: params => isNull(params.value),
                },
                {
                    field: 'name',
                    headerName: 'Tên hàng hóa',
                    ...filter,
                    cellRenderer: params => isNull(params.value),
                },
                {
                    field: 'pb',
                    headerName: 'Tỷ lệ phân bổ',
                    cellStyle: {textAlign: 'right'},
                    headerClass: 'right-align-important',
                    ...filter,
                    cellRenderer: params => formatMoney(params.value),
                    editable: (params) => editMode,
                },
                // {
                //     field: 'cf',
                //     headerName: 'Tổng CF'
                //     , ...filter,
                //     cellStyle: {textAlign: 'right'},
                //     headerClass: 'right-align-important',
                //     cellRenderer: params => formatMoney(params.value)
                // },
                {
                    field: 'sl',
                    headerName: 'Tổng SL thành phẩm',
                    ...filter,
                    cellStyle: {textAlign: 'right'},
                    headerClass: 'right-align-important',
                    cellRenderer: params => formatMoney(params.value)
                },
                {
                    field: 'dg',
                    headerName: 'Đơn giá SX',
                    ...filter,
                    cellStyle: {textAlign: 'right'},
                    headerClass: 'right-align-important',
                    cellRenderer: params => formatMoney(params.value)
                },
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
        fetchAllHH()
        fetchAllPBLSX();
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        loadData()
        fetchData();
    }, [dataSoKeToan, isStatusFilter, editMode, dataPBGV3, dataPBGV2B, dataSettingPPTGT, dataCCPB, dataLSX, selectedLSX, dataHH, valueTimeRange, valueMonth, valueYear, filterMode, dataPBLSX]);

    const handleSaveSetting = async () => {
        let ky = genKy(valueTimeRange, valueMonth, valueYear);
        try {
            let allRowData = [];
            if (gridRef.current) {
                gridRef.current.api.forEachNode(node => allRowData.push(node.data));
            }
            const payload = allRowData.map(row => {
                return {
                    code: row.code,
                    pb: row.pb,
                    sl: row.sl
                };
            });
            let pblsx = dataPBLSX.find(e => e.ky == ky && e.LSX == selectedLSX);
            if (pblsx) {
                await updatePBLSX({...pblsx, PBSP: payload})
                await fetchAllPBLSX();
            } else {
                await createNewPBLSX({LSX: selectedLSX, ky: ky, PBSP: payload});
                await fetchAllPBLSX();
            }
            message.success('Cập nhật thành công');
            turnOffEditMode();
        } catch (error) {
            console.error('Có lỗi rồi TUẤN ơi !!!:', error);
        }
    };

    const handleCellValueChanged = (event) => {

    };

    function handleChangeLSX(value) {
        setSelectedLSX(value)
    }

    const handleClearFilter = () => {
        setFilterMode(false);
        setValueDate(null);
        setValueMonth(null);
        setValueYear(null);
    };

    const handleCreateToSKT = async () => {
        const result = []
        if (!valueTimeRange || !valueMonth || !valueYear) {
            message.error('Bắt buộc phải chon kỳ!')
            return
        }
        rowData.forEach(row => {
            if (row?.code && parseInt(row?.dg) > 0) {
                result.push({
                    tk_no: '998',
                    tk_co: '1543',
                    kmf: null,
                    dien_giai: `Kết chuyển sản phẩm Kỳ(${genKy(valueTimeRange, valueMonth, valueYear)})`,
                    day: new Date().getDate(),
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                    created_at: createTimestamp(),
                    user_create: currentUser.email,
                    so_tien_VND: row?.dg,
                    ps_no: 0,
                    ps_co: 0,
                    show: true,
                    da_dung_1: `GV3M2B_(${genKy(valueTimeRange, valueMonth, valueYear)})`
                })
            }
        })

        const uniqueDaDung1Values = Array.from(new Set(result.map(item => item.da_dung_1)));
        if (uniqueDaDung1Values.length > 0) {
            for (const resultElement of uniqueDaDung1Values) {
                await deleteAccountingJournalByDaDung1(resultElement)
            }
        }
        if (result.length > 0) {
            try {
                for (const resultElement of result) {
                    await createNewSoKeToan(resultElement)
                }
                message.success('Tạo kết chuyển vào sổ kế toán thành công')
                handleClose()
            } catch (e) {
                message.error('Có lỗi khi tạo kết chuyển vào sổ kế toán')
            }
        }


    };

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
                    {selectedPBLSX && <div style={{fontWeight : 450 , fontSize : '18px'}}>{formatMoney(selectedPBLSX.total)}</div>}
                    <LSXSelect dataLSX={dataLSX} selectedLSX={selectedLSX} handleChangeLSX={handleChangeLSX}/>
                    <Button type="default" variant="outlined" onClick={handleClick}>Kết chuyển</Button>
                    <Menu
                        id="basic-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        MenuListProps={{
                            'aria-labelledby': 'basic-button',
                        }}
                        sx={{alignItems: 'center', top: '5px'}}
                    >
                        <div style={{
                            width: '250px',
                            height: '50px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: "center",
                        }}>
                            <Typography>Bạn có muốn kết chuyển không?</Typography>
                        </div>

                        <div style={{
                            width: '250px',
                            height: '30px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: "center",
                            gap: '20px'
                        }}>
                            <Button color={'primary'} variant={'solid'} onClick={handleCreateToSKT}>Kết chuyển</Button>
                            <Button color="danger" variant={'solid'} onClick={handleClose}>Hủy</Button>
                        </div>

                    </Menu>
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
        </>
    );
}

