import {setItemInIndexedDB2} from "../storage/storageService.js";

export function saveColumnStateToLocalStorage(gridApi, key = "") {
    if (gridApi) {
        const columnState = gridApi.getColumnState();
        const simplifiedColumnState = columnState.map(({pinned, width, hide, colId}) => ({
            colId,
            pinned,
            width,
            hide,
        }));
        setItemInIndexedDB2(key, simplifiedColumnState);
    }
}
export function loadColumnState(updatedColDefs, savedColumnState, checkPrefix = false) {
    const orderedColDefs = [];
    const matchedColIds = [];

    updatedColDefs = updatedColDefs.map((col) => {
        const savedCol = savedColumnState.find((state) => {
            if (checkPrefix) {
                // Kiểm tra theo tiền tố
                const colPrefix = col.field.split('_')[0];
                const statePrefix = state.colId.split('_')[0];
                return colPrefix === statePrefix;
            } else {
                // Kiểm tra chính xác colId
                return state.colId === col.field;
            }
        });

        if (savedCol) {
            return {
                ...col,
                pinned: savedCol.pinned,
                width: savedCol.width,
                // hide: savedCol.hide, // Mở dòng này nếu cần xử lý `hide`
            };
        } else {
            matchedColIds.push(col); // Nếu không tìm thấy trạng thái đã lưu, giữ nguyên cột
            return col;
        }
    });

    for (const savedCol of savedColumnState) {
        const matchedCol = updatedColDefs.find((col) => {
            if (checkPrefix) {
                const colPrefix = col.field.split('_')[0];
                const statePrefix = savedCol.colId.split('_')[0];
                return colPrefix === statePrefix;
            } else {
                return savedCol.colId === col.field;
            }
        });

        if (matchedCol) {
            orderedColDefs.push(matchedCol);
        }
    }
    return [...orderedColDefs, ...matchedColIds];
}

