import React, {useEffect, useState, useMemo, useContext} from "react";
import css from './SubStepSheet.module.css';
import {message} from "antd";
import {IconButton, Tooltip, Button} from "@mui/material";
import {evaluate} from 'mathjs';
import {EditIconCoLe, SaveTron} from "../../../../../icon/IconSVG.js";
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import {DANH_MUC_LIST} from "../../../../../Consts/DANH_MUC_LIST.js";
import {MyContext} from "../../../../../MyContext.jsx";
// AG GRID
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import {AgGridReact} from 'ag-grid-react';
//API
import {
    getAllSheet,
    createNewSheet
} from "../../../../../apis/sheetService";
import {
    getAllSheetColumnBySheetId,
    createNewSheetColumn,
    updateSheetColumn
} from "../../../../../apis/sheetColumnService";
import {
    getAllSheetDataBySheetId,
    createNewSheetData,
    updateSheetData,
    deleteSheetData
} from "../../../../../apis/sheetDataService";
import {getAllInput} from "../../../../../apis/inputService.jsx";
import {getAllCardInput} from "../../../../../apis/cardInputService.jsx";
import {updateCardField} from "../logic/updateCardField.js";
// COMPONENT
import SheetColumnModal from "./SheetColumnModal/SheetColumnModal";
import PopupDeleteSubStep from "../../../popUpDelete/popUpDeleteSubStep.jsx";
import {getAllHangHoa} from "../../../../../apis/hangHoaService.jsx";
import {DON_GIA, MASP, THUE} from "./DSSP_COL.js";
import {SA, SB, SC, SE, SD} from "../../../../../Consts/LIST_STEP_TYPE.js";
import {DONE} from "../../../../../Consts/STEP_STATUS.js";
import {TYPE_SHEET} from "../../../../../Consts/SECTION_TYPE.js";
import {getDetailData, getDetailData2} from "../../../formCreate/GomPhieu/logicGom.js";
import {getAllLo} from "../../../../../apis/loService.jsx";
import {getAllKho} from "../../../../../apis/khoService.jsx";
import {getAllCard} from "../../../../../apis/cardService.jsx";
import {getAllStep, getStepDataById} from "../../../../../apis/stepService.jsx";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {useParams} from "react-router-dom";
import {getFullDetailPhieuNhapService} from "../../../../../apis/detailPhieuNhapService.jsx";
import {getFullDetailPhieuXuatService} from "../../../../../apis/detailPhieuXuatService.jsx";
import {getAllCauHinh} from "../../../../../apis/cauHinhService.jsx";
import {getSubStepSheetIdInCardByType} from "../../../../../generalFunction/logicMau/logicMau.js";

