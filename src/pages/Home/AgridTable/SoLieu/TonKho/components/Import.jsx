import css from "./Import.module.css";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
import { toast } from 'react-toastify';
import AG_GRID_LOCALE_VN from "../../../locale.jsx";
import { getFullDetailPhieuNhapService } from "../../../../../../apis/detailPhieuNhapService.jsx";
import { ArrowDownAZ } from 'lucide-react';
import { Switch, Spin } from 'antd';
import {formatMoney} from "../../../../../../generalFunction/format.js";
import ActionChangeFilter from "../../../actionButton/ActionChangeFilter.jsx";
import Loading from '../../../../../Loading/Loading.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function Import() {
  const gridRef = useRef();
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([]);
  const [dataPhieuNhap, setDataPhieuNhap] = useState([]);
  const [isStatusFilter, setIsStatusFilter] = useState(false);
  const [loadingSpin, setLoadingSpin] = useState(false);
  const [gridVisible, setGridVisible] = useState(false);

  const fetchFullDetailPhieuNhapService = async () => {
    try {
      setLoadingSpin(true);
      const data = await getFullDetailPhieuNhapService();
      if (data) {
        setDataPhieuNhap(data);
        setTimeout(() => {
          setLoadingSpin(false);
          setGridVisible(true);
        }, 500);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  useEffect(() => {
    fetchFullDetailPhieuNhapService();
  }, []);

  const handleChangeStatusFilter = () => {
    setIsStatusFilter(!isStatusFilter);
  };

  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      filter: true,
      suppressMenu: true,
      cellStyle: { fontSize: '14.5px' },
    };
  });

  const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);

  function filter() {
    if (isStatusFilter) {
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
  }

  const mapDataToHeaders = (data) => {
    return data.map((item) => ({
      'Ngày nhập': item.ngay_nhap,
      'Tên hàng hóa': item.code,
      'Lô': item.lo,
      'Kho': item.kho,
      'Giá nhập': item.gia_nhap,
      'Số lượng': item.so_luong,
    }));
  };

  const fetchData = async () => {
    try {
      setRowData(mapDataToHeaders(dataPhieuNhap));
      setColDefs([
        {
          field: 'Ngày nhập',
          headerName: 'Ngày nhập',
          width: 150, ...filter(),
          cellStyle: { textAlign: 'center' },
        },
        {
          field:
            'Tên hàng hóa',
          headerName: 'Tên hàng hóa',
          width: 150, ...filter(),
        },
        {
          field: 'Lô',
          headerName: 'Lô',
          width: 150, ...filter(),
        },
        {
          field: 'Kho',
          headerName: 'Kho',
          width: 150, ...filter(),
        },
        {
          field: 'Giá nhập',
          headerName: 'Giá nhập',
          width: 150, ...filter(),
          cellStyle: { textAlign: 'right' },
          headerClass: 'right-align-important',
          cellRenderer: params=> formatMoney(params.value)

        },
        {
          field: 'Số lượng',
          headerName: 'Số lượng',
          width: 150,
          ...filter(),
          cellStyle: { textAlign: 'right' },
          headerClass: 'right-align-important',
        },
      ]);
    } catch (error) {
     console.log(error)
    }
  };

  useEffect(() => {
    fetchData();
  }, [dataPhieuNhap, isStatusFilter]);

  return (
    <div className={css.main}>
      <div className={css.agGridReactWrapper}>
        {loadingSpin
          ? (
            // <div
            //   style={{
            //     width: "100%",
            //     height: "100%",
            //     display: "flex",
            //     justifyContent: "center",
            //     alignItems: "center",
            //   }}
            // >
              <Loading loading={loadingSpin}/>
            //   <Spin size="large" />
            // </div>
          )
          : (
            <div className={gridVisible ? css.zoomIn : ''}>
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
          )
        }
      </div>
      <ActionChangeFilter isStatusFilter={isStatusFilter} handleChangeStatusFilter={handleChangeStatusFilter}/>
    </div>
  );
}
