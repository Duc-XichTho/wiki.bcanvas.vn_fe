export function calB01(rowDataList, vasList) {

    let KNNoList = filterByField(vasList, 'kc_no');
    let KNCoList    = filterByField(vasList, 'kc_co');
    let KNNetList = filterByField(vasList, 'kc_net');
    let KNNet2List = filterByField(vasList, 'kc_net2');
    rowDataList.map(e => {
        e.value = calculateByMonthAndField(KNNoList, 'no_cuoi_ky', e.code, 'kc_no')
            + calculateByMonthAndField(KNCoList, 'co_cuoi_ky', e.code, 'kc_co')
            + calculateByMonthAndField(KNNetList, 'net_cuoi_ky', e.code, 'kc_net')
            - calculateByMonthAndField(KNNet2List, 'net_cuoi_ky', e.code, 'kc_net2')
        e.value2 = calculateByMonthAndField(KNNoList, 'no_dau_ky', e.code, 'kc_no')
            + calculateByMonthAndField(KNCoList, 'co_dau_ky', e.code, 'kc_co')
            + calculateByMonthAndField(KNNetList, 'net_dau_ky', e.code, 'kc_net')
            - calculateByMonthAndField(KNNet2List, 'net_dau_ky', e.code, 'kc_net2')
    })

    return rowDataList;

}


function calculateByMonthAndField(list, field, code, kc) {
    let sum = 0;
    list.map(e => {
        if (e[`${field}`] && code === e[kc])
            sum += parseFloat(e[`${field}`]);
    })
    return sum;
}

function filterByField(list, field) {
    return list.filter((e) => e[field]);
}

