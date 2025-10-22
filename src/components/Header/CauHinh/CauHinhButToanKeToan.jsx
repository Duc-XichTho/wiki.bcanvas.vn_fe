// LIBRARY
import css from "./CauHinhButToanKeToan.module.css";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
import { Modal, Button, DatePicker, Segmented, message } from 'antd';
import AG_GRID_LOCALE_VN from '../../../pages/Home/AgridTable/locale.jsx';
ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

// FUNCITON
import { formatMoney } from '../../../generalFunction/format.js';
import { getAllSoKeToan, updateSoKeToan } from '../../../apis/soketoanService.jsx';
import { getSettingByType } from "../../../apis/settingService.jsx";

// COMPONENTS
import ActionChangeFilter from "../../../pages/Home/AgridTable/actionButton/ActionChangeFilter.jsx";

const CauHinhButToanKeToan = ({ showCauHinhButToan, setShowCauHinhButToan }) => {
  const gridRef = useRef();
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([]);
  const [dataSoKeToan, setDataSoKeToan] = useState([]);
  const [dataSettingPPTGT, setDataSettingPPTGT] = useState({});
  const [isStatusFilter, setIsStatusFilter] = useState(false);
  const [changedRows, setChangedRows] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [filterMode, setFilterMode] = useState(false);
  const [valueDate, setValueDate] = useState(null);
  const [valueTimeRange, setValueTimeRange] = useState('full');
  const [valueMonth, setValueMonth] = useState(null);
  const [valueYear, setValueYear] = useState(null);

  const onChangeDatePicker = (date, _) => {
    setValueDate(date);
    setValueMonth(date?.$M + 1);
    setValueYear(date?.$y);
  };

  const fetchAllSoKeToan = async () => {
    try {
      const data = await getAllSoKeToan();
      const filteredData = data.filter(item =>
          item.tk_no && (item.tk_no.startsWith('6') || item.tk_no.startsWith('8') || item.tk_no == '1549')
      );
      setDataSoKeToan(filteredData);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin:', error);
    }
  };

  const fetchSettingPPTGT = async () => {
    try {
      const data = await getSettingByType('PhuongPhapTinhGiaThanh');
      setDataSettingPPTGT(data);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchSettingPPTGT();
      await fetchAllSoKeToan();
    };
    fetchData();
  }, [showCauHinhButToan, editMode, valueDate]);

  const handleChangeStatusFilter = () => {
    setIsStatusFilter(!isStatusFilter);
  };

  const defaultColDef = useMemo(() => ({
    editable: false,
    filter: true,
    suppressMenu: true,
    cellStyle: { fontSize: '14.5px' },
  }), []);

  const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);

  const filter = useMemo(() => {
    if (isStatusFilter) {
      return {
        filter: 'agMultiColumnFilter',
        floatingFilter: true,
        filterParams: {
          filters: [
            { filter: 'agTextColumnFilter' },
            { filter: 'agSetColumnFilter' },
          ],
        },
      };
    }
    return {};
  }, [isStatusFilter]);

  const mapDataToHeaders = (data) => {
    return data.map((item) => ({
      "id": item.id,
      'day': item.day,
      'month': item.month,
      'year': item.year,
      'tk_co': item.tk_co,
      'dien_giai': item.dien_giai,
      'so_tien_VND': item.so_tien_VND,
      'unit_code': item.unit_code,
      'kmf': item.kmf,
      'vu_viec_code': item.vu_viec_code,
      'lenh_sx': item.lenh_sx,
      'mo_hinh_tinh_gia': item.mo_hinh_tinh_gia
    }));
  };

  const isNull = (field) => {
    return field == null || field == "" ? '-' : field
  }

  const initialValue = (record) => {
    if (!dataSettingPPTGT || !dataSettingPPTGT.setting) return "Chưa phân bổ";

    const { month, vu_viec_code, lenh_sx } = record;

    const monthKey = month ? Number(month).toString() : null;

    const dataSettingVuViec = dataSettingPPTGT.setting.find(item => item.code === "W");
    const dataSettingLenhSX = dataSettingPPTGT.setting.find(item => item.code === "M");

    if (dataSettingLenhSX && dataSettingLenhSX.thoigian[monthKey] && lenh_sx) {
      return "Lệnh SX";
    }

    if (dataSettingVuViec && dataSettingVuViec.thoigian[monthKey] && vu_viec_code) {
      return "Vụ việc";
    }

    return "Chưa phân bổ";
  };

  const fetchData = async () => {
    try {
      setRowData(mapDataToHeaders(dataSoKeToan));
      setColDefs([
        {
          field: 'id',
          headerName: 'ID',
          hide: true
        },
        {
          field: 'day',
          headerName: 'Ngày',
          width: 70, ...filter,
          cellRenderer: params => isNull(params.value),

        },
        {
          field: 'month',
          headerName: 'Tháng',
          width: 70, ...filter,
          cellRenderer: params => isNull(params.value),

        },
        {
          field: 'year',
          headerName: 'Năm',
          width: 100, ...filter,
          cellRenderer: params => isNull(params.value),

        },
        {
          field: 'tk_co',
          headerName: 'TK',
          width: 100, ...filter,
          cellRenderer: params => isNull(params.value),

        },
        {
          field: 'dien_giai',
          headerName: 'Diễn giải',
          width: 300, ...filter,
          cellRenderer: params => <span title={params.value}>{params.value}</span>
        },
        {
          field: 'so_tien_VND',
          headerName: 'Số tiền',
          width: 120, ...filter,
          cellStyle: { textAlign: 'right' },
          headerClass: 'right-align-important',
          cellRenderer: params => formatMoney(params.value)
        },
        {
          field: 'unit_code',
          headerName: 'ĐV',
          width: 80, ...filter,
          cellRenderer: params => isNull(params.value),
        },
        {
          field: 'kmf',
          headerName: 'KMF',
          width: 80, ...filter,
          cellRenderer: params => isNull(params.value),

        },
        {
          field: 'vu_viec_code',
          headerName: 'Vụ việc',
          width: 80, ...filter,
          cellRenderer: params => isNull(params.value),

        },
        {
          field: 'lenh_sx',
          headerName: 'LSX',
          width: 80, ...filter,
          cellRenderer: params => isNull(params.value),

        },
        {
          field: 'mo_hinh_tinh_gia',
          headerName: 'Mô hình',
          ...filter,
          width: 150,
          editable: editMode,
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            values: ['Chờ phân bổ', 'Vụ việc', 'Lệnh SX'],
          },
          cellRenderer: (params) => {
            if (params.value === 'Chờ phân bổ' || params.value === 'Vụ việc' || params.value === 'Lệnh SX') {
              return params.value;
            }
            return initialValue(params.data);
          },

        },
      ]);
    } catch (error) {
     console.log(error)
    }
  };

  useEffect(() => {
    fetchData();
  }, [dataSoKeToan, isStatusFilter]);

  const handleCellValueChanged = (event) => {
    const updatedRow = event.data;

    setChangedRows((prev) => {
      const exists = prev.find(row => row.id === updatedRow.id);
      if (exists) {
        return prev.map(row => (row.id === updatedRow.id ? updatedRow : row));
      }
      return [...prev, updatedRow];
    });
  };

  const handleSaveSetting = async () => {
    try {
      if (changedRows.length === 0) {
        message.warning('Không có thay đổi');
        turnOffEditMode();
        return;
      }

      for (const row of changedRows) {
        await updateSoKeToan({
          id: row.id,
          mo_hinh_tinh_gia: row.mo_hinh_tinh_gia
        });
      }

      message.success('Cài đặt thành công');

      turnOffEditMode();
    } catch (error) {
      console.error('Lỗi khi lưu dữ liệu:', error);
    }
  };

  const turnOnEditMode = () => {
    setEditMode(true);
  };

  const turnOffEditMode = () => {
    setEditMode(false);
    setChangedRows([]);
  };

  const handleClearFilter = () => {
    setValueTimeRange('full');
    setValueDate(null);
    setFilterMode(false);
  };

  const handleCloseModal = () => {
    setShowCauHinhButToan(false);
    handleClearFilter();
  };

  const handleActiveFilterMode = () => {
    setFilterMode(true);
    let dataFilterMode = [];

    if (valueYear && valueMonth && valueTimeRange) {
      dataFilterMode = dataSoKeToan.filter(item => +item.month == valueMonth && item.year == valueYear);

      if (valueTimeRange === 'p1') {
        dataFilterMode = dataFilterMode.filter(item => Number(item.day) <= 15);
      } else if (valueTimeRange === 'p2') {
        dataFilterMode = dataFilterMode.filter(item => Number(item.day) > 15);
      }
    }

    setRowData(dataFilterMode);
  };

  return (
      <>
        <div className={css.functionArea}>
          <div className={css.filterDatePicker}>
            <DatePicker
                placeholder="Chọn tháng"
                onChange={onChangeDatePicker}
                picker="month"
                value={valueDate}
            />
            {valueDate
                && (
                    <>
                      <Segmented
                          options={[
                            {label: 'Đủ tháng', value: 'full'},
                            {label: 'P1', value: 'p1'},
                            {label: 'P2', value: 'p2'},
                          ]}
                          value={valueTimeRange}
                          onChange={value => setValueTimeRange(value)}
                      />
                      <Button
                          type="primary"
                          onClick={handleActiveFilterMode}
                      >
                        Lọc
                      </Button>
                      {filterMode &&
                          <Button
                              onClick={handleClearFilter}
                          >
                            Bỏ lọc
                          </Button>
                      }
                    </>
                )
            }
            {  !editMode ? (
                <Button type="primary" onClick={turnOnEditMode}>Cập nhật</Button>
            ) : (
                <>
                  <Button onClick={turnOffEditMode}>Hủy bỏ</Button>
                  <Button type="primary" onClick={handleSaveSetting}>Lưu lại</Button>
                </>
            )}
          </div>
          <div className={css.filterTable}>
            <ActionChangeFilter isStatusFilter={isStatusFilter} handleChangeStatusFilter={handleChangeStatusFilter}/>
          </div>
        </div>
        <div style={{height: '400px', width: '100%'}}>
          <AgGridReact
              statusBar={statusBar}
              enableRangeSelection={true}
              ref={gridRef}
              rowData={rowData}
              defaultColDef={defaultColDef}
              columnDefs={colDefs}
              localeText={AG_GRID_LOCALE_VN}
              className="ag-theme-quartz"
              onCellValueChanged={handleCellValueChanged}
          />
        </div>
      </>


  )
}

export default CauHinhButToanKeToan
