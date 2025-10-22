import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { MyContext } from '../../../MyContext.jsx';
// AG GRID
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ModuleRegistry } from '@ag-grid-community/core';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import AG_GRID_LOCALE_VN from "../../Home/AgridTable/locale.jsx";
import '../../Home/AgridTable/agComponent.css';
import css from "../KeToanQuanTriComponent/KeToanQuanTri.module.css"
// FUNCTION
import ExportableGrid from "../popUp/exportFile/ExportableGrid.jsx";
import { formatDateFromTimestamp } from "../../../generalFunction/format.js";
import ImportBtn from "../popUp/importFIle/ImportBtn.jsx";
import PopupDeleteRenderer from '../popUp/popUpDelete.jsx';
import { handleAddAgl } from "../functionKTQT/handleAddAgl.js";
import { getCurrentDateTimeWithHours } from "../functionKTQT/formatDate.js";
import { handleSaveAgl } from "../functionKTQT/handleSaveAgl.js";
import { onFilterTextBoxChanged } from "../../../generalFunction/quickFilter.js";
import TooltipHeaderIcon from "../HeaderTooltip/TooltipHeaderIcon.jsx";
// API
import { getAllLeadManagement } from "../../../apis/leadManagementService.jsx";
import { getAllUnits } from "../../../apisKTQT/unitService.jsx";
import { setItemInIndexedDB2 } from '../storage/storageService.js';
// ICON
import { EllipsisIcon } from "../../../icon/IconSVG.js";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import {CustomDatePickerEditor} from "../popUp/CustomDatePickerEditor.jsx";
import ActionSelectCompanyBaoCao from "../ActionButton/ActionSelectCompanyBaoCao.jsx";
import {CANVAS_DATA_PACK} from "../../../CONST.js";
import {KHONG_THE_TRUY_CAP} from "../../../Consts/TITLE_HEADER.js";
import {getCurrentUserLogin} from "../../../apis/userService.jsx";
import {getPermissionDataCty} from "../../Canvas/getPermissionDataNhomBC.js";


ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function LeadManagement({ company, call }) {

    const table = 'Lead-Management';
    const key = 'S102'
    const getLocalStorageSettings = () => {
        const storedSettings = JSON.parse(localStorage.getItem(table + '_' + key));
        return {
            companySelected: storedSettings?.companySelected ?? [],
        };
    };
    let {
        sheetPermissionsInfo,
        currentUser,
        loadDataSoKeToan,
        listCompany,
        userClasses,
        fetchUserClasses,
        uCSelected_CANVAS,
    } = useContext(MyContext);
    const [listCom, setListCom] = useState([])
    const [companySelected, setCompanySelected] = useState(getLocalStorageSettings().companySelected || [])
    const [titleName, setTitleName] = useState('');

    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [listUnit, setListUnit] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [saveActive, setSaveActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [oldData, setOldData] = useState({});
    const [showProjectFormUpdate, setShowProjectFormUpdate] = useState(false);
    const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);
    const [openDialog, setOpenDialog] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [newLeadManagement, setNewLeadManagement] = useState({
        name: '',
        unit_code: '',
        code: '',
        dp: '',
        group: '',
        company: ''
    });
    const fetchAndSetTitleName = async () => {
        try {
            const user = await getCurrentUserLogin();
            const listComs = await getPermissionDataCty('cty', user, userClasses, fetchUserClasses, uCSelected_CANVAS)
            if (listComs?.length > 0 || user.data.isAdmin || listComs.some(e => e.code == 'HQ')) {
                setListCom(listComs)
                setTitleName(CANVAS_DATA_PACK.find(e => e.value == key)?.name)
            } else {
                setTitleName(KHONG_THE_TRUY_CAP)
            }

        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu:', error);
        }
    };
    useEffect(() => {
        if (!companySelected && companySelected?.length == 0) {
            setCompanySelected(listCom)
        }
    }, [companySelected]);
    useEffect(() => {
        const tableSettings = {
            companySelected,
        }
        localStorage.setItem(table + '_' + key, JSON.stringify(tableSettings));
        fetchAndSetTitleName();
    }, [companySelected]);
    const resetForm = () => {
        setNewLeadManagement({
            name: '',
            unit_code: '',
            code: '',
            dp: '',
            group: '',
            company: ''
        });
    };
    const defaultColDef = useMemo(() => {
        return {
            filter: true,
            cellStyle: { fontSize: '14.5px' },
            cellClassRules: {
                'cell-small': (params) => params.colDef.width < 150,
            },
            wrapHeaderText: true,
            autoHeaderHeight: true,
            editable: true,
        };
    });

    const onGridReady = useCallback(async () => {
        let data = await fetchLeadManagementData();
        await setItemInIndexedDB2(key, data)
        setRowData(data);
    }, [company]);
    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };
    const handleFileImported = (importedData) => {
        const currentRowData = [];
        if (gridRef.current) {
            gridRef.current.api.forEachNode((node) => {
                currentRowData.push(node.data); // Đẩy dữ liệu của mỗi node vào mảng
            });
        }
        // Kết hợp dữ liệu cũ và dữ liệu mới
        const updatedData = [...currentRowData, ...importedData];

        // Cập nhật lại dữ liệu trong AG-Grid
        if (gridRef.current) {
            gridRef.current.api.setRowData(updatedData); // Set lại toàn bộ dữ liệu vào grid
        }
    };
    const fetchLeadManagementData = async () => {
        if(companySelected && companySelected?.length>0){
            const [listSoKeToan, data] = await Promise.all([loadDataSoKeToan(), getAllLeadManagement()]);

            let relevantLeadManagement = data
            if(companySelected.some(e=> e.code != 'HQ')){
                relevantLeadManagement = relevantLeadManagement.filter(e => companySelected.some(c=> c.code == e.company) );
            }
            let relevantSoKeToan =listSoKeToan
            if(companySelected.some(e=> e.code != 'HQ')){
                relevantSoKeToan = relevantSoKeToan.filter(e => companySelected.some(c=> c.code == e.company) );
            }

            const sktSet = new Set(relevantSoKeToan.map(s => s.dataCMR2));

            // Cập nhật thuộc tính `isEditable` dựa trên điều kiện
            relevantLeadManagement.forEach(dataCMR => {
                dataCMR.isEditable = dataCMR.code === '' || !dataCMR.code || !sktSet.has(dataCMR.code);
            });

            getAllUnits().then(data => {
                if(companySelected.some(e=> e.code != 'HQ')){
                    data = data.filter(e => companySelected.some(c=> c.code == e.company) );
                    setListUnit(data)
                }
                else {
                    setListUnit(data);
                }
            })

            return relevantLeadManagement;
        }
        else {
            return []
        }

    };
    const loadData = async () => {
        let data = await fetchLeadManagementData()
        setRowData(data);
        setLoading(false);
    };


    useEffect(() => {
        setLoading(true);
        loadData();
    }, [companySelected]);

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
                        headerName: 'ID',
                        width: 100,
                        hide: true,
                        ...filter(),
                        cellStyle: { textAlign: "left" }
                    },
                    {
                        field: 'code',
                        headerName: 'Lead ID',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'name',
                        headerName: 'Tên lead',
                        width: 150,
                        ...filter(),
                    },

                    {
                        field: 'company',
                        headerName: 'Công ty',
                        width: 100,
                        ...filter(),
                    },
                    {
                        field: 'ngay',
                        headerName: 'Ngày tạo',
                        editable: true,
                        width: 140,
                        cellEditor: CustomDatePickerEditor,
                        ...filter(),
                        valueFormatter: (params) => params.value || '',
                        cellRenderer: params =>params.value? formatDateFromTimestamp(params.value): null
                    },
                    {
                        field: 'type',
                        headerName: 'Loại B2C/B2B',

                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: ['B2C', 'B2B']
                        },
                        width: 150,
                        ...filter(),
                    },
                    // {
                    //     field: 'company',
                    //     headerName: 'Công ty',
                    //     width: 90,
                    //     suppressHeaderMenuButton: true,
                    //     ...filter(),
                    //     // hide: false,
                    //     // cellStyle: {textAlign: "left"},
                    //     // cellEditor: 'agRichSelectCellEditor',
                    //     // cellEditorParams: {
                    //     //     allowTyping: true,
                    //     //     filterList: true,
                    //     //     highlightMatch: true,
                    //     //     values: listCompany.map((p) => p.code),
                    //     // },
                    // },

                    {
                        field: 'ten_lien_he',
                        headerName: 'Tên liên hệ',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'chu_thich_lien_he',
                        headerName: 'Chú thích liên hệ',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'sdt',
                        headerName: 'Số điện thoại',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'dia_chi',
                        headerName: 'Địa chỉ',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'tinh_thanh',
                        headerName: 'Tỉnh thành',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'mail',
                        headerName: 'Mail',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'nguon_lead',
                        headerName: 'Nguồn lead',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'trang_thai',
                        headerName: 'Trạng thái',
                        width: 150,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: ['Cao', 'Tiêu chuẩn', 'Thấp']
                        },
                        ...filter(),
                    },
                    {
                        field: 'da_convert',
                        headerName: 'Đã convert',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'pic',
                        headerName: 'PIC',

                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'thong_tin_khac',
                        headerName: 'Thông tin khác',
                        width: 150,
                        ...filter(),
                    },

                    {
                        field: 'ngay_cuoi_lien_he',
                        headerName: 'Ngày cuối liên hệ',
                        editable: true,
                        width: 140,
                        cellEditor: CustomDatePickerEditor,
                        ...filter(),
                        valueFormatter: (params) => params.value || '',
                        cellRenderer: params =>params.value? formatDateFromTimestamp(params.value): null
                    },



                    // {
                    //     field: "duyet",
                    //     width: 80,
                    //     headerName: 'Trạng thái',
                    //     cellEditor: 'agRichSelectCellEditor',
                    //     suppressHeaderMenuButton: true,
                    //     cellEditorParams: {
                    //         values: customSelectDuyet.map(item => item.id.toString()),
                    //         formatValue: function (value) {
                    //             const found = customSelectDuyet.find(item => item.id.toString() === value);
                    //             return found ? found.name : value;
                    //         }
                    //     },
                    //     valueFormatter: function (params) {
                    //         const selectedItem = customSelectDuyet.find(item => item.id.toString() === params.value);
                    //         return selectedItem ? selectedItem.name : null;
                    //     },
                    //     valueParser: function (params) {
                    //         const found = customSelectDuyet.find(item => item.name === params.newValue);
                    //         return found ? found.id.toString() : null;
                    //     },
                    //     cellClassRules: {
                    //         'daduyet': (params) => params.data.duyet == 1,
                    //     },
                    // },
                    {
                        pinned: 'left',
                        width: '40',
                        field: 'action',
                        cellStyle: { textAlign: 'center' },
                        headerName: '',
                        cellRenderer: (params) => {
                            if (!params.data || !params.data.id || params.data.duyet == 1 || !params.data.isEditable) {
                                return null;
                            }
                            return (
                                <PopupDeleteRenderer
                                    {...params.data}
                                    id={params.data.id}
                                    table={table}
                                    reloadData={onGridReady}
                                // disable={params.data.duyet == 1}
                                />
                            );
                        },
                    },
                ]);
            } catch (error) {
               console.log(error)
            }
        };
        fetchData();
    }, [onGridReady, rowData, table]);

    // const onRowDoubleClicked = (event) => {
    //     setOldData(event.data);
    //     setShowProjectFormUpdate(true);
    // };
    const handleCellValueChanged = async (event) => {

        const rowExistsInUpdatedData = updatedData.some((row) => row.id === event.data.id);

        let newUpdatedData;
        if (rowExistsInUpdatedData) {
            newUpdatedData = updatedData.map((row) => {
                if (row.id === event.data.id) {
                    return { ...event.data };
                }
                return row;
            });
        } else {
            newUpdatedData = [...updatedData, event.data];
        }
        let updatedArray = newUpdatedData.map((item) =>
            item.id === event?.data?.id ? { ...item, oldValue: event.oldValue } : item
        );
        newUpdatedData = updatedArray;
        setUpdatedData(newUpdatedData);
        await handleSaveAgl(newUpdatedData, table, setUpdatedData, onGridReady);
        await fetchAllLeadManagement();
    };
    const handleAddRow = async () => {
        // Open the dialog to create a new deal
        setOpenDialog(true);
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
        resetForm()
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewLeadManagement((prev) => ({ ...prev, [name]: value }));
    };
    useEffect(() => {
        const isValid = (newLeadManagement.name || '').trim() !== '' && (newLeadManagement.unit_code || '').trim() !== '';
        setIsFormValid(isValid);

        if (isValid) {
            // Tạo code tự động khi các trường hợp lệ
            const newCode = `${newLeadManagement.name}-${newLeadManagement.company}-${newLeadManagement.unit_code}`;
            setNewLeadManagement(prev => ({ ...prev, code: newCode }));
        }
    }, [newLeadManagement.name, newLeadManagement.unit_code, company]);
    const handleSaveNewLeadManagement = async () => {
        try {
            // Gọi API để thêm giao dịch mới
            await handleAddAgl(null,
                {
                    system_created_at: getCurrentDateTimeWithHours(),
                }, 'Lead-Management', fetchAllLeadManagement);

            await loadData();  // Reload dữ liệu trong bảng

        } catch (error) {
            // Bắt lỗi và hiển thị thông báo lỗi
            console.error('Lỗi khi lưu giao dịch:', error);
            toast.error('Lỗi xảy ra khi lưu giao dịch. Vui lòng thử lại.');
        }
    };
    // const handleAddRow = useCallback(async () => {
    //     await handleAddAgl(
    //         company,
    //         {
    //             system_created_at: getCurrentDateTimeWithHours(),
    //             company: company,
    //             show: true,
    //         },
    //         table,
    //         onGridReady
    //     );
    //     await fetchAllLeadManagement();
    // }, [onGridReady]);
    const onRowDoubleClicked = (event) => {
        setOldData(event.data);
        setShowProjectFormUpdate(true);
    };
    return (
        <>
            <div className={'header-powersheet'}>
                <div className={css.headerTitle}>
                    <span>Lead Management   {(companySelected?.length > 0 ? companySelected : []).map((e, index) => (
                        <React.Fragment key={index}>
                            {index == 0 && ` - `}
                            {e.name}
                            {index !== (companySelected?.length > 0 ? companySelected.length : 0) - 1 && ", "}
                        </React.Fragment>
                    ))}<TooltipHeaderIcon table={table} /></span>
                </div>

                <div className={css.headerAction}>

                    <div className={css.headerAction}>
                        <ActionSelectCompanyBaoCao options={listCom} handlers={setCompanySelected}
                                                   valueSelected={companySelected}/>
                        <div className={`${css.headerActionButton} ${css.buttonOn}`}
                            onClick={handleSaveNewLeadManagement}>
                            <span> Thêm mới</span>
                        </div>
                    </div>

                    <div className="navbar-item" ref={dropdownRef}>
                        <img
                            src={EllipsisIcon}
                            style={{ width: 32, height: 32, cursor: 'pointer' }}
                            alt="Ellipsis Icon"
                            onClick={handleDropdownToggle}
                        />
                        {isDropdownOpen && (
                            <div className={css.dropdownMenu}>
                                <ExportableGrid
                                    api={gridRef.current ? gridRef.current.api : null}
                                    columnApi={gridRef.current ? gridRef.current.columnApi : null}
                                    table={table}
                                    isDropdownOpen={isDropdownOpen}
                                />
                                <ImportBtn
                                    apiUrl={`${import.meta.env.VITE_API_URL}/api/lead-management`}
                                    onFileImported={handleFileImported}
                                    onGridReady={loadData}
                                    company={company}
                                    isDropdownOpen={setIsDropdownOpen}
                                    table={table}
                                />
                            </div>
                        )}
                    </div>

                </div>
            </div>
            {/*<div style={{width: '100%' , boxSizing : "border-box"}}>*/}
            {/*    <RichNoteKTQTRI table={`${table}`}/>*/}
            {/*</div>*/}
            <div
                style={{
                    height: call === 'cdsd' ? '70vh' : '72.5vh',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    marginTop: '15px',
                }}
            >
                {loading && (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            position: 'absolute',
                            width: '100%',
                            zIndex: '1000',
                            backgroundColor: 'rgba(255, 255, 255, 0.96)',
                        }}
                    >
                        <img src='/loading_moi_2.svg' alt="Loading..." style={{ width: '650px', height: '550px' }} />
                    </div>
                )}
                <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
                    <AgGridReact
                        ref={gridRef}
                        statusBar={statusBar}
                        enableRangeSelection
                        rowData={rowData}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        onCellValueChanged={handleCellValueChanged}
                        rowSelection="multiple"
                        animateRows={true}
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                        onRowDoubleClicked={onRowDoubleClicked}
                    />
                </div>
                {/* Dialog Component */}
                <Dialog open={openDialog} onClose={handleDialogClose}>
                    <DialogTitle>Thêm giao dịch mới</DialogTitle>

                    <DialogContent className={css.dialogContent}>
                        <TextField
                            margin="dense"
                            label="Tên công ty"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={newLeadManagement.company}
                            required
                            error={(newLeadManagement.company || '').trim() === ''}  // Hiển thị lỗi nếu bỏ trống
                            helperText={(newLeadManagement.company || '').trim() === '' ? "Tên công ty là bắt buộc" : ""}
                            onChange={(e) => setNewLeadManagement({ ...newLeadManagement, company: e.target.value })}
                            select // Thêm thuộc tính select để biến TextField thành Select
                        >
                            {listCompany.map((p) => (
                                <MenuItem key={p.code} value={p.code}>
                                    {p.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Tên sản phẩm"
                            className={css.form_content}
                            name="name"
                            value={newLeadManagement.name || ''}  // Đảm bảo luôn có giá trị mặc định
                            onChange={handleInputChange}
                            variant="outlined"
                            fullWidth
                            margin="dense"
                            required
                            error={(newLeadManagement.name || '').trim() === ''}  // Hiển thị lỗi nếu bỏ trống
                            helperText={(newLeadManagement.name || '').trim() === '' ? "Tên sản phẩm là bắt buộc" : ""}
                            InputLabelProps={{
                                sx: {
                                    top: '-5px',  // Điều chỉnh vị trí của label (di chuyển label lên/xuống)
                                },
                            }}
                        />

                        <TextField
                            label="Đơn vị"
                            className={css.form_content}
                            name="unit_code"
                            value={newLeadManagement.unit_code || ''}  // Đảm bảo luôn có giá trị mặc định
                            onChange={handleInputChange}
                            variant="outlined"
                            fullWidth
                            margin="dense"
                            required
                            select  // Bật chế độ select cho TextField
                            SelectProps={{
                                native: true,
                                className: css.customSelect
                            }}
                            InputLabelProps={{
                                sx: {
                                    top: '-5px',  // Điều chỉnh vị trí của label (di chuyển label lên/xuống)
                                },
                            }}
                            error={(newLeadManagement.unit_code || '').trim() === ''}  // Hiển thị lỗi nếu bỏ trống
                            helperText={(newLeadManagement.unit_code || '').trim() === '' ? "Đơn vị là bắt buộc" : ""}
                        >
                            <option value=""></option>
                            {listUnit.map((unit) => (
                                <option key={unit.id} value={unit.name}>
                                    {unit.name}
                                </option>
                            ))}
                        </TextField>
                        <TextField
                            className={css.form_content}
                            label="Tên thể hiện"
                            name="dp"
                            onChange={handleInputChange}
                            variant="outlined"
                            InputLabelProps={{
                                sx: {
                                    top: '-5px',
                                },
                            }} />
                        <TextField
                            className={css.form_content}
                            label="Nhóm sản phẩm"
                            name="group"
                            onChange={handleInputChange}
                            variant="outlined"
                            InputLabelProps={{
                                sx: {
                                    top: '-5px',
                                },
                            }} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleDialogClose} color="secondary">
                            Hủy
                        </Button>
                        <Button onClick={handleSaveNewLeadManagement} color="primary">
                            Lưu
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </>
    );
}
