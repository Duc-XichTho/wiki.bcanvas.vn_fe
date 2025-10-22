export const uniqueCellEditor = ({ list, key }) => {
   const filteredValues = list.map((item) => item[key]).filter((value) => value != null);
   const uniqueValues = [...new Set(filteredValues)];
   const sortedValues = uniqueValues.sort((a, b) => a.localeCompare(b));

   return {
      cellEditor: 'agRichSelectCellEditor',
      cellEditorParams: {
         allowTyping: true,
         filterList: true,
         highlightMatch: true,
         values: sortedValues,
      },
   };
};
