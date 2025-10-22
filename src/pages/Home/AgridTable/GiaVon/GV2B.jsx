import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// Ag Grid Function
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
import '../agComponent.css';
import AG_GRID_LOCALE_VN from '../locale.jsx';
import { formatMoney } from "../../../../generalFunction/format.js";
import css from "./GV2B.module.css";
import ActionBookMark from "../actionButton/ActionBookMark.jsx";
import { GV2B_TITLE } from "../../../../Consts/TITLE_HEADER.js";
import { getAllSoKeToan, updateSoKeToan } from "../../../../apis/soketoanService.jsx";
import { getSettingByType } from "../../../../apis/settingService.jsx";
import {Button, DatePicker, message, Segmented} from "antd";
import { getAllPBGV2B, createNewPBGV2B, updatePBGV2B } from "../../../../apis/pbgv2BService.jsx";
import {getCurrentUserLogin} from "../../../../apis/userService.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function GV2B() {
    const headerTitle = GV2B_TITLE;
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [dataSoKeToan, setDataSoKeToan] = useState([]);
    const [dataPBGV2B, setDataPBGV2B] = useState([]);
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
    const fetchAllPBGV2B = async () => {
        try {
            const data = await getAllPBGV2B();
            setDataPBGV2B(data);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error);

        }
    }

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

    const fetchSettingPPTGT = async () => {
        try {
            const data = await getSettingByType('PhuongPhapTinhGiaThanh');
            setDataSettingPPTGT(data);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            await fetchSettingPPTGT();
            await fetchAllSoKeToan();
            await fetchAllPBGV2B();
            await fetchCurrentUser()
        };
        fetchData();
    }, []);

    const handleChangeStatusFilter = () => {
        setIsStatusFilter(!isStatusFilter);
    };

    const defaultColDef = useMemo(() => ({
        editable: false,
        filter: true,
        suppressMenu: true,
        cellStyle: { fontSize: '14.5px' },
    }), []);

    const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);

    const filter = useMemo(() => {
        if (isStatusFilter) {
            return {
                filter: 'agMultiColumnFilter',
                floatingFilter: true,
                filterParams: {
                    filters: [
                        { filter: 'agTextColumnFilter' },
                        { filter: 'agSetColumnFilter' },
                    ],
                },
            };
        }
        return {};
    }, [isStatusFilter]);

    const initialValue = (text, record) => {
        if (!dataSettingPPTGT || !dataSettingPPTGT.setting) return "Chưa phân bổ";

        const { month, vu_viec_code, lenh_sx } = record;

        const monthKey = month ? Number(month).toString() : null;

        const dataSettingVuViec = dataSettingPPTGT.setting.find(item => item.code === "W");
        const dataSettingLenhSX = dataSettingPPTGT.setting.find(item => item.code === "M");

        if (dataSettingLenhSX && dataSettingLenhSX.thoigian[monthKey] && lenh_sx) {
            return "Lệnh SX";
        }

        if (dataSettingVuViec && dataSettingVuViec.thoigian[monthKey] && vu_viec_code) {
            return "Vụ việc";
        }

        return "Chưa phân bổ";
    };

    const mapDataToHeaders = (dataSoKeToan, dataPBGV2B) => {
        let newData = dataSoKeToan.map((item) => {

            const existingItem = dataPBGV2B.find(pbItem => pbItem.TK === item.tk_co && pbItem.KMF === item.kmf);
            return {
                "id": item.id,
                'tk_co': item.tk_co,
                'month': item.month,
                'year': item.year,
                'day': item.day,
                'ky': `${item?.day<=15?'P1':'P2'}_T${parseInt(item?.month)}_${item?.year}`,
                'so_tien_VND': item.so_tien_VND,
                'kmf': item.kmf,
                'mo_hinh_tinh_gia': initialValue('', item),
                'w': existingItem ? existingItem.W : null,
                'm': existingItem ? existingItem.M : null,
            };
        });
        if (valueYear && valueMonth && valueTimeRange) {
            newData = newData.filter(item => item.month == valueMonth && item.year == valueYear);
            setFilterMode(true);
            if (valueTimeRange == 'p1') {
                newData = newData.filter(item => parseInt(item.day) <= 15);
            } else if (valueTimeRange == 'p2') {
                newData = newData.filter(item => parseInt(item.day) > 15);
            }
        }
        newData = newData.filter(item => item.mo_hinh_tinh_gia === "Chưa phân bổ");
        newData = newData.reduce((acc, current) => {
            const existing = acc.find(item => item.tk_co === current.tk_co && item.kmf === current.kmf);

            if (existing) {
                existing.so_tien_VND = (parseFloat(existing.so_tien_VND) + parseFloat(current.so_tien_VND)).toString();
            } else {
                acc.push({ ...current });
            }

            return acc;
        }, []);

        return newData;
    };

    const isNull = (field) => {
        return field == null || field == "" ? '-' : field
    }

    const fetchData = async () => {
        try {
            setRowData(mapDataToHeaders(dataSoKeToan, dataPBGV2B));
            setColDefs([
                {
                    field: 'id',
                    headerName: 'ID',
                    hide: true
                },

                {
                    field: 'tk_co',
                    headerName: 'TK',
                    width: 100, ...filter,
                    cellRenderer: params => isNull(params.value),

                },
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
                    cellStyle: { textAlign: 'right' },
                    headerClass: 'right-align-important',
                    cellRenderer: params => formatMoney(params.value)
                },
                {
                    field: 'w',
                    headerName: 'W',
                    editable: editMode,
                    width: 120, ...filter,
                    cellStyle: { textAlign: 'right' },
                    headerClass: 'right-align-important',
                    cellRenderer: params => isNull(params.value),
                },
                {
                    field: 'm',
                    headerName: 'M',
                    editable: editMode,
                    width: 120, ...filter,
                    cellStyle: { textAlign: 'right' },
                    headerClass: 'right-align-important',
                    cellRenderer: params => isNull(params.value),
                },
            ]);
        } catch (error) {
            console.log('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dataSoKeToan, dataPBGV2B, editMode, valueYear, valueMonth, valueTimeRange, filterMode,]);

    const turnOnEditMode = () => {
        setEditMode(true);
    };

    const turnOffEditMode = () => {
        setEditMode(false);
    };

    const handleClearFilter = () => {
        setFilterMode(false);
        setValueDate(null);
        setValueMonth(null);
        setValueYear(null);
    };

    const handleSaveSetting = async () => {
        try {
            let allRowData = [];
            if (gridRef.current) {
                gridRef.current.api.forEachNode(node => allRowData.push(node.data));
            }
            const payload = allRowData.map(row => {
                return {
                    TK: row.tk_co,
                    KMF: row.kmf,
                    W: row.w,
                    M: row.m,
                };
            });

            for (const row of payload) {
                if (dataPBGV2B.length === 0) {
                    await createNewPBGV2B(row);
                    await fetchAllPBGV2B();
                    continue;
                }
                const existingRow = dataPBGV2B.find(item => item.TK === row.TK && item.KMF === row.KMF);
                if (existingRow) {
                    await updatePBGV2B({ ...row, id: existingRow.id });
                    await fetchAllPBGV2B();
                } else {
                    await createNewPBGV2B(row);
                    await fetchAllPBGV2B();
                }
            }

            message.success('Cập nhật thành công');
            turnOffEditMode();
        } catch (error) {
            console.error('Có lỗi rồi TUẤN ơi !!!:', error);
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
                                    {/*<Button*/}
                                    {/*    type="primary"*/}
                                    {/*    onClick={handleActiveFilterMode}*/}
                                    {/*>*/}
                                    {/*    Lọc*/}
                                    {/*</Button>*/}
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
                <div class={css.headerAction}>
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
                <div style={{height: '100%', width: '100%'}}>
                    <AgGridReact
                        statusBar={statusBar}
                        enableRangeSelection={true}
                        ref={gridRef}
                        rowData={rowData}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        localeText={AG_GRID_LOCALE_VN}
                        className="ag-theme-quartz"
                    />
                </div>
            </div>
        </>
    );
}
