import React, {useCallback, useEffect, useState} from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {ModuleRegistry} from '@ag-grid-community/core';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {Bao_Cao_B03} from "../../../../../Consts/TITLE_HEADER.js";
import {getAllB0123} from "../../../../../apis/b0123Service.jsx";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import styles from '../B01/B01.module.css'
import {handleSave} from "../../handleAction/handleSave.js";
import dayjs from "dayjs";
import {Button, DatePicker} from "antd";
import ActionViewKmtc from "../../actionButton/ActionViewKmtc.jsx";
import DialogKmtc from "../../detail/dialog/DialogKmtc.jsx";
import {EditOutlined, SaveOutlined} from "@ant-design/icons";
import {IconButton} from "@mui/material";
import {getAllSoKeToan} from '../../../../../apis/soketoanService.jsx';
import {getAllKmtc} from "../../../../../apis/kmtcService.jsx";
import {formatCurrency} from "../../../../../generalFunction/format.js";
import ActionHideRow from "../../actionButton/ActionHideRow.jsx";
import ActionChangeDataset from "../../actionButton/ActionChangeDataset.jsx";

const {RangePicker} = DatePicker;

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function B03() {
    const headerTitle = Bao_Cao_B03;
    const table = 'B0123'
    const [accounts, setAccounts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingNotes, setEditingNotes] = useState({});
    const [dateRange, setDateRange] = useState([null, null]);
    const [dataSoKeToan, setDataSoKeToan] = useState([]);
    const [dataKMTC, setDataKMTC] = useState([]);
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

    const fetchDataKMTC = async () => {
        try {
            const data = await getAllKmtc();
            let filteredData = data
            filteredData = filteredData.sort((a, b) => {
                const loaiOrder = (loai) => (loai === "Thu" ? 0 : 1);
                const loaiCompare = loaiOrder(a?.loai) - loaiOrder(b?.loai);
                if (loaiCompare !== 0) {
                    return loaiCompare;
                }
            });
            setDataKMTC(filteredData);
        } catch (error) {
            console.error('Lỗi khi lấy dataVas:', error);
        }
    }

    const fetchAllSoKeToan = async () => {
        try {
            let data = await getAllSoKeToan();
            if (isStatusFilter) {
                data = data.filter(item => item.tax);
            } else {
                data = data.filter(item => item.quan_tri_noi_bo);
            }
            setDataSoKeToan(data);
        } catch (error) {
            console.error('Lỗi khi lấy dataSoKeToan:', error);
        }
    }

    const handleMonthChange = (dates) => {
        if (dates) {
            setDateRange(dates.map(date => (date ? date.startOf('month').toISOString() : null)));
        } else {
            setDateRange([null, null]);
        }
    };

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


    useEffect(() => {
        const fetchData = async () => {
            const fetchedData = await getAllB0123();
            let filteredData = fetchedData.filter(item => item.loai === Bao_Cao_B03);
            filteredData = filteredData.sort((a, b) => a.code.localeCompare(b.code));

            filteredData = filteredData.map(item => {
                const matchingKMTC = dataKMTC.filter(kmtc => kmtc.phan_loai == item.code);
                const totalPlValue = matchingKMTC.reduce((sum, kmtcItem) => {
                    const matchingSoKeToan = dataSoKeToan.filter(soKeToanItem => soKeToanItem.kmns == kmtcItem.code);
                    const plValueSum = matchingSoKeToan.reduce((innerSum, soKeToanItem) => innerSum + (+soKeToanItem.pl_value), 0);
                    return sum + plValueSum;
                }, 0);
                return {...item, nam_nay: totalPlValue};
            })
            setAccounts(filteredData);

        };

        fetchData();
    }, [dataKMTC, dataSoKeToan]);

    useEffect(() => {
        fetchCurrentUser();
        fetchDataKMTC();
        fetchAllSoKeToan();
    }, []);
    useEffect(() => {
        fetchAllSoKeToan();
    }, [isStatusFilter]);

    const fetchCurrentUser = async () => {
        const {data} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    const formatNumber = useCallback((number) => {
        return new Intl.NumberFormat('vi-VN').format(number || 0);
    }, []);

    const calculateTotal = useCallback((code) => {
        const account = accounts.find(acc => acc.code == code);
        if (!account) return 0;
        if (account.children.length == 0) {
            return account.isNegative ? -(account.nam_nay) : (account.nam_nay);
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

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>BÁO CÁO LƯU CHUYỂN TIỀN TỆ</h1>
                <p>Tại ngày {period.day} tháng {period.month} năm {period.year}</p>
                <p className={styles.unit}>Đơn vị tính: VND</p>
            </header>

            <div className={styles.controls}>
                <div className={styles.actionButtons}>
                    <div>
                        {/*<RangePicker*/}
                        {/*    size="middle"*/}
                        {/*    format="MM/YYYY"*/}
                        {/*    value={dateRange.map(date => (date ? dayjs(date) : null))}*/}
                        {/*    onChange={handleMonthChange}*/}
                        {/*    picker="month"*/}
                        {/*    disabledDate={disabledDate}*/}
                        {/*/>*/}
                    </div>
                    <div style={{display: "flex", gap: '1rem', alignItems: "center"}}>
                        <ActionHideRow handleHideRow={handleHideRow}
                                       handleShowRow={handleShowRow}
                                       isHideShow={isHideShow}/>
                        <ActionViewKmtc open={open} handleOpenView={handleOpenView}/>
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
                <div>Năm nay</div>
                <div>Năm trước</div>
            </div>

            <div className={styles.tableBody}>
                {accounts.map(account => {
                    const totalValue = calculateTotal(account.nam_nay);
                    const totalValue2 = calculateTotal2(account.nam_nay);
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
                                    {formatNumber(totalValue2)}
                                </div>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
            {
                open && <DialogKmtc open={open}
                                    onClose={handleCloseView}
                                    headerTitle={headerTitle}
                />
            }
        </div>
    );
};
