import {toast} from 'react-toastify';
import {Popconfirm} from 'antd';
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
import '../../agComponent.css';
import TextField from "@mui/material/TextField";
import {FaChevronDown, FaChevronLeft} from "react-icons/fa";
import css from "../../DanhMuc/KeToanQuanTri.module.css";
import pLimit from 'p-limit';
import {MyContext} from "../../../../../MyContext.jsx";
import AG_GRID_LOCALE_VN from "../../locale.jsx";
import {deleteCCPB} from "../../../../../apis/ccpbService.jsx";
import {handleSave} from "../../handleAction/handleSave.js";
import {formatMoney} from "../../../../../generalFunction/format.js";
import {CardCodeIcon} from "../../../../../icon/IconSVG.js";

const limit = pLimit(5);
ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const ConfirmDelete = ({item, fetchAllCoCauPhanBo}) => {
    const {loadDataSoKeToan} = useContext(MyContext);

    const handleDeleteRecord = async () => {
        try {
            await deleteCCPB(item.id);
            await fetchAllCoCauPhanBo();
            toast.success(`Xóa thành công!`);
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


const CoChePhanBoTable = ({item, fetchAllCoCauPhanBo, listChoose, typeCCPB, currentUser}) => {
    const [editCount, setEditCount] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const table = 'CoChePhanBo';
    const tableSoKeToan = 'SoKeToan';
    const [updatedData, setUpdatedData] = useState([]);
    const [moTa, setMoTa] = useState(item.dp1);
    const [ten, setTen] = useState(item.name);
    const [errorMaCoChe, setErrorMaCoChe] = useState(false);
    const [errorMoTa, setErrorMoTa] = useState(false);
    const [buttonColor, setButtonColor] = useState(item.dp2 === '0' ? 'primary' : 'success');
    const [isOpen, setIsOpen] = useState(false);

    const defaultColDef = useMemo(() => {
        return {
            editable: true, filter: true, cellStyle: {fontSize: '14.5px'}, suppressHeaderMenuButton: true,
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
        ty_le: PB.ty_le
    })));

    const handleAddRow = async () => {
        if (rowData.length < listChoose.length) {
            const newRow = {
                ten_don_vi: null,
                ty_le: null
            };

            const updatedPB = [...rowData, newRow];
            setRowData((prevRowData) => [...prevRowData, newRow]);

            const data = {
                id: item.id, PB: updatedPB,
            };

            await handleSave([data], table, setUpdatedData);
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
                id: item.id, PB: updatedRowData,
            };

            await handleSave([data], table, setUpdatedData);
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
    }, {
        field: `ty_le`,
        headerName: `Tỷ lệ`,
        width: 120,
        editable: true,
        cellStyle: {textAlign: 'right'},
        headerClass: 'ag-right-aligned-header',
        // cellEditor: 'agNumberCellEditor',
        valueFormatter: (params) => formatMoney(params.value),

    },
        {
            pinned: 'left',
            width: 40,
            field: 'action',
            suppressHeaderMenuButton: true,
            cellStyle: {textAlign: 'center', paddingTop: 5},
            headerName: '',
            editable: false,
            cellRenderer: (params) => (
                <AiOutlineDelete style={{cursor: 'pointer', fontSize: '20px'}}
                                 onClick={() => handleDeleteRow(params)}/>),
        }
        ,], [listChoose]);

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
        setEditCount((prev) => prev + 1); // Tăng bộ đếm
        setLoading(true);
        await limit(async () => {
            // typeCCPB
            try {
                const data = {
                    id: item.id, PB: rowData,
                };
                await handleSave([data], table, setUpdatedData, currentUser);
            } catch (error) {
                console.error('Error in handleCellValueChanged', error);
            } finally {
                setEditCount((prev) => prev - 1); // Giảm bộ đếm
            }
        });
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
                id: item.id, name: ten, dp1: moTa,
            };
            await handleSave([data], table, setUpdatedData, currentUser);
        };
        saveData();
    }, [ten, moTa]);

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
                            style={{width: "85%"}}
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
            {isOpen && <>
                <div className="co-che-phan-bo-table-wrap-add-row">
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
                    height: '330px',
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
