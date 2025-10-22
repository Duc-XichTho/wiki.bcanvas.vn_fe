import '../../index.css';
import {Grid} from "@mui/material";
import './soLienHienThi.css';
import React, {useContext, useEffect, useState} from "react";
import {formatMoney} from "../../generalFunction/format.js";
import {MyContext} from "../../MyContext.jsx";
import {getFinancialDataForMonth} from "../KeToanQuanTri/BaoCao/logic/financeFunctions.js";
import {useParams} from "react-router-dom";
import ActionSelectCompanyBaoCao from "../KeToanQuanTri/ActionButton/ActionSelectCompanyBaoCao.jsx";
import {Typography} from "antd";
import {getPermissionDataCty} from "../Canvas/getPermissionDataNhomBC.js";
import {CANVAS_DATA_PACK} from "../../CONST.js";
import {KHONG_THE_TRUY_CAP} from "../../Consts/TITLE_HEADER.js";
import NotAccessible from "../Canvas/NotAccessible.jsx";
import {getCurrentUserLogin} from "../../apis/userService.jsx";
import css from "../KeToanQuanTri/BaoCao/BaoCao.module.css";
import {getItemFromIndexedDB, setItemInIndexedDB} from "../../storage/storageService.js";

const FinanceDetail = ({title, currentValue, previousValue, isLast, isExpense}) => {
    const calculatePercentageChange = (current, previous) => {
        if (previous === 0) {
            return current > 0 ? 100 : -100;
        }
        return ((current - previous) / Math.abs(previous)) * 100;
    };

    const formatPercentage = (current, previous) => {
        const percentage = calculatePercentageChange(current, previous);

        // Handle cases where the current value is zero
        if (current === 0) {
            return '-%';
        }

        if (Math.abs(percentage) < 0.5) {
            return "≈0%";
        }

        const sign = percentage > 0 ? "+" : "";
        if (`${sign}${parseInt(percentage)}%` === '0%') {
            return "≈0%";
        }
        return `${sign}${parseInt(percentage)}%`;
    };

    const percentage = calculatePercentageChange(currentValue, previousValue);
    const percentage2 = formatPercentage(currentValue, previousValue)

    // Color logic
    let percentageColor;
    if (isExpense) {
        // For expenses, decrease is good (green), increase is bad (red)
        percentageColor = percentage < 0 ? '#00AF00' : (percentage > 0 ? '#E72828' : '#262626');
    } else {
        // For income, profit, etc., increase is good (green), decrease is bad (red)
        percentageColor = percentage > 0 ? '#00AF00' : (percentage < 0 ? '#E72828' : '#262626');
    }
    if (percentage2 === "≈0%" || percentage2 === '-%') {
        percentageColor = '#262626'
    }

    return (
        <div className="group-finance-detail" style={{border: !isLast ? '0.5px solid #ffffff' : 'none'}}>
            <div className="title-finance-detail">
                <span>{title}</span>
            </div>
            <div className="content-finance-detail">
                <div className={'so-tien'}>
                    <span>{formatMoney(isExpense ? -currentValue : currentValue)}</span>
                </div>
                <div className={'perCen'}>
                    <span style={{color: percentageColor}}>
                        {formatPercentage(currentValue, previousValue)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export const SoLieuHienThi = () => {
    const key = 'SOLIEUHIENTHI';
    const table = key + "_COMPANY";
    const getLocalStorageSettings = () => {
        const storedSettings = JSON.parse(localStorage.getItem(table));
        return {
            companySelected: storedSettings?.companySelected ?? [],
        };
    };
    const {
        currentMonthCanvas,
        loadDataSoKeToan,
        currentYearCanvas,
        userClasses,
        fetchUserClasses,
        uCSelected_CANVAS
    } = useContext(MyContext);
    const {tabSelect} = useParams();
    const [doanhThuThangHienTai, setDoanhThuThangHienTai] = useState(null);
    const [chiPhiThangHienTai, setChiPhiThangHienTai] = useState(null);
    const [doanhThuThangTruoc, setDoanhThuThangTruoc] = useState(null);
    const [chiPhiThangTruoc, setChiPhiThangTruoc] = useState(null);
    const [tongThuTrongThang, setTongThu] = useState(null);
    const [tongChiTrongThang, setTongChi] = useState(null);
    const [loiNhuanRongTrongThang, setLoiNhuanRong] = useState(null);
    const [tongThuThangTruoc, setTongThuThangTruoc] = useState(null);
    const [tongChiThangTruoc, setTongChiThangTruoc] = useState(null);
    const [loiNhuanRongThangTruoc, setLoiNhuanRongThangTruoc] = useState(null);
    const [duCuoiKy, setDuCuoiKy] = useState(null);
    const [duCuoiKyTruoc, setDuCuoiKyTruoc] = useState(null);
    const [companySelected, setCompanySelected] = useState(getLocalStorageSettings().companySelected || [])
    const [listCom, setListCom] = useState([])
    const [titleName, setTitleName] = useState('');

    useEffect(() => {
        const tableSettings = {
            companySelected: companySelected
        }
        localStorage.setItem(table, JSON.stringify(tableSettings));
    }, [companySelected]);

    const fetchAndSetTitleName = async () => {
        try {

            const user = await getCurrentUserLogin();
            const listComs = await getPermissionDataCty('cty', user, userClasses, fetchUserClasses, uCSelected_CANVAS)
            if (listComs?.length > 0 || user.data.isAdmin || listComs.some(e => e.code == 'HQ')) {
                setListCom(listComs)
                setTitleName(CANVAS_DATA_PACK.find(e => e.value == key)?.name)
            } else {
                setTitleName(KHONG_THE_TRUY_CAP)
            }

        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu:', error);
        }
    };

    useEffect(() => {
        fetchAndSetTitleName()
    }, []);

    const getData = async () => {
        const month = tabSelect == 'daas' ? new Date().getMonth() + 1 : currentMonthCanvas
        let soKeToanList = await loadDataSoKeToan();
        let m = await getFinancialDataForMonth(month, soKeToanList, currentYearCanvas, companySelected);
        let m1 = await getFinancialDataForMonth(month - 1, soKeToanList, currentYearCanvas, companySelected);
        await setItemInIndexedDB(key, [m, m1]);
        setDoanhThuThangHienTai(m.revenue);
        setChiPhiThangHienTai(-m.cost);
        setTongThu(m.tongThuTrongThang);
        setTongChi(-m.tongChiTrongThang);
        setLoiNhuanRong(m.laiLoRongTrongThang);
        setDoanhThuThangTruoc(m1.revenue);
        setChiPhiThangTruoc(-m1.cost);
        setTongChiThangTruoc(-m1.tongChiTrongThang);
        setTongThuThangTruoc(m1.tongThuTrongThang);
        setLoiNhuanRongThangTruoc(m1.laiLoRongTrongThang);
        setDuCuoiKy(m.duCuoiKy);
        setDuCuoiKyTruoc(m1.duCuoiKy);
    };

    useEffect(() => {
        getData();
    }, [currentMonthCanvas, companySelected, currentYearCanvas]);

    return (
        <div>
            <NotAccessible NotAccessible={titleName}/>
            <div className={css.headerTitle}>
                   <span>
  {titleName}
                       {(companySelected?.length > 0 ? companySelected : []).map((e, index) => (
                           <React.Fragment key={index}>
                               {index == 0 && ` - `}
                               {e.name}
                               {index !== (companySelected?.length > 0 ? companySelected.length : 0) - 1 && ", "}
                           </React.Fragment>
                       ))}
                   </span>
                <div style={{width: 'max-content%', display: "flex",}}>
                    <ActionSelectCompanyBaoCao options={listCom} handlers={setCompanySelected}
                                               valueSelected={companySelected}/>
                </div>
            </div>

            <div style={{width: '100%'}}>
                <Grid container pl={4}>
                    <Grid item xl={2} md={4} sm={6}>
                        <FinanceDetail
                            title="Doanh thu"
                            currentValue={doanhThuThangHienTai}
                            previousValue={doanhThuThangTruoc}
                            isLast={false}
                            isExpense={false} // Not an expense
                        />
                    </Grid>
                    <Grid item xl={2} md={4} sm={6} mb={2}>
                        <FinanceDetail
                            title="Chi phí"
                            currentValue={chiPhiThangHienTai}
                            previousValue={chiPhiThangTruoc}
                            isLast={false}
                            isExpense={true} // This is an expense
                        />
                    </Grid>
                    <Grid item xl={2} md={4} sm={6} mb={2}>
                        <FinanceDetail
                            title="Lợi nhuận ròng"
                            currentValue={loiNhuanRongTrongThang}
                            previousValue={loiNhuanRongThangTruoc}
                            isLast={false}
                            isExpense={false} // Not an expense
                        />
                    </Grid>
                    <Grid item xl={2} md={4} sm={6} mb={2}>
                        <FinanceDetail
                            title="Tiền thu trong kỳ"
                            currentValue={tongThuTrongThang}
                            previousValue={tongThuThangTruoc}
                            isLast={false}
                            isExpense={false} // Not an expense
                        />
                    </Grid>
                    <Grid item xl={2} md={4} sm={6} mb={2}>
                        <FinanceDetail
                            title="Tiền chi trong kỳ"
                            currentValue={tongChiTrongThang}
                            previousValue={tongChiThangTruoc}
                            isLast={false}
                            isExpense={true} // This is an expense
                        />
                    </Grid>
                    <Grid item xl={2} md={4} sm={6} mb={2}>
                        <FinanceDetail
                            title="Dư cuối kỳ"
                            currentValue={duCuoiKy}
                            previousValue={duCuoiKyTruoc}
                            isLast={false}
                            isExpense={false} // Not an expense
                        />
                    </Grid>
                </Grid>
            </div>
        </div>

    );
};
