function sumAttributesByCode(result, code, unitCode) {
    let sumObj = { code: code };
    result.forEach((item) => {
        if (String(item.code) === String(code)) {
            for (let i = 0; i <= 12; i++) {
                const field = unitCode ? `${unitCode}_${i}` : i; // kiểm tra nếu unitCode có tồn tại
                if (!sumObj.hasOwnProperty(i)) {
                    sumObj[i] = 0;
                }
                sumObj[i] += item[field] ? parseFloat(item[field]) : 0;
            }
        }
    });
    return sumObj;
}

export function calculateData(
    data,
    units,
    kmfList,
    unitCodeKey,
    projectFilterKey = 'unit_code',
    teamField = null,
    teamListField = null
) {
    data = data.filter((e) => e.pl_type && e.pl_type !== '' && e.pl_value);
    kmfList = kmfList.map((item) => {
        return { ...item, kmf: item.name, dp: `${item.dp}` };
    });
    const result = [
        { dp: 'Doanh thu', mo_ta: null, layer: '1' },
        { dp: 'CF biến đổi', mo_ta: null, layer: '2' },
        { dp: 'Lãi lỗ trực tiếp', mo_ta: null, layer: '3' },
        { dp: 'CF hỗn hợp', mo_ta: null, layer: '4' },
        { dp: 'CF cố định', mo_ta: null, layer: '5' },
        { dp: 'Lãi lỗ hoạt động', mo_ta: null, layer: '6' },
        { dp: 'Hoạt động tài chính', mo_ta: null, layer: '7' },
        { dp: 'Lãi lỗ khác', mo_ta: null, layer: '8' },
        { dp: 'Lợi nhuận trước thuế', mo_ta: null, layer: '9' },
        { dp: 'Thuế', mo_ta: null, layer: '10' },
        { dp: 'Lãi lỗ ròng', mo_ta: null, layer: '11' },
        { dp: 'EBITDA', mo_ta: null, layer: '12' },
        // { dp: 'Điểm hòa vốn', mo_ta: null, layer: '13' },
    ];

    let thuCounter = 1,
        chiCounter = 1,
        gvCounter = 1;

    kmfList.forEach((item) => {
        if (item.code !== null) {
            if (item.code === 'DT') {
                result.push({ ...item, layer: `1.${thuCounter++}` });
            }
            if (item.code.startsWith('VC')) {
                result.push({ ...item, layer: `2.${gvCounter++}` });
            }
            if (item.code === 'MC') {
                result.push({ ...item, layer: `4.${thuCounter++}` });
            }
            if (['FC', 'KH'].includes(item.code)) {
                result.push({ ...item, layer: `5.${chiCounter++}` });
            }
            if (['DTTC', 'CFTC'].includes(item.code)) {
                result.push({ ...item, layer: `7.${chiCounter++}` });
            }
            if (['OI', 'OE'].includes(item.code)) {
                result.push({ ...item, layer: `8.${chiCounter++}` });
            }
            if (item.code === 'TAX') {
                result.push({ ...item, layer: `10.${chiCounter++}` });
            }
        }
    });
    units.forEach((unit) => {
        let unitCode = unit[unitCodeKey];
        result.forEach((item) => {
            item[`${unitCode}_0`] = 0;
            for (let month = 1; month <= 12; month++) {
                item[`${unitCode}_${month}`] = 0;
            }
        });

        const totals = {};
        data.forEach((item) => {
            const key = `${item.kmf}_${+item.month}`;
            // Điều kiện xử lý `unitCode` và dựa vào `teamField`, `teamListField` nếu có
            if (item[projectFilterKey] === unitCode && (!item[teamField] || item.CCPBDV === '')) {
                if (!totals[key]) totals[key] = 0;
                totals[key] += parseFloat(item.pl_value);
            } else if (teamField && teamListField && item[teamField] !== null) {
                let teamList = JSON.parse(item[teamField])[teamListField];
                teamList.forEach((team) => {
                    if (team.team === unitCode) {
                        if (!totals[key]) totals[key] = 0;
                        totals[key] += parseFloat(team.tien);
                    }
                });
            }
        });
        // Gán kết quả vào result
        result.forEach((item) => {
            for (const key in totals) {
                const [dp, month] = key.split('_');
                if (item.kmf === dp) {
                    item[`${unitCode}_${month}`] = totals[key];
                }
            }
        });
        // Tính toán tổng layer (ví dụ: 1, 2, 3)
        result.forEach((item) => {
            if (
                item.layer === '1' ||
                item.layer === '2' ||
                item.layer === '3' ||
                item.layer === '4' ||
                item.layer === '5' ||
                item.layer === '7' ||
                item.layer === '8' ||
                item.layer === '10'
            ) {
                for (let month = 1; month <= 12; month++) {
                    const layerPrefix = item.layer + '.';
                    const layerItems = result.filter((subItem) => subItem.layer && subItem.layer.startsWith(layerPrefix));
                    const total = layerItems.reduce((acc, subItem) => acc + (subItem[`${unitCode}_${month}`] || 0), 0);
                    item[`${unitCode}_${month}`] = total;
                }
            }
        });
        // Các tính toán phức tạp khác dựa trên logic đã có
        let l1 = result.find((e) => e.layer == 1);
        let l2 = result.find((e) => e.layer == 2);
        let l3 = result.find((e) => e.layer == 3);
        let l4 = result.find((e) => e.layer == 4);
        let l5 = result.find((e) => e.layer == 5);
        let l6 = result.find((e) => e.layer == 6);
        let l7 = result.find((e) => e.layer == 7);
        let l8 = result.find((e) => e.layer == 8);
        let l9 = result.find((e) => e.layer == 9);
        let l10 = result.find((e) => e.layer == 10);
        let l11 = result.find((e) => e.layer == 11);
        let l12 = result.find((e) => e.layer == 12);
        // let l13 = result.find((e) => e.layer == 13);
        let khpb = result.find((e) => e.code == 'KH');
        let cftc = result.find((e) => e.code == 'CFTC');
        for (let month = 1; month <= 12; month++) {
            l3[`${unitCode}_${month}`] = l1[`${unitCode}_${month}`] + l2[`${unitCode}_${month}`];
            l6[`${unitCode}_${month}`] =
                l1[`${unitCode}_${month}`] +
                l2[`${unitCode}_${month}`] +
                l5[`${unitCode}_${month}`] +
                l4[`${unitCode}_${month}`];
            l9[`${unitCode}_${month}`] =
                l1[`${unitCode}_${month}`] +
                l2[`${unitCode}_${month}`] +
                l4[`${unitCode}_${month}`] +
                l5[`${unitCode}_${month}`] +
                l7[`${unitCode}_${month}`] +
                l8[`${unitCode}_${month}`];
            l11[`${unitCode}_${month}`] = l9[`${unitCode}_${month}`] + l10[`${unitCode}_${month}`];
            l12[`${unitCode}_${month}`] =
                l9[`${unitCode}_${month}`] -
                (cftc ? cftc[`${unitCode}_${month}`] || 0 : 0) -
                (khpb ? khpb[`${unitCode}_${month}`] || 0 : 0);
            // if (l3[`${unitCode}_${month}`] < 0) {
            //     l13[`${unitCode}_${month}`] = 0;
            // }
            // if (l3[`${unitCode}_${month}`] > 0) {
            //     l13[`${unitCode}_${month}`] =
            //         -l5[`${unitCode}_${month}`] / (l3[`${unitCode}_${month}`] / l1[`${unitCode}_${month}`]);
            // }
        }

        // Tính tổng năm cho từng unit
        result.forEach((item) => {
            item[`${unitCode}_0`] = 0;
            for (let month = 1; month <= 12; month++) {
                item[`${unitCode}_0`] += item[`${unitCode}_${month}`];
            }
        });
    });

    // Tính tổng cho tất cả các units
    result.forEach((item) => {
        for (let i = 0; i <= 12; i++) {
            let total = units.reduce((sum, unit) => {
                const field = `${unit[unitCodeKey]}_${i}`;
                return sum + (item[field] || 0);
            }, 0);
            item[`ALL_${i}`] = total;
        }
    });

    return result;
}

