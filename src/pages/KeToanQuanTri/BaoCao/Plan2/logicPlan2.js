import {calculateValueByKmf} from "../logic/logicActual.js";

export default function loadDataPlan(listUnit, listKMF, plans, selectedUnit, uniqueGroupKH, currentMonth) {
    let rowData = [];
    let isNotExistData = true;
    if (plans) {
        if (selectedUnit === 'Total') {
            const aggregatedData = {};
            plans.forEach(plan => {
                if (uniqueGroupKH) {
                    if (!uniqueGroupKH.includes(plan.bu)) {
                        return;
                    }
                }
                plan.data.forEach(row => {
                    const key = `${row.header}-${row.layer}`;

                    if (!aggregatedData[key]) {
                        aggregatedData[key] = {...row};
                    } else {
                        Object.keys(row).forEach(column => {
                            if (column.startsWith('t')) {
                                const currentValue = parseFloat(row[column]) || 0;
                                aggregatedData[key][column] =
                                    (parseFloat(aggregatedData[key][column]) || 0) + currentValue;
                            }
                        });
                    }
                });
            });

            rowData = Object.values(aggregatedData);
            isNotExistData = false;
        } else {
            for (let i = 0; i < plans.length; i++) {
                let plan = plans[i];
                if (plan.bu === selectedUnit) {
                    rowData = plan.data;
                    isNotExistData = false;
                    break;
                }
            }
        }
    }

    if (isNotExistData) {
        const uniqueGroupsKMF = [...new Set(listKMF.map((unit) => unit.group ? unit.group : 'Nhóm KMF Khác'))];
        uniqueGroupsKMF.sort();
        for (let i = 0; i < uniqueGroupsKMF.length; i++) {
            rowData.push({header: uniqueGroupsKMF[i], layer: `${i + 1}`});
        }
    }
    return rowData;
}


export function mergeDataByHeader(arr) {
    const mergedData = {};
    arr.forEach(item => {
        if (!item.layer.includes('.')) {
            const headerKey = item.header.trim();
            if (!mergedData[headerKey]) {
                mergedData[headerKey] = {...item};
            } else {
                for (let i = 0; i <= 12; i++) {
                    item[`t${i}`] = parseFloat(item[`t${i}`]) || 0
                    mergedData[headerKey][`t${i}`] = parseFloat(mergedData[headerKey][`t${i}`]) + parseFloat(item[`t${i}`]) || 0;
                }
            }
        }
    });
    return Object.values(mergedData);
}

export function calSupAndT0(rowData, currentMonthCanvas) {
    let currentMonth = 12;
    if (currentMonthCanvas) {
        currentMonth = currentMonthCanvas;
    }
    if (!rowData) return [];
    rowData.forEach((item) => {
        item['t0'] = 0;
        item['t0_th'] = 0;
        item['t0_ck'] = 0;
        for (let month = 1; month <= currentMonth; month++) {
            item['t0'] += (parseFloat(item[`t${month}`]) || 0);
            item['t0_th'] += (parseFloat(item[`t${month}_th`]) || 0);
            item['t0_ck'] += (parseFloat(item[`t${month}_ck`]) || 0);
        }
    });
    let l101 = rowData.find(e => e.layer === '101');
    if (!l101) {
        rowData.push(
            {header: 'Lãi lỗ ròng', layer: '101'},
        )
        l101 = rowData.find(e => e.layer === '101');
    }
    for (let month = 0; month <= currentMonth; month++) {
        l101[`t${month}`] = 0;
        l101[`t${month}_th`] = 0;
        l101[`t${month}_ck`] = 0;
    }
    rowData.forEach((item) => {
        if (item.layer !== '101')
            for (let month = 0; month <= currentMonth; month++) {
                l101[`t${month}`] += parseFloat(item[`t${month}`]) || 0;
                l101[`t${month}_th`] += parseFloat(item[`t${month}_th`]) || 0;
                l101[`t${month}_ck`] += parseFloat(item[`t${month}_ck`]) || 0;
            }
    })
    return rowData;
}

export function getDataUnit(listUnit, listKMF, plans, selectedUnit, listSoKeToan) {
    let rowData = loadDataPlan(listUnit, listKMF, plans, selectedUnit)
    rowData.forEach(e => {
        for (let i = 0; i <= 12; i++) {
            e[`t${i}_th`] = 0;
            e[`t${i}_cl`] = 0;
            e[`t${i}_v`] = 0;
        }
    })
    for (let i = 0; i < rowData.length; i++) {
        let groupKmf = rowData[i].header;
        for (let j = 1; j <= 12; j++) {
            let key = `t${j}_th`
            rowData[i][key] = calculateValueByKmf(groupKmf, listKMF, listSoKeToan, j, selectedUnit, 2024)
        }

    }
    rowData = calSupAndT0(rowData);
    rowData = rowData.filter(e => e.layer !== '100')
    rowData.map((e) => {
        for (let i = 0; i <= 12; i++) {
            e[`t${i}_cl`] = parseFloat(e[`t${i}_th`]) - parseFloat(e[`t${i}`]);
            e[`t${i}_v`] = parseFloat(e[`t${i}_th`]) - parseFloat(e[`t${i}`]);
        }

    });
    return rowData

}
