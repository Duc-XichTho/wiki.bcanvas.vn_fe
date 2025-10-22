import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
// Ag Grid Function
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
import { toast } from 'react-toastify';
import '../../../../Home/AgridTable/agComponent.css';
import css from "../../../BaoCao/BaoCao.module.css";
// Component
import { Color } from '../../Color.js';
import { calculateData, calculateDataView2 } from '../logicKQKD.js';
import { calculateData3 } from "../logicKQKDKieuC.js";
import { onFilterTextBoxChanged } from "../../../../../generalFunction/quickFilter.js";
import { MyContext } from "../../../../../MyContext.jsx";
import { getItemFromIndexedDB2, setItemInIndexedDB2 } from "../../../storage/storageService.js";
import { getAllKmf } from "../../../../../apisKTQT/kmfService.jsx";
import { getAllUnits } from "../../../../../apisKTQT/unitService.jsx";
import PopupCellActionBCKD from "../../../popUp/cellAction/PopUpCellActionBCKD.jsx";
import { EllipsisIcon } from "../../../../../icon/IconSVG.js";
import AG_GRID_LOCALE_VN from "../../../../Home/AgridTable/locale.jsx";
import ActionViewSetting from "../../../ActionButton/ActionViewSetting.jsx";

import { useParams } from 'react-router-dom';
import ActionHideEmptyRows from "../../../ActionButton/ActionHideEmptyRows.jsx";
import ActionSelectTypeBaoCao from "../../../ActionButton/ActionSelectTypeBaoCao.jsx";
import ActionSelectMonthBaoCao from "../../../ActionButton/ActionSelectMonthBaoCao.jsx";
import { getFileNotePadByIdController } from "../../../../../apis/fileNotePadService.jsx";
import ActionToggleSwitch from "../../../ActionButton/ActionToggleSwitch.jsx";
import ActionDisplayModeSwitch from "../../../ActionButton/ActionDisplayModeSwitch.jsx";
import ExportableGrid from "../../../popUp/exportFile/ExportableGrid.jsx";
import { getCurrentUserLogin } from "../../../../../apis/userService.jsx";
import { KHONG_THE_TRUY_CAP } from "../../../../../Consts/TITLE_HEADER.js";
import NotAccessible from "../../../../Canvas/NotAccessible.jsx";
import { getPermissionDataNhomDV } from "../../../../Canvas/getPermissionDataNhomBC.js";
import ActionDisplayRichNoteSwitch from "../../../ActionButton/ActionDisplayRichNoteSwitch.jsx";
import RichNoteKTQTRI from "../../../../Home/SelectComponent/RichNoteKTQTRI.jsx";
import ActionToggleSwitch2 from "../../../ActionButton/ActionToggleSwitch2.jsx";
import { Button, Dropdown } from 'antd';
import { ChevronDown } from 'lucide-react';
import ActionMenuDropdown from '../../../ActionButton/ActionMenuDropdown.jsx';
import Loading from '../../../../Loading/Loading.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function BaoCaoUnit_CANVAS() {
  const pathDashboard = window.location.pathname.includes('dashboard');
  const { companySelect, id, tabSelect } = useParams();
  const table = 'BaoCaoUnitCanvas';
  const key = 'KQKD_DV';
  const {
    isNotePadBaoCao,
    loadDataSoKeToan,
    currentMonthCanvas,
    selectedCompany,
    currentYearCanvas,
    userClasses,
    fetchUserClasses,
    uCSelected_CANVAS,
  } = useContext(MyContext);
  const gridRef = useRef();
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [titleName, setTitleName] = useState('');

  function isBold(params) {
    const isBold = params.data.layer.toString()?.includes('.');
    return {
      textAlign: 'left',
      paddingRight: 10,
      // background: isBold ? "" : 'rgb(237, 237, 237)',
    };
  }

  const tableStatusButton = 'BCUnitStatusButtonCanvas';
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isShowAll1, setShowAll1] = useState(null);
  const [isHideEmptyColumns, setHideEmptyColumns] = useState(null);
  const [isShowView, setShowView] = useState(null);
  const [isShowView2, setShowView2] = useState(null);
  const [isShowView3, setShowView3] = useState(null);
  const [isShowInfo, setIsShowInfo] = useState(false);

  useEffect(() => {
    handleSelectedMonthChange(currentMonthCanvas);
  }, [currentMonthCanvas])

  const fetchAndSetTitleName = async (id) => {
    try {
      const data = await getFileNotePadByIdController(id);
      setTitleName(data.name);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu:', error);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getItemFromIndexedDB2(tableStatusButton);
      setSelectedMonth(settings?.selectedMonth || null)
      setShowAll1(settings?.isShowAll1 ?? true);
      setHideEmptyColumns(settings?.isHideEmptyColumns ?? false);
      setShowView(settings?.isShowView ?? false);
      setShowView2(settings?.isShowView2 ?? true);
      setShowView3(settings?.isShowView3 ?? false);
      setIsShowInfo(settings?.isShowInfo ?? false);
    };

    fetchSettings();
    fetchAndSetTitleName(id)
  }, []);

  useEffect(() => {
    const saveSettings = async () => {
      const tableSettings = {
        selectedMonth,
        isShowAll1,
        isHideEmptyColumns,
        isShowView,
        isShowView2,
        isShowView3,
        isShowInfo,
      };
      await setItemInIndexedDB2(tableStatusButton, tableSettings);
    };

    saveSettings();
  }, [isShowView, isShowView2, isShowAll1, isHideEmptyColumns, selectedMonth, isShowView3, isShowInfo,]);

  const handleClickView = () => {
    setShowView(true);
    setShowView2(false);
    setShowView3(false);
  };

  const handleClickView2 = () => {
    setShowView2(true);
    setShowView(false);
    setShowView3(false);
  };
  const handleClickView3 = () => {
    setShowView3(true);
    setShowView(false);
    setShowView2(false);
  };

  const handleIsShowAll1 = () => {
    setShowAll1((prevIsShowAll1) => {
      setHideEmptyColumns(!prevIsShowAll1);
      return !prevIsShowAll1;
    });
  };

  const toggleSwitch = () => {
    handleIsShowAll1()
  }

  const handleSelectedMonthChange = (e) => {
    setSelectedMonth(e);
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  const handleShowInfo = () => {
    setIsShowInfo(prevState => !prevState);
  };

  const statusBar = useMemo(() => {
    return {
      statusPanels: [{ statusPanel: 'agAggregationComponent' }],
    };
  }, []);
  const defaultColDef = useMemo(() => {
    return {
      editable: false,
      filter: true,
      cellStyle: {
        fontSize: '14.5px',
        color: 'var(--text-color)',
        fontFamily: 'var(--font-family)',
      },
      width: 150,
      wrapHeaderText: true,
      autoHeaderHeight: true,
    };
  });

  async function prepareData() {
    setLoading(true);
    const user = await getCurrentUserLogin();
    let units = await getAllUnits();
    units = await getPermissionDataNhomDV('unit', user, userClasses, fetchUserClasses, uCSelected_CANVAS, units)
    if (units?.length == 0 || !units) {
      setTitleName(KHONG_THE_TRUY_CAP)
      units = []
    }

    let data = await loadDataSoKeToan();
    data = data.filter((e) => e.consol?.toLowerCase() == 'consol');
    data = data.filter(e => e.year == currentYearCanvas);



    const uniqueUnits = units.reduce((acc, current) => {
      if (!acc.find((unit) => unit.code === current.code)) {
        acc.push(current);
      }
      return acc;
    }, []);

    let kmfList = await getAllKmf();
    kmfList = kmfList.reduce((acc, current) => {
      if (!acc.find((unit) => unit.name === current.name)) {
        acc.push(current);
      }
      return acc;
    }, []);
    let rowData = []
    if (isShowView3) rowData = calculateData3(data, units, kmfList, 'code', 'unit_code2', 'PBDV', 'teams');
    if (isShowView2) rowData = calculateDataView2(data, units, kmfList, 'code', 'unit_code2', 'PBDV', 'teams')
    if (isShowView) rowData = calculateData(data, units, kmfList, 'code', 'unit_code2', 'PBDV', 'teams')
    let newRowData = rowData

    if (isShowAll1) {
      newRowData = newRowData.filter((item) => {
        for (let j = 0; j < uniqueUnits.length; j++) {
          if ((item[`${uniqueUnits[j].code}_${selectedMonth}`] && item[`${uniqueUnits[j].code}_${selectedMonth}`] !== 0) || !item.layer.includes('.')) {
            return true;
          }
        }

        return false;
      });
    }
    await setItemInIndexedDB2(key, newRowData);
    setRowData(newRowData);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }

  const onGridReady = useCallback(async () => {
    prepareData();
  }, []);

  useEffect(() => {
    prepareData();
  }, [isShowView, isShowView3, isShowView2, selectedMonth, isShowAll1, selectedCompany, currentYearCanvas]);

  const rendHeader = (teamKey) => {
    const parts = teamKey.split('_');
    const prefix = parts[0];
    if (prefix === 'ALL') {
      return 'Tổng';
    }
    let header = prefix.split('-')[1] || 'Khác';
    return `${prefix}`;
  };

  function createField(field) {
    return {
      field: field,
      headerName: rendHeader(field),
      headerClass: 'right-align-business-name',
      cellStyle: (params) => {
        return { ...isBold(params), textAlign: 'right' }
      },
      cellRenderer: (params) => {
        return (
          <div className="cell-action-group">
            <PopupCellActionBCKD {...params} field={field} allData={rowData} type={'NDV'}
              view={isShowView2} currentYear={currentYearCanvas} />
          </div>
        );
      },
      ...Color(),
    };
  }

  async function redenderFields() {
    let fields = [
      {
        field: 'dp',
        headerName: 'Khoản mục phí',
        width: 300,
        pinned: 'left',
        ...Color(),
        cellStyle: isBold
      },
      ...(await renderFieldMoney()),
    ];
    console.log(key + '_FEILD', fields.map(item => {
      return { field: item.field, headerName: item.headerName }
    }))
    return fields;
  }

  async function renderFieldMoney() {
    const teamFields = [];
    const validFields = [];
    for (let y = 0; y <= 12; y++) {
      if (selectedMonth === null || selectedMonth == y) {
        teamFields.push({
          ...createField(`ALL_${y}`),
        });
      }
    }
    const user = await getCurrentUserLogin();
    let units = await getAllUnits();
    units = await getPermissionDataNhomDV('unit', user, userClasses, fetchUserClasses, uCSelected_CANVAS, units, setTitleName)
    if (units?.length == 0 || !units) {
      setTitleName(KHONG_THE_TRUY_CAP)
      units = []
    }
    let uniqueGroups = [...new Set(units.map((unit) => unit.code))];
    uniqueGroups = uniqueGroups.map((group) => group === null ? '100-Khác' : group)
    uniqueGroups.sort((a, b) => {
      let idxA = parseFloat(a.split('-')[0]) || 100
      let idxB = parseFloat(b.split('-')[0]) || 100
      return idxA - idxB;
    });
    if (isHideEmptyColumns) {
      uniqueGroups.forEach((team) => {
        for (let y = 0; y <= 12; y++) {
          if (selectedMonth === null || selectedMonth == y) {
            const fieldName = `${team}_${y}`;
            if (rowData.some((row) => row[fieldName] !== 0 && row[fieldName] !== null)) {
              validFields.push(fieldName);
            }

          }
        }
      });
      validFields.forEach((field) => {
        teamFields.push(createField(field));
      });
    } else {
      uniqueGroups.forEach((team) => {
        for (let y = 0; y <= 12; y++) {
          if (selectedMonth === null || selectedMonth == y) {
            const fieldName = `${team}_${y}`;
            teamFields.push({
              ...createField(fieldName),
            });
          }
        }
      });
    }
    return teamFields;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setColDefs(await redenderFields());
      } catch (error) {
        console.log(error);
        console.log(error)
      }
    };
    fetchData();
  }, [selectedMonth, isHideEmptyColumns, rowData]);

  const handlers = {
    A: () => {
      handleClickView()
    },
    B: () => {
      handleClickView2()
    },
    C: () => {
      handleClickView3()
    },
  };

  const options = [
    { value: 'A', label: 'Nhóm theo bản chất biến phí, định phí', used: isShowView },
    { value: 'B', label: 'Nhóm khoản mục KQKD dựa theo TK kế toán', used: isShowView2 },
    { value: 'C', label: 'Nhóm theo dạng trực tiếp, phân bổ', used: isShowView3 },
  ];

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const items = [
    {
      key: '0',
      label: (
          <span>{isShowAll1 && isHideEmptyColumns ? '✅ Bật ẩn dữ liệu trống' : '❌ Tắt ẩn dữ liệu trống'}</span>
      ),
      onClick: toggleSwitch,
    },
    {
      key: '1',
      label: (
          <span>{isShowInfo ? '✅ Bật ghi chú' : '❌ Tắt ghi chú'}</span>
      ),
      onClick: handleShowInfo,
    },
    // {
    //   key: '2',
    //   label: (
    //       <span>
    //             🔄 Xem KMF
    //         </span>
    //   ),
    //   onClick: handleOpenViewKMF,
    // },
    // {
    //   key: '3',
    //   label: (
    //       <span>
    //             🔄 Xem Sản phẩm
    //         </span>
    //   ),
    //   onClick: handleOpenViewSP,
    // },
  ];

  const popoverContent = (
      <div className={css.popoverContent}>
        {items.map((item) => (
            <div
                key={item.key}
                onClick={item.onClick}
                className={css.popoverItem}
            >
              {item.label}
            </div>
        ))}
      </div>
  );

  return (
    <>
      <div className={css.main}>
        <NotAccessible NotAccessible={titleName} />
        <div style={{ width: isNotePadBaoCao ? "80%" : "100%" }}>
          <div className={css.headerPowersheet}>
            <div className={css.headerTitle}>
              <span>{titleName}</span>
              {/*<div className={css.toogleChange}>*/}
              {/*    <ActionToggleSwitch label="Ẩn dòng trống" isChecked={isShowAll1}*/}
              {/*                        onChange={handleIsShowAll1}/>*/}
              {/*</div>*/}

              {/*<div className={css.toogleChange}>*/}
              {/*    <ActionToggleSwitch label="Ẩn cột trống" isChecked={isHideEmptyColumns}*/}
              {/*                        onChange={handleHideEmptyColumns}/>*/}
              {/*</div>  */}

            </div>
          </div>
          <div className={css.headerPowersheet2}>
            <img src="/Group%20197.png" alt="Đơn vị: VND" style={{ width: '130px', marginLeft: '3px' }} />
            {/*<div className={css.toogleChange}>*/}
            {/*  <ActionToggleSwitch2 label="Ẩn dữ liệu trống"*/}
            {/*    isChecked={isShowAll1 && isHideEmptyColumns}*/}
            {/*    onChange={toggleSwitch} />*/}
            {/*</div>*/}
            {/*<div className={css.toogleChange}>*/}
            {/*  <ActionDisplayRichNoteSwitch isChecked={isShowInfo} onChange={handleShowInfo} />*/}
            {/*</div>*/}
            <div className={css.headerAction}>
              <ActionSelectTypeBaoCao options={options} handlers={handlers} />
              {!pathDashboard && (
                <ActionSelectMonthBaoCao selectedMonth={selectedMonth}
                  handleSelectedMonthChange={handleSelectedMonthChange} />
              )}
              {/*<div className="navbar-item" ref={dropdownRef}>*/}
              {/*  /!* <img*/}
              {/*    src={EllipsisIcon}*/}
              {/*    style={{ width: 32, height: 32, cursor: 'pointer' }}*/}
              {/*    alt="Ellipsis Icon"*/}
              {/*    onClick={handleDropdownToggle}*/}
              {/*  /> *!/*/}
              {/*  {isDropdownOpen && (*/}
              {/*    <div className={css.dropdownMenu}>*/}
              {/*      <ExportableGrid*/}
              {/*        api={gridRef.current ? gridRef.current.api : null}*/}
              {/*        columnApi={gridRef.current ? gridRef.current.columnApi : null}*/}
              {/*        table={table}*/}
              {/*        isDropdownOpen={isDropdownOpen}*/}
              {/*      />*/}
              {/*    </div>*/}
              {/*  )}*/}
              {/*</div>*/}

              {/*<div>*/}
              {/*  <ActionViewSetting table={table} />*/}
              {/*</div>*/}
              <ActionMenuDropdown popoverContent={popoverContent}
                                  dropdownOpen={dropdownOpen}
                                  setDropdownOpen={setDropdownOpen}
              />
            </div>
          </div>
          <Loading loading={loading}/>
          {isShowInfo && <div style={{ width: '100%', height: 'max-content', boxSizing: "border-box" }}>
            <RichNoteKTQTRI table={`${table}_Canvas_note`} />
          </div>}
          <div
            style={{
              height: isShowInfo ? '50vh' : '50vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              marginTop: '15px',
            }}
          >

            <div className="ag-theme-quartz"
              style={{ height: '100%', width: '100%', display: 'flex' }}>
              <div style={{ maxHeight: '50vh', width: '100%', }}>
                <AgGridReact
                  statusBar={statusBar}
                  ref={gridRef}
                  rowData={rowData}
                  enableRangeSelection={true}
                  defaultColDef={defaultColDef}
                  treeData={true}
                  // groupDefaultExpanded={-1}
                  getDataPath={(data) => data.layer?.toString().split('.')}
                  columnDefs={colDefs}
                  rowSelection="multiple"
                  // pagination={true}
                  // paginationPageSize={500}
                  animateRows={true}
                  // paginationPageSizeSelector={[500, 1000, 2000, 3000, 5000]}
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
                  domLayout="normal"
                  rowClassRules={{
                    'row-head': (params) => {
                      return params.data.layer?.toString().split('.').length === 1;
                    },
                  }}
                />
              </div>
              {/*{isSidebarVisible && <AnalysisSideBar table={table} gridRef={gridRef}/>}*/}
            </div>
          </div>
        </div>
        {
          isNotePadBaoCao &&
          <div className={css.phantich}>
            {/*<PhanTichNote table={table}/>*/}
          </div>
        }
      </div>
    </>
  );
}
