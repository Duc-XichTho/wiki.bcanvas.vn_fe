export function getArrFromFieldOfList(list, field) {
    let arr = [];
    list.forEach((item) => {
        if (arr.indexOf(item[field]) === -1 && item[field] && item[field] !== '') {
            arr.push(item[field]);
        }
    })
    return arr
}
export function getArrFieldAndTK(list, field) {
    list = list.filter((item) => item[field] && item[field] !== '');
    let arr = [];
    list.forEach((item) => {
        if (!arr.find(e => (e.field == item[field] && e.tk == item.tk_no))) {
            arr.push({field: item[field], ma_tk: item.tk_no});
        }
    })
    return arr
}

export function getArrField(list, field) {
    list = list.filter((item) => item[field] && item[field] !== '');
    let arr = [];
    list.forEach((item) => {
        if (!arr.find(e => (e== item[field]))) {
            arr.push(item[field]);
        }
    })
    return arr
}
