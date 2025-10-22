import {getArrField, getArrFromFieldOfList} from "../../../../../generalFunction/getArrFromFieldOfList.js";

export function createSDT2(list, list2, TD, TD2, listDauKy) {
    list = list.map((item, index) => ({
        ...item,
        layer: (index + 1)+''
    }));
    list.forEach(parent => {
        let parentLayer = parent.layer;
        let countChild = 1;
        let listChild = getArrFromFieldOfList(listDauKy.filter(item => item[TD] === parent.doiTuong), TD2);
        list2.forEach(child => {
            if (listChild.includes(child.doiTuong)) {
                let childLayer = parentLayer + '.' + countChild++
                list.push({...child, layer: childLayer})
            }
        })
    });
    return list
}

export function getTkConArr(cdps, selectedTK) {
    try {
        let tkChas = cdps.filter((tk) => tk.tk_cha == selectedTK);
        let tkArr = [selectedTK, ...getArrField(tkChas, 'code')];
        return tkArr
    }catch (e) {
        return []
    }
}