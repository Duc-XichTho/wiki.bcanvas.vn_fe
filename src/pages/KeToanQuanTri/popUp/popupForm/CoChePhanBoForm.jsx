import './CoChePhanBoForm.css';
import { toast } from 'react-toastify';
import React, { useEffect, useMemo, useState } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { AiOutlineDelete } from 'react-icons/ai';
// Ag Grid Function
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ModuleRegistry } from '@ag-grid-community/core';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import '../../../Home/AgridTable/agComponent.css';

import TextField from '@mui/material/TextField';
import { createNewCoCauPhanBo } from '../../../../apisKTQT/coCauPhanBoService.jsx';
import { CardCodeIcon } from "../../../../icon/IconSVG.js";
import { Form, Modal, Popconfirm, Select, Button } from "antd";
import css from "../../../KeToanQuanTri/KeToanQuanTriComponent/KeToanQuanTri.module.css";
import AG_GRID_LOCALE_VN from "../../../Home/AgridTable/locale.jsx";
import { formatCurrency } from "../../functionKTQT/formatMoney.js";
import { getAllProduct } from "../../../../apisKTQT/productService.jsx";
import { getAllKmf } from "../../../../apisKTQT/kmfService.jsx";
import { calculateDataView2 } from "../../BaoCao/KQKD/logicKQKD.js";
import { getAllSoKeToan } from "../../../../apisKTQT/soketoanService.jsx";
import { getAllUnits } from "../../../../apisKTQT/unitService.jsx";
import { getAllKenh } from "../../../../apisKTQT/kenhService.jsx";
import { getAllProject } from "../../../../apisKTQT/projectService.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
const ConfirmAutoFill = ({ handleAutoFill, setSelectedLoai, selectedLoai, setYear, year }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Thêm trạng thái loading

    const showModal = () => setIsModalOpen(true);
    const handleCancel = () => setIsModalOpen(false);


    const handleApprove = async () => {
        if (!year || !selectedLoai) {
            return alert('Vui lòng chọn đầy đủ Năm và Loại Phân bổ');
        }

        setIsLoading(true); // Kích hoạt loading

        try {
            await handleAutoFill(); // Chờ quá trình hoàn tất
            setIsModalOpen(false);
        } catch (error) {
            console.error('Lỗi khi tự động điền dữ liệu:', error);
        } finally {
            setIsLoading(false); // Tắt loading dù thành công hay thất bại
        }
    };

    return (
        <>
            <div
                className={`${css.headerActionButton} ${css.buttonOn}`}
                onClick={() => showModal()}
            >
                <span>Autofill</span>
            </div>

            <Modal
                title="XÁC NHẬN AUTOFILL"
                visible={isModalOpen}
                onOk={handleApprove}
                onCancel={handleCancel}
                footer={null}
            >
                <Form layout="vertical">
                    <Form.Item label="Chọn năm">
                        <Select
                            value={year}
                            onChange={setYear}
                        >
                            <Select.Option value="2023">2023</Select.Option>
                            <Select.Option value="2024">2024</Select.Option>
                            <Select.Option value="2025">2025</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="Chọn loại phân bổ">
                        <Select
                            value={selectedLoai}
                            onChange={setSelectedLoai}
                        >
                            <Select.Option value="Doanh thu">Doanh thu</Select.Option>
                            <Select.Option value="Tổng chi phí">Tổng chi phí</Select.Option>
                            <Select.Option value="Tùy chỉnh">Tùy chỉnh</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button onClick={handleCancel}>Hủy</Button>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn ghi đè dữ liệu không?"
                        onConfirm={handleApprove}
                        okText="Xác nhận"
                        cancelText="Hủy"
                        disabled={isLoading} // Vô hiệu hóa nếu đang loading

                    >
                        <Button type="primary" loading={isLoading}>
                            Xác nhận
                        </Button>
                    </Popconfirm>
                </div>
            </Modal>
        </>
    );
};

