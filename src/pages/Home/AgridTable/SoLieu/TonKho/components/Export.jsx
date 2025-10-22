import css from "./Export.module.css"
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
import { getFullDetailPhieuXuatService } from "../../../../../../apis/detailPhieuXuatService.jsx";
import { ArrowDownAZ } from 'lucide-react';
import { Switch, Spin } from 'antd';
import { formatMoney } from "../../../../../../generalFunction/format.js";
import ActionChangeFilter from "../../../actionButton/ActionChangeFilter.jsx";
import Loading from '../../../../../Loading/Loading.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const Export = () => {
  const gridRef = useRef();
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([]);
  const [dataPhieuXuat, setDataPhieuXuat] = useState([]);
  const [isStatusFilter, setIsStatusFilter] = useState(false);
  const [loadingSpin, setLoadingSpin] = useState(false);
  const [gridVisible, setGridVisible] = useState(false);

  const fetchFullDetailPhieuXuatService = async () => {
    try {
      setLoadingSpin(true);
      const data = await getFullDetailPhieuXuatService();
      if (data) {
        setDataPhieuXuat(data);
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
    fetchFullDetailPhieuXuatService();
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
      'Ngày xuất': item.ngay_xuat,
      'Tên hàng hóa': item.code,
      'Lô': item.lo,
      'Kho': item.kho,
      'Giá xuất': item.gia_xuat,
      'Số lượng': item.so_luong,
    }));
  };

  const fetchData = async () => {
    try {
      setRowData(mapDataToHeaders(dataPhieuXuat));
      setColDefs([
        {
          field: 'Ngày xuất',
          headerName: 'Ngày xuất',
          width: 150,
          ...filter(),
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
          field: 'Giá xuất',
          headerName: 'Giá xuất',
          width: 150, ...filter(),
          cellStyle: { textAlign: 'right' },
          headerClass: 'right-align-important',
          cellRenderer: params => formatMoney(params.value)
        },
        {
          field: 'Số lượng',
          headerName: 'Số lượng',
          width: 150, ...filter(),
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
  }, [dataPhieuXuat, isStatusFilter]);

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
      <ActionChangeFilter isStatusFilter={isStatusFilter} handleChangeStatusFilter={handleChangeStatusFilter} />
    </div>
  )
}

export default Export
