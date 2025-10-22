import React, {useCallback, useEffect, useState} from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {ModuleRegistry} from '@ag-grid-community/core';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {Bao_Cao_B01} from "../../../../../Consts/TITLE_HEADER.js";
import {getAllB0123} from "../../../../../apis/b0123Service.jsx";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import styles from './B01.module.css'
import {handleSave} from "../../handleAction/handleSave.js";
import ActionViewVas from "../../actionButton/ActionViewVas.jsx";
import DialogVas from "../../detail/dialog/DialogVas.jsx";
import dayjs from "dayjs";
import {DatePicker} from "antd";
import {getAllTaiKhoan} from "../../../../../apis/taiKhoanService.jsx";
import {getAllSoKeToan} from "../../../../../apis/soketoanService.jsx";
import {calCDPS2} from "../../SoLieu/CDPS/logicCDPS.js";
import {calB01} from "./logicB01.js";
import {getMonthRange} from "../../../../../generalFunction/getMonthRange.js";
import {IconButton} from "@mui/material";
import {EditOutlined, SaveOutlined} from "@ant-design/icons";
import {formatCurrency} from "../../../../../generalFunction/format.js";
import ActionHideRow from "../../actionButton/ActionHideRow.jsx";
import ActionChangeDataset from "../../actionButton/ActionChangeDataset.jsx";

