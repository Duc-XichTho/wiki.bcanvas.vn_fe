import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
// import loadingSvg from "../../../../public/loading3.gif";
// Ag Grid Function
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ModuleRegistry } from '@ag-grid-community/core';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { toast } from 'react-toastify';
import '../../Home/AgridTable/agComponent.css';
import { getAllSoKeToan } from '../../../apisKTQT/soketoanService.jsx';
import {MyContext} from "../../../MyContext.jsx";
import AG_GRID_LOCALE_VN from "../../Home/AgridTable/locale.jsx";
import {formatCurrency} from "../functionKTQT/formatMoney.js";
import {getFirstThreeChars} from "../functionKTQT/getTKForDetail.js";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function DetailBCKDTH({ kmf, month, company ,currentYear, plType}) {
  console.log(plType)
  const table = 'DetailBCKDTH';
  const gridRef = useRef();
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([]);
  const [loading, setLoading] = useState(false);
  const defaultColDef = useMemo(() => {
    return {
      editable: false,
      filter: true,
      width: 180,
      cellStyle: { fontSize: '14.5px' },
    };
  });
  const statusBar = useMemo(() => {
    return {
      statusPanels: [{ statusPanel: 'agAggregationComponent' }],
    };
  }, []);

  const onGridReady = useCallback(async () => {
    setLoading(true);
    getAllSoKeToan().then((data) => {
      let filteredData = data.filter((e) => e.kmf === kmf && parseFloat(e.month) == month && e.consol?.toLowerCase() == 'consol' && e.pl_value !== '' && e.pl_value && e.year == currentYear && (e.pl_type === plType || plType == null));
      if(company!== 'HQ'){
        filteredData = filteredData.filter(e=> company === e.company)
      }
      setRowData(filteredData);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setColDefs([
          {
            field: 'id',
            headerName: 'ID',
            hide: true,
          },
          {
            field: 'diengiai',
            headerName: 'Diễn giải',
            flex: 1,
          },
          {
            field: 'company',
            headerName: 'Công ty',
            width: 100,
          },
          {
            field: 'day',
            headerName: 'Ngày',
            width: 70,
          },
          {
            field: 'pl_type',
            headerName: 'PL Type',
            width: 70,
            suppressHeaderMenuButton: true,
          },
          {
            field: 'month',
            headerName: 'Tháng',
            width: 70,
          },
          {
            field: 'tk_no',
            headerName: 'Tài khoản nợ',
            width: 117,
            // valueFormatter: (params) => getFirstThreeChars(params.value),
          },
          {
            field: 'tk_co',
            headerName: 'Tài khoản có',
            width: 117,
            // valueFormatter: (params) => getFirstThreeChars(params.value),
          },
          {
            field: 'pl_value',
            headerName: 'Số tiền',
            width: 110,
            headerClass: 'right-align-important',
            valueFormatter: (params) => formatCurrency((params.value / 1000).toFixed(0)),
            cellStyle: { textAlign: 'right' },
          },
        ]);
      } catch (error) {
       console.log(error)
      }
    };
    fetchData();
  }, [onGridReady, rowData, table]);

  function headerRenderer(subs, col) {
    let sum = 0;
    subs.map((node) => {
      if (node.show) {
        sum += +node[col];
      }
    });
    return sum;
  }

  function calSum() {
    let sum = headerRenderer(rowData, `pl_value`);
    return sum ? (sum / 1000).toFixed(0) : 0;
  }

  return (
    <>
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
          <img src='/loading_moi_2.svg' alt="Loading..." style={{width: '650px', height: '550px'}}/>
        </div>
      )}
      <div className="header-detail">
        <div className="unit-label">Đơn vị: ‘000VND</div>
        <div className="total-amount">Tổng: {formatCurrency(calSum())}</div>
      </div>
      <div>
        <div
          style={{
            height: '50vh',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            marginTop: '15px',
          }}
        >
          <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
            <AgGridReact
              statusBar={statusBar}
              enableRangeSelection={true}
              ref={gridRef}
              rowData={rowData}
              defaultColDef={defaultColDef}
              columnDefs={colDefs}
              rowSelection="multiple"
              animateRows={true}
              localeText={AG_GRID_LOCALE_VN}
              onGridReady={onGridReady}
            />
          </div>
        </div>
      </div>
    </>
  );
}