export function calculateDataView2(
    data,
    units,
    kmf,
    unitCodeKey,
    projectFilterKey = 'unit_code',
    teamField = null,
    teamListField = null
) {
    data = data.filter((e) => e.pl_type && e.pl_type !== '' && e.pl_value);
    const uniqueKMFMap = new Map(
        data.flatMap((item) =>
            kmf
                .filter((km) => km.name === item.kmf)
                .map((km) => [
                    `${item.kmf}_${item.pl_type}`,
                    { kmf: item.kmf, dp: `${km.dp}`, code: item.pl_type || null },
                ])
        )
    );
    const kmfList = Array.from(uniqueKMFMap.values());
    const result = [
        { dp: 'Doanh thu', mo_ta: null, layer: '1' },
        { dp: 'Giá vốn', mo_ta: null, layer: '2' },
        { dp: 'Lãi gộp (Doanh thu-GV)', mo_ta: null, layer: '3' },
        { dp: 'Chi phí bán hàng', mo_ta: null, layer: '4' },
        { dp: 'Chi phí quản lí', mo_ta: null, layer: '5' },
        { dp: 'Lãi lỗ hoạt động', mo_ta: null, layer: '6' },
        { dp: 'Doanh thu tài chính', mo_ta: null, layer: '7' },
        { dp: 'Chi phí tài chính', mo_ta: null, layer: '8' },
        { dp: 'Lãi lỗ khác', mo_ta: null, layer: '9' },
        { dp: 'Lợi nhuận trước thuế', mo_ta: null, layer: '10' },
        { dp: 'Thuế', mo_ta: null, layer: '11' },
        { dp: 'Lãi lỗ ròng', mo_ta: null, layer: '12' },
    ];
    let thuCounter = 1,
        chiCounter = 1,
        gvCounter = 1;
    kmfList.forEach((item) => {
        if (item.code !== null) {
            if (item.code === 'DT') {
                result.push({ ...item, layer: `1.${thuCounter++}` });
            }
            if (item.code.startsWith('GV')) {
                result.push({ ...item, layer: `2.${gvCounter++}` });
            }
            if (item.code.startsWith('CFBH')) {
                result.push({ ...item, layer: `4.${chiCounter++}` });
            }
            if (item.code.startsWith('CFQL')) {
                result.push({ ...item, layer: `5.${chiCounter++}` });
            }
            if (item.code.startsWith('DTTC')) {
                result.push({ ...item, layer: `7.${chiCounter++}` });
            }
            if (item.code.startsWith('CFTC')) {
                result.push({ ...item, layer: `8.${chiCounter++}` });
            }
            if (['CFK', 'DTK'].includes(item.code)) {
                result.push({ ...item, layer: `9.${chiCounter++}` });
            }
            if (item.code.startsWith('TAX')) {
                result.push({ ...item, layer: `11.${chiCounter++}` });
            }
        }
    });
    units.forEach((unit) => {
        let unitCode = unit[unitCodeKey];
        result.forEach((item) => {
            item[`${unitCode}_0`] = 0;
            for (let month = 1; month <= 12; month++) {
                item[`${unitCode}_${month}`] = 0;
            }
        });

        const totals = {};
        data.forEach((item) => {
            const key = `${item.kmf}_${+item.month}_${item.pl_type}`;

            // Điều kiện xử lý `unitCode` và dựa vào `teamField`, `teamListField` nếu có
            if (item[projectFilterKey] === unitCode && (!item[teamField] || item.CCPBDV === '')) {
                if (!totals[key]) totals[key] = 0;
                totals[key] += parseFloat(item.pl_value);
            } else if (teamField && teamListField && item[teamField] !== null) {
                let teamList = JSON.parse(item[teamField])[teamListField];
                teamList.forEach((team) => {
                    if (team.team === unitCode) {
                        if (!totals[key]) totals[key] = 0;
                        totals[key] += parseFloat(team.tien);
                    }
                });
            }
        });

        // Gán kết quả vào result
        result.forEach((item) => {
            for (const key in totals) {
                const [dp, month, pl_type] = key.split('_');
                if (item.kmf === dp && item.code === pl_type) {
                    item[`${unitCode}_${month}`] = totals[key];
                }
            }
        });

        // Tính toán tổng layer (ví dụ: 1, 2, 3)
        result.forEach((item) => {
            if (
                item.layer === '1' ||
                item.layer === '2' ||
                item.layer === '5' ||
                item.layer === '4' ||
                item.layer === '8' ||
                item.layer === '7' ||
                item.layer === '9' ||
                item.layer === '11'
            ) {
                for (let month = 1; month <= 12; month++) {
                    const layerPrefix = item.layer + '.';
                    const layerItems = result.filter((subItem) => subItem.layer && subItem.layer.startsWith(layerPrefix));
                    const total = layerItems.reduce((acc, subItem) => acc + (subItem[`${unitCode}_${month}`] || 0), 0);
                    item[`${unitCode}_${month}`] = total;
                }
            }
        });

        // Tính toán tổng hợp dựa trên các trường VC, FC
        let vc = sumAttributesByCode(result, 'VC', unitCode);
        let fc = sumAttributesByCode(result, 'FC', unitCode);

        // Các tính toán phức tạp khác dựa trên logic đã có

        let l6 = result.find((e) => e.layer == 6);
        let l1 = result.find((e) => e.layer == 1);
        let l2 = result.find((e) => e.layer == 2);
        let l3 = result.find((e) => e.layer == 3);
        let l4 = result.find((e) => e.layer == 4);
        let l5 = result.find((e) => e.layer == 5);
        let l7 = result.find((e) => e.layer == 7);
        let l8 = result.find((e) => e.layer == 8);
        let l9 = result.find((e) => e.layer == 9);
        let l10 = result.find((e) => e.layer == 10);
        let l11 = result.find((e) => e.layer == 11);
        let l12 = result.find((e) => e.layer == 12);

        for (let month = 1; month <= 12; month++) {
            l3[`${unitCode}_${month}`] = l1[`${unitCode}_${month}`] + l2[`${unitCode}_${month}`];
            l6[`${unitCode}_${month}`] = l3[`${unitCode}_${month}`] + l4[`${unitCode}_${month}`] + l5[`${unitCode}_${month}`];
            l10[`${unitCode}_${month}`] =
                l6[`${unitCode}_${month}`] +
                l7[`${unitCode}_${month}`] +
                l8[`${unitCode}_${month}`] +
                l9[`${unitCode}_${month}`];
            l12[`${unitCode}_${month}`] =
                l1[`${unitCode}_${month}`] +
                l2[`${unitCode}_${month}`] +
                l4[`${unitCode}_${month}`] +
                l5[`${unitCode}_${month}`] +
                l7[`${unitCode}_${month}`] +
                l8[`${unitCode}_${month}`] +
                l9[`${unitCode}_${month}`] +
                l11[`${unitCode}_${month}`];
        }

        // Tính tổng năm cho từng unit
        result.forEach((item) => {
            item[`${unitCode}_0`] = 0;
            for (let month = 1; month <= 12; month++) {
                item[`${unitCode}_0`] += item[`${unitCode}_${month}`];
            }
        });
    });

    // Tính tổng cho tất cả các units
    result.forEach((item) => {
        for (let i = 0; i <= 12; i++) {
            let total = units.reduce((sum, unit) => {
                const field = `${unit[unitCodeKey]}_${i}`;
                return sum + (item[field] || 0);
            }, 0);
            item[`ALL_${i}`] = total;
        }
    });

    return result;
}
