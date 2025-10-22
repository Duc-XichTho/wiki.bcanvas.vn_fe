import {getAllSoKeToan} from "../../../../apisKTQT/soketoanService.jsx";
import {getAllVas} from "../../../../apisKTQT/vasService.jsx";

// Hàm lấy tổng doanh thu, chi phí và lợi nhuận theo tháng
export const getFinancialDataForMonth = async (month, skt, currentYear, company) => {
    // Tính tổng doanh thu
    const vasList = await getAllVas()
    let totalRevenue = 0
    let totalCost = 0
    let laiLoRongTrongThang = 0
    let tongThuTrongThang = 0
    let tongChiTrongThang = 0
    let dauKyList =0
    let duCuoiKy = 0;
    if (company && company?.length > 0) {
        if (company.some(c => c?.code.includes('HQ'))) {
            totalRevenue = skt
                .filter((e) => e?.month == month && e.year == currentYear && e.pl_type?.includes('DT'))
                .reduce((sum, row) => sum + (parseFloat(row.pl_value) || 0), 0);
            // Tính tổng chi phí
            totalCost = skt
                .filter((e) => ((e.pl_type?.includes('CF') || e.pl_type?.includes('GV')) && e?.month == month && e.year == currentYear))
                .reduce((sum, row) => sum + (parseFloat(row.pl_value) || 0), 0);
            laiLoRongTrongThang = skt
                .filter((e) => (e?.month == month && e.year == currentYear))
                .reduce((sum, row) => sum + (parseFloat(row.pl_value) || 0), 0);
            tongThuTrongThang = skt
                .filter((e) => (parseFloat(e?.cash_value) > 0 && e?.month == month && e.year == currentYear))
                .reduce((sum, row) => sum + (parseFloat(row.cash_value) || 0), 0);
            tongChiTrongThang = skt
                .filter((e) => (parseFloat(e?.cash_value) < 0 && e?.month == month && e.year == currentYear))
                .reduce((sum, row) => sum + (parseFloat(row.cash_value) || 0), 0);

            dauKyList = vasList.filter(e => e.ma_tai_khoan?.startsWith('11') && e.year == currentYear);

            dauKyList.forEach(e => {
                if (e[`t${month}_ending_net`])
                    duCuoiKy += parseFloat(e[`t${month}_ending_net`]);
            });
        } else {
            // Sử dụng += để cộng dồn tổng cho tất cả các công ty
            for (const item of company) {
                totalRevenue += skt
                    .filter((e) => e?.company == item.code && e?.month == month && e.year == currentYear && e.pl_type?.includes('DT'))
                    .reduce((sum, row) => sum + (parseFloat(row.pl_value) || 0), 0);
                // Tính tổng chi phí
                totalCost += skt
                    .filter((e) => e?.company == item.code && (e.pl_type?.includes('CF') || e.pl_type?.includes('GV')) && e?.month == month && e.year == currentYear)
                    .reduce((sum, row) => sum + (parseFloat(row.pl_value) || 0), 0);
                laiLoRongTrongThang += skt
                    .filter((e) => e?.company == item.code && e?.month == month && e.year == currentYear)
                    .reduce((sum, row) => sum + (parseFloat(row.pl_value) || 0), 0);
                tongThuTrongThang += skt
                    .filter((e) => e?.company == item.code && parseFloat(e?.cash_value) > 0 && e?.month == month && e.year == currentYear)
                    .reduce((sum, row) => sum + (parseFloat(row.cash_value) || 0), 0);
                tongChiTrongThang += skt
                    .filter((e) => e?.company == item.code && parseFloat(e?.cash_value) < 0 && e?.month == month && e.year == currentYear)
                    .reduce((sum, row) => sum + (parseFloat(row.cash_value) || 0), 0);

                const dauKyListForItem = vasList.filter(e => e?.company == item.code && e.ma_tai_khoan?.startsWith('11') && e.year == currentYear);
                dauKyListForItem.forEach(e => {
                    if (e[`t${month}_ending_net`])
                        duCuoiKy += parseFloat(e[`t${month}_ending_net`]);
                });
            }
        }
    }




    const totalProfit = totalRevenue + totalCost;
    return {
        month: `Tháng ${month}`,
        revenue: totalRevenue,
        cost: totalCost,
        profit: totalProfit,
        laiLoRongTrongThang: laiLoRongTrongThang,
        tongThuTrongThang: tongThuTrongThang,
        tongChiTrongThang: tongChiTrongThang,
        duCuoiKy: duCuoiKy

    };
}


// Hàm lấy tổng doanh thu, chi phí và lợi nhuận theo khoảng tháng
export async function getFinancialReportForRange(startMonth, endMonth) {

    let totalRevenue = 0;
    let totalCost = 0;
    let skt = await getAllSoKeToan();
    let laiLoRongTrongKhoang = 0
    let tongThuTrongKhoang = 0
    let tongChiTrongKhoang = 0
    for (let month = startMonth; month <= endMonth; month++) {
        totalRevenue += skt
            .filter((e) => e.pl_type?.includes('DT') && month ? e?.month == month : e.pl_type?.includes('DT'))
            .reduce((sum, row) => sum + (parseFloat(row.pl_value) || 0), 0);

        // Tính tổng chi phí
        totalCost += skt
            .filter((e) => (e.pl_type?.includes('CF') || e.pl_type?.includes('GV')) && e?.month == month)
            .reduce((sum, row) => sum + (parseFloat(row.pl_value) || 0), 0);

        laiLoRongTrongKhoang += skt
            .filter((e) => e?.month == month)
            .reduce((sum, row) => sum + (parseFloat(row.pl_value) || 0), 0);

        tongThuTrongKhoang += skt
            .filter((e) => e?.cash_value > 0 && e?.month == month)
            .reduce((sum, row) => sum + (parseFloat(row.pl_value) || 0), 0);
        tongChiTrongKhoang += skt
            .filter((e) => e?.cash_value < 0 && e?.month == month)
            .reduce((sum, row) => sum + (parseFloat(row.pl_value) || 0), 0);

    }
    // Tính lợi nhuận
    const totalProfit = totalRevenue + totalCost;

    return {
        startMonth,
        endMonth,
        totalRevenue,
        totalCost,
        totalProfit,
        laiLoRongTrongKhoang,
        tongThuTrongKhoang,
        tongChiTrongKhoang
    };
}
