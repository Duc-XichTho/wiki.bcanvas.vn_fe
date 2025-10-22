export function loadBCCCTC(vasList, currentMonth) {
    let rowDataList = [
        {header: 'Tài sản ngắn hạn', refercode: '1', code: ''},
        {header: 'Tiền', refercode: '1.1', code: 'M111'},
        {header: 'Gửi tiết kiệm ngắn hạn', refercode: '1.2', code: 'M112'},
        {header: 'Đầu tư ngắn hạn', refercode: '1.3', code: 'M120'},
        {header: 'Công nợ phải thu', refercode: '1.4', code: 'M131'},
        {header: 'Dự phòng nợ xấu', refercode: '1.5', code: 'M137'},
        {header: 'Trả trước cho người bán', refercode: '1.6', code: 'M132'},
        {header: 'Tồn kho thành phẩm, hàng hóa', refercode: '1.7', code: 'M1411'},
        {header: 'Tồn kho khác', refercode: '1.8', code: 'M1412'},
        {header: 'Dự phòng giảm giá tồn kho', refercode: '1.9', code: 'M142'},
        {header: 'Chi phí trả trước', refercode: '1.11', code: 'M151'},
        {header: 'Kí quỹ, kí cược ngắn hạn', refercode: '1.12', code: 'M1551'},
        {header: 'Phải thu nội bộ', refercode: '1.13', code: 'M136'},
        {header: 'Tài sản ngắn hạn khác', refercode: '1.14', code: 'M1552'},

        {header: 'Tài sản dài hạn', refercode: '2', code: ''},
        {header: 'Nguyên giá - Tài sản cố định hữu hình', refercode: '2.1', code: 'M222'},
        {header: 'Khấu hao - Tài sản cố định hữu hình', refercode: '2.2', code: 'M223'},
        {header: 'Nguyên giá - Tài sản cố định thuê tài chính', refercode: '2.3', code: 'M225'},
        {header: 'Khấu hao - Tài sản cố định thuê tài chính', refercode: '2.4', code: 'M226'},
        {header: 'Nguyên giá - Tài sản cố định vô hình', refercode: '2.5', code: 'M228'},
        {header: 'Khấu hao - Tài sản cố định vô hình', refercode: '2.6', code: 'M229'},
        {header: 'Bất động sản đầu tư', refercode: '2.7', code: 'M230'},
        {header: 'Xây dựng cơ bản dở dang', refercode: '2.8', code: 'M242'},
        {header: 'Đầu tư tài chính dài hạn', refercode: '2.9', code: 'M250'},
        {header: 'Tài sản dài hạn khác', refercode: '2.10', code: 'M260'},

        {header: 'Nợ ngắn hạn', refercode: '3', code: ''},
        {header: 'Nợ phải trả', refercode: '3.1', code: 'M311'},
        {header: 'Người mua trả trước', refercode: '3.2', code: 'M312'},
        {header: 'Thuế phải trả', refercode: '3.3', code: 'M313'},
        {header: 'Phải trả người lao động', refercode: '3.4', code: 'M314'},
        {header: 'Phải trả về bảo hiểm', refercode: '3.5', code: 'M3151'},
        {header: 'Phải trả nội bộ', refercode: '3.6', code: 'M336'},
        {header: 'Phải trả ngắn hạn khác', refercode: '3.7', code: 'M3152'},
        {header: 'Doanh thu chưa thực hiện', refercode: '3.8', code: 'M318'},
        {header: 'Vay nợ ngắn hạn', refercode: '3.9', code: 'M320'},

        {header: 'Nợ dài hạn', refercode: '4', code: ''},
        {header: 'Vay nợ dài hạn', refercode: '4.1', code: 'M338'},
        {header: 'Nghĩa vụ phải trả dài hạn khác', refercode: '4.2', code: 'M330'},

        {header: 'Vốn chủ sở hữu', refercode: '5', code: ''},
        {header: 'Vốn điều lệ', refercode: '5.1', code: 'M4111'},
        {header: 'Thặng dư vốn', refercode: '5.2', code: 'M412'},
        {header: 'Lợi nhuận giữ lại', refercode: '5.3', code: 'M421'},
        {header: 'Vốn chủ sở hữu khác', refercode: '5.4', code: 'M400'},
    ];
    vasList = vasList.filter(e => e.consol?.toLowerCase() === 'consol');
    let KNNoList = filterByField(vasList, 'kc_no');
    let KNCoList = filterByField(vasList, 'kc_co');
    let KNNetList = filterByField(vasList, 'kc_net');
    let KNNet2List = filterByField(vasList, 'kc_net2');
    rowDataList.map(e => {
        e[`t0_tien`] = calculateByMonthAndField(KNNoList, 1, 'open_no', e.code, 'kc_no')
            + calculateByMonthAndField(KNCoList, 1, 'open_co', e.code, 'kc_co')
            + calculateByMonthAndField(KNNetList, 1, 'open_net', e.code, 'kc_net')
            - calculateByMonthAndField(KNNet2List, 1, 'open_net', e.code, 'kc_net2')
        for (let i = 1; i <= currentMonth; i++) {
            e[`t${i}_tien`] =
                calculateByMonthAndField(KNNoList, i, 'ending_no', e.code, 'kc_no')
                + calculateByMonthAndField(KNCoList, i, 'ending_co', e.code, 'kc_co')
                + calculateByMonthAndField(KNNetList, i, 'ending_net', e.code, 'kc_net')
                - calculateByMonthAndField(KNNet2List, i, 'ending_net', e.code, 'kc_net2')
        }
    })
    rowDataList.forEach((item) => {
        if (!item.refercode.includes('.')) {
            for (let month = 0; month <= 12; month++) {
                const layerPrefix = item.refercode + '.';
                const layerItems = rowDataList.filter((subItem) => subItem.refercode && subItem.refercode.startsWith(layerPrefix));
                const total = layerItems.reduce((acc, subItem) => acc + (subItem[`t${month}_tien`] || 0), 0);
                item[`t${month}_tien`] = total;
            }
        }
    });
    rowDataList.forEach((item) => {
        item['change'] = [];
        for (let i = 1; i <= currentMonth; i++) {
            item['change'].push(item[`t${i}_tien`]);
        }
    });
    return rowDataList
}

function calculateByMonthAndField(list, month, field, code, kc) {
    let sum = 0;
    list.map(e => {
        if (e[`t${month}_${field}`] && code === e[kc])
            sum += parseFloat(e[`t${month}_${field}`]);
    })
    return sum;
}

function filterByField(list, field) {
    return list.filter((e) => e[field]);
}

