export function calculateValue(groupKmf, listKmf, groupProduct, list, listSoKeToan, month, fieldCheck, field, selectedUnit, year) {
    listKmf = listKmf.filter(e => e.group == groupKmf);
    list = list.filter(e => e.group == groupProduct);
    let value = 0;
    listSoKeToan.forEach(e => {
        if (listKmf.some(item => item.name === e.kmf) && list.some(item => item[field] === e[fieldCheck]) && e.month == month && e.unit_code2 == selectedUnit && e.year == year) {
            value += parseFloat(e.pl_value) || 0;
        }
    })
    return value;
}

export function calculateValueProduct(groupKmf, listKmf, groupProduct, listProduct, data, month, selectedUnit, year) {
    listKmf = listKmf.filter(e => e.group == groupKmf);
    listProduct = listProduct.filter(e => e.group == groupProduct);
    let value = 0;
    data.filter(e => e.month == month && e.year == year && e.unit_code2 == selectedUnit).forEach(e => {
        if (listKmf.some(item => item.name === e.kmf)) {
            if (listProduct.some(item => item['code'] === e['product2'])
                && (!e.CCBSP || e.CCBSP === '')) {
                value += parseFloat(e.pl_value) || 0;
            } else {
                if (e.CCBSP) {
                    let pbdv = JSON.parse(e.PBSP).teams;
                    pbdv.some(pb => {
                        if (listProduct.some(product => pb.team === product.code)) {
                            value += pb.tien;
                        }
                    })
                }
            }
        }
    })
    return value;
}

export function calculateValueByKmf(groupKmf, listKmf, listSoKeToan, month, selectedUnit, year) {
    listKmf = listKmf.filter(e => e.group == groupKmf);
    let value = 0;
    listSoKeToan.forEach(e => {
        if (listKmf.some(item => item.name === e.kmf) && e.month == month && e.unit_code2 == selectedUnit && e.year == year) {
            value += parseFloat(e.pl_value) || 0;
        }
    })
    return value;
}


export function calculateValueByKmfAndGroupKH(listUnit, groupKmf, listKmf, data, month, selectedUnit, year) {
    listKmf = listKmf.filter(e => e.group == groupKmf);
    listUnit = listUnit.filter(e => e.groupKH == selectedUnit);
    let value = 0;
    data.filter(e => e.month == month && e.year == year).forEach(e => {
        if (listKmf.some(item => item.name === e.kmf)) {
            if (listUnit.some(item => item['code'] === e['unit_code2'])
                && (!e.CCPBDV || e.CCPBDV === '')) {
                value += parseFloat(e.pl_value) || 0;
            } else {
                if (e.CCPBDV) {
                    let pbdv = JSON.parse(e.PBDV).teams;
                    pbdv.some(pb => {
                        if (listUnit.some(product => pb.team === product.code)) {
                            value += pb.tien;
                        }
                    })
                }
            }
        }
    })
    return value;
}

export function calculateValueTotal(groupKmf, listKmf, listSoKeToan, month, year) {
    listKmf = listKmf.filter(e => e.group == groupKmf);
    let value = 0;
    listSoKeToan.forEach(e => {
        if (listKmf.some(item => item.name === e.kmf) && e.month == month && e.year == year) {
            value += parseFloat(e.pl_value) || 0;
        }
    })
    return value;
}

export function calculateValueTotalYear(groupKmf, listKmf, listSoKeToan, month, year) {
    listSoKeToan = listSoKeToan.filter(e => e.month == month && e.year == year);
    listKmf = listKmf.filter(e => e.group == groupKmf);
    let value = 0;
    listSoKeToan.forEach(e => {
        if (listKmf.some(item => item.name === e.kmf)) {
            value += parseFloat(e.pl_value) || 0;
        }
    })
    return value;
}

export function removeAllZeroProperties(data) {
    const keysToRemove = Object.keys(data[0]).filter(key =>
        data.every(obj => obj[key] === 0)
    );

    return data.map(item => {
        const newItem = {...item};
        keysToRemove.forEach(key => delete newItem[key]);
        return newItem;
    });
}

export function findAllZeroProperties(data) {
    const keysWithAllZeros = Object.keys(data[0]).filter(key =>
        data.every(obj => obj[key] === 0)
    );
    return keysWithAllZeros;
}
