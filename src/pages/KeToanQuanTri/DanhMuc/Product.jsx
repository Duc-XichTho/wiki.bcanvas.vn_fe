import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MyContext } from '../../../MyContext.jsx';
import { toast } from 'react-toastify';
import css from '../KeToanQuanTriComponent/KeToanQuanTri.module.css';
// Ag Grid Function
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ModuleRegistry } from '@ag-grid-community/core';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import '../../Home/AgridTable/agComponent.css';
import AG_GRID_LOCALE_VN from '../../Home/AgridTable/locale.jsx';
// FUNCTION
import ActionDeleteDataAllowed from '../ActionButton/ActionDeleteDataAllowed.jsx';
import RichNoteKTQTRI from '../../Home/SelectComponent/RichNoteKTQTRI.jsx';
import { handleAddAgl } from '../functionKTQT/handleAddAgl.js';
import { getCurrentDateTimeWithHours } from '../functionKTQT/formatDate.js';
import { handleSaveAgl } from '../functionKTQT/handleSaveAgl.js';
import PopupDeleteRenderer from '../popUp/popUpDelete.jsx';
import { onFilterTextBoxChanged } from '../../../generalFunction/quickFilter.js';
// ICON
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TooltipHeaderIcon from '../HeaderTooltip/TooltipHeaderIcon.jsx';
import MenuItem from '@mui/material/MenuItem';
// API
import { getAllProduct } from '../../../apisKTQT/productService.jsx';
import { getAllUnits } from '../../../apisKTQT/unitService.jsx';
import { setItemInIndexedDB2 } from '../storage/storageService.js';
import SettingGroup from './SettingGroup.jsx';
import { getAllSettingGroup } from '../../../apisKTQT/settingGroupService.jsx';
import { getCurrentUserLogin } from '../../../apis/userService.jsx';
import { permissionForKtqt } from '../functionKTQT/permissionForKtqt/permissionForKtqt.js';
import { LoadingOutlined } from '@ant-design/icons';
import '../VanHanh/cssSKT.css';
import ActionSave from '../../Home/AgridTable/actionButton/ActionSave.jsx';
import { MAPPING_GROUP_TYPE } from '../../../Consts/GROUP_SETTING.js';
import DropdownImportDM_SP from '../popUp/importDanhMuc/DropdownImportDM_SP.jsx';
import Loading from '../../Loading/Loading.jsx';
import { getAllSoKeToan } from '../../../apisKTQT/soketoanService.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function Product({company, call, type}) {
    let {sheetPermissionsInfo, currentUser, fetchAllProduct, loadDataSoKeToan, listCompany, userClasses, fetchUserClasses, setIsUpdateNoti ,isUpdateNoti} = useContext(MyContext);
    const table = 'Product';
    const key = 'DANHMUC_SP_KTQT';
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [listUnit, setListUnit] = useState([]);
    const [listGroup, setListGroup] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [saveActive, setSaveActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [oldData, setOldData] = useState({});
    const [showProjectFormUpdate, setShowProjectFormUpdate] = useState(false);
    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);
    const [openDialog, setOpenDialog] = useState(false);  // State to handle Dialog open/close
    const [isFormValid, setIsFormValid] = useState(false);
    const [listEditData, setListEditData] = useState([]);
    const [listGroupNull, setListGroupNull] = useState([]);
    const [isFilteredGroup, setIsFilteredGroup] = useState(false);
    const [loadingCount, setLoadingCount] = useState(false);


    async function EditTable() {
        const user = await getCurrentUserLogin()
        let permission = await permissionForKtqt(user, userClasses, fetchUserClasses)
        return {editable: permission}
    }

    const [newProduct, setNewProduct] = useState({
        name: '',
        unit_code: '',
        code: '',
        dp: '',
        group: '',
        company: ''
    });

    const resetForm = () => {
        setNewProduct({
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
            cellStyle: {fontSize: '14.5px'},
            cellClassRules: {
                'cell-small': (params) => params.colDef.width < 150,
            },
            wrapHeaderText: true,
            autoHeaderHeight: true,
        };
    });

    const onGridReady = useCallback(async () => {
        loadData()
    }, [company]);

    const fetchProductData = async (company) => {
        const [listSoKeToan, data] = await Promise.all([getAllSoKeToan(), getAllProduct()]);

        const relevantProduct = company === "HQ" ? data : data.filter(v => v.company === company);
        const relevantSoKeToan = company === "HQ" ? listSoKeToan : listSoKeToan.filter(s => s.company === company);
        const nonEditableProjects = [];

        relevantProduct.forEach(product => {
            const matchingRecord = relevantSoKeToan.find(skt => skt.product2 === product.code && skt.company === product.company);
            product.isEditable = !matchingRecord;
            if (product.isEditable) {
                nonEditableProjects.push(product);
            }
        });
        setListEditData(nonEditableProjects)

        getAllUnits().then(data => {
            if (company === "HQ") {
                setListUnit(data);
            } else {
                const filteredData = data.filter((e) => e.company === company);
                setListUnit(filteredData);
            }
        })
        getAllSettingGroup().then(data => {
            const filteredData = data.filter((e) => e?.type === 'product');
            setListGroup(filteredData);
        })

        return relevantProduct;
    };

    function countGroupNull(data){
        getAllSettingGroup().then(value => {
            const filteredData = value.filter((e) => e?.type === 'product');
            let checkGroup = []
            data.forEach(e => {
                if (e.group === '' || e.group === null || e.group === undefined || !filteredData.map((p) => p?.name).includes(e.group)) checkGroup.push(e)
            })
            setListGroupNull(checkGroup)
        })
    }

    const loadData = async () => {
        let data;
        if (company === "HQ") {
            data = await fetchProductData("HQ");
        } else {
            data = await fetchProductData(company);
        }
        // data = data.filter((e) => !e.isEditable);
        await setItemInIndexedDB2(key, data);
        // countGroupNull(data);
        setRowData(data);
        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
        loadData();
    }, [company]);

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
                    // {
                    //     field: 'id',
                    //     headerName: 'ID',
                    //     hide: false,
                    //     width: 100,
                    //     ...filter(),
                    //     editable: false,
                    //     cellStyle: {textAlign: "left"}
                    // },
                    // {
                    //     field: 'company',
                    //     headerName: 'Công ty',
                    //     width: 90,
                    //     suppressHeaderMenuButton: true,
                    //     ...filter(),
                    //     editable: params => params.data.isEditable,
                    //     cellStyle: {textAlign: "left"},
                    //     cellEditor: 'agRichSelectCellEditor',
                    //     cellEditorParams: {
                    //         allowTyping: true,
                    //         filterList: true,
                    //         highlightMatch: true,
                    //         values: listCompany.map((p) => p.code),
                    //     },
                    //     // hide: type == 1
                    //
                    // },
                    // {
                    //     field: 'dp',
                    //     headerName: 'Tên thể hiện',
                    //     editable: true,
                    //     flex: 1,
                    //     ...filter(),
                    //     // hide: !type
                    // },
                    {
                        field: 'name',
                        headerName: 'Tên trên sổ hợp nhất',
                        flex: 1,
                        ...filter(),
                        editable: params => params.data.isEditable,
                    },
                    {
                        field: 'code',
                        headerName: 'Mã để tính số liệu báo cáo',
                        flex: 1,
                        ...filter(),
                        editable: params => params.data.isEditable,
                    },
                    // {
                    //     field: 'unit_code',
                    //     headerName: 'Đơn vị(từ sổ kế toán)',
                    //     flex: 1,
                    //     editable: params => params.data.isEditable,
                    //     ...filter(),
                    //     cellEditor: 'agRichSelectCellEditor',
                    //     cellEditorParams: {
                    //         allowTyping: true,
                    //         filterList: true,
                    //         highlightMatch: true,
                    //         // values: listUnit.map((p) => p.name),
                    //     },
                    //     // hide: type == 1
                    //
                    // },
                    {
                        field: 'group',
                        headerName: MAPPING_GROUP_TYPE['group'],
                        flex: 1,
                        editable: true,
                        ...filter(),
                        cellClassRules: {
                            'data-error': (params) => {
                                return params.value === '' || params.value === null || params.value === undefined  || !listGroup.filter(p=> p.groupType === 'group').map((p) => p?.name).includes(params.value);
                            },
                        },
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listGroup.filter(p=> p.groupType === 'group').map(p => p.name),
                        },
                        ...await EditTable()
                    },
                    {
                        field: 'group1',
                        headerName: MAPPING_GROUP_TYPE['group1'],
                        flex: 1,
                        editable: true,
                        ...filter(),
                        cellClassRules: {
                            'data-error': (params) => {
                                return params.value === '' || params.value === null || params.value === undefined  || !listGroup.filter(p=> p.groupType === 'group1').map((p) => p?.name).includes(params.value);
                            },
                        },
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listGroup.filter(p=> p.groupType === 'group1').map(p => p.name),
                        },
                        ...await EditTable()
                    },
                    {
                        field: 'group2',
                        headerName: MAPPING_GROUP_TYPE['group2'],
                        flex: 1,
                        editable: true,
                        ...filter(),
                        cellClassRules: {
                            'data-error': (params) => {
                                return params.value === '' || params.value === null || params.value === undefined  || !listGroup.filter(p=> p.groupType === 'group2').map((p) => p?.name).includes(params.value);
                            },
                        },
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listGroup.filter(p=> p.groupType === 'group2').map(p => p.name),
                        },
                        ...await EditTable()
                    },
                    {
                        field: 'group3',
                        headerName: MAPPING_GROUP_TYPE['group3'],
                        flex: 1,
                        editable: true,
                        ...filter(),
                        cellClassRules: {
                            'data-error': (params) => {
                                return params.value === '' || params.value === null || params.value === undefined  || !listGroup.filter(p=> p.groupType === 'group3').map((p) => p?.name).includes(params.value);
                            },
                        },
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listGroup.filter(p=> p.groupType === 'group3').map(p => p.name),
                        },
                        ...await EditTable()
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
                    //     editable: false
                    // },
                    {
                        pinned: 'left',
                        width: '40',
                        field: 'action',
                        cellStyle: {textAlign: 'center'},
                        headerName: '',
                        cellRenderer: (params) => {
                            // if (!params.data || !params.data.id || params.data.duyet == 1 || !params.data.isEditable) {
                            //     return null;
                            // }
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
                        editable: false,
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
    const handleCellValueChanged = (event) => {
        const updatedRow = { ...event.data };
        setUpdatedData((prevData) => {
            const existingRowIndex = prevData.findIndex(item => item.id === updatedRow.id);
            if (existingRowIndex !== -1) {
                prevData[existingRowIndex] = updatedRow;
                return [...prevData];
            } else {
                return [...prevData, updatedRow];
            }
        });
    };

    const handleSaveData = async () => {
        setLoading(true)
        if (!updatedData.length) return;
        await handleSaveAgl(updatedData, table, setUpdatedData, setIsUpdateNoti, isUpdateNoti);
        await loadData();
        setLoading(false)
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
        const {name, value} = e.target;
        setNewProduct((prev) => ({...prev, [name]: value}));
    };
    useEffect(() => {
        const isValid = (newProduct.name || '').trim() !== '' && (newProduct.unit_code || '').trim() !== '';
        setIsFormValid(isValid);

        if (isValid) {
            // Tạo code tự động khi các trường hợp lệ
            const newCode = `${newProduct.name}-${newProduct.company}-${newProduct.unit_code}`;
            setNewProduct(prev => ({...prev, code: newCode}));
        }
    }, [newProduct.name, newProduct.unit_code, company]);
    const handleSaveNewProduct = async () => {
        if (!isFormValid) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
            return;
        }

        try {
            // Gọi API để thêm giao dịch mới
            await handleAddAgl(
                newProduct.company,
                {
                    ...newProduct,
                    system_created_at: getCurrentDateTimeWithHours(),
                    company
                }, 'Product', fetchAllProduct,setIsUpdateNoti ,isUpdateNoti);


            await onGridReady();  // Reload dữ liệu trong bảng
            handleDialogClose();  // Đóng Dialog sau khi lưu

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
    //     await fetchAllProduct();
    // }, [onGridReady]);
    const onRowDoubleClicked = (event) => {
        setOldData(event.data);
        setShowProjectFormUpdate(true);
    };

    function handleFilterNotKM(type , data) {
        if (type == 'group') {
            if (!isFilteredGroup) {
                setRowData(listGroupNull);
            } else {
                loadData();
            }
            setIsFilteredGroup(!isFilteredGroup);
        }
    }


    return (
        <>
            <div className={'header-powersheet'}>
                {!call && <>
                    <div className={css.headerTitle}>
                        <span>Quản lý sản phẩm <TooltipHeaderIcon table={table}/></span>
                    </div>
                </>}
                <div className={css.headerAction}>
                    <SettingGroup table={table} reload={onGridReady}/>
                    {
                        listEditData.length > 0 &&
                        <ActionDeleteDataAllowed listDataAllowDelete={listEditData} table={table}
                                                 loadData={loadData}/>

                    }
                    <ActionSave handleSaveData={handleSaveData} updateData={updatedData}/>
                    {/*<ActionCreate handleAddRow={handleAddRow}/>*/}
                    <DropdownImportDM_SP
                        table={table}
                        reload={loadData}
                        columnDefs={colDefs}
                        company={company}
                        data={rowData}
                        title_table={'Quản lý sản phẩm'}
                        type_setting_group={'product'}
                        listGroup={listGroup}
                        listUnit={listUnit}
                    />
                </div>
            </div>
            <div className={css.headerPowersheet2}>
            <div className={`${css.headerActionButton}`}>
                {listGroupNull.length > 0 &&
                    <div
                        className={`${css.checkKM} ${isFilteredGroup ? css.activeNotification : ''}`}
                        onClick={() => {
                            handleFilterNotKM( 'group' ,listGroupNull)
                        }}>
                        {loadingCount ? <LoadingOutlined/> : <>Có {listGroupNull.length} dòng chưa điền nhóm lên báo
                            cáo KQKD hoặc sai với thiết lập nhóm
                        </>}

                    </div>}
            </div>

        </div>
            <div style={{width: '100%', height: 'max-content', boxSizing: "border-box"}}>
                <RichNoteKTQTRI table={`${table + '-' + company}`}/>
            </div>
            <div
                style={{
                    height: call === 'cdsd' ? '75%' : '61vh',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    marginTop: '15px',
                }}
            >
                <Loading loading={loading}/>
                <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
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
                    <DialogTitle>Thêm sản phẩm mới</DialogTitle>

                    <DialogContent className={css.dialogContent}>
                        <TextField
                            margin="dense"
                            label="Tên công ty"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={newProduct.company}
                            required
                            error={(newProduct.company || '').trim() === ''}  // Hiển thị lỗi nếu bỏ trống
                            helperText={(newProduct.company || '').trim() === '' ? "Tên công ty là bắt buộc" : ""}
                            onChange={(e) => setNewProduct({...newProduct, company: e.target.value})}
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
                            value={newProduct.name || ''}  // Đảm bảo luôn có giá trị mặc định
                            onChange={handleInputChange}
                            variant="outlined"
                            fullWidth
                            margin="dense"
                            required
                            error={(newProduct.name || '').trim() === ''}  // Hiển thị lỗi nếu bỏ trống
                            helperText={(newProduct.name || '').trim() === '' ? "Tên sản phẩm là bắt buộc" : ""}
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
                            value={newProduct.unit_code || ''}  // Đảm bảo luôn có giá trị mặc định
                            onChange={handleInputChange}
                            variant="outlined"
                            fullWidth
                            margin="dense"
                            required
                            select
                            // SelectProps={{
                            //     native: true,
                            //     className: css.customSelect
                            // }}
                            // InputLabelProps={{
                            //     sx: {
                            //         top: '-5px',  // Điều chỉnh vị trí của label (di chuyển label lên/xuống)
                            //     },
                            // }}
                            error={(newProduct.unit_code || '').trim() === ''}  // Hiển thị lỗi nếu bỏ trống
                            helperText={(newProduct.unit_code || '').trim() === '' ? "Đơn vị là bắt buộc" : ""}
                        >
                            {listUnit.map((unit) => (
                                <MenuItem key={unit.id} value={unit.name}>
                                    {unit.name}
                                </MenuItem>
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
                            }}/>
                        <TextField
                            select
                            className={css.form_content}
                            label="Nhóm sản phẩm"
                            name="group"
                            onChange={handleInputChange}
                            variant="outlined"
                            fullWidth
                            margin="dense"
                            value={newProduct.group}
                            InputLabelProps={{
                                sx: {
                                    top: '-5px',
                                },
                            }}>
                            {listGroup.map(e =>
                                <MenuItem key={e.name} value={e.name}>
                                    {e.name}
                                </MenuItem>
                            )}
                        </TextField>
                    </DialogContent>
                    <DialogActions>
                    <Button onClick={handleDialogClose} color="secondary">
                            Hủy
                        </Button>
                        <Button onClick={handleSaveNewProduct} color="primary">
                            Lưu
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </>
    );
}
