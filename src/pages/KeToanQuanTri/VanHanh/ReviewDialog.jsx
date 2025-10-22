import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import { MyContext } from "../../../../MyContext.jsx";
import { toast } from "react-toastify";
import AG_GRID_LOCALE_VN from "../../locale.jsx";
import { formatCurrency } from "../../function/formatMoney.js";
import LoadingOverlay from "../../../../pages/powersheet/LoadingOverlay.jsx";
import { findIdByField } from "../../function/CreateOptions.jsx";
import {
    createNewSoKeToan,
    deleteAccountingJournalByDaDung1,
    getAllSoKeToan
} from "../../../../apisKTQT/soketoanService.jsx";
import { getAllMappingLuong } from "../../../../apisKTQT/mappingLuongService.jsx"; // Adjust the path as necessary

const ReviewDialog = ({ open, onClose, reviewData, checkMappingChange }) => {
    const gridRef = useRef();
    const { loadDataSoKeToan } = useContext(MyContext);
    let [listAJ, setListAJ] = useState([]);
    let [listMapping, setListMapping] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingEnd, setIsLoadingEnd] = useState(false);
    const currentDate = new Date();
    useEffect(() => {
        const fetchData = async () => {
            const data = await getAllSoKeToan();
            setListAJ(data);
            const mapping = await getAllMappingLuong()
            setListMapping(mapping)
            setIsLoading(false);
        };
        fetchData();
    }, [checkMappingChange]);

    const statusBar = useMemo(() => {
        return {
            statusPanels: [{ statusPanel: "agAggregationComponent" }],
        };
    }, []);


    const columnDefs = useMemo(() => [
        { field: 'team', headerName: 'Team', width: 120 },
        { field: 'company', headerName: 'Công ty', width: 120 },
        { field: 'month', headerClass: 'center-align-important', headerName: 'Tháng', width: 80, cellStyle: { textAlign: 'center' } },
        { field: 'diengiai', headerName: 'Diễn giải', width: 300 },
        { field: 'so_tien', headerClass: 'right-align-important', headerName: 'Số tiền', valueFormatter: params => formatCurrency(params.value), width: 120, cellStyle: { textAlign: 'right' } },
        { field: 'tk_no', headerName: 'Tài khoản', width: 230 },
        { field: 'tk_co', headerName: 'Tài khoản đối ứng', width: 190 },
        { field: 'kmf', headerName: 'KMF', width: 160 },
        { field: 'pl_type', headerName: 'PL Type', width: 120, },
        { field: 'pl_value', headerClass: 'right-align-important', headerName: 'PL Value', valueFormatter: params => formatCurrency(params.value), width: 120, cellStyle: { textAlign: 'right' } },
        { field: 'cash_value', headerClass: 'right-align-important', headerName: 'Cash value', valueFormatter: params => formatCurrency(params.value), width: 120, cellStyle: { textAlign: 'right' } },
        { field: 'ps_no', headerClass: 'right-align-important', headerName: 'Phát sinh nợ', valueFormatter: params => formatCurrency(params.value), width: 120, cellStyle: { textAlign: 'right' } },
        { field: 'ps_co', headerClass: 'right-align-important', headerName: 'Phát sinh có', valueFormatter: params => formatCurrency(params.value), width: 120, cellStyle: { textAlign: 'right' } },

    ], []);

    const defaultColDef = useMemo(() => ({
        editable: false,
        filter: true,
        sortable: true,
        resizable: true,
    }), []);

    // const getTeamByName = (teamName) => {
    //     let listTeamSelected = [];
    //
    //     listTeam.map(team => {
    //         if(teamName!==null) {
    //             if (teamName.includes(team.team)) {
    //                 listTeamSelected.push(team);
    //             }
    //         }
    //         else {
    //             listTeamSelected.push(teamName);
    //         }
    //
    //     });
    //     return listTeamSelected;
    // };
    function updatePLAndCashValues(row) {
        const { tk_no, tk_co, so_tien } = row;

        let pl_type = '';
        let pl_value = '';
        let cash_value = '';

        // Đảm bảo rằng tk_no và tk_co tồn tại và không undefined hoặc null
        if (tk_no && tk_no.startsWith) {
            // Logic xác định pl_type
            if (tk_no.startsWith('511')) {
                pl_type = 'DT';
            } else if (tk_no.startsWith('62') || tk_no.startsWith('63')) {
                pl_type = 'GV';
            } else if (tk_no.startsWith('52') || tk_no.startsWith('641')) {
                pl_type = 'CFBH';
            } else if (tk_no.startsWith('642')) {
                pl_type = 'CFQL';
            } else if (tk_no.startsWith('635')) {
                pl_type = 'CFTC';
            } else if (tk_no.startsWith('515')) {
                pl_type = 'DTTC';
            } else if (tk_no.startsWith('71')) {
                pl_type = 'DTK';
            } else if (tk_no.startsWith('811')) {
                pl_type = 'CFK';
            } else if (tk_no.startsWith('821')) {
                pl_type = 'TAX';
            }
        }

        // Đảm bảo rằng pl_type là hợp lệ để xác định pl_value
        if (['DT', 'DTK', 'DTTC', 'GV', 'CFK', 'CFTC', 'CFBH', 'CFQL', 'TAX'].includes(pl_type)) {
            pl_value = -so_tien;
        }

        // Đảm bảo rằng tk_no và tk_co tồn tại và có phương thức startsWith
        if (tk_no && tk_co && tk_no.startsWith && tk_co.startsWith) {
            // Logic xác định cash_value
            if (tk_no.startsWith('11') && tk_co.startsWith('11')) {
                cash_value = '';
            } else if (tk_no.startsWith('11')) {
                cash_value = so_tien;
            }
        }

        return { pl_type, pl_value, cash_value };
    }


    function createRecord(row, listMapping, field, dienGiaiPrefix) {
        const mapping = listMapping.find(e => e.company === row.company && e.field_z === field) || {};
        const soTien = row[field];
        // Nếu không có số tiền hoặc số tiền bằng 0, không tạo bản ghi
        if (!soTien || soTien === 0) {
            return []; // Trả về mảng rỗng để không tạo bản ghi
        }

        // Xác định giá trị của ps_no và ps_co
        const ps_no = soTien > 0 ? soTien : 0;
        const ps_co = soTien < 0 ? -soTien : 0;

        // Tính toán cho record1 (tài khoản nợ - có gốc)
        const { pl_type: pl_type1, pl_value: pl_value1, cash_value: cash_value1 } = updatePLAndCashValues({
            tk_no: mapping.tk,
            tk_co: mapping.tk_doi_ung,
            so_tien: soTien
        });

        // Đối tượng thứ nhất
        const record1 = {
            team: row.team,
            company: row.company,
            diengiai: `(Auto record) ${dienGiaiPrefix} - Phân bổ ${row.team} tháng ${row.month}`,
            so_tien: soTien,
            tk_no: mapping.tk || '',
            tk_co: mapping.tk_doi_ung || '',
            kmf: mapping.kmf || '',
            month: row.month,
            da_dung_1: `L-T${row.month}-${row.company}`,
            pl_type: pl_type1,
            pl_value: pl_value1,
            cash_value: cash_value1,
            ps_no: ps_no,
            ps_co: ps_co,
            unit_code: row.unit_code,
            unit_code2: row.company && row.unit_code ? `${row.company}-${row.unit_code}` : null,
        };

        // Tính toán cho record2 (tài khoản đối ứng - có gốc)
        const { pl_type: pl_type2, pl_value: pl_value2, cash_value: cash_value2 } = updatePLAndCashValues({
            tk_no: mapping.tk_doi_ung,
            tk_co: mapping.tk,
            so_tien: -soTien
        });

        // Đối tượng thứ hai với so_tien đối nghịch
        const record2 = {
            team: row.team,
            company: row.company,
            diengiai: `(Auto record) ${dienGiaiPrefix} - Phân bổ ${row.team} tháng ${row.month}`,
            so_tien: -soTien,
            tk_no: mapping.tk_doi_ung || '',
            tk_co: mapping.tk || '',
            kmf: mapping.kmf || '',
            month: row.month,
            da_dung_1: `L-T${row.month}-${row.company}`,
            pl_type: pl_type2,
            pl_value: pl_value2,
            cash_value: cash_value2,
            ps_no: ps_co,
            ps_co: ps_no,
            unit_code: row.unit_code,
            unit_code2: row.company && row.unit_code ? `${row.company}-${row.unit_code}` : null,
        };

        // Trả về mảng chứa hai đối tượng
        return [record1, record2];
    }





    const rowData = reviewData.flatMap((row) => {
        return [
            ...createRecord(row, listMapping, 'luong_co_dinh', 'CF Lương cố định'),
            ...createRecord(row, listMapping, 'luong_bo_sung', 'CF Lương Bổ sung'),
            ...createRecord(row, listMapping, 'ot', 'CF Lương OT'),
            ...createRecord(row, listMapping, 'phu_cap', 'CF Lương Phụ cấp'),
            ...createRecord(row, listMapping, 'thuong', 'CF Thưởng'),
            ...createRecord(row, listMapping, 'khac', 'CF Khác'),
            ...createRecord(row, listMapping, 'bhxh_cty_tra', 'BHXH Cty'),
            ...createRecord(row, listMapping, 'bhyt_cty_tra', 'BHYT Cty'),
            ...createRecord(row, listMapping, 'bhtn_cty_tra', 'BHTN Cty'),
            ...createRecord(row, listMapping, 'cong_doan', 'Công đoàn'),
            ...createRecord(row, listMapping, 'bhxh_nv_tra', 'BHXH NV trả'),
            ...createRecord(row, listMapping, 'bhyt_nv_tra', 'BHYT NV trả'),
            ...createRecord(row, listMapping, 'bhtn_nv_tra', 'BHTN NV trả'),
            ...createRecord(row, listMapping, 'thue_tncn', 'Thuế TNCN'),
        ];
    });



    const handleApprove = useCallback(async () => {
        setIsLoadingEnd(true);
        if (isLoading) {
            toast.error("Dữ liệu đang được tải, vui lòng thử lại sau.");
            setIsLoadingEnd(false);
            return;
        }

        // Lấy tất cả bản ghi được hiển thị từ grid
        const rowData = gridRef.current.api.getRenderedNodes().map(node => node.data);

        try {
            // Lấy danh sách các giá trị da_dung_1 duy nhất từ bản ghi được hiển thị
            const daDung1Values = [...new Set(rowData.map(entry => entry.da_dung_1))];

            // Xóa tất cả các bản ghi có giá trị da_dung_1 trùng khớp
            for (let da_dung_1 of daDung1Values) {
                da_dung_1 = encodeURIComponent(da_dung_1);
                await deleteAccountingJournalByDaDung1(da_dung_1);

            }

            // Thêm mới các bản ghi hiển thị
            for (let entry of rowData) {
                let data = preDataForSave(entry);
                entry = { ...entry, data };

                // Thêm mới bản ghi vào sổ kế toán
                await createNewSoKeToan(entry);
            }

            toast.success("Thêm vào sổ kế toán thành công!");
            loadDataSoKeToan();  // Tải lại dữ liệu
            onClose();
            setIsLoadingEnd(false);
        } catch (error) {
            console.error('Error creating/updating journal entries:', error);
            toast.error("Error updating data: ", error.message);
            setIsLoadingEnd(false);
        }
    }, [onClose, isLoading]);



    function preDataForSave(data) {
        data.show = true;
        return data;
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>

            <DialogTitle style={{ display: "flex", justifyContent: "space-between" }} >
                Review
                <Button onClick={handleApprove} color="success" style={{ background: "#EFEFEF" }}>
                    Approve
                </Button>
            </DialogTitle>
            <DialogContent>
                {isLoadingEnd && <LoadingOverlay />}
                <div className="ag-theme-quartz" style={{ height: '70vh', width: '100%' }}>
                    <AgGridReact
                        ref={gridRef}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        pagination={true}
                        statusBar={statusBar}
                        enableRangeSelection={true}
                        rowSelection='multiple'
                        paginationPageSize={500}
                        animateRows={true}
                        paginationPageSizeSelector={[500, 1000, 2000, 3000, 5000]}
                        localeText={AG_GRID_LOCALE_VN}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReviewDialog;
