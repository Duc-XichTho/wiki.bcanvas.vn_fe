export const updatePLAndCashValues = (row) => {
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
            pl_type = "TAX";
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
