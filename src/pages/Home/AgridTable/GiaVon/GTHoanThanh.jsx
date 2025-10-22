import css from './GTHoanThanh.module.css'
import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
import AG_GRID_LOCALE_VN from "../locale.jsx";
import { formatMoney } from "../../../../generalFunction/format.js";
import ActionChangeFilter from "../actionButton/ActionChangeFilter.jsx";
import { getAllDuAn } from "../../../../apis/duAnService.jsx";
import { getAllSoKeToan } from "../../../../apis/soketoanService.jsx";
ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const GTHoanThanh = () => {
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [dataSoKeToan, setDataSoKeToan] = useState([]);
    const [dataDuAn, setDataDuAn] = useState([]);
    const [isStatusFilter, setIsStatusFilter] = useState(false);

    const fetchAllSoKeToan = async () => {
        try {
            const data = await getAllSoKeToan();
            const filteredData = data.filter(item =>
                item.vu_viec_code !== null
            );
            setDataSoKeToan(filteredData);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error);
        }
    };

    const fetchAllDuAn = async () => {
        try {
            const data = await getAllDuAn();
            if (data) {
                setDataDuAn(data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            await fetchAllDuAn();
            await fetchAllSoKeToan();
        };
        fetchData();
    }, []);

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

    const mapDataToHeaders = (dataSoKeToan, dataDuAn) => {

        const mappedData = dataDuAn.map((item) => {
            let giaTriHoanThanh = null;
            let cfTrucTiep = null;

            if (item.phan_loai === 'Dài hạn') {
                giaTriHoanThanh = dataSoKeToan
                    .filter(soKeToanItem => soKeToanItem.vu_viec_code === item.code)
                    .reduce((total, soKeToanItem) => {
                        if (soKeToanItem.pl_type?.startsWith('DT')) {
                            return total + (+soKeToanItem.pl_value);
                        }
                        return total;
                    }, 0);
            } else if (item.phan_loai === 'Ngắn hạn') {
                const cfPhatSinh = dataSoKeToan
                    .filter(soKeToanItem => soKeToanItem.vu_viec_code === item.code)
                    .reduce((total, soKeToanItem) => {
                        if (soKeToanItem.pl_type?.startsWith('CF')) {
                            return total + (+soKeToanItem.pl_value);
                        }
                        return total;
                    }, 0);

                const cfDuKien = item.CF;
                const dtDuKien = item.DT;

                if (cfDuKien && dtDuKien) {
                    giaTriHoanThanh = (cfPhatSinh / cfDuKien) * dtDuKien;
                }
            }

            cfTrucTiep = dataSoKeToan
                .filter(soKeToanItem => soKeToanItem.vu_viec_code === item.code)
                .reduce((total, soKeToanItem) => {
                    if (soKeToanItem.pl_type?.startsWith('CF')) {
                        return total + Math.abs(+soKeToanItem.pl_value);
                    }
                    return total;
                }, 0);

            return {
                "code": item.code,
                "type": item.phan_loai,
                "gia_tri_hoan_thanh": giaTriHoanThanh,
                "percent_dong_gop": 0,
                "cf_truc_tiep": cfTrucTiep,
                "ty_le_cf_truc_tiep": 0,
            };
        }
        );
        console.log("  mappedData:", mappedData)

        const totalGiaTriHoanThanh = mappedData.reduce((total, item) => total + (item.gia_tri_hoan_thanh || 0), 0);
        const totalCfTrucTiep = mappedData.reduce((total, item) => total + (item.cf_truc_tiep || 0), 0);

        return mappedData.map(item => ({
            ...item,
            percent_dong_gop: totalGiaTriHoanThanh
                ? ((item.gia_tri_hoan_thanh / totalGiaTriHoanThanh) * 100).toFixed(2) === '0.00' ? '-' : `${((item.gia_tri_hoan_thanh / totalGiaTriHoanThanh) * 100).toFixed(2)}%`
                : '-',
            ty_le_cf_truc_tiep: totalCfTrucTiep
                ? ((item.cf_truc_tiep / totalCfTrucTiep) * 100).toFixed(2) === '0.00' ? '-' : `${((item.cf_truc_tiep / totalCfTrucTiep) * 100).toFixed(2)}%`
                : '-',
        }));
    };

    const fetchData = async () => {
        try {
            setRowData(mapDataToHeaders(dataSoKeToan, dataDuAn));
            setColDefs([
                {
                    field: 'code',
                    headerName: 'Vụ việc',
                    ...filter,
                    width: 100,
                },
                {
                    field: 'type',
                    headerName: 'Kiểu',
                    ...filter,
                    width: 100,
                },
                {
                    field: 'gia_tri_hoan_thanh',
                    headerName: 'Giá trị hoàn thành',
                    ...filter,
                    width: 200,
                    cellStyle: { textAlign: 'right' },
                    headerClass: 'right-align-important',
                    cellRenderer: params => formatMoney(params.value)
                },
                {
                    field: 'percent_dong_gop',
                    headerName: '% đóng góp',
                    ...filter,
                    width: 200,
                    cellStyle: { textAlign: 'right' },
                    headerClass: 'right-align-important',
                },
                {
                    field: 'cf_truc_tiep',
                    headerName: 'Chi phí trực tiếp',
                    ...filter,
                    width: 200,
                    cellStyle: { textAlign: 'right' },
                    headerClass: 'right-align-important',
                    cellRenderer: params => formatMoney(params.value)
                },
                {
                    field: 'ty_le_cf_truc_tiep',
                    headerName: 'Tỷ lệ (theo CF trực tiếp)',
                    ...filter,
                    width: 200,
                    cellStyle: { textAlign: 'right' },
                    headerClass: 'right-align-important',
                },
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dataSoKeToan, dataDuAn, isStatusFilter]);

    return (
        <div className={css.main}>
            <div className={css.container}>
                <div className={css.header}>

                </div>
                <div className={css.body}>
                    <div style={{ height: '400px', width: '100%' }}>
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
                </div>
            </div>
        </div>
    )
}

export default GTHoanThanh