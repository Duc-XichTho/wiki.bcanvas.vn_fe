export function calculateData3(data, units, kmfList, unitCodeKey, projectFilterKey = 'unit_code', teamField = null, teamListField = null) {
    data = data.filter((e) => e.pl_type && e.pl_type !== '' && e.pl_value);
    let dataTT = data.filter(item => (!item[teamField] || item[teamField] === ''));
    let dataGT = data.filter(item => (teamField && teamListField && item[teamField]));
    const result = [
        {dp: 'Doanh thu', mo_ta: null, layer: '1'},
        {dp: 'CF trực tiếp', mo_ta: null, layer: '2'},
        {dp: 'Lãi lỗ trực tiếp', mo_ta: null, layer: '3'},
        {dp: 'CF phân bổ', mo_ta: null, layer: '4'},
        {dp: 'Lãi lỗ ròng', mo_ta: null, layer: '5'},];
    kmfList = kmfList.map((item) => {
        return { ...item, kmf: item.name, dp: `${item.dp}` };
    });
    let thuCounter = 1, chiCounter = 1;
    kmfList.forEach((item) => {
        if (item.code !== null) {
            if (item.code.startsWith('DT')) {
                result.push({...item, layer: `1.${thuCounter++}`});
            } else {
                result.push({...item, layer: `2.${chiCounter++}`});
                result.push({...item, layer: `4.${chiCounter++}`});
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
        const totalsTT = {};
        const totalsGT = {};
        data.forEach((item) => {
            const key = `${item.kmf}_${+item.month}`;
            if (item[projectFilterKey] === unitCode && (!item[teamField] || item[teamField] === '')) {
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
        dataTT.forEach((item) => {
            const key = `${item.kmf}_${+item.month}`;
            if (item[projectFilterKey] === unitCode) {
                if (!totalsTT[key]) totalsTT[key] = 0;
                totalsTT[key] += parseFloat(item.pl_value);
            }
        });
        dataGT.forEach((item) => {
            const key = `${item.kmf}_${+item.month}`;
            let teamList = JSON.parse(item[teamField])[teamListField];
            teamList.forEach((team) => {
                if (team.team === unitCode) {
                    if (!totalsGT[key]) totalsGT[key] = 0;
                    totalsGT[key] += parseFloat(team.tien);
                }
            });
        });
        result.forEach((item) => {
            if (item.layer.startsWith('1.')) {
                for (const key in totals) {
                    const [dp, month] = key.split('_');
                    if (item.kmf === dp) {
                        item[`${unitCode}_${month}`] = totals[key];
                    }
                }
            }
            if (item.layer.startsWith('2.')) {
                for (const key in totals) {
                    const [dp, month] = key.split('_');
                    if (item.kmf === dp) {
                        item[`${unitCode}_${month}`] = totalsTT[key];
                    }
                }
            }
            if (item.layer.startsWith('4.')) {
                for (const key in totals) {
                    const [dp, month] = key.split('_');
                    if (item.kmf === dp) {
                        item[`${unitCode}_${month}`] = totalsGT[key];
                    }
                }
            }
        });


        result.forEach((item) => {
            if (item.layer === '1' || item.layer === '2' || item.layer === '4') {
                for (let month = 1; month <= 12; month++) {
                    const layerPrefix = item.layer + '.';
                    const layerItems = result.filter((subItem) => subItem.layer && subItem.layer.startsWith(layerPrefix));
                    const total = layerItems.reduce((acc, subItem) => acc + (subItem[`${unitCode}_${month}`] || 0), 0);
                    item[`${unitCode}_${month}`] = total;
                }
            }
        });

        let l1 = result.find((e) => e.layer == 1);
        let l2 = result.find((e) => e.layer == 2);
        let l3 = result.find((e) => e.layer == 3);
        let l4 = result.find((e) => e.layer == 4);
        let l5 = result.find((e) => e.layer == 5);

        for (let month = 1; month <= 12; month++) {
            l3[`${unitCode}_${month}`] = l1[`${unitCode}_${month}`] + l2[`${unitCode}_${month}`];
            l5[`${unitCode}_${month}`] = l1[`${unitCode}_${month}`] + l2[`${unitCode}_${month}`] + l4[`${unitCode}_${month}`];
        }

        result.forEach((item) => {
            item[`${unitCode}_0`] = 0;
            for (let month = 1; month <= 12; month++) {
                item[`${unitCode}_0`] += item[`${unitCode}_${month}`];
            }
        });
    });
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