const CoChePhanBoForm = ({ company, onClose, fetchAllCoCauPhanBo, listChoose, typeCCPB }) => {
    const [moTa, setMoTa] = useState('');
    const [ten, setTen] = useState('');
    const [year, setYear] = useState(2024);
    const [rowData, setRowData] = useState([]);
    const [selectedLoai, setSelectedLoai] = useState('Doanh thu');
    const defaultColDef = useMemo(() => {
        return {
            editable: true,
            filter: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,
        };
    }, []);

    const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);


    const handleClose = () => {
        setRowData([])
        onClose()
    }

    const handleAddRow = (name = null) => {
        if (rowData?.length < listChoose?.length) {
            const newRow = {
                ten_don_vi: name,
                thang_1: null,
                thang_2: null,
                thang_3: null,
                thang_4: null,
                thang_5: null,
                thang_6: null,
                thang_7: null,
                thang_8: null,
                thang_9: null,
                thang_10: null,
                thang_11: null,
                thang_12: null,
            };

            setRowData((prevRowData) => [...prevRowData, newRow]);
        } else {
            toast.warn(`Vượt quá số lượng ${typeCCPB}`);
            console.log(listChoose)
        }
    };
    const handleAddAllListChose = () => {
        for (const data of listChoose) {
            handleAddRow(data.code)
        }
    }


    const handleDeleteRow = (params) => {
        const rowIndex = params.rowIndex;
        setRowData((prevRowData) => prevRowData.filter((_, index) => index !== rowIndex));
    };

    const handleSave = async () => {
        try {
            const newRowData = {
                company: company,
                name: ten,
                PB: rowData,
                type: typeCCPB,
                dp1: moTa,
                dp2: '0',
                fillOption: selectedLoai,
                year: year
            };
            await createNewCoCauPhanBo(newRowData);
            await fetchAllCoCauPhanBo();
            toast.success('Tạo thành công.');
            onClose();
        } catch (error) {
            console.log(error);
        }
    };

    const getAvailableSelect = (currentRowIndex) => {
        const selectedUnits = rowData
            .filter((_, index) => index !== currentRowIndex)
            .map((row) => row.ten_don_vi);

        return listChoose
            .map((unit) => unit.code)
            .filter((code) => !selectedUnits.includes(code));
    };

    const columnDefs = useMemo(
        () => [
            {
                field: 'ten_don_vi',
                headerName: `Tên ${typeCCPB}`,
                width: 220,
                cellEditor: 'agRichSelectCellEditor',
                cellEditorParams: (params) => ({
                    values: getAvailableSelect(params.rowIndex),
                }),
            },
            ...Array.from({ length: 12 }, (_, i) => ({
                field: `thang_${i + 1}`,
                headerName: `Tháng ${i + 1}`,
                flex: 1,
                editable: true,
                type: 'rightAligned',
                cellEditor: 'agNumberCellEditor',
                valueFormatter: (params) => formatCurrency(params.value),

            })),
            {
                pinned: 'left',
                width: 40,
                field: 'action',
                suppressHeaderMenuButton: true,
                cellStyle: { textAlign: 'center', paddingTop: 5 },
                headerName: '',
                editable: false,
                cellRenderer: (params) => (
                    <AiOutlineDelete style={{ cursor: 'pointer', fontSize: '20px' }}
                        onClick={() => handleDeleteRow(params)} />
                ),
            },
        ],
        [rowData, listChoose]
    );

    const [errorMaCoChe, setErrorMaCoChe] = useState(false);
    const [errorMoTa, setErrorMoTa] = useState(false);

    const handleChangeMaCoChe = (e) => {
        const value = e.target.value.toUpperCase();
        setTen(value);

        if (value.trim() === '') {
            setErrorMaCoChe(true);
        } else {
            setErrorMaCoChe(false);
        }
    };

    const handleChangeMoTa = (e) => {
        const value = e.target.value;
        setMoTa(value);

        if (value.trim() === '') {
            setErrorMoTa(true);
        } else {
            setErrorMoTa(false);
        }
    };
    const handleAutoFill = async () => {
        let dataSKT = await getAllSoKeToan();
        dataSKT = dataSKT.filter((e) => e.consol?.toLowerCase() == 'consol' && e.year == year);
        let kmfList = await getAllKmf();
        kmfList = kmfList.reduce((acc, current) => {
            if (!acc.find((unit) => unit.name === current.name)) {
                acc.push(current);
            }
            return acc;
        }, []);
        let dataBaoCao = []
        if (typeCCPB === 'Đơn vị') {
            let units = await getAllUnits();
            dataBaoCao = calculateDataView2(dataSKT, units, kmfList, 'code', 'unit_code2', 'PBDV', 'teams')
        }
        if (typeCCPB === 'Sản phẩm') {
            let units = await getAllProduct();
            dataBaoCao = calculateDataView2(dataSKT, units, kmfList, 'code', 'product2', 'PBSP', 'teams')
        }
        if (typeCCPB === 'Kênh') {
            let units = await getAllKenh();
            dataBaoCao = calculateDataView2(dataSKT, units, kmfList, 'code', 'kenh2', 'PBKENH', 'teams')
        }
        if (typeCCPB === 'Vụ việc') {
            let units = await getAllProject();
            dataBaoCao = calculateDataView2(dataSKT, units, kmfList, 'code', 'project2', 'PBPROJECT', 'teams')
        }

        const updateRowWithMonthlyData = (row, data) => {
            const tenDonVi = row.ten_don_vi;
            const tenDonViKey = tenDonVi?.split('_')[0];
            const relevantFields = Object.keys(data).filter(key => key.startsWith(tenDonViKey));

            if (relevantFields.length > 0) {
                const updatedRow = { ...row };
                for (let month = 1; month <= 12; month++) {
                    updatedRow[`thang_${month}`] = data[relevantFields[month]] || 0;
                }
                return updatedRow;
            }
            return row;
        };

        setRowData((prevRowData) => prevRowData.map((row) => {
            if (selectedLoai === "Doanh thu") {
                const found = dataBaoCao.find(item => item.dp === selectedLoai && !item.layer?.includes('.'));
                if (found) {
                    return updateRowWithMonthlyData(row, found);
                }
            } else if (selectedLoai === 'Tổng chi phí') {
                const cf_ban_hang_data_BC = dataBaoCao.filter(e => e.dp?.startsWith('Chi phí bán hàng') && !e.layer?.includes('.'));
                const cf_quan_li_data_BC = dataBaoCao.filter(e => e.dp?.startsWith('Chi phí quản lí') && !e.layer?.includes('.'));
                const gia_von_data_BC = dataBaoCao.filter(e => e.dp?.startsWith('Giá vốn') && !e.layer?.includes('.'));
                const totalCTYResults = sumCTYFields(row.ten_don_vi, [cf_ban_hang_data_BC, cf_quan_li_data_BC, gia_von_data_BC]);

                return updateRowWithMonthlyData(row, totalCTYResults);
            }
            return row;
        }));
    };

    const sumCTYFields = (checkKey, dataArrays) => {
        const result = {};
        dataArrays.forEach(array => {
            array.forEach(item => {
                Object.keys(item).forEach(key => {
                    if (key.includes(checkKey)) {
                        if (!result[key]) {
                            result[key] = 0;
                        }
                        result[key] += item[key] || 0;
                    }
                });
            });
        });

        return result;
    };
    return (
        <div className="co-che-phan-bo-popup">
            <div className="co-che-phan-bo-popup-form">
                <div className="co-che-phan-bo-popup-header">
                    <span>Thêm mới</span>
                </div>

                <div className="co-che-phan-bo-popup-body">
                    <div className="co-che-phan-bo-popup-body-mo-ta-and-ma-co-che">
                        <div className="co-che-phan-bo-popup-body-ma-co-che">
                            <img src={CardCodeIcon} style={{ width: '27px', height: '37px' }} alt="Add Icon" />
                            <p>Mã thẻ : </p>
                            <TextField
                                error={errorMaCoChe}
                                variant="standard"
                                value={ten}
                                onChange={(e) => handleChangeMaCoChe(e)}
                                InputProps={{
                                    disableUnderline: true,
                                }}
                                placeholder="Mã thẻ"
                                style={{ width: "100%" }}

                            />
                        </div>
                        <div className="co-che-phan-bo-popup-body-mo-ta">
                            <p>Mô tả :</p>
                            <TextField
                                error={errorMoTa}
                                variant="standard"
                                value={moTa}
                                onChange={(e) => handleChangeMoTa(e)}
                                InputProps={{
                                    disableUnderline: true,
                                }}
                                placeholder="Mô tả"
                                style={{ width: "100%" }}

                            />
                        </div>
                        <div className="co-che-phan-bo-popup-body-add-row">

                            {/*<div className={`${css.headerActionButton} ${css.selectItem}`}>*/}
                            {/*    <select className={css.selectContent}*/}
                            {/*            value={year}*/}
                            {/*            onChange={(e) => setYear(e.target.value)}>*/}
                            {/*        <option value="2024">2024</option>*/}
                            {/*        <option value="2025">2025</option>*/}
                            {/*        <option value="2026">2026</option>*/}
                            {/*    </select>*/}
                            {/*</div>*/}
                            {/*<div className={`${css.headerActionButton} ${css.selectItem}`}>*/}
                            {/*    <select className={css.selectContent}*/}
                            {/*            value={selectedLoai}*/}
                            {/*            onChange={(e) => setSelectedLoai(e.target.value)}>*/}
                            {/*        <option value="Doanh thu">Doanh thu</option>*/}
                            {/*        <option value="Tổng chi phí">Tổng chi phí</option>*/}
                            {/*        <option value="Tùy chỉnh">Tùy chỉnh</option>*/}
                            {/*    </select>*/}
                            {/*</div>*/}
                            <div className="navbar-item">
                                <div className="navbar-item">
                                    <ConfirmAutoFill handleAutoFill={handleAutoFill}
                                        selectedLoai={selectedLoai}
                                        setSelectedLoai={setSelectedLoai}
                                        setYear={setYear}
                                        year={year}
                                    />                                </div>
                            </div>
                            <div className="navbar-item">
                                <div className={`${css.headerActionButton} ${css.buttonOn}`}
                                    onClick={handleAddRow}>
                                    <span>+ Dòng thẻ</span>
                                </div>
                            </div>
                            <div className="navbar-item">
                                <div className={`${css.headerActionButton} ${css.buttonOn}`}
                                    onClick={handleAddAllListChose}>
                                    <span>Thêm toàn bộ</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className='ag-theme-quartz' style={{ height: '600px', width: '100%' }}>
                        <AgGridReact
                            statusBar={statusBar}
                            enableRangeSelection={true}
                            rowData={rowData}
                            columnDefs={columnDefs}
                            localeText={AG_GRID_LOCALE_VN}
                            defaultColDef={defaultColDef}
                        />
                    </div>
                </div>

                <div className="co-che-phan-bo-popup-footer">
                    <div className="co-che-phan-bo-popup-footer-wrap">
                        <Button variant="contained" onClick={handleSave}>
                            Tạo
                        </Button>
                        <Button variant="outlined" onClick={handleClose}>
                            Hủy
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoChePhanBoForm;
