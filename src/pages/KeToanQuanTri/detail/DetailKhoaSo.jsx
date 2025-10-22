import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
// Ag Grid Function
import AG_GRID_LOCALE_VN from '../locale.jsx';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ModuleRegistry } from '@ag-grid-community/core';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { toast } from 'react-toastify';
import '../agComponent.css';
import CheckboxRenderer from '../function/MuiSwitchCustom.jsx'; // Assuming this is your switch renderer
import { Flex } from 'antd';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function DetailKhoaSo({ month }) {
  const gridRef = useRef();
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([]);

  const defaultColDef = useMemo(
    () => ({
      editable: false,
      filter: true,
      width: 180,
      cellStyle: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
    }),
    []
  );

  const statusBar = useMemo(
    () => ({
      statusPanels: [{ statusPanel: 'agAggregationComponent' }],
    }),
    []
  );

  const getHeader = (key) => `Tháng ${key}`;
  const createMonthColumn = (headerKey) => ({
    field: `month_${headerKey}`,
    headerName: getHeader(headerKey),
    headerClass: 'right-align-important-3',
    suppressMenu: true,
    cellStyle: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    flex: 1,
    cellRenderer: CheckboxRenderer,
  });

  const getColumnDefs = useCallback(() => {
    let cols = [];
    for (let i = 1; i <= month; i++) {
      cols.push(createMonthColumn(i));
    }
    return cols;
  }, [month]);

  const dataMonth = Array.from({ length: 1 }, () => {
    let row = {};
    for (let i = 1; i <= month; i++) {
      row[`month_${i}`] = false;
    }
    return row;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setColDefs(getColumnDefs());
        setRowData(dataMonth);
      } catch (error) {
       console.log(error)
      }
    };
    fetchData();
  }, [getColumnDefs]);

  return (
    <>
      <div className="ag-theme-quartz" style={{ width: '100%' }}>
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
          domLayout="autoHeight"
        />
      </div>
    </>
  );
}
