import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Button, message, Dropdown, Upload } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { getAllKpiBenchmark, createNewKpiBenchmark, updateKpiBenchmark } from '../../../../apis/kpiBenchmarkService';
import { Download, FileText, Table, Upload as UploadIcon } from 'lucide-react';

const BulkBenchmarkModal = ({ onClose, selectedCategory, currentData }) => {
  const gridRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [rowData, setRowData] = useState([]);

  const columnDefs = useMemo(() => {
    const monthCols = Array.from({ length: 12 }, (_, i) => ({
      headerName: `Tháng${i + 1}`,
      field: `col${i + 1}`,
      editable: true,
    }));
    return [
      { headerName: 'ID KPI', field: 'kpiId', editable: false, width: 100 },
      { headerName: 'Tên', field: 'name', editable: false, width: 200 },
      { headerName: 'Mô tả', field: 'description', editable: false, width: 240 },
      { headerName: 'Danh mục', field: 'category', editable: false, width: 140 },
      ...monthCols
    ];
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const kpis = currentData?.kpis || [];
        const benchmarks = await getAllKpiBenchmark();
        const benchByKpi = new Map();
        (benchmarks || []).forEach(b => {
          if (b?.info?.business_category_id === selectedCategory && b?.info?.kpiId) {
            benchByKpi.set(b.info.kpiId, b);
          }
        });

        const rows = kpis.map(k => {
          const found = benchByKpi.get(k.id);
          return {
            kpiId: k.id,
            name: k.name,
            description: k.description,
            category: k.category,
            benchmarkId: found?.id || null,
            ...(found?.data || {})
          };
        });
        setRowData(rows);
      } catch (e) {
        message.error('Không thể tải benchmark');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentData, selectedCategory]);

  const handlePaste = () => {
    // Cho phép paste trực tiếp bằng Ctrl+V vào grid
    if (gridRef.current) {
      const api = gridRef.current.api;
      api.setSuppressClipboardPaste(false);
      message.info('Bạn có thể Ctrl+V để dán dữ liệu vào bảng');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updates = [];
      rowData.forEach(row => {
        const data = {};
        for (let i = 1; i <= 12; i += 1) data[`col${i}`] = row[`col${i}`] || '';
        const payload = {
          name: row.name,
          description: row.description,
          category: row.category,
          data,
          info: {
            kpiId: row.kpiId,
            business_category_id: selectedCategory,
            source: 'MetricMap.BulkBenchmark'
          }
        };
        if (row.benchmarkId) {
          updates.push(updateKpiBenchmark({ id: row.benchmarkId, ...payload }));
        } else {
          updates.push(createNewKpiBenchmark(payload));
        }
      });
      await Promise.all(updates);
      message.success('Đã lưu benchmark');
      onClose();
    } catch (e) {
      message.error('Lỗi lưu benchmark');
    } finally {
      setLoading(false);
    }
  };

  const exportBenchmarkJSON = () => {
    const exportData = {
      metadata: {
        version: "1.0",
        description: "Benchmark data export - Điền dữ liệu benchmark cho các KPI",
        created_at: new Date().toISOString(),
        instructions: [
          "1. Điền dữ liệu benchmark cho từng tháng (col1 = Tháng 1, col2 = Tháng 2, ...)",
          "2. Để trống nếu không có dữ liệu cho tháng đó",
          "3. Sử dụng số thực cho các giá trị benchmark",
          "4. Không thay đổi ID KPI và tên KPI",
          "5. Import lại file này để cập nhật benchmark"
        ]
      },
      benchmarks: rowData.map(row => ({
        kpiId: row.kpiId,
        name: row.name,
        description: row.description,
        category: row.category,
        data: {
          col1: row.col1 || "",
          col2: row.col2 || "",
          col3: row.col3 || "",
          col4: row.col4 || "",
          col5: row.col5 || "",
          col6: row.col6 || "",
          col7: row.col7 || "",
          col8: row.col8 || "",
          col9: row.col9 || "",
          col10: row.col10 || "",
          col11: row.col11 || "",
          col12: row.col12 || ""
        }
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    message.success('Đã xuất file JSON benchmark');
  };

  const exportBenchmarkExcel = () => {
    // Tạo Excel file thực sự sử dụng xlsx library
    try {
      // Import xlsx dynamically
      import('xlsx').then(XLSX => {
        // Tạo workbook
        const wb = XLSX.utils.book_new();
        
        // Tạo worksheet data
        const wsData = [
          ['ID KPI', 'Tên KPI', 'Mô tả', 'Danh mục', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
          ...rowData.map(row => [
            row.kpiId,
            row.name,
            row.description || '',
            row.category,
            row.col1 || '',
            row.col2 || '',
            row.col3 || '',
            row.col4 || '',
            row.col5 || '',
            row.col6 || '',
            row.col7 || '',
            row.col8 || '',
            row.col9 || '',
            row.col10 || '',
            row.col11 || '',
            row.col12 || ''
          ])
        ];
        
        // Tạo worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Set column widths
        ws['!cols'] = [
          { width: 10 }, // ID KPI
          { width: 30 }, // Tên KPI
          { width: 40 }, // Mô tả
          { width: 15 }, // Danh mục
          { width: 12 }, // Tháng 1-12
          { width: 12 },
          { width: 12 },
          { width: 12 },
          { width: 12 },
          { width: 12 },
          { width: 12 },
          { width: 12 },
          { width: 12 },
          { width: 12 },
          { width: 12 },
          { width: 12 }
        ];
        
        // Thêm worksheet vào workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Benchmark Data');
        
        // Xuất file
        XLSX.writeFile(wb, `benchmark_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        message.success('Đã xuất file Excel benchmark');
      }).catch(error => {
        console.error('Lỗi import xlsx:', error);
        message.error('Cần cài đặt thư viện xlsx để xuất Excel');
      });
    } catch (error) {
      console.error('Lỗi xuất Excel:', error);
      message.error('Lỗi xuất file Excel');
    }
  };

  const handleImport = (file) => {
    if (file.name.endsWith('.xlsx')) {
      // Handle Excel files separately
      import('xlsx').then(XLSX => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length < 2) {
              message.error('File Excel không có dữ liệu');
              return;
            }
            
            const headers = jsonData[0];
            const excelData = jsonData.slice(1).map(row => {
              const rowData = {};
              headers.forEach((header, index) => {
                const value = row[index] || '';
                if (header === 'ID KPI') rowData.kpiId = parseInt(value);
                else if (header === 'Tên KPI') rowData.name = value;
                else if (header === 'Mô tả') rowData.description = value;
                else if (header === 'Danh mục') rowData.category = value;
                else if (header && header.startsWith('Tháng')) {
                  const monthNum = header.split(' ')[1];
                  rowData[`col${monthNum}`] = value;
                }
              });
              return rowData;
            });
            
            const newRowData = rowData.map(row => {
              const excelRow = excelData.find(e => e.kpiId === row.kpiId);
              if (excelRow) {
                return {
                  ...row,
                  col1: excelRow.col1 || row.col1,
                  col2: excelRow.col2 || row.col2,
                  col3: excelRow.col3 || row.col3,
                  col4: excelRow.col4 || row.col4,
                  col5: excelRow.col5 || row.col5,
                  col6: excelRow.col6 || row.col6,
                  col7: excelRow.col7 || row.col7,
                  col8: excelRow.col8 || row.col8,
                  col9: excelRow.col9 || row.col9,
                  col10: excelRow.col10 || row.col10,
                  col11: excelRow.col11 || row.col11,
                  col12: excelRow.col12 || row.col12
                };
              }
              return row;
            });
            setRowData(newRowData);
            message.success('Đã import dữ liệu benchmark từ Excel');
          } catch (error) {
            message.error('Lỗi đọc file Excel: ' + error.message);
          }
        };
        reader.readAsArrayBuffer(file);
      }).catch(error => {
        console.error('Lỗi import xlsx:', error);
        message.error('Cần cài đặt thư viện xlsx để import Excel');
      });
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let importData;
        
        if (file.name.endsWith('.json')) {
          importData = JSON.parse(content);
          if (importData.benchmarks) {
            // Import từ JSON format
            const newRowData = rowData.map(row => {
              const importedBenchmark = importData.benchmarks.find(b => b.kpiId === row.kpiId);
              if (importedBenchmark) {
                return {
                  ...row,
                  ...importedBenchmark.data
                };
              }
              return row;
            });
            setRowData(newRowData);
            message.success('Đã import dữ liệu benchmark từ JSON');
          } else {
            message.error('File JSON không đúng định dạng');
          }
        } else if (file.name.endsWith('.csv')) {
          // Parse CSV
          const lines = content.split('\n');
          const headers = lines[0].split(',');
          const csvData = lines.slice(1).map(line => {
            const values = line.split(',');
            const row = {};
            headers.forEach((header, index) => {
              const value = values[index]?.replace(/"/g, '') || '';
              if (header.trim() === 'ID KPI') row.kpiId = parseInt(value);
              else if (header.trim() === 'Tên KPI') row.name = value;
              else if (header.trim() === 'Mô tả') row.description = value;
              else if (header.trim() === 'Danh mục') row.category = value;
              else if (header.trim().startsWith('Tháng')) {
                const monthNum = header.trim().split(' ')[1];
                row[`col${monthNum}`] = value;
              }
            });
            return row;
          });
          
          const newRowData = rowData.map(row => {
            const csvRow = csvData.find(c => c.kpiId === row.kpiId);
            if (csvRow) {
              return {
                ...row,
                col1: csvRow.col1 || row.col1,
                col2: csvRow.col2 || row.col2,
                col3: csvRow.col3 || row.col3,
                col4: csvRow.col4 || row.col4,
                col5: csvRow.col5 || row.col5,
                col6: csvRow.col6 || row.col6,
                col7: csvRow.col7 || row.col7,
                col8: csvRow.col8 || row.col8,
                col9: csvRow.col9 || row.col9,
                col10: csvRow.col10 || row.col10,
                col11: csvRow.col11 || row.col11,
                col12: csvRow.col12 || row.col12
              };
            }
            return row;
          });
          setRowData(newRowData);
          message.success('Đã import dữ liệu benchmark từ CSV');
        }
      } catch (error) {
        message.error('Lỗi đọc file: ' + error.message);
      }
    };
    reader.readAsText(file);
    return false; // Prevent upload
  };

  const exportMenuItems = [
    {
      key: 'json',
      label: 'Xuất JSON',
      icon: <FileText size={14} />,
      onClick: exportBenchmarkJSON
    },
    {
      key: 'excel',
      label: 'Xuất Excel',
      icon: <Table size={14} />,
      onClick: exportBenchmarkExcel
    }
  ];

  return (
    <Modal
      title="Nhập benchmark"
      open={true}
      onCancel={onClose}
      width={1100}
      footer={[
        <Button key="cancel" onClick={onClose} style={{marginRight: 8}}>Hủy</Button>,
        <Upload key="import" accept=".json,.csv,.xlsx" beforeUpload={handleImport} showUploadList={false}  style={{marginRight: 8}}>
          <Button icon={<UploadIcon size={14} />}>
            Import
          </Button>
        </Upload>,
        <Dropdown key="export" menu={{ items: exportMenuItems }} placement="topLeft"  style={{marginRight: 8}}>
          <Button icon={<Download size={14} />}>
            Xuất dữ liệu
          </Button>
        </Dropdown>,
        <Button key="save" type="primary" loading={loading} onClick={handleSave}>Lưu</Button>
      ]}
    >
      <div className="ag-theme-quartz" style={{ height: 520, width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={{ resizable: true, sortable: true }}
          onCellValueChanged={(e) => {
            const newRows = [...rowData];
            newRows[e.rowIndex] = { ...newRows[e.rowIndex], [e.colDef.field]: e.newValue };
            setRowData(newRows);
          }}
          suppressClipboardPaste={false}
          enableRangeSelection={true}
        />
      </div>
    </Modal>
  );
};

export default BulkBenchmarkModal;


