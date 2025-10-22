
export const filterText = (gridRef, text) => {
    gridRef?.current?.api?.setGridOption('quickFilterText', text)
}