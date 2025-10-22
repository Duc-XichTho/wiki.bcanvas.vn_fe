import React, { useState, useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '../Home/AgridTable/agComponent.css';
import Papa from 'papaparse';
import AG_GRID_LOCALE_VN from '../Home/AgridTable/locale.jsx';
import { Switch, Spin } from 'antd';

const TableViewer = ({ url }) => {
    const [rowData, setRowData] = useState([]);
    const [columnDefs, setColumnDefs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isStatusFilter, setIsStatusFilter] = useState(false);

    // StatusBar configuration giống AI.jsx
    const statusBar = useMemo(() => ({
        statusPanels: [{
            statusPanel: 'agAggregationComponent',
            statusPanelParams: {
                aggFuncs: ['count', 'sum'], // Only show average, count, and sum
            },
        }],
    }), []);

    // Filter configuration giống AI.jsx
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

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const text = await response.text();
                Papa.parse(text, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (result) => {
                        if (result.errors.length > 0) {
                            console.warn('CSV parsing errors:', result.errors);
                        }
                        
                        // Tạo column definitions với cấu hình đầy đủ
                        const columns = result.meta.fields.map(field => ({
                            headerName: field,
                            field: field,
                            valueGetter: params => params.data?.[field] ?? '',
                        }));
                        setColumnDefs(columns);
                        setRowData(result.data);
                        setLoading(false);
                    },
                    error: (error) => {
                        console.error('Papa parse error:', error);
                        setError('Error parsing CSV data');
                        setLoading(false);
                    }
                });
            } catch (error) {
                console.error('Error fetching or parsing CSV:', error);
                setError(`Error loading data: ${error.message}`);
                setLoading(false);
            }
        };

        if (url) {
            fetchData();
        }
    }, [url]);

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: 200,
                backgroundColor: '#fafafa',
                border: '1px solid #e8e8e8',
                borderRadius: '6px'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: '#ff4d4f',
                backgroundColor: '#fff2f0',
                border: '1px solid #ffccc7',
                borderRadius: '6px'
            }}>
                <p>{error}</p>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    Vui lòng thử lại sau hoặc kiểm tra URL của bảng
                </p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            {/* Filter control */}
            <div style={{ 
                marginBottom: '8px', 
                display: 'flex', 
                justifyContent: 'flex-end' 
            }}>
                <Switch
                    checked={isStatusFilter}
                    onChange={(checked) => setIsStatusFilter(checked)}
                    checkedChildren='Bật Filter'
                    unCheckedChildren='Tắt Filter'
                    size="small"
                />
            </div>
            
            {/* AgGrid với đầy đủ tính năng như AI.jsx */}
            <div className="ag-theme-quartz" style={{ height: 400, width: '100%' }}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    localeText={AG_GRID_LOCALE_VN}
                    enableRangeSelection={true}
                    statusBar={statusBar}
                    onGridReady={params => {
                        try {
                            params.api.autoSizeAllColumns();
                        } catch (error) {
                            console.warn('Error in grid ready:', error);
                        }
                    }}
                    onFirstDataRendered={params => {
                        try {
                            params.api.autoSizeAllColumns();
                        } catch (error) {
                            console.warn('Error in first data rendered:', error);
                        }
                    }}
                
                    defaultColDef={{
                        suppressHeaderMenuButton: true,
                        sortable: true,
                        filter: true,
                        resizable: true,
                        cellRenderer: params => params.value ?? '',
                        ...filter,
                    }}
                    // Additional features
                autoSizeAllColumns={true}
                />
            </div>
            
          
        </div>
    );
};

export default TableViewer; 