const SubStepSheet = ({sub_step_id, listSubStep, permissionsSubStep}) => {
    const {id, idCard, idStep} = useParams();
    const UPDATE_PERMISSION = permissionsSubStep?.update;
    const [sheetData, setSheetData] = useState(null);
    const [formStep, setFormStep] = useState(null);
    const [nhaps, setNhaps] = useState(null);
    const [xuats, setXuats] = useState(null);
    const [cauHinh, setCauHinh] = useState(null);
    const [card, setCard] = useState([]);
    const [step, setStep] = useState(null);
    const [subStepId, setSubStepId] = useState(sub_step_id);
    const [sheets, setSheets] = useState([]);
    const [hhs, setHHs] = useState([]);
    const [los, setLos] = useState([]);
    const [khos, setKhos] = useState([]);
    const [sheetColumns, setSheetColumns] = useState([]);
    const {loadData, setLoadData} = useContext(MyContext);
    const [gridData, setGridData] = useState([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [listInputForGet, setListInputForGet] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [pendingChanges, setPendingChanges] = useState({});
    const [listSP, setListSP] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    useEffect(() => {
        getFullDetailPhieuNhapService().then(data => {
            setNhaps(data);
        })
        getFullDetailPhieuXuatService().then(data => {
            setXuats(data)
        })
        getAllCauHinh().then(data => {
            setCauHinh(data.find(item => item.field == 'Giá bán'));
        })
    }, []);

    function fetchSheets() {
        getAllSheet().then(data => {
            setSheets(data)
        })
    }

    function fetchHHs() {
        getAllHangHoa().then(data => {
            setHHs(data)
        })
    }

    function fetchLos() {
        getAllLo().then(data => {
            setLos(data)
        })
    }

    function fetchKhos() {
        getAllKho().then(data => {
            setKhos(data)
        })
    }

    function fetchCard() {
        getAllCard().then(data => {
            setCard(data.find(item => item.id == idCard))
        })
    }

    function fetchStep() {
        getAllStep().then(data => {
            setStep(data.find(item => item.id == idStep));
        })
    }

    const fetchCurrentUser = async () => {
        const {data} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
        if (idCard) {
            fetchCard();
        }
        if (idStep) {
            fetchStep();
        }
        fetchSheets()
        fetchLos()
        fetchKhos()
        fetchHHs()
        fetchSheets()
        getAllHangHoa().then(data => {
            setListSP(data)
        })

    }, [])

    useEffect(() => {
        const formSubStep = listSubStep.filter(item => item.subStepType == "2");
        setFormStep(formSubStep);
    }, [listSubStep,])

    const defaultColDef = useMemo(() => {
        return {
            editable: true,
            cellStyle: {
                fontSize: '14.5px'
            },
            filter: false,
            suppressMenu: true
        }
    }, []);

    const getAllInputOfTemp = async () => {
        let inputs = await getAllInput();
        let cardInputs = await getAllCardInput();
        const filteredInputs = inputs.filter(item =>
            formStep.some(form => form.id == item.sub_step_id)
        );
        const filteredCardInputs = cardInputs.filter(item => item.card_id == idCard);

        const mergedInputs = filteredInputs.map(input => {
            const matchingCardInput = filteredCardInputs.find(cardInput => cardInput.input_id == input.id);
            return {
                ...input,
                value: matchingCardInput ? matchingCardInput.value : null
            };
        });

        setListInputForGet(mergedInputs);
        return mergedInputs;
    };

    useEffect(() => {
        if (formStep) {
            getAllInputOfTemp();
        }
    }, [subStepId, formStep])

    useEffect(()=> {
        if (step && (step.type == SC  || step.type == SE)) {
            let dsspId = getSubStepSheetIdInCardByType(card, SA);
            if (dsspId) {
                setSubStepId(dsspId);
            }
        }
    }, [step, card, idStep])
    useEffect(() => {
        loadSheetData();
    }, [subStepId, idCard, refreshTrigger],);

    const loadSheetData = async () => {
        try {
            const sheets = await getAllSheet();
            const existingSheet = sheets.find(sheet => sheet.sub_step_id === subStepId && sheet.card_id == idCard);
            let sheet;
            if (existingSheet) {
                setSheetData(existingSheet);
                sheet = existingSheet;
            } else {
                const templateSheet = sheets.find(sheet => sheet.sub_step_id === subStepId && sheet.card_id == null);
                const {id, ...templateSheetData} = templateSheet || {};
                const newSheet = {
                    ...templateSheetData,
                    card_id: idCard,
                    position: 0,
                };
                const createdSheet = await createNewSheet(newSheet);
                setSheetData(createdSheet);
                sheet = createdSheet;
                const templateSheetColumns = await getAllSheetColumnBySheetId(id);
                templateSheetColumns.forEach(async (column) => {
                    const {id, ...columnData} = column;
                    await createNewSheetColumn({
                        ...columnData,
                        sheet_id: createdSheet.id,
                        clone_id: id,
                    });
                });
            }
            const fetchedSheetColumns = await getAllSheetColumnBySheetId(sheet.id);
            const sortedColumns = fetchedSheetColumns.sort((a, b) => a.order - b.order);
            setSheetColumns(sortedColumns);
            const fetchedSheetData = await getAllSheetDataBySheetId(sheet.id);
            const rows = fetchedSheetData.map((row) => ({
                ...row.data,
                id: row.id
            }));
            setRowData(rows);
            setGridData(fetchedSheetData);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error);
        }
    };

    const handleRefreshData = async () => {
        setIsLoading(true);
        try {
            setRefreshTrigger(prev => prev + 1);
            setColDefs([]);
            if (formStep) {
                await getAllInputOfTemp();
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNewRow = async () => {
        if (!sheetData) return;

        try {
            const defaultData = {};
            sheetColumns.forEach(column => {
                switch (column.type) {
                    case 'text':
                        defaultData[column.name] = '';
                        break;
                    case 'number':
                        defaultData[column.name] = null;
                        break;
                    case 'date':
                        defaultData[column.name] = null;
                        break;
                    default:
                        defaultData[column.name] = '';
                }
            });
            const newRowData = {
                sheet_id: sheetData.id,
                data: defaultData,
                show: true
            };
            await createNewSheetData(newRowData);
            loadSheetData();
        } catch (error) {
            console.error('Error adding new row:', error);
        }
    };

    const handleColumnMoved = async (event) => {
        try {
            const currentColumns = event.api.getColumnState();
            const updatedColumns = currentColumns.map((colState, index) => {
                const originalColumn = sheetColumns.find(c => c.name === colState.colId);
                return {
                    ...originalColumn,
                    order: index
                };
            });
            await Promise.all(
                updatedColumns.map(column =>
                    updateSheetColumn({id: column.id, order: column.order})
                )
            );
        } catch (error) {
            console.error('Error updating column order:', error);
        }
    };

    const onColumnResized = async (event) => {
        if (event.finished) {
            const resizedColumn = sheetColumns.find(column => column.name === event.column.getColId());
            if (resizedColumn) {
                await updateSheetColumn({id: resizedColumn.id, columnWidth: event.column.getActualWidth()})
            }
        }
    };

    const handleSaveAllChanges = async () => {
        setIsLoading(true);
        try {
            const changedRows = Object.keys(pendingChanges).map(id => {
                const rowChanges = pendingChanges[id];
                // For each formula column, ensure we're using the calculated value
                sheetColumns.forEach(column => {
                    if (column.type === 'formula' && rowChanges[column.name] === '') {
                        // Recalculate the formula value
                        const gridRow = rowData.find(row => row.id === parseInt(id));
                        if (gridRow) {
                            const scope = column.formulaSetting.variables.reduce((acc, curr) => {
                                const key = Object.keys(curr)[0];
                                const value = gridRow[curr[key]];
                                acc[key] = value === null || value === undefined
                                    ? 0
                                    : typeof value === 'string'
                                        ? (
                                            value == '-'
                                                ? 0
                                                : (isNaN(parseFloat(value.replace(/,/g, '')))
                                                    ? NaN
                                                    : parseFloat(value.replace(/,/g, '')))
                                        )
                                        : Number(value);
                                return acc;
                            }, {});

                            try {
                                const result = evaluate(column.formulaSetting.formula, scope);
                                rowChanges[column.name] = isNaN(result) ? NaN : result;
                            } catch (error) {
                                console.error('Formula recalculation error:', error);
                            }
                        }
                    }
                });

                return {
                    id: parseInt(id),
                    data: rowChanges
                };
            });

            if (changedRows.length > 0) {
                await Promise.all(changedRows.map(row =>
                    updateSheetData({id: row.id, data: row.data})
                ));
                await updateCardField(idCard, 'sheet');
                await loadSheetData();
                setPendingChanges({});
                message.success(`Saved ${changedRows.length} row(s)`);
            }
            setLoadData(!loadData);
        } catch (error) {
            console.error('Error saving changes:', error);
            message.error('Failed to save changes');
        } finally {
            setIsLoading(false);
        }
    };

    const saveChanges = async (changedRows) => {
        try {
            await Promise.all(changedRows.map(row =>
                updateSheetData({ id: row.id, data: row.data })
            ));
            await updateCardField(idCard, 'sheet');
            await loadSheetData();
            setPendingChanges({});
            message.success(`Saved ${changedRows.length} row(s)`);
        } catch (error) {
            console.error('Error saving changes:', error);
            message.error('Failed to save changes');
        }
    };

    const handleCellValueChanged = async (event) => {
        const { data, column } = event;
        const { id, ...updatedData } = data;
        const columnDef = sheetColumns.find(col => col.name === column.getColId());
        let isMaSP = false;

        if (columnDef.name === MASP) {
            isMaSP = true;
            let codeSP = updatedData[MASP];
            let sp = listSP.find(item => item.code == codeSP);
            if (sp) {
                updatedData[DON_GIA] = sp.gia_ban;
                updatedData[THUE] = sp.thue_vat;
            }
        }

        if (columnDef && columnDef.type === 'formula') {
            const calculatedValue = event.api.getValue(column, data);

            setPendingChanges(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    [column.getColId()]: calculatedValue
                }
            }));
        } else {
            setPendingChanges(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    ...updatedData
                }
            }));
        }

        if (isMaSP) {
            const changedRows = [
                {
                    id: parseInt(id),
                    data: { ...updatedData, ...pendingChanges[id] }
                }
            ];
            await saveChanges(changedRows);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                let colDefs = [
                    {
                        hide: !UPDATE_PERMISSION,
                        pinned: 'left',
                        width: '40',
                        field: 'delete',
                        suppressHeaderMenuButton: true,
                        cellStyle: {textAlign: 'center'},
                        headerName: '',
                        cellRenderer: (params) => {
                            if (!params.data || !params.data.id) {
                                return null;
                            }
                            return (
                                <PopupDeleteSubStep
                                    id={params.data.id}
                                    reload={loadSheetData}
                                />
                            );
                        },
                        editable: false,
                    },
                ];
                const sortedColumns = [...sheetColumns].sort((a, b) =>
                    (a.order || 0) - (b.order || 0)
                );
                for (const column of sortedColumns) {
                    const col = {
                        field: column.name,
                        width: column.columnWidth ? column.columnWidth : 100,
                        cellEditor: 'agTextCellEditor',
                        cellStyle: (params) => ({
                            fontSize: '14.5px'
                        }),
                        editable: (params) => {
                            if (!params.data || !UPDATE_PERMISSION) return false;
                            const column = sheetColumns.find(col => col.columnName === params.colDef.field);
                            if (!column) return true;
                            return true;
                        },
                    };

                    const originalCellStyle = col.cellStyle;

                    if (column.type === 'number') {
                        col.cellEditor = 'agNumberCellEditor';
                        col.valueFormatter = (params) => {
                            if (params.value === null || params.value === undefined || params.value == 0) return '-';
                            return Number(params.value).toLocaleString('en-US', {useGrouping: true});
                        };
                        col.cellStyle = params => {
                            const originalStyles = originalCellStyle(params);
                            return {
                                ...originalStyles,
                                textAlign: 'right'
                            };
                        };
                        col.valueParser = params => {
                            if (typeof params.newValue === 'string') {
                                const cleanValue = params.newValue.replace(/,/g, '');
                                return isNaN(parseFloat(cleanValue)) ? 0 : parseFloat(cleanValue);
                            }
                            return params.newValue;
                        };
                    }

                    if (column.type === 'date') {
                        col.cellRenderer = (params) => {
                            if (params.value) {
                                const date = new Date(params.value);
                                return date.toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                });
                            }
                            return '';
                        };

                        col.cellEditor = 'agDateCellEditor';
                        col.cellEditorParams = {
                            formatString: 'dd/MM/yyyy',
                            minDate: new Date('1900-01-01'),
                            maxDate: new Date('2100-12-31')
                        };
                        col.valueParser = params => {
                            return new Date(params.newValue);
                        }
                    }

                    if (column.type === 'formula') {
                        col.cellEditor = 'agNumberCellEditor';
                        col.aggFunc = 'sum';
                        col.valueGetter = (params) => {
                            try {
                                const scope = column.formulaSetting.variables.reduce((acc, curr) => {
                                    const key = Object.keys(curr)[0];
                                    const value = params.data[curr[key]];
                                    acc[key] = value === null || value === undefined
                                        ? 0
                                        : typeof value === 'string'
                                            ? (
                                                value == '-'
                                                    ? 0
                                                    : (isNaN(parseFloat(value.replace(/,/g, '')))
                                                        ? NaN
                                                        : parseFloat(value.replace(/,/g, '')))
                                            )
                                            : Number(value);

                                    return acc;
                                }, {});

                                if (Object.values(scope).some(val => isNaN(val))) {
                                    return NaN;
                                }

                                const result = evaluate(column.formulaSetting.formula, scope);
                                return isNaN(result) ? NaN : result;
                            } catch (error) {
                                console.error('Formula evaluation error:', error);
                                return NaN;
                            }
                        };
                        col.valueFormatter = (params) => {
                            if (params.value === null || params.value === undefined || isNaN(params.value)) {
                                return 'NaN';
                            }
                            return params.value === 0 ? '-' : params.value.toLocaleString('en-US', {useGrouping: true});
                        };
                        col.valueParser = (params) => {
                            if (params.newValue === null || params.newValue === undefined || params.newValue === '') {
                                return NaN;
                            }
                            return Number(params.newValue.replace(/,/g, ''));
                        };

                        col.editable = false;
                        col.cellStyle = params => {
                            const originalStyles = originalCellStyle(params);
                            return {
                                ...originalStyles,
                                textAlign: 'right'
                            };
                        };
                    }

                    if (column.type === 'formula-input') {
                        if (listInputForGet.length == 0) return
                        col.cellEditor = 'agNumberCellEditor';
                        col.aggFunc = 'sum';
                        col.valueGetter = (params) => {
                            try {
                                const scope = column.formulaInputSetting.variables.reduce((acc, curr) => {
                                    const key = Object.keys(curr)[0];
                                    const variant = listInputForGet.find(item => item.id == curr[key])
                                    const value = variant.value;
                                    acc[key] = value === null || value === undefined
                                        ? 0
                                        : typeof value === 'string'
                                            ? (
                                                value == '-'
                                                    ? 0
                                                    : (isNaN(parseFloat(value.replace(/,/g, '')))
                                                        ? NaN
                                                        : parseFloat(value.replace(/,/g, '')))
                                            )
                                            : Number(value);

                                    return acc;
                                }, {});

                                if (Object.values(scope).some(val => isNaN(val))) {
                                    return NaN;
                                }

                                const result = evaluate(column.formulaInputSetting.formula, scope);
                                return isNaN(result) ? NaN : result;
                            } catch (error) {
                                console.error('Formula evaluation error:', error);
                                return NaN;
                            }
                        };
                        col.valueFormatter = (params) => {
                            if (params.value === null || params.value === undefined || isNaN(params.value)) {
                                return 'NaN';
                            }
                            return params.value === 0 ? '-' : params.value.toLocaleString('en-US', {useGrouping: true});
                        };
                        col.valueParser = (params) => {
                            if (params.newValue === null || params.newValue === undefined || params.newValue === '') {
                                return NaN;
                            }
                            return Number(params.newValue.replace(/,/g, ''));
                        };

                        col.editable = false;
                        col.cellStyle = params => {
                            const originalStyles = originalCellStyle(params);
                            return {
                                ...originalStyles,
                                textAlign: 'right'
                            };
                        };
                    }

                    if (column.type === 'vlookup') {
                        let isMaSP = column.name === 'Mã SP';
                        let lookUpOption = [];
                        let lookUpData = [];
                        let itemKey = '';
                        let itemName = 'name'; // Định nghĩa key cho tên sản phẩm.

                        if (column.vLookupSetting?.key) {
                            lookUpOption = DANH_MUC_LIST.find(item => item.key == column.vLookupSetting.key);
                            lookUpData = await lookUpOption.getAllApi();
                            itemKey = column.vLookupSetting.item; // Key chính để lưu.
                        }

                        col.cellEditor = 'agSelectCellEditor';

                        col.cellEditorParams = {
                            values: isMaSP
                                ? lookUpData.map(item => `${item[itemKey]}|${item[itemName]}`)
                                : lookUpData.map(item => item[itemKey]),
                        };

                        col.valueFormatter = (params) => {
                            if (!params.value) return '';
                            if (isMaSP) {
                                const selectedItem = lookUpData.find(item => item[itemKey] === params.value);
                                return selectedItem ? `${selectedItem[itemKey]}|${selectedItem[itemName]}` : params.value;
                            }
                            return String(params.value);
                        };

                        col.valueParser = (params) => {
                            if (isMaSP && params.newValue && params.newValue.includes('|')) {
                                const [key] = params.newValue.split('|');
                                return key;
                            }
                            return params.newValue ? String(params.newValue) : null;
                        };

                        col.onCellValueChanged = (event) => {
                            if (isMaSP && event.newValue.includes('|')) {
                                event.data[MASP] = event.newValue.split('|')[0];
                            }
                        };
                    }


                    colDefs.push(col);
                }
                setColDefs(colDefs);
            } catch (error) {
                console.error('Error setting column definitions:', error);
                message.error('Error setting up columns');
            }
        };

        fetchData();
    }, [sheetColumns, listInputForGet, refreshTrigger]);

    return (
        <div className={css.container}>
            <div className={css.settingsWrapper}>
                {UPDATE_PERMISSION
                    ? (
                        <>
                            <Tooltip title="Chỉnh sửa cột" >
                                <IconButton onClick={() => setIsSettingsOpen(true)} size="small">
                                    <img src={EditIconCoLe} alt="Edit Columns"/>
                                </IconButton>
                            </Tooltip>
                            <div className={css.actionButtons} style={{display: 'flex'}}>
                                <Tooltip title="Thêm dòng mới" >
                                    <IconButton
                                        onClick={handleAddNewRow}
                                        size="small"
                                        disabled={isLoading}
                                    >
                                        <AddIcon/>
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Cập nhật dữ liệu" >
                                    <IconButton
                                        onClick={handleRefreshData}
                                        size="small"
                                        disabled={isLoading}
                                    >
                                        <RefreshIcon/>
                                    </IconButton>
                                </Tooltip>

                                {Object.keys(pendingChanges).length > 0 && (
                                    <Tooltip title="Lưu thay đổi" >
                                        {/* <IconButton
                                onClick={handleSaveAllChanges}
                                size="small"
                                disabled={isLoading}
                                color="primary"
                            >
                                <SaveIcon />
                            </IconButton> */}
                                        <div className={'save-btn'} onClick={handleSaveAllChanges}>
                                            <img src={SaveTron} alt=""/> Lưu
                                        </div>
                                    </Tooltip>
                                )}
                            </div>
                        </>
                    )
                    : (<></>)
                }

                {isSettingsOpen && sheetData && listInputForGet && (
                    <SheetColumnModal
                        sheetId={sheetData.id}
                        loadSheetData={loadSheetData}
                        onClose={() => setIsSettingsOpen(false)}
                        sub_step_id={subStepId}
                        formStep={formStep}
                        listInputForGet={listInputForGet}
                        DANH_MUC_LIST={DANH_MUC_LIST}
                    />
                )}
            </div>

            <div className={`ag-theme-quartz ${css.gridContainer}`}>
                <AgGridReact
                    statusBar={statusBar}
                    rowData={rowData}
                    defaultColDef={defaultColDef}
                    columnDefs={colDefs}
                    enableRangeSelection={true}
                    suppressContextMenu={true}
                    suppressCellSelection={true}
                    onColumnMoved={handleColumnMoved}
                    onColumnResized={onColumnResized}
                    suppressMovableColumns={false}
                    onCellValueChanged={handleCellValueChanged}
                    loading={isLoading}
                />
            </div>
        </div>
    );
};

export default SubStepSheet;
