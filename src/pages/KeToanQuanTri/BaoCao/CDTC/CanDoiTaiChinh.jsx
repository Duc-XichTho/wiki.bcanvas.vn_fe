import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { formatCurrency } from '../../../function/formatMoney.js';
import ExportableGrid from '../../../popUp/exportFile/ExportableGrid.jsx';
import AG_GRID_LOCALE_VN from '../../../locale.jsx';
import { onFilterTextBoxChanged } from '../../../function/quickFilter.js';
import PopupCellActionCashReport from '../../../popUp/cellAction/PopUpCellActionCashReport.jsx';
import AnalysisSideBar from '../../../function/analysisSideBar.jsx';
import { getAllVas } from '../../../../../apisKTQT/vasService.jsx';
import PopupCellActionCDTC from '../../../popUp/cellAction/PopUpCellActionCDTC.jsx';
import {CURRENT_MONTH} from "../../../../../CONST.js";
import css from "../../../../KeToanQuanTri/KeToanQuanTriComponent/KeToanQuanTri.module.css";
import {IoIosSearch} from "react-icons/io";

export default function CanDoiTaiChinh({company, currentMonth}) {
  const table = 'CanDoiTaiChinh';
  const gridRef = useRef();
  const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([]);
  const [updatedData, setUpdatedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFullView, setIsFullView] = useState(false);
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);
  const defaultColDef = useMemo(
    () => ({
      editable: false,
      filter: true,
      cellStyle: { fontSize: '14.5px' },
      resizeable: true,
      width: 140,
    }),
    []
  );
  const getField = (month, key) => `t${month}_${key}`;
  const getHeader = (headerKey, key) => `${key} ${headerKey} `;
  const createColumn = (month, fieldKey, headerKey) => ({
    field: getField(month, fieldKey),
    headerName: month === 0 ? 2024 : getHeader(month, headerKey),
    headerClass: 'right-align-important-2',
    suppressMenu: true,
    width: 110,
    cellStyle: { textAlign: 'right' },
    valueFormatter: (params) => formatCurrency((params.value / 1000).toFixed(0)),
  });

  const handleCellValueChanged = async (event) => {
    // const rowExistsInUpdatedData = updatedData.some((row) => row.id === event.data.id);
    // let newUpdatedData;
    // if (rowExistsInUpdatedData) {
    //   newUpdatedData = updatedData.map((row) => {
    //     if (row.id === event.data.id) {
    //       return { ...event.data, business_unit: team };
    //     }
    //     return row;
    //   });
    // } else {
    //   newUpdatedData = [...updatedData, { ...event.data, business_unit: team }];
    // }
    // let updateMonth = event.colDef.field[1];
    // let duDauKi = rowData.find((e) => e.refercode === '6');
    // if (+updateMonth < 6) {
    //   duDauKi[`t${+updateMonth + 1}_kehoach`] =
    //     +duCuoiKi[`t${+updateMonth}_kehoach`] + +event.newValue - event.oldValue;
    // }
    // setUpdatedData(newUpdatedData);
    // await handleSaveAgl([...newUpdatedData, duDauKi], table, setUpdatedData);
    // loadData();
  };

  const onGridReady = useCallback(async () => {
    loadData();
  }, [company]);
  const getColumnDefs = () => {
    let cols = [
      { field: 'id', headerName: 'ID', hide: true },
      { field: 'header', headerName: 'Chi tiêu', width: 400, pinned: 'left' },
      {
        field: 'dauki',
        headerName: 'Đầu kỳ',
        cellStyle: { textAlign: 'right', paddingRight: 10, color: '#5F5E5B' },
        valueFormatter: (params) => formatCurrency((params.value / 1000).toFixed(0)),
        headerClass: 'right-align-important',
        width: 100,
      },
      {
        field: 'change',
        width: 130,
        columnGroupShow: 'open',
        headerClass: 'right-align-important',
        headerName: `Sparkline T1 - T${currentMonth}`,
        cellRenderer: 'agSparklineCellRenderer',
        cellRendererParams: {
          sparklineOptions: {
            type: 'area',
            marker: { size: 2 },
            tooltip: {
              renderer: (params) => {
                const { yValue, xValue } = params;
                return {
                  content: formatCurrency((yValue / 1000).toFixed(0)),
                  fontSize: '12px',
                };
              },
            },
          },
          valueFormatter: (params) => {
            const changeArray = params.value || [];
            return changeArray.map((value) => {
              return value === null || isNaN(value) ? 0 : Number(value);
            });
          },
        },
      },
    ];
    const numberOfMonths = isFullView ? 12 : 6;
    const startMonth = isFullView ? 1 : currentMonth - 2;

    for (let i = startMonth; i <= numberOfMonths; i++) {
      if (i <= 12) {
        cols.push(createColumn(i, 'ending_net', 'Tháng'));
      }
    }
    return cols;
  };

  async function loadData() {
    setSidebarVisible(false);
    setLoading(true);
    let vasList = await getAllVas();
    vasList = vasList.filter(e => e.consol?.toLowerCase() === 'consol')
    const uniqueRefercodes = ['1', '2', '3'];
    let rowDataList = [
      { header: 'Tài sản', mo_ta: null, refercode: '1' },
      { header: 'Nợ', mo_ta: null, refercode: '2' },
      { header: 'VCSH', mo_ta: null, refercode: '3' },
    ];

    const dp1Mapping = {
      'Tài sản': '1',
      Nợ: '2',
      VCSH: '3',
    };
    const refercodeCounters = {
      1: 1,
      2: 1,
      3: 1,
      4: 1,
    };

    vasList.forEach((item) => {
      const parentRefercode = dp1Mapping[item.phan_loai];
      if (!parentRefercode) return;

      let newRow = {
        header: item.ten_tai_khoan,
        mo_ta: item.chu_thich_tai_khoan,
        refercode: `${parentRefercode}.${refercodeCounters[parentRefercode]++}`,
      };

      for (let x = 1; x <= 12; x++) {
        if (newRow.refercode.startsWith('1')) {
          newRow[`t${x}_ending_net`] = item[`t${x}_ending_net`];
          newRow[`t${x}_open_net`] = item[`t${x}_open_net`];
        } else {
          newRow[`t${x}_ending_net`] = -item[`t${x}_ending_net`];
          newRow[`t${x}_open_net`] = -item[`t${x}_open_net`];
        }
      }
      rowDataList.push(newRow);
    });

    const calculateSums = (data, parentRefercode) => {
      const parentObj = data.find((obj) => obj.refercode === parentRefercode);
      if (!parentObj) return;

      const childObjects = data.filter((obj) => obj.refercode.startsWith(`${parentRefercode}.`));

      for (let i = 1; i <= 12; i++) {
        parentObj[`t${i}_ending_net`] = childObjects.reduce(
          (sum, child) => sum + Number(child[`t${i}_ending_net`] || 0),
          0
        );
      }
    };

    const calculateDauki = (data) => {
      const parentObj = data.find((obj) => obj.refercode === '4');
      if (!parentObj) return;

      for (let i = 1; i <= 12; i++) {
        parentObj[`t${i}_open_net`] = data
          .filter((obj) => ['1', '2', '3'].includes(obj.refercode))
          .reduce((sum, item) => sum + Number(item[`t${i}_open_net`] || 0), 0);
      }
    };
    uniqueRefercodes.forEach((refercode) => calculateSums(rowDataList, refercode));
    calculateDauki(rowDataList);
    const refercodeTotals = {
      1: 0,
      2: 0,
      3: 0,
    };
    rowDataList.forEach((item) => {
      const groupRefercode = item.refercode.split('.')[0];

      let total = 0;
      for (let i = 1; i <= 12; i++) {
        let key = `t${i}_open_net`;
        if (item[key] !== undefined && !isNaN(item[key])) {
          total += +item[key];
        }
      }
      item.dauki = total;
      if (refercodeTotals[groupRefercode] !== undefined) {
        refercodeTotals[groupRefercode] += total;
      }
    });
    rowDataList.forEach((item) => {
      const groupRefercode = item.refercode.split('.')[0];

      if (item.refercode === groupRefercode) {
        item.dauki = refercodeTotals[groupRefercode];
      }
    });
    rowDataList.forEach((obj) => {
      obj.change = [];
      for (let i = 1; i <= currentMonth; i++) {
        obj.change.push(Math.abs(+obj[`t${i}_ending_net`]));
      }
    });
    setRowData(rowDataList);
    setLoading(false);
  }

  const updateColDefs = useCallback(() => {
    setColDefs(getColumnDefs(isFullView));
  }, [currentMonth, isFullView]);

  const openAnalysis = async () => {
    setSidebarVisible(!isSidebarVisible);
  };

  useEffect(() => {
    updateColDefs();
  }, [updateColDefs]);

  useEffect(() => {
    loadData();
  }, [company]);

  return (
    <>
      <div
        className="header-powersheet"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2>Cân Đối Tài Chính (ĐV: ‘000VND)</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={`button-header-sheet ${isFullView ? 'button-active' : ''}`}
            onClick={() => setIsFullView(true)}
          >
            Đầy đủ
          </button>
          <button
            className={`button-header-sheet ${!isFullView ? 'button-active' : ''}`}
            onClick={() => setIsFullView(false)}
          >
            Rút gọn
          </button>
          <ExportableGrid api={gridRef.current?.api} columnApi={gridRef.current?.columnApi} table={table} />
        </div>
      </div>
      <div
        style={{
          height: '75vh',
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
            <img src='/loading3.gif' alt="Loading..." style={{ width: '250px', height: '170px' }} />
          </div>
        )}
        <div className="ag-theme-quartz" style={{ height: '100%', width: '100%', display: 'flex' }}>
          <div
            style={{
              flex: isSidebarVisible ? '75%' : '100%',
              transition: 'flex 0.3s',
            }}
          >
            <AgGridReact
              treeData={true}
              getDataPath={(data) => data.refercode?.toString().split('.')}
              statusBar={statusBar}
              enableRangeSelection
              ref={gridRef}
              rowData={rowData}
              defaultColDef={defaultColDef}
              columnDefs={colDefs}
              rowSelection="multiple"
              //   pagination
              onCellValueChanged={handleCellValueChanged}
              //   paginationPageSize={500}
              animateRows
              //   paginationPageSizeSelector={[500, 1000, 2000, 3000, 5000]}
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
              rowClassRules={{
                'row-head': (params) => {
                  return params.data.refercode?.toString().split('.').length === 1;
                },
              }}
            />
          </div>
          {isSidebarVisible && <AnalysisSideBar table={table + ` - ${team}`} gridRef={gridRef} />}
        </div>
      </div>
    </>
  );
}
