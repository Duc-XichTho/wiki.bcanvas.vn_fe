'use strict';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// Ag Grid Function
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
import { toast } from 'react-toastify';
import { getAllTeam } from '../../../../apisKTQT/teamService';
import { handleAddAgl } from '../../../powersheet/function/handleAddAgl.js';
import { handleSaveAgl } from '../../../powersheet/function/handleSaveAgl.js';
import '../../agComponent.css';
import { getCurrentDateTimeWithHours } from '../../function/formatDate.js';
import { onFilterTextBoxChanged } from '../../function/quickFilter.js';
import AG_GRID_LOCALE_VN from '../../locale.jsx';
import PopupDeleteRenderer from '../../popUp/PopUpDelete.jsx';

import { IoIosSearch } from 'react-icons/io';
import { IconSVG } from '../../../../image/IconSVG.js';
import {Button, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import LoadingOverlay from "../../../../pages/powersheet/LoadingOverlay.jsx";
import {getAllMappingLuong} from "../../../../apisKTQT/mappingLuongService.jsx";
import {getAllVas} from "../../../../apisKTQT/vasService.jsx";
import {getAllKmf} from "../../../../apisKTQT/kmfService.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function MappingLuong({ open, onClose,setCheckMappingChange , checkMappingChange}) {
  const table = 'MappingLuong';
  const gridRef = useRef();
  const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([]);
  const [updatedData, setUpdatedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState("DEHA");
  const [listVas, setListVas] = useState([]);
  const [listKmf, setListKms] = useState([]);
  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      filter: true,
      cellStyle: { fontSize: '14.5px' },
    };
  });

  const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);
  const getTeamData = async () => {
    try {
      const data = await getAllMappingLuong();
      setRowData(data.filter((e) => e.company === company).sort((a, b)=> a.id-b.id));
      getAllVas().then((data) => {
        const filteredData = data.filter((e) => e.company === company);
        setListVas(filteredData);
      });
      getAllKmf().then((data) => {
        const filteredData = data.filter((e) => e.company === company);
        setListKms(filteredData);
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
  }, [company]);

  const onGridReady = useCallback(async () => {
    getTeamData();
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
            field: 'tk',
            headerName: 'Tài khoản',
             flex:1,
            editable: true,
            ...filter(),
            cellEditor: 'agRichSelectCellEditor',
            cellEditorParams: {
              allowTyping: true,
              filterList: true,
              highlightMatch: true,
              values: listVas.map((vas) => vas?.ma_tai_khoan),
            },
          },

          {
            field: 'tk_doi_ung',
            headerName: 'Tài khoản đối ứng',
             flex:1,
            editable: true,
            ...filter(),
            cellEditor: 'agRichSelectCellEditor',
            cellEditorParams: {
              allowTyping: true,
              filterList: true,
              highlightMatch: true,
              values: listVas.map((vas) => vas?.ma_tai_khoan),
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
              values: listKmf.map((kmf) => kmf.name),
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
  //     company: company,
  //     show: true,
  //   };
  //   await handleAddAgl(company, newItems, table, onGridReady);
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
    // await handleSaveAgl(newUpdatedData, table, setUpdatedData);
    await handleSaveAgl(newUpdatedData, table, setUpdatedData, onGridReady);
    setCheckMappingChange(!checkMappingChange)
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>

        <DialogTitle style={{display:"flex", justifyContent:"space-between"}} >
          Mapping tài khoản và khoản mục phí - {company}
          <div>
            <label htmlFor="cty"> Chọn công ty:</label>
            <select id="cty" value={company} onChange={(e)=>{setCompany(e.target.value)}}>
              <option value='DEHA'>DEHA</option>
              <option value='SOL'>SOL</option>
            </select>
          </div>
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
                  <img src='/loading3.gif' alt="Loading..." style={{ width: '250px', height: '170px' }} />
                </div>
            )}
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
