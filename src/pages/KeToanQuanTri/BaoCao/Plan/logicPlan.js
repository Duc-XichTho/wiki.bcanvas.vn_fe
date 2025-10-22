import {calculateValue, calculateValueByKmf, calculateValueProduct} from "../logic/logicActual.js";

export default function loadDataPlan(listUnit, listVendor, listKMF, listProduct, plans, selectedUnit) {
    let rowData = [];
    let isNotExistData = true
    if (plans) {
        for (let i = 0; i < plans.length; i++) {
            let plan = plans[i];
            if (plan.bu === selectedUnit) {
                rowData = plan.data;
                isNotExistData = false;
            }
        }
    }
    if (isNotExistData) {
        const uniqueGroupsProduct = [...new Set(listProduct.map((unit) => unit.group? unit.group : 'Nhóm SP Khác'))];
        const uniqueGroupsVendor = [...new Set(listVendor.map((unit)  => unit.group? unit.group : 'Nhóm KH Khác'))];
        const uniqueGroupsKMF = [...new Set(listKMF.map((unit) => unit.group? unit.group : 'Nhóm KMF Khác'))];
        uniqueGroupsKMF.sort()
        for (let i = 0; i < uniqueGroupsKMF.length; i++) {
            rowData.push({header: uniqueGroupsKMF[i], layer: `${i + 1}`})
            if (uniqueGroupsKMF[i].includes('*')) {
                let countGroupProduct = 1;
                uniqueGroupsProduct.forEach(e => {
                    rowData.push({header: e, layer: `${i + 1}.1${countGroupProduct}`})
                    countGroupProduct++;
                })
                let countGroupVendor = 1;
                uniqueGroupsVendor.forEach(e => {
                    rowData.push({header: e, layer: `${i + 1}.2${countGroupVendor}`})
                    countGroupVendor++;
                })
            }

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
                    mergedData[headerKey][`t${i}`] += parseFloat(item[`t${i}`]);
                }
            }
        }
    });
    return Object.values(mergedData);
}

export function calSupAndT0(rowData) {
    if (!rowData) return [];
    rowData.forEach((item) => {
        item['t0'] = 0;
        for (let month = 1; month <= 12; month++) {
            item['t0'] += (parseFloat(item[`t${month}`]) || 0);
        }
    });
    let l100 = rowData.find(e => e.layer === '100');
    let l101 = rowData.find(e => e.layer === '101');
    if (!l100 || !l101) {
        rowData.push(
            {header: 'Lãi lỗ hoạt động', layer: '100'},
            {header: 'Lãi lỗ ròng', layer: '101'},
        )
        l100 = rowData.find(e => e.layer === '100');
        l101 = rowData.find(e => e.layer === '101');
    }
    for (let month = 0; month <= 12; month++) {
        l101[`t${month}`] = 0;
        l100[`t${month}`] = 0;
    }
    rowData.forEach((item) => {
        for (let month = 0; month <= 12; month++) {
            if (!item.layer.includes('.') && item.layer !== '100' && item.layer !== '101') {
                l101[`t${month}`] += parseFloat(item[`t${month}`]) || 0;
            }
            if (item.header.includes('#') && item.layer !== '100' && item.layer !== '101') {
                l100[`t${month}`] += parseFloat(item[`t${month}`]) || 0;
            }
        }
    })
    return rowData;
}
export function getDataUnit(listUnit, listVendor, listKMF, listProduct, listSoKeToan, plans, selectedUnit, isView) {
    let rowData = [];
    if (isView === 'View1') {
        plans = plans.find(e => e.type === 'View1');
    } else {
        plans = plans.find(e => e.type === 'View2');
    }
    plans = plans.rowData;
    rowData = loadDataPlan(listUnit, listVendor, listKMF, listProduct, plans, selectedUnit);
    rowData = filterViewRowData(rowData, isView);
    rowData = calSupAndT0(rowData)

    //Sup & T0
    rowData.forEach((item) => {
        if (!item.layer.includes('.') && item.header.includes('*')) {
            for (let month = 0; month <= 12; month++) {
                item[`t${month}`] = 0;
            }
        }
        item['t0'] = 0;
        for (let month = 1; month <= 12; month++) {
            if (item.layer.includes('.')) {
                item['t0'] += parseFloat(item[`t${month}`] || 0);
            }
        }
        for (let month = 1; month <= 12; month++) {
            const layerPrefix = item.layer + '.';
            const layerItems = rowData.filter((subItem) => subItem.layer && subItem.layer.startsWith(layerPrefix));
            const total = layerItems.reduce((acc, subItem) => acc + (subItem[`t${month}`] || 0), 0);
            if (!item.layer.includes('.') && item.header.includes('*')) item[`t${month}`] = total;
        }
        for (let month = 0; month <= 12; month++) {
            if (!item.layer.includes('.')) {
                item['t0'] += parseFloat(item[`t${month}`] || 0);
            }
        }
    });
    rowData = filterViewRowData(rowData, isView);
    return rowData
}

function filterViewRowData(data, view) {
    return data.filter(item => {
        const parts = item.layer.split('.');
        return parts.length === 1 || (parts.length > 1 && parts[1].charAt(0) === (view == "View1" ? '1' : "2"));
    });
}
