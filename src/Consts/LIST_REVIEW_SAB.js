
function getRandomInRange(min, max, isPercentage) {
    if (isPercentage) {
        min /= 100;
        max /= 100;
    }
    const value = (Math.random() * (max - min) + min).toFixed(4);
    return isPercentage ? `${(value * 100).toFixed(2)}%` : value;
}
export const LIST_REVIEW_SAB =  [
    {
        code: 'R10',
        name: 'Có số dư tiền bị âm theo số thuế',
        desc: 'Có số dư tiền bị âm theo số thuế',
        calc: 'Có số dư tiền bị âm theo số thuế',
        min: 0.3,
        max: 0.6
    },
    {
        code: 'R11',
        name: 'Tỷ lệ nợ/ tài sản',
        desc: 'Tỷ lệ nợ/ tài sản',
        calc: 'Tỷ lệ nợ/ tài sản',
        min: 0.3,
        max: 0.6
    },
    {
        code: 'R12',
        name: 'Tỷ lệ tài sản ngắn hạn/ nợ ngắn hạn',
        desc: 'Tỷ lệ tài sản ngắn hạn/ nợ ngắn hạn',
        calc: 'Tỷ lệ tài sản ngắn hạn/ nợ ngắn hạn',
        min: 0.3,
        max: 0.6
    },
    {
        code: 'R13',
        name: 'Tổng phải thu / tổng tài sản',
        desc: 'Tổng phải thu / tổng tài sản',
        calc: 'Tổng phải thu / tổng tài sản',
        min: 0.3,
        max: 0.6
    },
    {
        code: 'R14',
        name: 'Tổng phải trả / Tổng tài sản',
        desc: 'Tổng phải trả / Tổng tài sản',
        calc: 'Tổng phải trả / Tổng tài sản',
        min: 0.3,
        max: 0.6
    },
    {
        code: 'R15',
        name: "Tỷ lệ TK 138 (Phải thu khác)/tổng tài sản",
        desc: "TK 138 cao bất thường có thể chỉ ra việc chuyển tiền không rõ mục đích, che giấu thu nhập hoặc giao dịch không hợp pháp",
        calc: "TK 138 (Phải thu khác) / Tổng tài sản",
        min: 1,
        max: 10,
        isPercentage: true
    },
    {
        code: 'R16',
        name: "Tỷ lệ TK 338 (Phải trả khác)/tổng nguồn vốn",
        desc: "TK 338 cao bất thường có thể chỉ ra việc nhận tiền không rõ nguồn gốc, che giấu doanh thu",
        calc: "TK 338 (Phải trả khác) / Tổng nguồn vốn",
        min: 1,
        max: 10,
        isPercentage: true
    },
    {
        code: 'R17',
        name: 'Vòng quay tồn kho',
        desc: 'Vòng quay tồn kho',
        calc: 'Vòng quay tồn kho',
        min: 1000,
        max: 1200
    },
    {
        code: 'R18',
        name: "Tỷ lệ thuế GTGT đầu vào/đầu ra",
        desc: "Nếu thường xuyên có thuế GTGT đầu vào cao hơn đáng kể so với đầu ra, có thể chỉ ra việc khai khống hóa đơn đầu vào",
        calc: "Thuế GTGT đầu vào / Thuế GTGT đầu ra",
        min: 0.3,
        max: 0.6
    },
    {
        code: 'R19',
        name: "Tỷ lệ thuế TNDN/lợi nhuận trước thuế",
        desc: "Thấp hơn mức quy định có thể liên quan đến việc áp dụng không đúng ưu đãi thuế",
        calc: "Thuế TNDN / Lợi nhuận trước thuế",
        min: 18,
        max: 22,
        isPercentage: true
    },
    {
        code: 'R20',
        name: "Tỷ lệ chi phí lãi vay/EBITDA",
        desc: "Cao hơn 30% EBITDA có thể gặp vấn đề về giới hạn khấu trừ chi phí lãi vay theo Nghị định 132/2020/NĐ-CP",
        calc: "Chi phí lãi vay / EBITDA (giới hạn 30%)",
        min: 0,
        max: 15,
        isPercentage: true
    },
    {
        code: 'R21',
        name: "Tỷ lệ thuế đã nộp/thuế phải nộp",
        desc: "Thấp hơn 1 có thể chỉ ra nợ thuế, vi phạm nghĩa vụ thuế",
        calc: "Thuế đã nộp / Thuế phải nộp",
        min: 0.95,
        max: 1.0
    },
    {
        code: 'R22',
        name: "Tỷ lệ kê khai thuế GTGT/kê khai thuế TNDN",
        desc: "Chênh lệch lớn giữa doanh thu kê khai trên tờ khai thuế GTGT và TNDN gợi ý việc khai thiếu doanh thu",
        calc: "Doanh thu kê khai thuế GTGT / Doanh thu kê khai thuế TNDN",
        min: 0.95,
        max: 1.05
    },
    {
        code: 'R23',
        name: "Tỷ lệ TK 111 (Tiền mặt)/tổng tài sản",
        desc: "TK 111 cao bất thường có thể liên quan đến việc giữ nhiều tiền mặt để tránh giao dịch qua ngân hàng, che giấu các giao dịch không hợp pháp",
        calc: "TK 111 (Tiền mặt) / Tổng tài sản",
        min: 2,
        max: 7,
        isPercentage: true
    }
].map(indicator => ({
    ...indicator,
    t1: getRandomInRange(indicator.min, indicator.max, indicator.isPercentage),
    t2: getRandomInRange(indicator.min, indicator.max, indicator.isPercentage),
    t3: getRandomInRange(indicator.min, indicator.max, indicator.isPercentage),
    t4: getRandomInRange(indicator.min, indicator.max, indicator.isPercentage),
    t5: getRandomInRange(indicator.min, indicator.max, indicator.isPercentage),
    t6: getRandomInRange(indicator.min, indicator.max, indicator.isPercentage),
    t7: getRandomInRange(indicator.min, indicator.max, indicator.isPercentage),
    t8: getRandomInRange(indicator.min, indicator.max, indicator.isPercentage),
    t9: getRandomInRange(indicator.min, indicator.max, indicator.isPercentage),
    t10: getRandomInRange(indicator.min, indicator.max, indicator.isPercentage),
    t11: getRandomInRange(indicator.min, indicator.max, indicator.isPercentage),
    t12: getRandomInRange(indicator.min, indicator.max, indicator.isPercentage),
}));
