import {toast} from 'react-toastify';
import {Form, Modal, Popconfirm, Select , Button} from 'antd';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import {AiOutlineDelete} from 'react-icons/ai';
import './CoChePhanBoTable.css';
import React, {useContext, useEffect, useMemo, useState,} from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
// Ag Grid Function

import {AgGridReact} from 'ag-grid-react';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {ModuleRegistry} from '@ag-grid-community/core';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import '../../../Home/AgridTable/agComponent.css';
import {deleteCoCauPhanBo, getAllCoCauPhanBo, updateCoCauPhanBo} from '../../../../apisKTQT/coCauPhanBoService.jsx';
import {getAllSoKeToan} from '../../../../apisKTQT/soketoanService.jsx';
import {CardCodeIcon} from "../../../../icon/IconSVG.js";
import TextField from "@mui/material/TextField";
import {FaChevronDown, FaChevronLeft} from "react-icons/fa";
import css from "../../../KeToanQuanTri/KeToanQuanTriComponent/KeToanQuanTri.module.css";
import pLimit from 'p-limit';
import {MyContext} from "../../../../MyContext.jsx";
import {handleSaveAgl} from "../../functionKTQT/handleSaveAgl.js";
import {formatCurrency} from "../../functionKTQT/formatMoney.js";
import AG_GRID_LOCALE_VN from "../../../Home/AgridTable/locale.jsx";
import {getAllProduct} from "../../../../apisKTQT/productService.jsx";
import {getAllKmf} from "../../../../apisKTQT/kmfService.jsx";
import {calculateDataView2} from "../../BaoCao/KQKD/logicKQKD.js";
import {getAllUnits} from "../../../../apisKTQT/unitService.jsx";
import {getAllKenh} from "../../../../apisKTQT/kenhService.jsx";
import {getAllProject} from "../../../../apisKTQT/projectService.jsx";

const limit = pLimit(5);
ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const ConfirmDelete = ({item, fetchAllCoCauPhanBo}) => {
    const {loadDataSoKeToan} = useContext(MyContext);

    const handleDeleteRecord = async () => {
        try {
            const data = await loadDataSoKeToan();
            const names = data.map(record => record.CCBSP);
            const validNames = names.filter(name => name !== null);
            if (validNames.includes(item.name)) {
                toast.warn(`Xóa không thành công do đã được sử dụng!`, {
                    autoClose: 1300,
                });
            } else {
                await deleteCoCauPhanBo(item.id);
                await fetchAllCoCauPhanBo();
                toast.success(`Xóa thành công!`);

            }
        } catch (error) {
            toast.error(`Lỗi khi xóa: ${error.message}`);
        }
    };

    return (
        <>
            <Popconfirm
                placement="leftTop"
                title="XÁC NHẬN XÓA"
                description="Hành động này không thể hoàn tác !!"
                okText="Xóa"
                cancelText="Hủy"
                onConfirm={handleDeleteRecord}
            >
                <DeleteIcon fontSize="small" style={{cursor: 'pointer'}}/>
            </Popconfirm>
        </>);
};

const ConfirmAutoFill = ({handleAutoFill, setSelectedLoai, selectedLoai , setYear , year}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const showModal = () => setIsModalOpen(true);
    const handleCancel = () => setIsModalOpen(false);

    const handleApprove = async () => {
        if (!year || !selectedLoai) {
            return alert('Vui lòng chọn đầy đủ Năm và Loại Phân bổ');
        }

        handleAutoFill();
        setIsModalOpen(false);
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
                    <Button  onClick={handleCancel}>Hủy</Button>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn ghi đè dữ liệu không?"
                        onConfirm={handleApprove}
                        okText="Xác nhận"
                        cancelText="Hủy"
                    >
                        <Button>Xác nhận</Button>
                    </Popconfirm>
                </div>
            </Modal>
        </>
    );
};

