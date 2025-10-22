import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Dialog, DialogActions, DialogContent, DialogTitle, Button} from '@mui/material';
import {AgGridReact} from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import {MyContext} from "../../../../MyContext.jsx";
import {toast} from "react-toastify";
import {
    createNewSoKeToan,
    deleteAccountingJournalByDaDung1,
    getAllSoKeToan
} from "../../../../apis/soketoanService.jsx";
import AG_GRID_LOCALE_VN from "../locale.jsx";
import {formatCurrency} from "../../../../generalFunction/format.js";
import {getAllMappingLuong} from "../../../../apis/mappingLuongService.jsx";
import {useLocation, useNavigate, useParams} from "react-router-dom"; // Adjust the path as necessary

const ReviewDialog = ({open, onClose, reviewData, checkMappingChange}) => {
    const gridRef = useRef();
    const { id, idCard, idStep} = useParams()
    let [listAJ, setListAJ] = useState([]);
    let [listMapping, setListMapping] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingEnd, setIsLoadingEnd] = useState(false);
    const navigate = useNavigate();

    const currentDate = new Date();
    const fetchData = async () => {
        const data = await getAllSoKeToan();
        setListAJ(data);
        const mapping = await getAllMappingLuong()
        setListMapping(mapping)
        setIsLoading(false);
    };
    useEffect(() => {
        fetchData();
    }, [checkMappingChange]);

    const statusBar = useMemo(() => {
        return {
            statusPanels: [{statusPanel: "agAggregationComponent"}],
        };
    }, []);


    const columnDefs = useMemo(() => [
        {field: 'team', headerName: 'Team', width: 120},
        {field: 'company', hide: true, headerName: 'Công ty', width: 120},
        {
            field: 'month',
            headerClass: 'center-align-important',
            headerName: 'Tháng',
            width: 80,
            cellStyle: {textAlign: 'center'}
        },
        {field: 'dien_giai', headerName: 'Diễn giải', width: 300, tooltips: params => params.value},
        {
            field: 'so_tien_VND',
            headerClass: 'right-align-important',
            headerName: 'Số tiền',
            valueFormatter: params => formatCurrency(params.value),
            width: 120,
            cellStyle: {textAlign: 'right'}
        },
        {field: 'tk_no', headerName: 'Tài khoản nợ', width: 190},
        {field: 'tk_co', headerName: 'Tài khoản có', width: 190},
        {field: 'kmf', headerName: 'KMF', width: 160},
        {field: 'pl_type', headerName: 'PL Type', width: 120,},
        {
            field: 'pl_value',
            headerClass: 'right-align-important',
            headerName: 'PL Value',
            valueFormatter: params => formatCurrency(params.value),
            width: 120,
            cellStyle: {textAlign: 'right'}
        },
        {
            field: 'cash_value',
            headerClass: 'right-align-important',
            headerName: 'Cash value',
            valueFormatter: params => formatCurrency(params.value),
            width: 120,
            cellStyle: {textAlign: 'right'}
        },
        // {
        //     field: 'ps_no',
        //     headerClass: 'right-align-important',
        //     headerName: 'Phát sinh nợ',
        //     valueFormatter: params => formatCurrency(params.value),
        //     width: 120,
        //     cellStyle: {textAlign: 'right'}
        // },
        // {
        //     field: 'ps_co',
        //     headerClass: 'right-align-important',
        //     headerName: 'Phát sinh có',
        //     valueFormatter: params => formatCurrency(params.value),
        //     width: 120,
        //     cellStyle: {textAlign: 'right'}
        // },

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
        const {tk_no, tk_co, so_tien_VND} = row;
        let pl_type
        let pl_value
        let cash_value
        if (tk_no && tk_co) {
            if (tk_no.startsWith("91") || tk_co.startsWith("91")) {
                pl_type = "KC";
            } else if (tk_no.startsWith("515") || tk_co.startsWith("515")) {
                pl_type = "DTTC";
            } else if (tk_no.startsWith("51") || tk_co.startsWith("51")) {
                pl_type = "DT";
            } else if (tk_no.startsWith("71") || tk_co.startsWith("71")) {
                pl_type = "DTK";
            } else if (tk_no.startsWith("635") || tk_co.startsWith("635")) {
                pl_type = "CFTC";
            } else if (tk_no.startsWith('641') || tk_co.startsWith('641')) {
                pl_type = 'CFBH';
            } else if (tk_no.startsWith('642') || tk_co.startsWith('642')) {
                pl_type = 'CFQL';
            } else if (tk_no.startsWith('632') || tk_co.startsWith('632') || tk_no.startsWith('62') || tk_co.startsWith('62')) {
                pl_type = 'GV';
            } else if (tk_no.startsWith("52") || tk_co.startsWith("52") || tk_no.startsWith("6") || tk_co.startsWith("6")) {
                pl_type = "CF";
            } else if (tk_no.startsWith("81") || tk_co.startsWith("81")) {
                pl_type = "CFK";
            } else if (tk_no.startsWith("82") || tk_co.startsWith("82")) {
                pl_type = "Tax";
            } else {
                pl_type = "";
            }

            if (tk_no.startsWith("11") && tk_co.startsWith("11")) {
                row.cf_Check = "";
            } else if (tk_no.startsWith("11")) {
                row.cf_Check = "Cashin";
            } else if (tk_co.startsWith("11")) {
                row.cf_Check = "Cashout";
            } else {
                row.cf_Check = "";
            }

            if (['DT', 'DTK', 'DTTC'].includes(pl_type) && (tk_co.startsWith('51') || tk_co.startsWith('7'))) {
                pl_value = so_tien_VND;
            } else if (['DT', 'DTK', 'DTTC'].includes(pl_type) && (tk_no.startsWith('51') || tk_co.startsWith('7'))) {
                pl_value = -so_tien_VND;
            } else if (['CFBH', 'CFQL', 'GV', 'CFK', 'CFTC', 'TAX', 'CF'].includes(pl_type) && (tk_co.startsWith('52') || tk_co.startsWith('6') || tk_co.startsWith('8'))) {
                pl_value = so_tien_VND;
            } else if (['CFBH', 'CFQL', 'GV', 'CFK', 'CFTC', 'TAX', 'CF'].includes(pl_type) && (tk_no.startsWith('52') || tk_no.startsWith('6') || tk_no.startsWith('8'))) {
                pl_value = -so_tien_VND;
            } else {
                pl_value = "";
            }

            if (row.cf_Check === "Cashin") {
                cash_value = so_tien_VND;
            } else if (row.cf_Check === "Cashout") {
                cash_value = -so_tien_VND;
            } else {
                cash_value = "";
            }
        }

        return {pl_type, pl_value, cash_value};
    }


    function createRecord(row, listMapping, field, dienGiaiPrefix) {
        const mapping = listMapping.find(e => e.field_z === field) || {};
        const soTien = row[field];
        // Nếu không có số tiền hoặc số tiền bằng 0, không tạo bản ghi
        if (!soTien || soTien === 0) {
            return [];
        }

        // Xác định giá trị của ps_no và ps_co
        // const ps_no = soTien > 0 ? soTien : 0;
        // const ps_co = soTien < 0 ? -soTien : 0;

        // Tính toán cho record1 (tài khoản nợ - có gốc)
        const {pl_type: pl_type1, pl_value: pl_value1, cash_value: cash_value1} = updatePLAndCashValues({
            tk_no: mapping.tk_no,
            tk_co: mapping.tk_co,
            so_tien_VND: parseFloat(soTien)
        });

        // Đối tượng thứ nhất
        const record1 = {
            team: row.team,
            company: row.company,
            dien_giai: `(Auto record) ${dienGiaiPrefix} - Phân bổ ${row.team} tháng ${row.month}`,
            so_tien_VND: parseFloat(soTien) ,
            tk_no: mapping.tk_no?.split(' | ')[0] || '',
            tk_co: mapping.tk_co?.split(' | ')[0] || '',
            kmf: mapping.kmf?.split(' | ')[0] || '',
            month: row.month,
            da_dung_1: `L-T${row.month}-${row.year}`,
            pl_type: pl_type1,
            pl_value: pl_value1,
            cash_value: cash_value1,
            // ps_no: ps_no,
            // ps_co: ps_co,
            // unit_code: row.unit_code,
            // unit_code2: row.company && row.unit_code ? `${row.company}-${row.unit_code}` : null,
            year: currentDate.getFullYear(),
            day: '15'
        };
        //
        // // Tính toán cho record2 (tài khoản đối ứng - có gốc)
        // const { pl_type: pl_type2, pl_value: pl_value2, cash_value: cash_value2 } = updatePLAndCashValues({
        //     tk_no: mapping.tk_co,
        //     tk_co: mapping.tk_no,
        //     so_tien_VND: -soTien
        // });
        //
        // // Đối tượng thứ hai với so_tien_VND đối nghịch
        // const record2 = {
        //     team: row.team,
        //     company: row.company,
        //     dien_giai: `(Auto record) ${dienGiaiPrefix} - Phân bổ ${row.team} tháng ${row.month}`,
        //     so_tien_VND: -soTien,
        //     tk_no: mapping.tk_co.split(' | ')[0] || '',
        //     tk_co: mapping.tk_no.split(' | ')[0] || '',
        //     kmf: mapping.kmf.split(' | ')[0] || '',
        //     month: row.month,
        //     da_dung_1: `L-T${row.month}-${row.year}`,
        //     pl_type: pl_type2,
        //     pl_value: pl_value2,
        //     cash_value: cash_value2,
        //     ps_no: ps_co,
        //     ps_co: ps_no,
        //     unit_code: row.unit_code,
        //     unit_code2: row.company && row.unit_code ? `${row.company}-${row.unit_code}` : null,
        //     year:currentDate.getFullYear(),
        //     day: '15'
        // };

        // Trả về mảng chứa hai đối tượng
        return [record1]
        // , record2
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
        navigate(`/accounting/chains/${id}/cards/${idCard}/steps/${parseInt(idStep)+1}`, { state: { rowData } })
        // try {
        //     // Lấy danh sách các giá trị da_dung_1 duy nhất từ bản ghi được hiển thị
        //     const daDung1Values = [...new Set(rowData.map(entry => entry.da_dung_1))];
        //
        //     // Xóa tất cả các bản ghi có giá trị da_dung_1 trùng khớp
        //     for (let da_dung_1 of daDung1Values) {
        //         da_dung_1 = encodeURIComponent(da_dung_1);
        //         await deleteAccountingJournalByDaDung1(da_dung_1);
        //
        //     }
        //
        //     // Thêm mới các bản ghi hiển thị
        //     for (let entry of rowData) {
        //         let data = preDataForSave(entry);
        //         entry = {...entry, data};
        //
        //         // Thêm mới bản ghi vào sổ kế toán
        //         await createNewSoKeToan(entry);
        //     }
        //
        //     toast.success("Thêm vào sổ kế toán thành công!");
        //     await fetchData()
        //     onClose();
        //     setIsLoadingEnd(false);
        // } catch (error) {
        //     console.error('Error creating/updating journal entries:', error);
        //     toast.error("Error updating data: ", error.message);
        //     setIsLoadingEnd(false);
        // }
    }, [onClose, isLoading]);


    function preDataForSave(data) {
        data.show = true;
        return data;
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>

            <DialogTitle style={{display: "flex", justifyContent: "space-between"}}>
                Review
                <Button onClick={handleApprove} color="success" style={{background: "#EFEFEF"}}>
                    Approve
                </Button>
            </DialogTitle>
            <DialogContent>

                <div className="ag-theme-quartz" style={{height: '70vh', width: '100%'}}>
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
