import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
// Ag Grid Function
import AG_GRID_LOCALE_VN from '../../locale.jsx';
import { onFilterTextBoxChanged } from '../../function/quickFilter.js';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ModuleRegistry } from '@ag-grid-community/core';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { toast } from 'react-toastify';
import '../../agComponent.css';

import AnalysisSideBar from '../../function/analysisSideBar.jsx';
import ExportableGrid from '../../popUp/exportFile/ExportableGrid.jsx';
import { getAllSoKeToan } from '../../../../apisKTQT/soketoanService.jsx';
import PopupCellActionBCKD from '../../popUp/cellAction/PopUpCellActionBCKD.jsx';
import { getAllKmf } from '../../../../apisKTQT/kmfService.jsx';
import { formatCurrency } from '../../function/formatMoney.js';
import {CURRENT_MONTH} from "../../../../CONST.js";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function MaKQKD({company}) {
  const table = 'MaKQKD';
  const gridRef = useRef();
  const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const currentMonth = CURRENT_MONTH;
  // const currentMonth = (new Date()).getMonth() + 1;
  const [isFullView, setIsFullView] = useState(false);

  const statusBar = useMemo(() => {
    return {
      statusPanels: [{ statusPanel: 'agAggregationComponent' }],
    };
  }, []);

  const defaultColDef = useMemo(() => {
    return {
      editable: false,
      filter: true,
      cellStyle: { fontSize: '14.5px' },
      width: 120,
    };
  });
  function sumAttributesByCode(result, code) {
    let sumObj = { code: code };

    // Duyệt qua từng phần tử trong result
    result.forEach((item) => {
      if (item.code === code) {
        for (let i = 0; i <= 12; i++) {
          if (!sumObj.hasOwnProperty(i)) {
            sumObj[i] = 0;
          }
          sumObj[i] += item[i] || 0;
        }
      }
    });

    return sumObj;
  }

  function prepareData() {
    setLoading(true);
    getAllSoKeToan().then(async (data) => {
      data = data.filter(e =>  e.consol?.toLowerCase() == 'consol')
      const uniqueKMF = await getAllKmf();
      const uniqueKMFMap = uniqueKMF.map((item) => {
        return { ...item, kmf: item.name };
      });
      const result = [
        { kmf: 'Doanh thu', mo_ta: null, layer: '1' },
        { kmf: 'Giá vốn', mo_ta: null, layer: '2' },
        { kmf: 'Chi phí', mo_ta: null, layer: '3' },
        { kmf: 'Hoạt động tài chính', mo_ta: null, layer: '4' },
        { kmf: 'Lãi lỗ khác', mo_ta: null, layer: '5' },
        { kmf: 'Lợi nhuận trước thuế', mo_ta: null, layer: '6' },
        { kmf: 'Thuế', mo_ta: null, layer: '7' },
        { kmf: 'Lợi nhuận sau thuế', mo_ta: null, layer: '8' },
        { kmf: 'EBITDA', mo_ta: null, layer: '9' },
        { kmf: 'Tổng chi phí biến đối', mo_ta: null, layer: '10' },
        { kmf: 'Tổng chi phí cố định', mo_ta: null, layer: '11' },
      ];

      let thuCounter = 1,
        chiCounter = 1,
        gvCounter = 1;
      uniqueKMFMap.forEach((item) => {
        if (item.code === 'DT') {
          result.push({ ...item, layer: `1.${thuCounter++}` });
        } else if (item.code.startsWith('COS')) {
          result.push({ ...item, layer: `2.${gvCounter++}` });
        } else if (item.code === 'VC' || item.code === 'FC' || item.code === 'KH') {
          result.push({ ...item, layer: `3.${chiCounter++}` });
        } else if (item.code === 'DTTC' || item.code === 'CFTC') {
          result.push({ ...item, layer: `4.${chiCounter++}` });
        } else if (item.code === 'OI' || item.code === 'OE') {
          result.push({ ...item, layer: `5.${chiCounter++}` });
        } else if (item.code === 'TAX') {
          result.push({ ...item, layer: `7.${chiCounter++}` });
        }
      });
      result.forEach((item) => {
        for (let month = 1; month <= 12; month++) {
          item[`${month}`] = 0;
        }
      });

      const totals = {};

      data.forEach((item) => {
        const key = `${item.kmf}_${+item.month}`;
        if (!totals[key]) {
          totals[key] = 0;
        }
        totals[key] += parseFloat(item.pl_value);
      });
      result.forEach((item) => {
        for (const key in totals) {
          const [kmf, month] = key.split('_');
          if (item.kmf === kmf) {
            item[`${month}`] = totals[key];
          }
        }
      });
      result.forEach((item) => {
        if (item.layer === '1' || item.layer === '2' || item.layer === '3' || item.layer === '4') {
          for (let month = 1; month <= 12; month++) {
            const layerPrefix = item.layer + '.';
            const layerItems = result.filter((subItem) => subItem.layer && subItem.layer.startsWith(layerPrefix));
            const total = layerItems.reduce((acc, subItem) => acc + (subItem[`${month}`] || 0), 0);
            item[`${month}`] = total;
          }
        }
      });
      let l1 = result.find((e) => e.layer == 4);
      let l2 = result.find((e) => e.layer == 1);
      let l3 = result.find((e) => e.layer == 3);
      let l4 = result.find((e) => e.layer == 2);
      let l5 = result.find((e) => e.layer == 5);
      let l6 = result.find((e) => e.layer == 6);
      let l7 = result.find((e) => e.layer == 7);
      let l8 = result.find((e) => e.layer == 8);
      let l9 = result.find((e) => e.layer == 9);
      let l10 = result.find((e) => e.layer == 10);
      let l11 = result.find((e) => e.layer == 11);
      let khpb = result.find((e) => e.code == 'KH');
      let cftc = result.find((e) => e.code == 'CFTC');
      let cosV = result.find((e) => e.code == 'COS-V');
      let cosF = result.find((e) => e.code == 'COS-F');
      let vc = sumAttributesByCode(result, 'VC');
      let fc = sumAttributesByCode(result, 'FC');
      for (let month = 1; month <= 12; month++) {
        l6[`${month}`] = l1[`${month}`] + l2[`${month}`] + l3[`${month}`] + l4[`${month}`] + l5[`${month}`];
        l8[`${month}`] = l7[`${month}`] + l6[`${month}`];
        l9[`${month}`] = l6[`${month}`] - cftc[`${month}`] - khpb[`${month}`];
        l10[`${month}`] = vc[`${month}`] + cosV[`${month}`];
        l11[`${month}`] = fc[`${month}`] + khpb[`${month}`] + cosF[`${month}`];
      }
      result.forEach((item) => {
        item[`0`] = 0;
        for (let month = 1; month <= 12; month++) {
          item[`0`] += item[`${month}`];
        }
      });
      result.forEach((item) => {
        item['change'] = [];
        for (let i = 1; i <= currentMonth; i++) {
          if (item.layer && (item.layer.includes('2') || item.layer.includes('3'))) {
            item['change'].push(Math.abs(item[`${i}`]));
          } else {
            item['change'].push(item[`${i}`]);
          }
        }
      });
      setRowData(result);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    });
  }

  const onGridReady = useCallback(async () => {
    prepareData();
  }, [company]);
  useEffect(() => {
    prepareData();
  }, [company]);
  const rendHeader = (suffix) => {
    if (suffix == 0) return '2024';
    return `Tháng ${suffix}`;
  };

  function createField(field) {
    return {
      field: field,
      headerName: rendHeader(field),
      headerClass: 'right-align-important-2',
      cellRenderer: (params) => {
        return (
          <div className="cell-action-group">
            <PopupCellActionBCKD {...params} field={field} allData={rowData} type={'TQ'} />
          </div>
        );
      },
      width: 150,
    };
  }

  function redenderFields() {
    let fields = [
      {
        field: 'kmf',
        headerName: 'Khoản mục phí',
        width: 300,
        pinned: 'left',
      },
      {
        field: 'code',
        headerName: 'Code',
        width: 80,
        pinned: 'left',
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
      ...renderFieldMoney(),
    ];
    return fields;
  }

  function renderFieldMoney() {
    const teamFields = [];
    const startMonth = isFullView ? 0 : Math.max(0, currentMonth - 2);
    const endMonth = isFullView ? 12 : currentMonth;
    teamFields.push({
      ...createField(`0`),
    });
    for (let y = startMonth; y <= endMonth; y++) {
      const fieldName = `${y}`;
      if (y !== 0) {
        teamFields.push({
          ...createField(fieldName),
        });
      }
    }
    return teamFields;
  }

  const openAnalysis = async () => {
    setSidebarVisible(!isSidebarVisible);
  };

  useEffect(() => {
    setSidebarVisible(false);
    const fetchData = async () => {
      try {
        setColDefs(redenderFields());
      } catch (error) {
       console.log(error)
      }
    };
    fetchData();
  }, [onGridReady, rowData, table, isFullView, currentMonth]);

  return (
    <>
      <div>
        <div
          className={'header-powersheet'}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2>Báo cáo kết quả kinh doanh (ĐV: ‘000VND)</h2>
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
            <button className={'button-header-sheet-analysis'} onClick={openAnalysis}>
              Phân tích
            </button>
            <ExportableGrid
              api={gridRef.current ? gridRef.current.api : null}
              columnApi={gridRef.current ? gridRef.current.columnApi : null}
              table={table}
            />
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
            <div style={{ flex: isSidebarVisible ? '75%' : '100%', transition: 'flex 0.3s' }}>
              <AgGridReact
                statusBar={statusBar}
                ref={gridRef}
                rowData={rowData}
                enableRangeSelection={true}
                defaultColDef={defaultColDef}
                treeData={true}
                getDataPath={(data) => data.layer?.toString().split('.')}
                columnDefs={colDefs}
                rowSelection="multiple"
                animateRows={true}
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
                    return params.data.layer?.toString().split('.').length === 1;
                  },
                }}
              />
            </div>
            {isSidebarVisible && <AnalysisSideBar table={table + ` - ${team}`} gridRef={gridRef} />}
          </div>
        </div>
      </div>
    </>
  );
}
