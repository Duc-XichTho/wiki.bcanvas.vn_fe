import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Button, Popconfirm } from 'antd';
import { DeleteIcon } from "../../../../../icon/IconSVG.js";
import { updateCFConfigService } from "../../../../../apis/CFConfigService.jsx";
import {formatCurrency} from "../../../Daas/Logic/SetupChart.js";

const CauHinh = ({ selectedRecord, monthsRange, listRsLK }) => {
    const [rowData, setRowData] = useState([]);

    useEffect(() => {
        if (!selectedRecord) return;

        try {
            let parsedData = [];

            if (selectedRecord.detailSKU) {
                parsedData = typeof selectedRecord.detailSKU === 'string'
                    ? JSON.parse(selectedRecord.detailSKU)
                    : selectedRecord.detailSKU;
            }

            // Tạo Map để tránh trùng dữ liệu
            const uniqueItems = new Map(parsedData.map(item => [`${item.brand}-${item.sku}`, item]));

            listRsLK.forEach(item => {
                const key = `${item.brand}-${item.sku}`;
                if (!uniqueItems.has(key)) {
                    uniqueItems.set(key, {
                        id: Date.now() + Math.random(),
                        brand: item.brand,
                        sku: item.sku,
                        productName: item.productName || '',
                        ...monthsRange.reduce((acc, month) => ({ ...acc, [month]: 0 }), {})
                    });
                }
            });

            const newData = Array.from(uniqueItems.values());
            setRowData(newData);

            // Cập nhật backend nếu detailSKU ban đầu trống
            if (!selectedRecord.detailSKU || selectedRecord.detailSKU.length === 0) {
                updateCFConfigService(selectedRecord.id, { ...selectedRecord, detailSKU: newData });
            }

        } catch (error) {
            console.error('Error parsing detailSKU:', error);
            setRowData([]);
        }
    }, [selectedRecord, listRsLK]);


    const columnDefs = [
        { headerName: 'Brand', field: 'brand', editable: true, width: 120 },
        { headerName: 'SKU', field: 'sku', editable: true, width: 120 },
        ...monthsRange.map(month => ({
            headerName: month, field: month, editable: true, width: 120, type: 'numericColumn',
            cellRenderer: (params) => (<>{formatCurrency(params.value)}</>
            ),
        })),
        {
            headerName: '', field: 'actions', width: 70, pinned: 'left',
            cellRenderer: (params) => (
                <Popconfirm title="Xóa sản phẩm" description="Bạn có chắc chắn muốn xóa sản phẩm này?"
                            onConfirm={() => handleDeleteRow(params.data.id)} okText="Có" cancelText="Không">
                    <Button type="text" danger>
                        <img src={DeleteIcon} alt="delete" />
                    </Button>
                </Popconfirm>
            ),
        }
    ];

    const handleDeleteRow = async (id) => {
        const newData = rowData.filter(row => row.id !== id);
        setRowData(newData);
        try {
            await updateCFConfigService(selectedRecord.id, { ...selectedRecord, detailSKU: newData });
        } catch (error) {
            console.error('Error deleting row:', error);
        }
    };

    const onCellValueChanged = async (params) => {
        const updatedData = rowData.map(row => row.id === params.data.id ? params.data : row);
        setRowData(updatedData);
        try {
            await updateCFConfigService(selectedRecord.id, { ...selectedRecord, detailSKU: updatedData });
        } catch (error) {
            console.error('Error updating cell:', error);
        }
    };

    return (
        <div style={{ height: '500px', width: '100%' }}>
            <div className="ag-theme-quartz" style={{ height: '450px', width: '100%' }}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={{ resizable: true, sortable: true }}
                    onCellValueChanged={onCellValueChanged}
                />
            </div>
        </div>
    );
};

export default CauHinh;
