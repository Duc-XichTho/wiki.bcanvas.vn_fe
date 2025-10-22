import React, {useEffect, useMemo, useState} from "react";
import { AgGridReact } from "ag-grid-react";
import styles from "./BottomDown.module.css";
import { formatCurrency } from "../../../../KeToanQuanTri/functionKTQT/formatMoney.js";
import {getDepTableByPlanIdService, getTemplateRow} from "../../../../../apis/templateSettingService.jsx";
import {convertDataActual} from "../../FunctionPlan/functionActual.js";
import {getAllPMVSettingKH} from "../../../../../apis/pmvSettingKHService.jsx";

export default function BottomDownView({ deployment, planData, show }) {
    const statusBar = useMemo(() => ({
        statusPanels: [{ statusPanel: 'agAggregationComponent' }],
    }), []);

    const columnDefs = useMemo(
        () => [
            {
                field: "actualToday",
                headerName: "Thực hiện",
                aggFunc: "sum",
                filter: "agNumberColumnFilter",
                headerClass: 'right-align-important',
                width: 150,
                cellStyle: { textAlign: 'right' },
                cellRenderer: (params) => {
                    if (params.data.level === 0) {
                        return <span style={{ fontWeight: "bold", fontSize: '16px' }}>
                            {formatCurrency(params.value)}
                        </span>;
                    }
                    return formatCurrency(params.value);
                }
            },
            {
                field: "targetCumulativeToday",
                headerName: "KH theo tiến độ",
                aggFunc: "sum",
                filter: "agNumberColumnFilter",
                headerClass: 'right-align-important',
                width: 150,
                cellStyle: { textAlign: 'right' },
                cellRenderer: (params) => {
                    if (params.data.level === 0) {
                        return <span style={{ fontWeight: "bold", fontSize: '16px' }}>
                            {formatCurrency(params.value)}
                        </span>;
                    }
                    return formatCurrency(params.value);
                }
            },
            {
                field: "target",
                headerName: "KH cả kỳ",
                aggFunc: "sum",
                filter: "agNumberColumnFilter",
                headerClass: 'right-align-important',
                width: 150,
                cellStyle: { textAlign: 'right' },
                cellRenderer: (params) => {
                    if (params.data.level === 0) {
                        return <span style={{ fontWeight: "bold", fontSize: '16px' }}>
                            {formatCurrency(params.value)}
                        </span>;
                    }
                    return formatCurrency(params.value);
                }
            }
        ],
        []
    );

    const autoGroupColumnDef = useMemo(() => ({
        headerName: "",
        field: "group_value",
        minWidth: 300,
        flex: 1,
        cellRendererParams: {
            suppressCount: true,
            innerRenderer: (params) => {
                const isTopLevel = params.data.level === 0;
                return <span style={{
                    fontWeight: isTopLevel ? "bold" : "normal",
                    fontSize: isTopLevel ? '16px' : 'inherit'
                }}>
                    {params.value}
                </span>;
            },
        },
    }), []);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        suppressMovable: true
    }), []);

    const gridOptions = useMemo(() => ({
        animateRows: true,
        enableRangeSelection: true,
        suppressAggFuncInHeader: true,
    }), []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>{deployment?.userClass}</h2>
            </div>
            <div className="ag-theme-quartz" style={{ height: 300, width: "100%" }}>
                <AgGridReact
                    rowData={planData}
                    columnDefs={columnDefs}
                    autoGroupColumnDef={autoGroupColumnDef}
                    defaultColDef={defaultColDef}
                    treeData={true}
                    getDataPath={(data) => {
                        let path = [];
                        let current = data;
                        while (current) {
                            path.unshift(current.group_value);
                            current = planData.find((item) => item.id === current.parentId);
                        }
                        return path;
                    }}
                    statusBar={statusBar}
                    groupDefaultExpanded={-1}
                    {...gridOptions}
                />
            </div>
        </div>
    );
}
