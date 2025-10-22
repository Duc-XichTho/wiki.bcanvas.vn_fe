import React from 'react';
import { Button, message } from 'antd';
import { getTemplateByFileNoteId, getTemplateColumn, getTemplateRow, deleteTemplateRowByTableId, deleteTemplateColByTableId, createTemplateColumn, createBathTemplateRow,getTableByid } from '../../../../../apis/templateSettingService.jsx';
import { getAllTemplateSheetTable, updateTemplateTable } from '../../../../../apis/templateSettingService.jsx';
import { log } from 'mathjs';
import { loadAndMergeData } from './SettingCombine/logicCombine.js';
import { evaluate } from 'mathjs';


const UpdateAllRotateTablesButton = ({ tabRotates, templateData, setTemplateData, setLoadData, loading, setLoading, css, allFileNotes }) => {

  const evaluateFormula = (formula, variables, row) => {
    let processedFormula = formula;
    Object.entries(variables).forEach(([variable, column]) => {
      if (column && row[column] !== undefined) {
        const value = Number(row[column]) || 0;
        const regex = new RegExp(`(?<![a-zA-Z])${variable}(?![a-zA-Z])`, 'g');
        processedFormula = processedFormula.replace(regex, value.toString());
      }
    });
    try {
      const safeEval = new Function('return ' + processedFormula);
      const result = safeEval();
      return isNaN(result) ? 0 : result;
    } catch (error) {
      console.error('Lỗi tính toán:', error, 'Công thức sau khi xử lý:', processedFormula);
      return 0;
    }
  };

  const transformDataWithPivot = (originalData, options) => {
    const { rowFields, columnFields, valueFields, aggregation, calculatedColumns, customValueFieldName, splitRowFieldsToColumns, showRowTotal, showColumnTotal } = options;
    if (!originalData?.length) {
      return { rows: [], columns: [], data: [] };
    }

    // Multi-valueFields
    if (valueFields && valueFields.length > 1) {
      // Tạo row headers
      const rowHeaders = new Set();
      originalData.forEach(item => {
        const rowKey = rowFields.length > 0 ? rowFields.map(field => item[field]).join(' | ') : 'Dữ liệu';
        rowHeaders.add(rowKey);
      });
      const sortedRowHeaders = Array.from(rowHeaders).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
      // Tạo data
      const pivotedData = sortedRowHeaders.map(rowKey => {
        const rowData = {};
        // Gán giá trị các trường hàng
        if (rowFields.length > 0) {
          const values = rowKey.split(' | ');
          rowFields.forEach((field, idx) => {
            rowData[field] = values[idx] !== undefined ? values[idx] : '';
          });
        } else {
          rowData['Dữ liệu'] = rowKey;
        }
        // Gán giá trị cho từng trường giá trị
        valueFields.forEach(field => {
          // Lấy tất cả item thuộc row này
          const items = originalData.filter(item => {
            const key = rowFields.length > 0 ? rowFields.map(f => item[f]).join(' | ') : 'Dữ liệu';
            return key === rowKey;
          });
          // Tính toán theo aggregation
          let value = 0;
          if (items.length === 0) {
            value = '';
          } else {
            switch (aggregation) {
              case 'sum':
                value = items.reduce((sum, i) => sum + (Number(i[field]) || 0), 0);
                break;
              case 'count':
                value = items.filter(i => i[field] !== null && i[field] !== undefined && i[field] !== '').length;
                break;
              case 'average':
                const validItems = items.filter(i => i[field] !== null && i[field] !== undefined && i[field] !== '');
                value = validItems.length > 0 ? validItems.reduce((sum, i) => sum + (Number(i[field]) || 0), 0) / validItems.length : 0;
                break;
              case 'min':
                const validItemsForMin = items.filter(i => i[field] !== null && i[field] !== undefined && i[field] !== '');
                value = validItemsForMin.length > 0 ? Math.min(...validItemsForMin.map(i => Number(i[field]) || 0)) : 0;
                break;
              case 'max':
                const validItemsForMax = items.filter(i => i[field] !== null && i[field] !== undefined && i[field] !== '');
                value = validItemsForMax.length > 0 ? Math.max(...validItemsForMax.map(i => Number(i[field]) || 0)) : 0;
                break;
              case 'unique_count':
                value = new Set(items.filter(i => i[field] !== null && i[field] !== undefined && i[field] !== '').map(i => i[field])).size;
                break;
              default:
                value = items.reduce((sum, i) => sum + (Number(i[field]) || 0), 0);
            }
          }
          rowData[field] = value;
        });
        return rowData;
      });
      // Tạo columns
      let columns = [];
      if (rowFields.length > 0) {
        columns = rowFields.map(field => ({
          field,
          headerName: field,
          sortable: true,
          filter: true,
          minWidth: 120,
          resizable: true,
          valueFormatter: params => params.value ?? '',
        }));
      } else {
        columns = [{
          field: 'Dữ liệu',
          headerName: 'Dữ liệu',
          sortable: true,
          filter: true,
          minWidth: 120,
          resizable: true,
          valueFormatter: params => params.value ?? '',
        }];
      }
      columns = [
        ...columns,
        ...valueFields.map(field => {
          const colType = getColumnType(field, originalData);
          return {
            field,
            headerName: field,
            sortable: true,
            filter: true,
            minWidth: 120,
            resizable: true,
            valueFormatter: params => {
              if (params.value === null || params.value === undefined || params.value === '') {
                return '';
              }
              if (colType === 'number') {
                return params.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              }
              return params.value;
            },
          };
        })
      ];
      if (splitRowFieldsToColumns && rowFields.length > 1) {
        columns = [
          ...rowFields.map(field => ({
            field,
            headerName: field,
            sortable: true,
            filter: true,
            minWidth: 120,
            resizable: true,
            valueFormatter: params => params.value ?? '',
          })),
          ...columns.filter(col => !rowFields.includes(col.field))
        ];
        pivotedData.forEach(row => {
          if (row[rowFields.join(' | ')]) {
            const values = row[rowFields.join(' | ')].split(' | ');
            rowFields.forEach((field, idx) => {
              row[field] = values[idx] !== undefined ? values[idx] : '';
            });
            delete row[rowFields.join(' | ')];
          }
        });
      }
      // Tính toán các cột calculatedColumns cho multi-value fields
      if (calculatedColumns?.length) {
        pivotedData.forEach(row => {
          calculatedColumns.forEach(calcCol => {
            try {
              const result = evaluateFormula(calcCol.formula, calcCol.variables, row);
              row[calcCol.name] = result.toFixed(2);
            } catch (error) {
              console.error('Lỗi tính toán công thức (multi-value):', error);
              row[calcCol.name] = 0;
            }
          });
        });

        columns.push(...calculatedColumns.map(calcCol => ({
          field: calcCol.name,
          headerName: calcCol.name,
          sortable: true,
          filter: true,
          minWidth: 120,
          resizable: true,
          valueFormatter: params => {
            if (params.value === null || params.value === undefined || params.value === '') {
              return '';
            }
            if (calcCol.isPercent) {
              let val = Number(params.value);
              if (!isNaN(val)) {
                val = val * 100;
                return `${val.toFixed(2)}%`;
              }
              return params.value;
            }
            return params.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          },
        })));
      }
      if (options.customTextColumns && Array.isArray(options.customTextColumns)) {
        console.log(options.customTextColumns);
        console.log(pivotedData);
        const dataArr = Array.isArray(pivotedData.data) ? pivotedData.data : Array.isArray(pivotedData) ? pivotedData : [];
        for (const customCol of options.customTextColumns) {
          if (customCol && customCol.columnName && customCol.data) {
            // Xác định cột tham chiếu ưu tiên từ customCol.referenceColumn (nếu có), nếu không thì từ rowFields
            const referenceColumn = customCol.referenceColumn ||
                                  ((options.rowFields && options.rowFields.length > 0) ? options.rowFields[0] : 'Dữ liệu');

            dataArr.forEach(row => {
              let rowKey;
              if (options.splitRowFieldsToColumns && options.rowFields && options.rowFields.length > 1) {
                // Nếu đã tách trường hàng và referenceColumn nằm trong rowFields, lấy trực tiếp
                if (options.rowFields.includes(referenceColumn)) {
                  rowKey = row[referenceColumn];
                } else {
                  // Đã tách trường hàng thành nhiều cột, nhưng referenceColumn không nằm trong rowFields
                  // Dùng row key là row[referenceColumn] nếu có, nếu không thì join các rowFields
                  rowKey = row[referenceColumn] || options.rowFields.map(f => row[f]).join(' | ');
                }
              } else if (options.rowFields && options.rowFields.length === 1) {
                // Trường hợp rowFields chỉ có 1 trường
                rowKey = row[options.rowFields[0]];
              } else {
                // Không có trường hàng hoặc cột đối chiếu không thuộc rowFields
                rowKey = row[referenceColumn];
              }

              // Chỉ gán giá trị nếu rowKey tồn tại trong data (trùng khớp với một key đã lưu)
              if (rowKey !== undefined && customCol.data.hasOwnProperty(rowKey)) {
                row[customCol.columnName] = customCol.data[rowKey];
              } else {
                // Nếu không trùng, để giá trị là rỗng
                row[customCol.columnName] = '';
              }
            });
          }
        }
      }
      return {
        rows: valueFields,
        columns,
        data: pivotedData,
      };
    }

    // Single valueField (pivot truyền thống)
    if (valueFields && valueFields.length === 1) {
      const valueField = valueFields[0];
      const result = {};
      const columnHeaders = new Set();
      const rowHeaders = new Set();
      const rowFieldName = rowFields.length > 0 ? rowFields.join(' | ') : 'Dữ liệu';
      const valueFieldDisplay = (rowFields.length === 0 && columnFields.length > 0 && valueFields.length > 0 && customValueFieldName) ? customValueFieldName : (valueFields.length > 0 ? valueFields.join(' | ') : 'Giá trị');
      originalData.forEach(item => {
        const rowKey = rowFields.length > 0 ? rowFields.map(field => item[field]).join(' | ') : valueFieldDisplay;
        const colKey = columnFields.length > 0
          ? columnFields.map(field => item[field]).join(' | ')
          : valueFieldDisplay;
        rowHeaders.add(rowKey);
        columnHeaders.add(colKey);
        if (!result[rowKey]) result[rowKey] = {};
        if (!result[rowKey][colKey]) result[rowKey][colKey] = {
          count: 0,
          sum: 0,
          values: [],
          rawValues: [],
          uniqueValues: new Set()
        };
        result[rowKey][colKey].count += 1;
        const rawValue = item[valueField];
        const numValue = Number(rawValue) || 0;
        result[rowKey][colKey].sum += numValue;
        result[rowKey][colKey].rawValues.push(rawValue);
        result[rowKey][colKey].values.push(numValue);
        result[rowKey][colKey].uniqueValues.add(rawValue);
      });
      const sortedRowHeaders = Array.from(rowHeaders).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
      const sortedColumnHeaders = Array.from(columnHeaders).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
      const pivotedData = [];
      sortedRowHeaders.forEach(row => {
        const rowData = { [rowFieldName]: row };
        sortedColumnHeaders.forEach(col => {
          const cellData = result[row]?.[col];
          if (cellData) {
            switch (aggregation) {
              case 'sum':
                rowData[col] = cellData.sum;
                break;
              case 'count':
                rowData[col] = cellData.rawValues.filter(v => v !== null && v !== undefined && v !== '').length;
                break;
              case 'average':
                const validValues = cellData.rawValues.filter(v => v !== null && v !== undefined && v !== '');
                rowData[col] = validValues.length > 0 ? cellData.sum / validValues.length : 0;
                break;
              case 'min':
                rowData[col] = Math.min(...cellData.values);
                break;
              case 'max':
                rowData[col] = Math.max(...cellData.values);
                break;
              case 'unique_count':
                rowData[col] = new Set(cellData.rawValues.filter(v => v !== null && v !== undefined && v !== '')).size;
                break;
              default:
                rowData[col] = cellData.sum;
            }
          } else {
            rowData[col] = 0;
          }
        });
        pivotedData.push(rowData);
      });
      let columns = [
        {
          field: rowFieldName,
          headerName: rowFieldName,
          sortable: true,
          filter: true,
          autoSize: true,
          minWidth: 150,
          resizable: true,
          cellStyle: params => {
            if (params.value === 'TỔNG CỘT') {
              return { backgroundColor: '#989898', fontWeight: 'bold' };
            }
            return null;
          },
        },
        ...Array.from(sortedColumnHeaders).map(col => ({
          field: col,
          headerName: col,
          sortable: true,
          filter: true,
          autoSize: true,
          minWidth: 120,
          resizable: true,
          valueFormatter: params => {
            if (params.value === null || params.value === undefined || params.value === '') {
              return '';
            }
            return params.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          },
          cellStyle: params => {
            const rowData = params.node.data;
            if (rowData[rowFieldName] === 'TỔNG CỘT') {
              return { backgroundColor: '#d5ffdc', fontWeight: 'bold' };
            }
            return null;
          },
        }))
      ];
      if (splitRowFieldsToColumns && rowFields.length > 1) {
        columns = [
          ...rowFields.map(field => ({
            field,
            headerName: field,
            sortable: true,
            filter: true,
            minWidth: 120,
            resizable: true,
            valueFormatter: params => params.value ?? '',
          })),
          ...columns.filter(col => col.field !== rowFieldName)
        ];
        pivotedData.forEach(row => {
          if (row[rowFieldName]) {
            const values = row[rowFieldName].split(' | ');
            rowFields.forEach((field, idx) => {
              row[field] = values[idx] !== undefined ? values[idx] : '';
            });
            delete row[rowFieldName];
          }
        });
      }
      // Tính toán các cột calculatedColumns
      if (calculatedColumns?.length) {
        pivotedData.forEach(row => {
          calculatedColumns.forEach(calcCol => {
            try {
              const result = evaluateFormula(calcCol.formula, calcCol.variables, row);
              row[calcCol.name] = result.toFixed(2);
            } catch (error) {
              console.error('Lỗi tính toán công thức:', error);
              row[calcCol.name] = 0;
            }
          });
        });
        columns.push(...calculatedColumns.map(calcCol => ({
          field: calcCol.name,
          headerName: calcCol.name,
          sortable: true,
          filter: true,
          minWidth: 120,
          valueFormatter: params => {
            if (params.value === null || params.value === undefined || params.value === '') {
              return '';
            }
            if (calcCol.isPercent) {
              let val = Number(params.value);
              if (!isNaN(val)) {
                val = val * 100;
                return `${val.toFixed(2)}%`;
              }
              return params.value;
            }
            return params.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          },
        })));
      }
      // Thêm tổng hàng nếu được yêu cầu
      if (showRowTotal) {
        const allColumns = Array.from(sortedColumnHeaders);
        pivotedData.forEach(row => {
          const rowTotal = allColumns.reduce((sum, col) => {
            const value = Number(row[col]) || 0;
            return sum + value;
          }, 0);
          row['TỔNG HÀNG'] = rowTotal;
        });
        if (!columns.some(col => col.headerName === 'TỔNG HÀNG')) {
          columns.push({
            field: 'TỔNG HÀNG',
            headerName: 'TỔNG HÀNG',
            sortable: true,
            filter: true,
            minWidth: 120,
            valueFormatter: params => {
              if (params.value === null || params.value === undefined || params.value === '') {
                return '';
              }
              return params.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            },
            cellStyle: params => {
              const rowData = params.node.data;
              if (rowData[rowFieldName] === 'TỔNG CỘT') {
                return { backgroundColor: '#fff9e6', fontWeight: 'bold' };
              }
              return { backgroundColor: '#ff99e6', fontWeight: 'bold' };
            },
          });
        }
      }
      // Thêm tổng cột nếu được yêu cầu
      if (showColumnTotal) {
        const totalRow = { [rowFieldName]: 'TỔNG CỘT' };
        columns.forEach(col => {
          if (col.field !== rowFieldName) {
            totalRow[col.field] = pivotedData.reduce((sum, row) =>
              sum + (Number(row[col.field]) || 0), 0,
            );
          }
        });
        pivotedData.push(totalRow);
      }
      if (options.splitRowFieldsToColumns && options.rowFields && options.rowFields.length > 1) {
        // Thêm các cột cho từng trường hàng
        columns = [
          ...columns.filter(col => !options.rowFields.includes(col.field) && col.field !== (options.rowFields.join(' | ') || 'Dữ liệu')),
          ...options.rowFields.map(field => ({
            ...columns.find(col => col.field === field),
            field,
            headerName: field,
            columnType: 'text',
          }))
        ];
        // Với mỗi dòng, tách giá trị group thành các trường hàng và loại bỏ cột group
        pivotedData.forEach(row => {
          const groupField = options.rowFields.join(' | ');
          if (row[groupField]) {
            const values = row[groupField].split(' | ');
            options.rowFields.forEach((field, idx) => {
              row[field] = values[idx] !== undefined ? values[idx] : '';
            });
            delete row[groupField];
          }
        });
      }
      // Sau khi có pivotData.data, nếu options.customTextColumns dạng mới, merge giá trị text vào từng dòng
      if (options.customTextColumns && Array.isArray(options.customTextColumns)) {
        console.log(options.customTextColumns);
        console.log(pivotedData);
        const dataArr = Array.isArray(pivotedData.data) ? pivotedData.data : Array.isArray(pivotedData) ? pivotedData : [];
        for (const customCol of options.customTextColumns) {
          if (customCol && customCol.columnName && customCol.data) {
            // Xác định cột tham chiếu ưu tiên từ customCol.referenceColumn (nếu có), nếu không thì từ rowFields
            const referenceColumn = customCol.referenceColumn ||
                                  ((options.rowFields && options.rowFields.length > 0) ? options.rowFields[0] : 'Dữ liệu');

            dataArr.forEach(row => {
              let rowKey;
              if (options.splitRowFieldsToColumns && options.rowFields && options.rowFields.length > 1) {
                // Nếu đã tách trường hàng và referenceColumn nằm trong rowFields, lấy trực tiếp
                if (options.rowFields.includes(referenceColumn)) {
                  rowKey = row[referenceColumn];
                } else {
                  // Đã tách trường hàng thành nhiều cột, nhưng referenceColumn không nằm trong rowFields
                  // Dùng row key là row[referenceColumn] nếu có, nếu không thì join các rowFields
                  rowKey = row[referenceColumn] || options.rowFields.map(f => row[f]).join(' | ');
                }
              } else if (options.rowFields && options.rowFields.length === 1) {
                // Trường hợp rowFields chỉ có 1 trường
                rowKey = row[options.rowFields[0]];
              } else {
                // Không có trường hàng hoặc cột đối chiếu không thuộc rowFields
                rowKey = row[referenceColumn];
              }

              // Chỉ gán giá trị nếu rowKey tồn tại trong data (trùng khớp với một key đã lưu)
              if (rowKey !== undefined && customCol.data.hasOwnProperty(rowKey)) {
                row[customCol.columnName] = customCol.data[rowKey];
              } else {
                // Nếu không trùng, để giá trị là rỗng
                row[customCol.columnName] = '';
              }
            });
          }
        }
      }
      return {
        rows: Array.from(sortedColumnHeaders),
        columns: columns,
        data: pivotedData,
      };
    }
    // fallback
    return { rows: [], columns: [], data: [] };
  };

  // Hàm nhận diện kiểu dữ liệu cột (copy từ RotateTable.jsx)
  const getColumnType = (col, rowDataGoc) => {
    const samples = rowDataGoc.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '').slice(0, 10);
    if (samples.length === 0) return 'string';
    if (samples.every(v => !isNaN(v) && v !== '')) return 'number';
    if (samples.every(v => !isNaN(Date.parse(v)))) return 'date';
    return 'string';
  };

  // Hàm applyFilters giống RotateTable.jsx
  const applyFilters = (data, filters, rowDataGoc, options) => {
    if (!filters || !filters.length) return data;

    // Xử lý đặc biệt cho is_distinct
    let filteredData = data;
    filters.forEach(f => {
      if (f.operator === 'is_distinct' && f.column) {
        // Lấy group fields từ options nếu có, hoặc mặc định []
        const groupByFields = (options?.rowFields || []).concat(options?.columnFields || []);
        const seen = new Set();
        filteredData = filteredData.filter(row => {
          const groupKey = groupByFields.map(field => row[field]).join('|');
          const distinctValue = row[f.column];
          const uniqueKey = groupKey + '|' + distinctValue;
          if (seen.has(uniqueKey)) return false;
          seen.add(uniqueKey);
          return true;
        });
      }
    });

    // Xử lý các filter còn lại (không phải is_distinct)
    return filteredData.filter((row, rowIdx, arr) => {
      const results = filters.map(f => {
        if (!f.column) return true;
        if (f.operator === 'is_distinct') return true; // đã xử lý ở trên
        const cell = row[f.column];
        const colType = getColumnType(f.column, rowDataGoc);
        let cellVal = cell;
        let filterVal = f.value;
        if (colType === 'number') {
          cellVal = Number(cell);
          filterVal = Number(f.value);
        } else if (colType === 'date') {
          cellVal = cell ? new Date(cell).getTime() : null;
          filterVal = f.value ? new Date(f.value).getTime() : null;
        } else {
          cellVal = (cell || '').toString().trim().toLowerCase();
          filterVal = (f.value || '').toString().trim().toLowerCase();
        }
        switch (f.operator) {
          case 'eq': return cellVal == filterVal;
          case 'neq': return cellVal != filterVal;
          case 'gt': return cellVal > filterVal;
          case 'lt': return cellVal < filterVal;
          case 'gte': return cellVal >= filterVal;
          case 'lte': return cellVal <= filterVal;
          case 'contains': return colType === 'string' ? cellVal.includes(filterVal) : false;
          default: return true;
        }
      });
      let result = results[0];
      for (let i = 1; i < results.length; i++) {
        const logic = filters[i].logic || 'and';
        if (logic === 'and') {
          result = result && results[i];
        } else {
          result = result || results[i];
        }
      }
      return result;
    });
  };


  const handleUpdateAll = async () => {
    setLoading(true);
    try {
      // Update all rotate tables
      for (const tab of tabRotates) {
        if (!tab.isMainTab) {
          const table = await getTableByid(tab.id);
          if (table) {
            const options = table.mother_rotate_columns;
            const rowDataGocResponse = await getTemplateRow(table.mother_table_id);
            const rowDataGoc = rowDataGocResponse.rows || [];
            if (rowDataGoc && rowDataGoc.length > 0) {
            const originalData = rowDataGoc.map(e => e.data);
            const data = transformDataWithPivot(originalData, options);
            await deleteTemplateRowByTableId(table.id);
            await createBathTemplateRow({
              tableId: table.id,
              data: data,
            });
            }
          }
        }
      }

      // Update the main template's isNeedUpdatePivot status
      await updateTemplateTable({id: templateData.id, isNeedUpdatePivot: false});

      // Fetch the latest template data to ensure state is in sync
      const [templateInfo] = await Promise.all([
        getTemplateByFileNoteId(templateData.fileNote_id),
      ]);
      const updatedTemplate = templateInfo[0];
      if (updatedTemplate) {
        setTemplateData(updatedTemplate);
      }

      setLoadData(prev => !prev);
      message.success('Đã cập nhật tất cả các bảng pivot thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật lại tất cả bảng xoay:', error);
      message.error('Lỗi khi cập nhật lại tất cả bảng xoay!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      className={css?.customButton}
      onClick={handleUpdateAll}
      loading={loading}
    >
      <span>Cập nhật các bảng pivot</span>
    </Button>
  );
};

export default UpdateAllRotateTablesButton;