const {RangePicker} = DatePicker;

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function B01() {
    const headerTitle = Bao_Cao_B01;
    const table = 'B0123'
    const [accounts, setAccounts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingNotes, setEditingNotes] = useState({});
    const [dateRange, setDateRange] = useState([dayjs('2024-01-01'), dayjs('2024-12-31')]);
    const [isHideShow, setIsHideShow] = useState(false);
    const [isStatusFilter, setIsStatusFilter] = useState(true);
    const handleChangeStatusFilter = () => {
        setIsStatusFilter((prev) => {
            return !prev;
        });
    };
    const [period, setPeriod] = useState({
        day: new Date().getDate(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    const handleMonthChange = (dates) => {
        if (dates) {
            setDateRange(dates.map(date => (date ? date.startOf('month').toISOString() : null)));
        } else {
            setDateRange([null, null]);
        }
    };

    const fetchData = async () => {
        let monthRange = getMonthRange(dateRange)
        const fetchedData = await getAllB0123();
        let filteredData = fetchedData.filter(item => item.loai === Bao_Cao_B01);
        filteredData = filteredData.sort((a, b) => a.code.localeCompare(b.code));
        const data = await getAllTaiKhoan();
        let listSKT = await getAllSoKeToan();
        if (isStatusFilter) {
            listSKT = listSKT.filter(item => item.tax);
        } else {
            listSKT = listSKT.filter(item => item.quan_tri_noi_bo);
        }
        let accounts = [];
        let cdps = []
        if (monthRange.length > 1) {
            let dauKy = monthRange[0];
            let cuoiKy = monthRange[monthRange.length - 1];
            cdps = calCDPS2(listSKT, data, dauKy.month, cuoiKy.month);
        } else {
            cdps = calCDPS2(listSKT, data, 1, 12);
        }
        accounts = calB01(filteredData, cdps)
        setAccounts(accounts);
    };

    useEffect(() => {
        fetchCurrentUser();
        fetchData();
    }, []);
    useEffect(() => {
        fetchData();
    }, [dateRange, isStatusFilter]);

    const fetchCurrentUser = async () => {
        const {data} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    const calculateTotal = useCallback((code) => {
        const account = accounts.find(acc => acc.code == code);
        if (!account) return 0;
        if (account.children.length == 0) {
            return account.isNegative ? -(account.value) : (account.value);
        }
        return account.children.reduce((sum, childCode) => {
            return sum + calculateTotal(childCode);
        }, 0);
    }, [accounts]);

    const calculateTotal2 = useCallback((code) => {
        const account = accounts.find(acc => acc.code == code);
        if (!account) return 0;
        if (account.children.length == 0) {
            return account.isNegative ? -(account.value2) : (account.value2);
        }
        return account.children.reduce((sum, childCode) => {
            return sum + calculateTotal2(childCode);
        }, 0);
    }, [accounts]);

    const handleNoteChange = (accountCode, newNote) => {
        setEditingNotes(prev => ({
            ...prev,
            [accountCode]: newNote
        }));
    };

    const saveChanges = () => {
        const updatedAccounts = accounts.map(account => ({
            ...account,
            note: editingNotes[account.code] || account.note
        }));
        setAccounts(updatedAccounts);
        handleSave(updatedAccounts, table, '', currentUser)

        setEditingNotes({});
        setIsEditing(false);
    };

    const [open, setIsOpen] = useState(false);
    const handleOpenView = () => {
        setIsOpen(true)
    }
    const handleCloseView = () => {
        setIsOpen(false)
    }

    const disabledDate = (current) => {
        if (!current) return false;
        return current.year() !== 2024;
    };

    const handleHideRow = () => {
        setIsHideShow(true);
    };

    const handleShowRow = () => {
        setIsHideShow(false);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>BẢNG CÂN ĐỐI KẾ TOÁN</h1>
                <p>Tại ngày {period.day} tháng {period.month} năm {period.year}</p>
                <p className={styles.unit}>Đơn vị tính: VND</p>
            </header>

            <div className={styles.controls}>
                <div className={styles.actionButtons}>
                    <div>
                        <RangePicker
                            size="middle"
                            format="MM/YYYY"
                            value={dateRange.map(date => (date ? dayjs(date) : null))}
                            onChange={handleMonthChange}
                            picker="month"
                            disabledDate={disabledDate}
                        />
                    </div>

                    <div style={{display: "flex", gap: '1rem', alignItems: "center"}}>
                        <ActionHideRow handleHideRow={handleHideRow}
                                       handleShowRow={handleShowRow}
                                       isHideShow={isHideShow}/>

                        <ActionViewVas open={open} handleOpenView={handleOpenView}/>
                        {!isEditing ? (
                            <IconButton
                                onClick={() => setIsEditing(true)}
                            >
                                <EditOutlined style={{width: '21px', height: '23px'}}/>
                            </IconButton>
                        ) : (
                            <IconButton
                                onClick={saveChanges}
                            >
                                <SaveOutlined style={{width: '18px', height: '23px'}}/>
                            </IconButton>
                        )}
                        <ActionChangeDataset isStatusFilter={isStatusFilter}
                                             handleChangeStatusFilter={handleChangeStatusFilter}/>
                    </div>
                </div>
            </div>

            <div className={styles.tableHeader}>
                <div>Chỉ tiêu</div>
                <div>Mã số</div>
                <div>Thuyết minh</div>
                <div>Số cuối kỳ</div>
                <div>Số đầu kỳ</div>
            </div>

            <div className={styles.tableBody}>
                {accounts.map(account => {
                    const totalValue = calculateTotal(account.code);
                    const totalValue2 = calculateTotal2(account.code);
                    if (account.level == 0 || (!isHideShow || (totalValue !== 0 || totalValue2 !== 0))) {
                        return (
                            <div className={`${styles.row} ${styles[`level${account.level}`]}`} key={account.code}>
                                <div className={styles.accountName}>{account.name}</div>
                                <div className={styles.accountCode}>{account.code}</div>
                                <div className={styles.note}>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editingNotes[account.code] || account.note || ""}
                                            onChange={(e) => handleNoteChange(account.code, e.target.value)}
                                            placeholder="TM..."
                                            className={`${styles.input} ${styles.center}`}
                                        />
                                    ) : (
                                        <span title={account.note || 'TM...'}>{account.note || 'TM...'}</span>
                                    )}
                                </div>
                                <div className={styles.value}>
                                    <div className={styles.totalValue}>
                                        {formatCurrency(totalValue)}
                                    </div>
                                </div>
                                <div className={styles.total}>
                                    {formatCurrency(totalValue2)}
                                </div>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
            {
                open && <DialogVas open={open}
                                   onClose={handleCloseView}
                                   headerTitle={headerTitle}
                />
            }
        </div>
    );
};
