'use strict';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
// Ag Grid Function
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {ModuleRegistry} from '@ag-grid-community/core';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {AgGridReact} from 'ag-grid-react';
import {toast} from 'react-toastify';
import '../agComponent.css';
import {Button, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import {createNewMappingLuong, getAllMappingLuong} from "../../../../apis/mappingLuongService.jsx";
import {getAllKmf} from "../../../../apis/kmfService.jsx";
import {handleSave} from "../handleAction/handleSave.js";
import AG_GRID_LOCALE_VN from "../locale.jsx";
import {getAllTaiKhoan} from "../../../../apis/taiKhoanService.jsx";
import ActionCreate from "../actionButton/ActionCreate.jsx";
import {createTimestamp} from "../../../../generalFunction/format.js";
import {createNewLuong} from "../../../../apis/luongService.jsx";
import {getCurrentUserLogin} from "../../../../apis/userService.jsx";
import css from "../DanhMuc/KeToanQuanTri.module.css";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function MappingLuong({ open, onClose,setCheckMappingChange , checkMappingChange}) {
  const table = 'MappingLuong';
  const gridRef = useRef();
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([]);
  const [updatedData, setUpdatedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listVas, setListVas] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [listKmf, setListKms] = useState([]);
  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      filter: true,
      cellStyle: { fontSize: '14.5px' },
    };
  });
  const fetchCurrentUser = async () => {
    const {data, error} = await getCurrentUserLogin();
    if (data) {
      setCurrentUser(data);
    }
  };
  const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);
  const getTeamData = async () => {
    try {
      const data = await getAllMappingLuong();
      setRowData(data.sort((a, b)=> a.id-b.id));
      getAllTaiKhoan().then((data) => {
        setListVas(data);
      });
      getAllKmf().then((data) => {
        setListKms(data);
      });
      setCheckMappingChange(!checkMappingChange)
      setLoading(false);
    } catch (error) {
     console.log(error)
    }
  };

  useEffect(() => {
    setLoading(true);
    getTeamData();
    fetchCurrentUser()
  }, [open]);

  const onGridReady = useCallback(async () => {
    getTeamData();
  }, [open]);

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
            field: 'header',
            headerName: 'Danh mục lương',
            flex:1,
            editable: false,
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
          },

          {
            field: 'tk_no',
            headerName: 'Tài khoản nợ',
             flex:1,
            editable: true,
            ...filter(),
            cellEditor: 'agRichSelectCellEditor',
            cellEditorParams: {
              allowTyping: true,
              filterList: true,
              highlightMatch: true,
              values: listVas.map((vas) => vas?.code + ' | ' + vas?.name),
            },

          },

          {
            field: 'tk_co',
            headerName: 'Tài khoản có',
             flex:1,
            editable: true,
            ...filter(),
            cellEditor: 'agRichSelectCellEditor',
            cellEditorParams: {
              allowTyping: true,
              filterList: true,
              highlightMatch: true,
              values: listVas.map((vas) => vas?.code + ' | ' + vas?.name),
            },
          },

          {
            field: 'kmf',
            headerName: 'Khoản mục phí',
             flex:1,
            editable: true,
            ...filter(),
            cellEditor: 'agRichSelectCellEditor',
            cellEditorParams: {
              allowTyping: true,
              filterList: true,
              highlightMatch: true,
              values: listKmf.map((kmf) => kmf?.code + ' | ' + kmf?.name),
            },
          },

          // {
          //   pinned: 'left',
          //   width: '40',
          //   field: 'action',
          //   suppressHeaderMenuButton: true,
          //   cellStyle: { textAlign: 'center', paddingTop: 5 },
          //   headerName: '',
          //
          //   cellRenderer: (params) => {
          //     if (!params.data || !params.data.id) {
          //       return null;
          //     }
          //
          //     return (
          //       <PopupDeleteRenderer {...params.data} id={params.data.id} table={table} reloadData={onGridReady} />
          //     );
          //   },
          //   editable: false,
          // },
        ]);
      } catch (error) {
       console.log(error)
      }
    };
    fetchData();
  }, [onGridReady, rowData, table]);

  // const handleAddRow = useCallback(async () => {
  //   const newItems = {
  //     createAt: getCurrentDateTimeWithHours(),
  //     show: true,
  //   };
  //   await handleAddAgl( newItems, table, onGridReady);
  // }, [onGridReady]);

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
    setUpdatedData(newUpdatedData);
    await handleSave(newUpdatedData, table, setUpdatedData, onGridReady);
    setCheckMappingChange(!checkMappingChange)
  };
  const handleAddRow = async () => {
    const newData = {
      created_at: createTimestamp(),
      user_create: currentUser.email
    };
    await createNewMappingLuong(newData);
    toast.success("Tạo dòng thành công", {autoClose: 1000})
    await getTeamData()
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>

        <DialogTitle style={{display:"flex", justifyContent:"space-between"}} >
          Mapping tài khoản và khoản mục phí
          {/*<div>*/}
          {/*  <label htmlFor="cty"> Toàn bộ:</label>*/}
          {/*    <option value='DEHA'>DEHA</option>*/}
          {/*    <option value='SOL'>SOL</option>*/}
          {/*  </select>*/}
          {/*</div>*/}
        </DialogTitle>
        <DialogContent>
          <div
              style={{
                height: '70vh',
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
                  <img src='/loading_moi_2.svg' alt="Loading..." style={{width: '250px', height: '170px'}}/>
                </div>
            )}
            <div className={css.headerPowersheet}>
              <div className={css.headerAction}>
                {/*<ActionCreate handleAddRow={handleAddRow}/>*/}
              </div>
            </div>
              <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
                <AgGridReact
                    statusBar={statusBar}
                    ref={gridRef}
                    rowData={rowData}
                    defaultColDef={defaultColDef}
                    columnDefs={colDefs}
                    rowSelection="multiple"
                    enableRangeSelection={true}
                    onCellValueChanged={handleCellValueChanged}
                    localeText={AG_GRID_LOCALE_VN}
                    onGridReady={onGridReady}
                />
              </div>
            </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
}
