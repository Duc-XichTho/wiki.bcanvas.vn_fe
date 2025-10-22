import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import css from './SubStepDKPro.module.css';
import {Button, ConfigProvider, message} from "antd";
import {IconButton, Tooltip} from "@mui/material";
import {SaveTron} from "../../../../../icon/IconSVG";
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import {MyContext} from "../../../../../MyContext.jsx";
// CONSTANT
import {TYPE_SHEET} from '../../../../../Consts/SECTION_TYPE.js';
import {DANH_MUC_LIST} from '../../../../../Consts/DANH_MUC_LIST.js';
import {SETTING_TYPE} from '../../../../../CONST.js';
// FUNCTION
// COMPONENT
import PopupDeleteRenderer from './popUpDeleteRenderer/popUpDeleteRenderer.jsx';
// AG GRID
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {ModuleRegistry} from '@ag-grid-community/core';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {AgGridReact} from 'ag-grid-react';
import AG_GRID_LOCALE_VN from '../../../AgridTable/locale.jsx';
// API
import {
    createNewDinhKhoanPro,
    getAllDinhKhoanPro,
    getDinhKhoanProDataByStepId
} from '../../../../../apis/dinhKhoanProService';
import {getAllSheet} from '../../../../../apis/sheetService.jsx';
import {
    createNewDinhKhoanProData,
    getDinhKhoanProDataByDinhKhoanId,
    updateDinhKhoanProData
} from '../../../../../apis/dinhKhoanProDataService.jsx';
import {getAllTaiKhoan} from '../../../../../apis/taiKhoanService.jsx';
import {getSheetColumnDataById} from '../../../../../apis/sheetColumnService.jsx';
import {getAllSheetDataBySheetId} from '../../../../../apis/sheetDataService.jsx';
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {getSettingByType} from '../../../../../apis/settingService.jsx';
import {getAllCauHinh} from '../../../../../apis/cauHinhService.jsx';
import {CODE_PKT, genCode} from "../../../../../generalFunction/genCode/genCode.js";
import {updateCardDetails} from "../Mau/cardUtils.js";
import {updateCard} from "../../../../../apis/cardService.jsx";
import {DONE, getVNStatus} from "../../../../../Consts/STEP_STATUS.js";
import {hideFieldDK, requiredFieldDK} from "../../../../../Consts/LIST_FIELD_DK.js";
import PhieuLQView from "../Mau/PhieuLQView.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const SubStepDKPro = ({sub_step_id, listSubStep, idCard, permissionsSubStep}) => {
    const {
        loadData,
        setLoadData,
        currentYear,
        chainTemplate2Selected,
        setChainTemplate2Selected
    } = useContext(MyContext);
    const UPDATE_PERMISSION = permissionsSubStep?.update;
    const gridRef = useRef();
    const [tkDropDown, setTkDropDown] = useState([]);
    const [formStep, setFormStep] = useState(null);
    const [dinhKhoanProData, setDinhKhoanProData] = useState(null);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [dropDownKMF, setDropDownKMF] = useState([]);
    const [dropDownKTC, setDropDownKMTC] = useState([]);
    const [dropDownDuAn, setDropDownDuAn] = useState([]);
    const [dropDownSanPham, setDropDownSanPham] = useState([]);
    const [dropDownNcc, setDropDownNcc] = useState([]);
    const [dropDownHopDong, setDropDownHopDong] = useState([]);
    const [dropDownKhachHang, setDropDownKhachHang] = useState([]);
    const [dropDownPhongBan, setDropDownPhongBan] = useState([]);
    const [pendingChanges, setPendingChanges] = useState([]);
    const [noteDefaultValue, setNoteDefaultValue] = useState('');
    const [columnDefaults, setColumnDefaults] = useState({});
    const [subStep, setSubStep] = useState({});
    const [typePhieu, setTypePhieu] = useState(null);
    const [settingData, setSettingData] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const {idStep} = useParams();
    const [dataReceived, setDataReceived] = useState(location.state || null);
    const [selectedPhieuLQ, setSelectedPhieuLQ] = useState(null);
    // Function to clear dataReceived
    const clearDataReceived = () => {
        navigate(location.pathname, {replace: true, state: {}});
    };
    const defaultColDef = useMemo(() => {
        return {
            editable: false,
            filter: true,
            suppressMenu: true,
            cellStyle: {fontSize: '13.5px'},
            resizable: false,
        };
    }, []);
    let sct = (listSubStep[0]?.name == 'Định khoản') ? genCode(CODE_PKT, idCard, currentYear) : ''
    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    const getSheetData = async (sheetSubStep) => {
        try {
            const sheetList = await getAllSheet();
            const filteredSheetList = sheetList
                .filter(sheet => sheetSubStep.some(subStep => subStep.id === sheet.sub_step_id))
                .map(sheet => {
                    const matchingSubStep = sheetSubStep.find(subStep => subStep.id == sheet.sub_step_id);
                    return {
                        ...sheet,
                        name: matchingSubStep ? matchingSubStep.name : null,
                    };
                });
            const sheetLists = filteredSheetList.filter(sheet => sheet.card_id == idCard);
            setFormStep(sheetLists);
        } catch (error) {
            console.log(error);
            // message.error('Lỗi khi lấy dữ liệu');
        }
    };

    useEffect(() => {
        const sheetSubStep = listSubStep.filter(item => item.subStepType == TYPE_SHEET);
        getSheetData(sheetSubStep);
        chainTemplate2Selected.data?.selectedTemplate?.cards.map((item) => {
            if (item.id == idCard) {
                let cau_truc = item.cau_truc
                if (cau_truc) {
                    cau_truc.map((item) => {
                        if (item.id == idStep) {
                            setTypePhieu(item.type)
                            item.subSteps.map((e) => {
                                if (e.id == sub_step_id) {
                                    setSubStep(e)
                                }
                            });
                        }
                    })
                }
            }
        });
    }, [listSubStep, loadData]);

    useEffect(() => {
        getSettingByType(typePhieu).then(data => {
            setSettingData(data)
        })
    }, [typePhieu])

    const loadDataDK = useCallback(async () => {

        if (!dinhKhoanProData?.id) return;
        setPendingChanges([]);
        setIsLoading(true);
        try {


            const [data, accList] = await Promise.all([
                getDinhKhoanProDataByDinhKhoanId(dinhKhoanProData.id),
                getAllTaiKhoan()
            ]);

            const formattedAccounts = accList.map(account => (`${account.code}`));
            setTkDropDown(formattedAccounts);

            // Create an object to store default values
            const defaults = {};

            const sheetDropdownConfigs = [
                {
                    show: dinhKhoanProData.showKMF,
                    setting: dinhKhoanProData.settingKMF,
                    setDropDown: setDropDownKMF,
                    field: 'kmf'
                },
                {
                    show: dinhKhoanProData.showTemCode,
                    setting: dinhKhoanProData.settingTemCode,
                    setDropDown: setDropDownPhongBan,
                    field: 'temCode'
                },
                {
                    show: dinhKhoanProData.showKMTC,
                    setting: dinhKhoanProData.settingKMTC,
                    setDropDown: setDropDownKMTC,
                    field: 'kmtc'
                },
                {
                    show: dinhKhoanProData.showDuAn,
                    setting: dinhKhoanProData.settingDuAn,
                    setDropDown: setDropDownDuAn,
                    field: 'duAn'
                },
                {
                    show: dinhKhoanProData.showSanPham,
                    setting: dinhKhoanProData.settingSanPham,
                    setDropDown: setDropDownSanPham,
                    field: 'sanPham'
                },
                {
                    show: dinhKhoanProData.showNcc,
                    setting: dinhKhoanProData.settingNcc,
                    setDropDown: setDropDownNcc,
                    field: 'nhaCungCap'
                },
                {
                    show: dinhKhoanProData.showHopDong,
                    setting: dinhKhoanProData.settingHopDong,
                    setDropDown: setDropDownHopDong,
                    field: 'hopDong'
                },
                {
                    show: dinhKhoanProData.showKhachHang,
                    setting: dinhKhoanProData.settingKhachHang,
                    setDropDown: setDropDownKhachHang,
                    field: 'khachHang'
                }
            ];

            // Process data and apply default values
            const processedData = data.map(row => {
                const newRow = {...row};
                if (listSubStep[0]?.name == 'Định khoản') newRow.soChungTu = sct
                Object.entries(defaults).forEach(([field, defaultValue]) => {
                    if (!newRow[field]) {
                        newRow[field] = defaultValue;
                    }
                });
                if (row.phieu_lq && Array.isArray(row.phieu_lq)) {
                    newRow.phieu_lq = [...row.phieu_lq, row.soChungTu];
                } else {
                    newRow.phieu_lq = [row.soChungTu];
                }
                return newRow;
            });

            async function processSheetDropdowns() {
                for (const config of sheetDropdownConfigs) {
                    if (config.show && config.setting) {
                        // Store default value if it exists
                        if (config.setting.defaultValue) {
                            defaults[config.field] = config.setting.defaultValue;
                        }

                        if (config.setting.id && config.setting.type == 'sheet') {
                            const colData = await getSheetColumnDataById(config.setting.id);
                            const sheetData = await getAllSheetDataBySheetId(colData.sheet_id);
                            config.setDropDown(sheetData.map(item => item.data[colData.name]));
                        } else if (config.setting.id && config.setting.type === 'category') {
                            const DanhMuc = DANH_MUC_LIST.find(item => item.key === config.setting.id);
                            const DanhMucData = await DanhMuc.getAllApi();
                            config.setDropDown(DanhMucData.map(item => item[config.setting.field]));
                        }
                    }
                }
            }

            await processSheetDropdowns();
            // Handle dataReceived logic...
            if (dataReceived && dataReceived.rowData && dataReceived.rowData.length > 0) {
                let dataGet = dataReceived.rowData;

                for (const obj of dataGet) {
                    const newRow = await createNewDinhKhoanProData({
                        kmf: obj?.kmf || defaults?.kmf,
                        kmtc: obj?.kmns || defaults?.kmtc,
                        nhaCungCap: obj?.supplier || defaults?.nhaCungCap,
                        sanPham: obj?.product || defaults?.sanPham,
                        soTien: obj?.so_tien_VND,
                        tkCo: obj?.tk_co,
                        tkNo: obj?.tk_no,
                        hopDong: obj?.hop_dong || defaults?.hopDong,
                        duAn: obj?.deal || defaults?.duAn,
                        temCode: obj?.team || defaults?.temCode,
                        khachHang: obj?.customer || defaults?.khachHang,
                        date: `${obj?.year}-${obj?.month}-30`,
                        day: '',
                        note: obj?.dien_giai,
                        dinhKhoan_id: dinhKhoanProData?.id,
                        card_id: idCard,
                        step_id: idStep,
                    });
                    setRowData(prevState => [...prevState, newRow]);
                }
                clearDataReceived();
            }
            setColumnDefaults(defaults);
            setRowData(processedData);

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [dinhKhoanProData, dataReceived]);

    const loadDinhKhoanData = useCallback(async () => {
        try {

            const dinhKhoanPro = await getDinhKhoanProDataByStepId(sub_step_id, idCard);
            if (dinhKhoanPro) {
                setDinhKhoanProData(dinhKhoanPro);
            } else {
                const allDKPro = await getAllDinhKhoanPro();
                const dinhKhoanTemplate = allDKPro.find(item => item.sub_step_id == sub_step_id && item.card_id == null);
                const {id, ...data} = dinhKhoanTemplate;
                const newDKPro = await createNewDinhKhoanPro({...data, card_id: idCard});
                setDinhKhoanProData(newDKPro);

            }
        } catch (error) {
            console.error("Failed to load Dinh Khoan data:", error);
            message.error("Failed to load Dinh Khoan data");
        }
    }, [sub_step_id, idCard, loadData]);

    useEffect(() => {
        if (dinhKhoanProData) {
            loadDataDK();
        }
    }, [dinhKhoanProData]);

    useEffect(() => {
        loadDinhKhoanData();
    }, [loadDinhKhoanData, loadData]);

    const onGridReady = useCallback((params) => {
        gridRef.current = params.api;
    }, []);

    const handleAddNewRow = async () => {
        try {
            const newRowData = {
                dinhKhoan_id: dinhKhoanProData.id,
                note: noteDefaultValue,
                card_id: idCard,
                step_id: idStep,
                phieuKT: sct,
                ...columnDefaults
            };
            if (sct !== '') {
                newRowData.soChungTu = sct
                newRowData.soChungTuLQ = sct
            }
            await createNewDinhKhoanProData(newRowData);
            loadDataDK();
        } catch (error) {
            console.error("Failed to add new row:", error);
            message.error("Failed to add new row");
        }
    };

    const isDateInLockedPeriod = (date, lockedPeriods) => {
        const day = parseInt(date.split('/')[0]);
        const month = parseInt(date.split('/')[1]);
        const isInPeriod = (day, term) => {
            if (term === 'K1') {
                return day >= 1 && day <= 15;
            } else if (term === 'K2') {
                return day >= 16 && day <= 31;
            }
            return false;
        };
        return lockedPeriods.some(([period]) => {
            const [_, month_str, term] = period.match(/T(\d+)_([K][12])/);
            const periodMonth = parseInt(month_str);

            return month === periodMonth && isInPeriod(day, term);
        });
    };

    const handleSaveAllChanges = async () => {
        if (pendingChanges.length === 0) {
            message.info('Không có thay đổi để lưu');
            return;
        }
        const settingData = await getSettingByType(SETTING_TYPE.ChotSo);
        const cauHinhData = await getAllCauHinh();
        if (cauHinhData[0].value === "Theo tháng") {
            const lockedMonths = Object.entries(settingData.setting.month[0])
                .filter(([key, value]) => key.startsWith('T') && value === false)
                .map(([key]) => parseInt(key.substring(1)));

            const hasLockedData = pendingChanges.some(item => {
                const itemMonth = new Date(item.date).getMonth() + 1;
                return lockedMonths.includes(itemMonth);
            });

            if (hasLockedData) {
                toast.error("Có dữ liệu đã được khóa sổ");
                return;
            }
        } else {
            const lockedPeriods = Object.entries(settingData.setting.term[0])
                .filter(([key, value]) => key.startsWith('T') && value === false);

            const hasLockedData = pendingChanges.some(item => {
                const date = new Date(item.date);
                const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`
                return isDateInLockedPeriod(formattedDate, lockedPeriods);
            });

            if (hasLockedData) {
                message.error("Có dữ liệu đã được khóa sổ");
                return;
            }
        }
        setIsLoading(true);
        try {
            const updatePromises = pendingChanges.map(change => {
                const {delete: _, ...updateData} = change;
                return updateDinhKhoanProData(updateData);
            });

            await Promise.all(updatePromises);
            setPendingChanges([]);
            message.success(`Đã lưu ${updatePromises.length} thay đổi`);
            loadDataDK();
        } catch (error) {
            console.error("Failed to save all changes:", error);
            message.error("Không thể lưu tất cả các thay đổi");
        } finally {
            setIsLoading(false);
        }

        let created_at = '';
        chainTemplate2Selected.data?.selectedTemplate.cards.map((item) => {
            if (item.id == idCard) {
                created_at = item.created_at
            }
        });

        if (sct !== '') {
            let tongTien = 0;
            rowData.map(row => {
                tongTien += (+row.soTien)
            })
            await updateCardDetails(idCard, created_at, tongTien, '');
            setChainTemplate2Selected({
                type: 'chain2',
                data: {
                    ...chainTemplate2Selected.data,
                    selectedTemplate: {
                        ...chainTemplate2Selected.data?.selectedTemplate,
                        cards: chainTemplate2Selected.data?.selectedTemplate.cards.map((item) => item.id == idCard ? {
                            ...item,
                            mo_ta: created_at,
                            so_tien: tongTien,
                            mo_ta2: '',
                        } : item)
                    }
                }
            })
        }
    };

    const handleCellValueChanged = useCallback((params) => {
        if (!params.data || !dinhKhoanProData?.id) return;

        setPendingChanges(prev => {
            const existingRowIndex = prev.findIndex(
                change => change.id === params.data.id
            );

            if (existingRowIndex !== -1) {
                const updatedChanges = [...prev];
                updatedChanges[existingRowIndex] = {
                    id: params.data.id,
                    ...updatedChanges[existingRowIndex],
                    ...params.data,
                    [params.colDef.field]: params.newValue
                };
                return updatedChanges;
            }

            return [
                ...prev,
                {
                    ...params.data,
                    [params.colDef.field]: params.newValue
                }
            ];
        });
    }, [dinhKhoanProData]);


    const CustomHeader = (props) => {
        const {displayName} = props;
        let field = props.column.colId;
        let required = requiredFieldDK(settingData, field)
        return (
            <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                {displayName}
                {required && <span style={{color: 'red', fontWeight: 'bold'}}>*</span>}
            </span>
        );
    };

    // Column definitions effect
    useEffect(() => {
        const fetchColumnDefs = async () => {
            try {
                setColDefs([
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
                                <PopupDeleteRenderer
                                    id={params.data.id}
                                    reload={loadDataDK}
                                />
                            );
                        },
                        editable: false,
                    },
                    {
                        field: 'id',
                        headerName: 'STT', width: 90,
                        pinned: 'left',
                    },
                    {
                        field: 'date',
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Ngày'
                        },
                        width: 110,
                        cellEditor: 'agDateCellEditor',
                        cellEditorParams: {
                            filterParams: {
                                buttons: ['today', 'clear']
                            },
                            dateFormat: 'dd/MM/yyyy'
                        },
                        valueFormatter: (params) => {
                            if (params.value) {
                                const date = new Date(params.value);
                                return date.toLocaleDateString('en-GB');
                            }
                            return '';
                        },
                        editable: UPDATE_PERMISSION,
                        hide: hideFieldDK(settingData, 'date')
                    },
                    {
                        field: 'phieuKT',
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Phiếu kế toán'
                        },
                        width: 150,
                        editable: false,
                        hide: hideFieldDK(settingData, 'phieuKT'),
                        cellRenderer: (params) => {
                            if (!params.value) {
                                return null;
                            }
                            return (
                                <>
                                    <button className={'btn-view-phieu'}
                                            onClick={() => setSelectedPhieuLQ(params.value)}>{params.value}</button>
                                </>
                            );
                        },
                    },
                    {
                        field: 'phieu_lq',
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Chứng từ liên quan'
                        },
                        width: 150,
                        hide: hideFieldDK(settingData, 'phieu_lq'),
                        cellRenderer: (params) => {
                            if (!params.value) {
                                return null;
                            }
                            return (
                                <>
                                    {params.value.map(ph => (
                                        <button className={'btn-view-phieu'} onClick={() => setSelectedPhieuLQ(ph)}>{ph}</button>
                                    ))}
                                </>
                            );
                        },
                        editable: false,
                    },
                    {
                        field: 'phieu_thu_chi',
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Phiếu thu chi'
                        },
                        width: 150,
                        editable: false,
                        hide: hideFieldDK(settingData, 'phieu_thu_chi'),
                        cellRenderer: (params) => {
                            if (!params.value) {
                                return null;
                            }
                            return (
                                <>
                                    <button className={'btn-view-phieu'} onClick={() => setSelectedPhieuLQ(params.value)}>{params.value}</button>
                                </>
                            );
                        },
                    },
                    // {
                    //     field: 'soChungTuLQ',
                    //     headerName: 'Chứng từ liên quan',
                    //     width: 150,
                    //     editable: false
                    // },
                    {
                        field: 'soChungTu',
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Chứng từ'
                        },
                        width: 150,
                        editable: false,
                        hide: hideFieldDK(settingData, 'soChungTu'),
                        cellRenderer: (params) => {
                            if (!params.value) {
                                return null;
                            }
                            return (
                                <>
                                    <button className={'btn-view-phieu'} onClick={() => setSelectedPhieuLQ(params.value)}>{params.value}</button>
                                </>
                            );
                        },
                    },
                    {
                        field: 'note',
                        width: 150,
                        editable: UPDATE_PERMISSION,
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Diễn giải'
                        },
                        hide: hideFieldDK(settingData, 'note')
                    },
                    {
                        field: 'temCode',
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Phòng ban'
                        },
                        width: 150,
                        cellEditor: 'agSelectCellEditor',
                        cellEditorParams: {
                            values: dropDownPhongBan
                        },
                        editable: UPDATE_PERMISSION,
                        hide: hideFieldDK(settingData, 'temCode')
                    },
                    {
                        field: 'tkNo',
                        width: 130,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            values: tkDropDown,
                        },
                        editable: UPDATE_PERMISSION,
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Tài khoản nợ'
                        },
                        hide: hideFieldDK(settingData, 'tkNo')
                    },
                    {
                        field: 'tkCo',
                        width: 130,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            values: tkDropDown,
                        },
                        editable: UPDATE_PERMISSION,
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Tài khoản có'
                        },
                        hide: hideFieldDK(settingData, 'tkCo')
                    },
                    {
                        field: 'soTien',
                        width: 130,
                        valueFormatter: (params) => {
                            if (params.value == null) return '';
                            return new Intl.NumberFormat('en-US').format(Number(params.value));
                        },
                        valueParser: (params) => {
                            const numericValue = Number(params.newValue.toString().replace(/[^\d]/g, ''));
                            return isNaN(numericValue) ? null : numericValue;
                        },
                        cellRenderer: (params) => {
                            if (params.value == null) return '';
                            return new Intl.NumberFormat('en-US').format(Number(params.value));
                        },
                        cellEditor: 'agNumberCellEditor',
                        cellEditorParams: {
                            min: 0,
                            precision: 0
                        },
                        editable: UPDATE_PERMISSION,
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Số tiền'
                        },
                        hide: hideFieldDK(settingData, 'soTien')
                    },
                    {
                        field: 'kmf',
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Khoản mục phí'
                        },
                        width: 150,
                        cellEditor: 'agSelectCellEditor',
                        cellEditorParams: {
                            values: dropDownKMF
                        },
                        editable: UPDATE_PERMISSION,
                        hide: hideFieldDK(settingData, 'kmf')
                    },
                    {
                        field: 'kmtc',
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Khoản mục thu chi'
                        },
                        width: 180,
                        cellEditor: 'agSelectCellEditor',
                        cellEditorParams: {
                            values: dropDownKTC
                        },
                        editable: UPDATE_PERMISSION,
                        hide: hideFieldDK(settingData, 'kmtc')
                    },
                    {
                        field: 'duAn',
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Dự án'
                        },
                        width: 130,
                        cellEditor: 'agSelectCellEditor',
                        cellEditorParams: {
                            values: dropDownDuAn
                        },
                        editable: UPDATE_PERMISSION,
                        hide: hideFieldDK(settingData, 'duAn')
                    },
                    {
                        field: 'sanPham',
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Sản phẩm'
                        },
                        width: 130,
                        cellEditor: 'agSelectCellEditor',
                        cellEditorParams: {
                            values: dropDownSanPham
                        },
                        editable: UPDATE_PERMISSION,
                        hide: hideFieldDK(settingData, 'sanPham')
                    },
                    {
                        field: 'nhaCungCap',
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Nhà cung cấp'
                        },
                        width: 150,
                        cellEditor: 'agSelectCellEditor',
                        cellEditorParams: {
                            values: dropDownNcc
                        },
                        editable: UPDATE_PERMISSION,
                        hide: hideFieldDK(settingData, 'nhaCungCap')
                    },
                    {
                        field: 'hoaDon',
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Hóa đơn'
                        },
                        width: 120,
                        hide: hideFieldDK(settingData, 'hoaDon'),
                        cellRenderer: (params) => {
                            if (!params.value) {
                                return null;
                            }
                            return (
                                <>
                                    <button className={'btn-view-phieu'}
                                            onClick={() => setSelectedPhieuLQ(params.value)}>{params.value}</button>
                                </>
                            );
                        },
                    },
                    {
                        field: 'hopDong',
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Hợp đồng'
                        },
                        width: 130,
                        cellRenderer: (params) => {
                            if (!params.value) {
                                return null;
                            }
                            return (
                                <>
                                    <button className={'btn-view-phieu'}
                                            onClick={() => setSelectedPhieuLQ(params.value)}>{params.value}</button>
                                </>
                            );
                        },
                        editable: UPDATE_PERMISSION,
                        hide: hideFieldDK(settingData, 'hopDong')
                    },
                    {
                        field: 'khachHang',
                        headerComponent: CustomHeader,
                        headerComponentParams: {
                            displayName: 'Khách hàng'
                        },
                        width: 150,
                        cellEditor: 'agSelectCellEditor',
                        cellEditorParams: {
                            values: dropDownKhachHang
                        },
                        editable: UPDATE_PERMISSION,
                        hide: hideFieldDK(settingData, 'khachHang')
                    },
                ]);
            } catch (error) {
                console.log(error)
                message.error('Error fetching data:', error);
            }
        };

        fetchColumnDefs();
    }, [dinhKhoanProData, tkDropDown, dropDownKMF, dropDownKTC, dropDownDuAn, dropDownSanPham, dropDownNcc, dropDownHopDong, dropDownKhachHang, UPDATE_PERMISSION]);

    function formatDate(isoString) {
        if (!isoString) return ""; // Kiểm tra nếu dữ liệu rỗng
        const date = new Date(isoString);
        const day = String(date.getUTCDate()).padStart(2, "0"); // Lấy ngày (đảm bảo có 2 chữ số)
        const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Tháng bắt đầu từ 0 nên +1
        const year = date.getUTCFullYear(); // Lấy năm
        return `${day}-${month}-${year}`;
    };

    async function handleDuyet() {
        let created_at = '';
        let cau_truc = [];
        let newRowData = [];
        for (const item of rowData) {
            const newData = await updateDinhKhoanProData({id: item.id, duyet: true})
            newRowData.push(newData);
        }
        setRowData(newRowData);
        chainTemplate2Selected.data?.selectedTemplate.cards.map((item) => {
            if (item.id == idCard) {
                created_at = item.created_at
                cau_truc = item.cau_truc;
                if (cau_truc) {
                    cau_truc.map((item) => {
                        if (item.id == idStep) {
                            let subSteps = item.subSteps;
                            subSteps.forEach(e => {
                                if (e.id == sub_step_id) {
                                    e.trang_thai == getVNStatus(DONE);
                                    subStep.trang_thai = getVNStatus(DONE);
                                    setSubStep({...subStep})
                                }
                            })
                        }
                    })
                }
            }
        });
        await updateCard({id: idCard, trang_thai: 'Hoàn thành', cau_truc: cau_truc})
        setChainTemplate2Selected({
            type: 'chain2',
            data: {
                ...chainTemplate2Selected.data,
                selectedTemplate: {
                    ...chainTemplate2Selected.data?.selectedTemplate,
                    cards: chainTemplate2Selected.data?.selectedTemplate.cards.map((item) => item.id == idCard ? {
                        ...item,
                        trang_thai: 'Hoàn thành'
                    } : item)
                }
            }
        })
        if (sct !== '') {

            let tongTien = 0;
            rowData.map(row => {
                tongTien += (+row.soTien)
            })
            await updateCardDetails(idCard, formatDate(created_at), tongTien, '');
            setChainTemplate2Selected({
                type: 'chain2',
                data: {
                    ...chainTemplate2Selected.data,
                    selectedTemplate: {
                        ...chainTemplate2Selected.data?.selectedTemplate,
                        cards: chainTemplate2Selected.data?.selectedTemplate.cards.map((item) => item.id == idCard ? {
                            ...item,
                            mo_ta: formatDate(created_at),
                            so_tien: tongTien,
                            mo_ta2: '',
                            trang_thai: 'Hoàn thành'
                        } : item)
                    }
                }
            })
        }
    }


    return (
        <div className={css.container}>
            <div className={css.settingsWrapper}>
                <h3>{genCode(CODE_PKT, idCard, currentYear)}</h3>
                <div className={css.actionButtons}>
                    {UPDATE_PERMISSION
                        ? (
                            <>
                                <Tooltip title="Thêm dòng mới">
                                    <IconButton
                                        onClick={handleAddNewRow}
                                        size="small"
                                        disabled={isLoading || !dinhKhoanProData}
                                    >
                                        <AddIcon/>
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Cập nhật dữ liệu">
                                    <IconButton
                                        onClick={loadDataDK}
                                        size="small"
                                        disabled={isLoading || !dinhKhoanProData}
                                    >
                                        <RefreshIcon/>
                                    </IconButton>
                                </Tooltip>
                            </>
                        )
                        : (<></>)
                    }
                    {Object.keys(pendingChanges).length > 0 && (
                        <Tooltip title="Lưu tất cả các thay đổi">
                            <div className={'save-btn'} onClick={handleSaveAllChanges}>
                                <img src={SaveTron} alt=""/> Lưu
                            </div>
                        </Tooltip>
                    )}
                </div>
            </div>
            <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
                <AgGridReact
                    statusBar={statusBar}
                    enableRangeSelection={true}
                    ref={gridRef}
                    rowData={rowData}
                    defaultColDef={defaultColDef}
                    columnDefs={colDefs}
                    rowSelection="multiple"
                    localeText={AG_GRID_LOCALE_VN}
                    onGridReady={onGridReady}
                    onCellValueChanged={handleCellValueChanged}
                    suppressContextMenu={true}
                    suppressCellSelection={true}
                    suppressMovableColumns={false}
                />
            </div>
            {rowData.length > 0 &&
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        justifyContent: 'right',
                        marginTop: '15px',
                    }}
                >
                    <ConfigProvider>
                        <Button
                            type={subStep?.trang_thai !== "Hoàn thành" ? 'primary' : 'default'}
                            onClick={() => handleDuyet()}
                            disabled={subStep?.trang_thai !== "Hoàn thành" ? false : true}
                        >
                            {subStep?.trang_thai !== "Hoàn thành" ? 'Duyệt phiếu' : 'Đã duyệt'}
                        </Button>
                    </ConfigProvider>
                </div>
            }
            {selectedPhieuLQ &&
                <PhieuLQView selectedPhieuLQ={selectedPhieuLQ} setSelectedPhieuLQ={setSelectedPhieuLQ}/>}
        </div>
    );
};

export default SubStepDKPro;