const CoChePhanBoTable = ({item, fetchAllCoCauPhanBo, listChoose, typeCCPB, listCCPBDV}) => {
    const [editCount, setEditCount] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const table = 'CoChePhanBo';
    const [updatedData, setUpdatedData] = useState([]);
    const [moTa, setMoTa] = useState(item.dp1);
    const [ten, setTen] = useState(item.name);
    const [errorMaCoChe, setErrorMaCoChe] = useState(false);
    const [errorMoTa, setErrorMoTa] = useState(false);
    const [selectedLoai, setSelectedLoai] = useState(item.fillOption);
    const [year, setYear] = useState(item.year);
    const [isOpen, setIsOpen] = useState(false);
    const [dataBaoCao, setDataBaoCao] = useState([]);

    const defaultColDef = useMemo(() => {
        return {
            editable: true,
            filter: true,
            cellStyle: {fontSize: '14.5px'},
            suppressHeaderMenuButton: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,
        };
    }, []);

    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    const toggle = () => {
        setIsOpen(prev => !prev);
    };

    const getAvailableSelect = (currentRowIndex) => {
        const selectedUnits = rowData
            .filter((_, index) => index !== currentRowIndex)
            .map((row) => row.ten_don_vi);

        return listChoose
            .map((unit) => unit.code)
            .filter((code) => !selectedUnits.includes(code));
    };

    const [rowData, setRowData] = useState(item?.PB.map((PB) => ({
        ten_don_vi: PB.ten_don_vi,
        thang_1: PB.thang_1,
        thang_2: PB.thang_2,
        thang_3: PB.thang_3,
        thang_4: PB.thang_4,
        thang_5: PB.thang_5,
        thang_6: PB.thang_6,
        thang_7: PB.thang_7,
        thang_8: PB.thang_8,
        thang_9: PB.thang_9,
        thang_10: PB.thang_10,
        thang_11: PB.thang_11,
        thang_12: PB.thang_12,
    })));

    const handleAddRow = async () => {
        if (rowData.length < listChoose.length) {
            const newRow = {
                ten_don_vi: null,
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

            const updatedPB = [...rowData, newRow];
            setRowData((prevRowData) => [...prevRowData, newRow]);

            const data = {
                id: item.id, PB: updatedPB,
            };

            await handleSaveAgl([data], table, setUpdatedData);
            await fetchAllCoCauPhanBo();
        } else {
            toast.warn(`Vượt quá số lượng ${typeCCPB}`);
        }
    };

    const handleDeleteRow = async (params) => {
        try {
            const rowIndex = params.rowIndex;
            setRowData((prevRowData) => {
                const newRowData = prevRowData.filter((_, index) => index !== rowIndex);
                return newRowData;
            });

            const updatedRowData = rowData.filter((_, index) => index !== rowIndex);

            const data = {
                id: item.id, PB: updatedRowData, fillOption: selectedLoai
            };

            await handleSaveAgl([data], table, setUpdatedData);
            await fetchAllCoCauPhanBo();
            toast.success('Xóa dòng thành công!');
        } catch (error) {
            console.error('Error in handleDeleteRow', error);
        }
    };

    const columnDefs = useMemo(() => [{
        field: 'ten_don_vi',
        headerName: `Mã ${typeCCPB}`,
        width: 220,
        cellEditor: 'agRichSelectCellEditor',
        cellEditorParams: (params) => ({
            values: getAvailableSelect(params.rowIndex),
        }),
        valueFormatter: (params) => {
            return params.value || '';
        },
    }, ...Array.from({length: 12}, (_, i) => ({
        field: `thang_${i + 1}`,
        headerName: `Tháng ${i + 1}`,
        flex: 1,
        editable: true,
        cellStyle: {textAlign: 'right'},
        headerClass: 'ag-right-aligned-header',
        // cellEditor: 'agNumberCellEditor',
        valueFormatter: (params) => formatCurrency(params.value),

    })), {
        pinned: 'left',
        width: 40,
        field: 'action',
        suppressHeaderMenuButton: true,
        cellStyle: {textAlign: 'center', paddingTop: 5},
        headerName: '',
        editable: false,
        cellRenderer: (params) => (<AiOutlineDelete style={{cursor: 'pointer', fontSize: '20px'}}
                                                    onClick={() => handleDeleteRow(params)}/>),
    },], [listChoose]);

    function calculateTeams(teams, soTien) {
        let totalSoChot = teams.reduce((sum, team) => sum + parseInt(team.so_chot, 10), 0);
        teams.forEach((team) => {
            team.tien = (parseFloat(soTien) / totalSoChot) * parseInt(team.so_chot, 10);
        });
    }

    function updateCCPData(event, ccpb, key) {
        const teamsMap = {};

        ccpb.PB.forEach((item) => {
            const team = item.ten_don_vi;
            const thangValue = item[`thang_${event.data.month}`];
            if (thangValue !== null) {
                teamsMap[team] = teamsMap[team] || {team: team, so_chot: 0, tien: 0};
                teamsMap[team].so_chot = thangValue;
            }
        });

        const teamsArray = Object.values(teamsMap);
        calculateTeams(teamsArray, event.data.pl_value);

        event.data[key] = JSON.stringify({teams: teamsArray});
    }

    const chunkArray = (array, size) => {
        if (!Array.isArray(array)) {
            throw new TypeError('Expected an array');
        }
        if (size <= 0) {
            throw new Error('Size must be greater than 0');
        }
        const result = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    };

    const handleCellValueChanged = async (event) => {
        const data = {
            id: item.id, PB: rowData,
        };
        await handleSaveAgl([data], table, setUpdatedData);
    };

    useEffect(() => {
        if (editCount === 0 && !isLoaded) {
            setLoading(false);
            setIsLoaded(true);
        }
        if (editCount !== 0) {
            setIsLoaded(false);
        }
    }, [editCount, isLoaded]);

    const handleAutoFill = async () => {
        setLoading(true);
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
                const updatedRow = {...row};
                for (let month = 1; month <= 12; month++) {
                    updatedRow[`thang_${month}`] = data[relevantFields[month]] || 0;
                }
                return updatedRow;
            }
            return row;
        };
        const rowDataUpdate = rowData.map((row) => {
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
        });
        setRowData(rowDataUpdate)
        const data = {
            id: item.id, PB: rowDataUpdate, name: ten, dp1: moTa, fillOption: selectedLoai, year: year
        };
        await handleSaveAgl([data], table, setUpdatedData);
        setLoading(false);
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

    useEffect(() => {
        const saveData = async () => {
            const data = {
                id: item.id, name: ten, dp1: moTa, fillOption: selectedLoai
            };
            await handleSaveAgl([data], "CoChePhanBo", setUpdatedData);
        };
        saveData();
    }, [ten, moTa, selectedLoai]);

    async function phanBoSKT() {
        setEditCount((prev) => prev + 1); // Tăng bộ đếm
        setLoading(true);
        await limit(async () => {
            // typeCCPB
            try {
                let ccpbUpdate = item;
                ccpbUpdate.PB = rowData
                let sktList = await getAllSoKeToan();
                let sktUpdate = [];
                if (typeCCPB === 'Đơn vị') {
                    sktUpdate = sktList.filter((e) => e.CCPBDV === ccpbUpdate.name);
                    sktUpdate.map((item) => {
                        updateCCPData({data: item}, ccpbUpdate, "PBDV");
                    });
                } else if (typeCCPB === 'Sản phẩm') {
                    sktUpdate = sktList.filter((e) => e.CCBSP === ccpbUpdate.name);
                    sktUpdate.map((item) => {
                        updateCCPData({data: item}, ccpbUpdate, "PBSP");
                    });
                } else if (typeCCPB === 'Kênh') {
                    sktUpdate = sktList.filter((e) => e.CCPBKENH === ccpbUpdate.name);
                    sktUpdate.map((item) => {
                        updateCCPData({data: item}, ccpbUpdate, "PBKENH");
                    });
                } else if (typeCCPB === 'Vụ việc') {
                    sktUpdate = sktList.filter((e) => e.CCPBPROJECT === ccpbUpdate.name);
                    sktUpdate.map((item) => {
                        updateCCPData({data: item}, ccpbUpdate, "PBPROJECT");
                    });
                }
                const sktChunks = chunkArray(sktUpdate, 10); // 10 phần tử mỗi lần
                for (const chunk of sktChunks) {
                    await Promise.all(
                        chunk.map((item) => {
                                handleSaveAgl([item], 'SoKeToan-KTQT', setUpdatedData)
                            }
                        )
                    );
                }
            } catch (error) {
                console.error('Error in handleCellValueChanged', error);
            } finally {
                setEditCount((prev) => prev - 1);
                if (editCount == 0) setLoading(false)
            }
        });
    }

    return (
        <div className="co-che-phan-bo-table">
            {loading && (<div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    zIndex: '2000',
                    backgroundColor: 'rgba(255, 255, 255, 0.96)',
                }}
            >
                <img src='/loading_moi_2.svg' alt="Loading..." style={{width: '650px', height: '550px'}}/>
                {editCount !== 0 && <div>Đang phân bổ lại sổ kế toán</div>}
            </div>)}
            <div className="co-che-phan-bo-table-wrap">
                <div className="co-che-phan-bo-table-wrap-ma-co-che">
                    <div className="co-che-phan-bo-table-ma-co-che">
                        <img src={CardCodeIcon} style={{width: '27px', height: '37px'}} alt="Add Icon"/>
                        <p>Mã thẻ : </p>
                        <TextField
                            error={errorMaCoChe}
                            variant="standard"
                            value={ten}
                            onChange={(e) => handleChangeMaCoChe(e)}
                            style={{width: "70%"}}
                            InputProps={{
                                disableUnderline: true,
                            }}
                            placeholder="Mã thẻ"
                        />
                    </div>
                    <div className="co-che-phan-bo-table-mo-ta">
                        <p>Mô tả :</p>
                        <TextField
                            error={errorMoTa}
                            variant="standard"
                            value={moTa}
                            onChange={(e) => handleChangeMoTa(e)}
                            style={{width: "100%"}}
                            InputProps={{
                                disableUnderline: true,
                            }}
                            placeholder="Mô tả"
                        />
                    </div>
                    <div className="co-che-phan-bo-table-isOpen" onClick={toggle}>
                        <span style={{color: " #696969"}}>{isOpen ? <FaChevronDown/> : <FaChevronLeft/>}</span>
                    </div>
                </div>
            </div>


            <div style={{fontSize: '13px'}}>
                <p>{item.monthsHasValue}</p>
                {item.objHasNotValue &&
                    <p style={{
                        color: "red",
                        fontWeight: "bold",
                        background: 'lightpink',
                        padding: 5,
                        width: "max-content",
                        borderRadius: 4,
                        marginTop: 3
                    }}>
                        {item.objHasNotValue}
                    </p>
                }
            </div>
            {isOpen && <>
                <div className="co-che-phan-bo-table-wrap-add-row">
                    <div className="navbar-item">
                        <div className={`${css.headerActionButton} ${css.buttonOn}`}
                             onClick={phanBoSKT}>
                            <span>Phân bổ lại sổ kế toán</span>
                        </div>
                    </div>
                    {/*<div className={`${css.headerActionButton} ${css.selectItem}`}>*/}
                    {/*    <select className={css.selectContent}*/}
                    {/*            onChange={(e) => setYear(e.target.value)}*/}
                    {/*            value={year}*/}
                    {/*    >*/}
                    {/*        <option value="2024">2024</option>*/}
                    {/*        <option value="2025">2025</option>*/}
                    {/*        <option value="2026">2026</option>*/}
                    {/*    </select>*/}
                    {/*</div>*/}
                    {/*<div className={`${css.headerActionButton} ${css.selectItem}`}>*/}
                    {/*    <select className={css.selectContent}*/}
                    {/*            onChange={(e) => setSelectedLoai(e.target.value)}*/}
                    {/*            value={selectedLoai}*/}
                    {/*    >*/}
                    {/*        <option value="Doanh thu">Doanh thu</option>*/}
                    {/*        <option value="Tổng chi phí">Tổng chi phí</option>*/}
                    {/*        <option value="Tùy chỉnh">Tùy chỉnh</option>*/}
                    {/*    </select>*/}
                    {/*</div>*/}

                    <div className="navbar-item">
                        <ConfirmAutoFill handleAutoFill={handleAutoFill}
                                         selectedLoai={selectedLoai}
                                         setSelectedLoai={setSelectedLoai}
                                         setYear={setYear}
                                         year={year}
                        />
                    </div>
                    <div className="navbar-item">
                        <div className={`${css.headerActionButton} ${css.buttonOn}`}
                             onClick={handleAddRow}>
                            <span>+ Dòng thẻ</span>
                        </div>
                    </div>
                    <div className="co-che-phan-bo-table-wrap-delete">
                        <IconButton aria-label="delete" size="large">
                            <ConfirmDelete item={item} fetchAllCoCauPhanBo={fetchAllCoCauPhanBo}/>
                        </IconButton>
                    </div>
                </div>
                <div className='ag-theme-quartz' style={{
                    height: '430px',
                    width: '100%',
                    border: '1px solid white',
                    boxShadow: '0px 0px 0px 0px white',
                    padding: "15px"
                }}>
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        localeText={AG_GRID_LOCALE_VN}
                        onCellValueChanged={handleCellValueChanged}
                        statusBar={statusBar}
                        enableRangeSelection
                    />
                </div>
            </>}

        </div>);
};

export default CoChePhanBoTable;
