import React, { useEffect, useState } from "react";
import css from './TemplateSheet.module.css';
import { IconButton } from "@mui/material";
import { EditIconCoLe } from "../../../../../icon/IconSVG.js";
import { DANH_MUC_LIST } from "../../../../../Consts/DANH_MUC_LIST.js";
import { TYPE_FORM } from "../../../../../Consts/SECTION_TYPE.js";
// AG GRID
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

// API
import {
    getAllSheet,
    createNewSheet,
} from "../../../../../apis/sheetService";
import {
    getAllSheetColumnBySheetId,
    updateSheetColumn,
} from "../../../../../apis/sheetColumnService";

// COMPONENT
import SheetColumnModal from "./SheetColumnModal/SheetColumnModal";

const TemplateSheet = ({ sub_step_id, listSubStep }) => {
    const [sheetData, setSheetData] = useState(null);
    const [formStep, setFormStep] = useState(null);
    const [sheetColumns, setSheetColumns] = useState([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        const formSubStep = listSubStep?.filter(item => item.subStepType == TYPE_FORM);
        setFormStep(formSubStep);
    }, [listSubStep])

    useEffect(() => {
        loadSheetData();
    }, [sub_step_id]);

    const loadSheetData = async () => {
        try {
            const sheets = await getAllSheet();
            const existingSheet = sheets.find(sheet => sheet.sub_step_id === sub_step_id && sheet.card_id == null);
            let sheet;

            if (existingSheet) {
                setSheetData(existingSheet);
                sheet = existingSheet;
            } else {
                const newSheet = {
                    sub_step_id,
                    position: 0,
                };
                const createdSheet = await createNewSheet(newSheet);
                setSheetData(createdSheet);
                sheet = createdSheet;
            }

            const fetchedSheetColumns = await getAllSheetColumnBySheetId(sheet.id);
            const sortedColumns = fetchedSheetColumns.sort((a, b) => a.order - b.order);
            setSheetColumns(sortedColumns);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error);
        }
    };

    const handleColumnMoved = async (event) => {
        try {
            const currentColumns = event.api.getColumnState();
            const updatedColumns = currentColumns.map((colState, index) => {
                const originalColumn = sheetColumns.find(c => c.name === colState.colId);
                return {
                    ...originalColumn,
                    order: index
                };
            });
            setSheetColumns(updatedColumns);
            await Promise.all(
                updatedColumns.map(column =>
                    updateSheetColumn({ id: column.id, order: column.order })
                )
            );
        } catch (error) {
            console.error('Error updating column order:', error);
        }
    };

    const onColumnResized = async (event) => {
        if (event.finished) {
            const resizedColumn = sheetColumns.find(column => column.name === event.column.getColId());
            if (resizedColumn) {
                await updateSheetColumn({ id: resizedColumn.id, columnWidth: event.column.getActualWidth() })
            }
        }
    };

    const columnDefs = sheetColumns.map(column => ({
        headerName: column.name,
        field: column.name,
        width: column.columnWidth || 100,
        editable: false,
        cellRenderer: (params) => {
            if (params.column.getColId() === column.name) {
                switch (column.type) {
                    case 'text':
                        return 'Xích thố';
                    case 'number':
                        return new Date().getFullYear();
                    case 'date':
                        const today = new Date();
                        return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
                    case 'formula':
                        return new Date().getMonth() + 1;
                    case 'formula-input':
                        return new Date().getDate();
                    case 'vlookup':
                        return 'Dữ liệu từ bảng khác'
                    default:
                        return '';
                }
            }
            return '';
        }
    }));

    return (
        <div className={css.container}>
            <div className={css.settingsWrapper}>
                <IconButton onClick={() => setIsSettingsOpen(true)} size="small">
                    <img src={EditIconCoLe} alt="" />
                </IconButton>

                {isSettingsOpen && sheetData && (
                    <SheetColumnModal
                        sheetId={sheetData.id}
                        loadSheetData={loadSheetData}
                        onClose={() => setIsSettingsOpen(false)}
                        sub_step_id={sub_step_id}
                        formStep={formStep}
                        DANH_MUC_LIST={DANH_MUC_LIST}
                    />
                )}
            </div>

            <div className={`ag-theme-quartz ${css.gridContainer}`}>
                <AgGridReact
                    rowData={[{}]}
                    columnDefs={columnDefs}
                    suppressContextMenu={true}
                    suppressCellSelection={true}
                    onColumnMoved={handleColumnMoved}
                    onColumnResized={onColumnResized}
                    suppressMovableColumns={false}
                />
            </div>
        </div>
    );
};

export default TemplateSheet;