export const localStorageKeys = {
    result_bkkd: 'result_bkkd',
    result_bcdv: 'result_bcdv',
    result_bcsp: 'result_bcsp',
    actualData: 'actual_data',
    percentageDV: 'percentage_dv',
    percentageSP: 'percentage_sp',
    dataChartKH: 'data_chart_kh',
    doanh_thu_data_BC: 'doanh_thu_data_BC',
    chi_phi_data_BC: 'chi_phi_data_BC',
    gia_von_data_BC: 'gia_von_data_BC',
    doanh_thu_data_BCDV: 'doanh_thu_data_BCDV',
    chi_phi_data_BCDV: 'chi_phi_data_BCDV',
    gia_von_data_BCDV: 'gia_von_data_BCDV',
    cm_data_BCDV: 'cm_data_BCDV',
    doanh_thu_data_BCSP: 'doanh_thu_data_BCSP',
    chi_phi_data_BCSP: 'chi_phi_data_BCSP',
    gia_von_data_BCSP: 'gia_von_data_BCSP',
    cm_data_BCSP: 'cm_data_BCSP',
    data_for_chart_line_CP_BC: 'data_for_chart_line_CP_BC',
    data_for_chart_line_LN_BC: 'data_for_chart_line_LN_BC',
    data_for_chart_line_DT_BC: 'data_for_chart_line_DT_BC',
    data_for_chart_line_BCDV: 'data_for_chart_line_BCDV',
    data_for_chart_line_LNDV: 'data_for_chart_line_LNDV',
    data_for_chart_line_CMDV: 'data_for_chart_line_CMDV',
    data_for_chart_line_CP_BCDV: 'data_for_chart_line_CP_BCDV',
    data_for_chart_line_LNSP: 'data_for_chart_line_LNSP',
    data_for_chart_line_CMSP: 'data_for_chart_line_CMSP',
    data_for_chart_line_BCSP: 'data_for_chart_line_BCSP',
    data_for_chart_line_CP_BCSP: 'data_for_chart_line_CP_BCSP',
    data_for_chart_waterfall_cocau_chi_phi: 'data_for_chart_waterfall_cocau_chi_phi',
    data_for_chart_stack_DT: 'data_for_chart_stack_DT',
    data_for_chart_stack_CDTC: 'data_for_chart_stack_CDTC',
    data_for_chart_stack_TT: 'data_for_chart_stack_TT',
    doanhThuData: 'doanhThuData',
    chiPhiData: 'chiPhiData',
    loiNhuanData: 'loiNhuanData',
};
export const loadFromLocalStorage = (key, fallback) => {
    const savedData = localStorage.getItem(key);
    if (!savedData) {
        return fallback;
    }
    return JSON.parse(savedData);
};

export const saveToLocalStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};
