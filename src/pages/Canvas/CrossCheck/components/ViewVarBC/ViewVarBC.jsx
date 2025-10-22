import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { getItemFromIndexedDB2 } from "../../../../KeToanQuanTri/storage/storageService.js";
import { calKQKD } from "../../../../../generalFunction/calculateDataBaoCao/calKQKD.js";
import { MyContext } from "../../../../../MyContext.jsx";
import { CANVAS_DATA_PACK } from "../../../../../CONST.js";
import { Table } from "antd";
import { formatCurrency } from "../../../Daas/Logic/SetupChart.js";
import AG_GRID_LOCALE_VN from "../../../../Home/AgridTable/locale.jsx";
import { saveColumnStateToLocalStorage } from "../../../../KeToanQuanTri/functionKTQT/coloumnState.jsx";
import { AgGridReact } from "ag-grid-react";
import { formatMoney } from "../../../../../generalFunction/format.js";
import { getAllVar } from "../../../../../generalFunction/calculateDataBaoCao/getAllDataBaoCao.js";

export function ViewVarBC() {
  let { loadDataSoKeToan, listCompany, listYear } = useContext(MyContext);
  const [rs, setRs] = useState([]);
  const [columns, setColumns] = useState([]);
  const statusBar = useMemo(
    () => ({ statusPanels: [{ statusPanel: "agAggregationComponent" }] }),
    []
  );
  const gridRef = useRef();
  const defaultColDef = {
    editable: false,
    cellStyle: {
      fontSize: "14.5px",
      color: "var(--text-color)",
      fontFamily: "var(--font-family)",
    },
    width: 120,
    wrapHeaderText: true,
    autoHeaderHeight: true,
  };

  async function loadDataBC() {
    let result = await getAllVar(listCompany, listYear, loadDataSoKeToan);
    setRs(result);
  }

  useEffect(() => {
    loadDataBC();
    let listCol = [
      {
        headerName: "Tên",
        field: "name",
        width: 200,
      },
    ];
    for (let i = 1; i <= 12; i++) {
      listCol.push({
        headerName: `Tháng ${i}`,
        field: `t${i}`,
        headerClass: "right-align-important-2",
        width: 120,
        cellStyle: () => {
          return { textAlign: "right" };
        },
        valueFormatter: (params) => formatCurrency(params.value),
      });
    }
    setColumns(listCol);
  }, []);

  return (
    <>
      <div
        className="ag-theme-quartz"
        style={{ height: "90%", width: "100%", display: "flex", marginTop: 15 }}
      >
        <div
          style={{
            flex: "100%",
            transition: "flex 0.3s",
            height: "85vh",
          }}
        >
          <AgGridReact
            statusBar={statusBar}
            ref={gridRef}
            rowData={rs}
            enableRangeSelection={true}
            defaultColDef={defaultColDef}
            columnDefs={columns}
            rowSelection="multiple"
            animateRows={true}
          />
        </div>
      </div>
    </>
  );
}
