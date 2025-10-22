import React, { useState, useMemo, useRef } from 'react';
import { Modal, Upload, Button, message, Space, Typography, Alert, Table, Tag } from 'antd';
import { InboxOutlined, DownloadOutlined, FileExcelOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

const { Dragger } = Upload;
const { Text, Paragraph } = Typography;

// Cell Renderer cho tags/groups
const TagsCellRenderer = (props) => {
  const tags = props.value;
  if (!tags || !Array.isArray(tags) || tags.length === 0) return null;
  
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '4px 0' }}>
      {tags.map((tag, index) => (
        <span 
          key={index}
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            backgroundColor: '#f0f0f0',
            color: '#595959',
            border: '1px solid #d9d9d9'
          }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
};

// Cell Renderer cho date với format
const DateCellRenderer = (props) => {
  const date = props.value;
  if (!date) return '';
  if (typeof date === 'object' && date.error) {
    return <span style={{ color: '#ff4d4f' }}>{date.error}</span>;
  }
  try {
    return new Date(date).toLocaleDateString('vi-VN');
  } catch (error) {
    return date;
  }
};

// Cell Renderer cho validation status
const ValidationCellRenderer = (props) => {
  const error = props.data._validationError;
  if (error && error.errors && error.errors.length > 0) {
    return (
      <div style={{ color: '#ff4d4f', fontSize: '12px' }}>
        {error.errors.map((err, index) => (
          <div key={index}>• {err}</div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ color: '#52c41a' }}>
      ✓ OK
    </div>
  );
};

const ImportModal = ({ 
  open, 
  onCancel, 
  onImport, 
  loading = false 
}) => {
  const [fileList, setFileList] = useState([]);
  const [importData, setImportData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const gridRef = useRef();

  // Xuất template Excel mẫu
  const handleExportTemplate = async () => {
    try {
      // Tạo workbook với ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Template');

      // Định nghĩa headers
      worksheet.columns = [
        { header: 'Name', key: 'name', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Company', key: 'company', width: 20 },
        { header: 'Số điện thoại', key: 'phone', width: 15 },
        { header: 'Ghi chú', key: 'note', width: 30 },
        { header: 'Group 1', key: 'group1', width: 15 },
        { header: 'Group 2', key: 'group2', width: 15 },
        { header: 'Group 3', key: 'group3', width: 15 },
        { header: 'Group 4', key: 'group4', width: 15 },
        { header: 'Group 5', key: 'group5', width: 15 },
        { header: 'Group 6', key: 'group6', width: 15 },
        { header: 'Group 7', key: 'group7', width: 15 },
        { header: 'Group 8', key: 'group8', width: 15 },
        { header: 'Group 9', key: 'group9', width: 15 },
        { header: 'Group 10', key: 'group10', width: 15 },
        { header: 'Text Field 1', key: 'text1', width: 15 },
        { header: 'Text Field 2', key: 'text2', width: 15 },
        { header: 'Text Field 3', key: 'text3', width: 15 },
        { header: 'Text Field 4', key: 'text4', width: 15 },
        { header: 'Text Field 5', key: 'text5', width: 15 },
        { header: 'Text Field 6', key: 'text6', width: 15 },
        { header: 'Text Field 7', key: 'text7', width: 15 },
        { header: 'Text Field 8', key: 'text8', width: 15 },
        { header: 'Text Field 9', key: 'text9', width: 15 },
        { header: 'Text Field 10', key: 'text10', width: 15 },
        { header: 'Date Field 1', key: 'date1', width: 15 },
        { header: 'Date Field 2', key: 'date2', width: 15 },
        { header: 'Date Field 3', key: 'date3', width: 15 },
      ];

      // Thêm dữ liệu mẫu
      worksheet.addRows([
        {
          name: 'Nguyễn Văn A',
          email: 'nguyenvana@example.com',
          company: 'Công ty ABC',
          phone: '0123456789',
          note: 'Khách hàng tiềm năng',
          group1: 'VIP, Premium',
          group2: 'Hà Nội, Miền Bắc',
          group3: 'Quan tâm, Tiềm năng',
          group4: 'Khách hàng mới',
          group5: 'Doanh nghiệp',
          group6: 'Cá nhân',
          group7: 'Tư vấn',
          group8: 'Hợp đồng',
          group9: 'Dịch vụ',
          group10: 'Hỗ trợ',
          text1: 'Địa chỉ: 123 ABC',
          text2: 'Nghề nghiệp: Kỹ sư',
          text3: 'Sở thích: Đọc sách',
          text4: 'Tuổi: 30',
          text5: 'Trình độ: Đại học',
          text6: 'Kinh nghiệm: 5 năm',
          text7: 'Mức lương: 20M',
          text8: 'Tình trạng: Độc thân',
          text9: 'Nguồn: Website',
          text10: 'Ghi chú thêm: VIP',
          date1: '2024-01-15',
          date2: '2024-02-20',
          date3: '2024-03-10',
        },
        {
          name: 'Trần Thị B',
          email: 'tranthib@example.com',
          company: 'Công ty XYZ',
          phone: '0987654321',
          note: 'Khách hàng thân thiết',
          group1: 'Premium',
          group2: 'TP.HCM',
          group3: 'Đã mua',
          group4: 'Khách hàng cũ',
          group5: 'Cá nhân',
          group6: 'Y tế',
          group7: 'Chăm sóc',
          group8: 'Dài hạn',
          group9: 'Ưu đãi',
          group10: 'Theo dõi',
          text1: 'Địa chỉ: 456 XYZ',
          text2: 'Nghề nghiệp: Bác sĩ',
          text3: 'Sở thích: Du lịch',
          text4: 'Tuổi: 35',
          text5: 'Trình độ: Thạc sĩ',
          text6: 'Kinh nghiệm: 8 năm',
          text7: 'Mức lương: 35M',
          text8: 'Tình trạng: Có gia đình',
          text9: 'Nguồn: Giới thiệu',
          text10: 'Ghi chú thêm: Thân thiết',
          date1: '2024-02-01',
          date2: '2024-03-15',
          date3: '2024-04-20',
        }
      ]);

      // ⭐ KEY FEATURE: Format 3 cột date thành Text cho TOÀN BỘ cột
      // Date Field 1 = cột 26 (AA), Date Field 2 = 27 (AB), Date Field 3 = 28 (AC)
      worksheet.getColumn(26).numFmt = '@'; // Text format
      worksheet.getColumn(27).numFmt = '@'; // Text format
      worksheet.getColumn(28).numFmt = '@'; // Text format
      
      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Customer_Import_Template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);

      message.success('Đã xuất template thành công!');
    } catch (error) {
      console.error('Error exporting template:', error);
      message.error('Lỗi khi xuất template!');
    }
  };

  // Xử lý upload file
  const handleUpload = (info) => {
    const { fileList: newFileList } = info;
    
    // Chỉ giữ lại file cuối cùng (thay thế file cũ)
    const latestFile = newFileList[newFileList.length - 1];
    setFileList(latestFile ? [latestFile] : []);

    // Nếu remove file thì clear data
    if (!latestFile) {
      setImportData([]);
      setValidationErrors([]);
      return;
    }

    // Xử lý file ngay khi có file (không cần chờ status)
    if (latestFile.originFileObj || latestFile) {
      const file = latestFile.originFileObj || latestFile;
      if (file && file.type && (file.type.includes('sheet') || file.type.includes('excel') || file.name.match(/\.(xlsx|xls)$/i))) {
        readExcelFile(file);
      }
    }
  };

  // Validate dữ liệu
  const validateData = (data) => {
    const errors = [];
    const emailMap = new Map(); // Map để track email và vị trí của chúng
    
    data.forEach((row, index) => {
      const rowErrors = [];
      
      // Validate required fields (chỉ validate nếu có dữ liệu)
      if (row.name === null || row.name === undefined || row.name.trim() === '') {
        rowErrors.push('Tên không được để trống');
      }
      
      if (row.email === null || row.email === undefined || row.email.trim() === '') {
        rowErrors.push('Email không được để trống');
      } else if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        rowErrors.push('Email không đúng định dạng');
      } else if (row.email) {
        // Check email trùng trong list
        const email = row.email.trim().toLowerCase();
        if (emailMap.has(email)) {
          const firstRowIndex = emailMap.get(email);
          rowErrors.push(`Email trùng với dòng ${firstRowIndex}`);
        } else {
          emailMap.set(email, index + 1);
        }
      }
      
      // Validate date fields format
      if (row.info?.date1 && typeof row.info.date1 === 'object' && row.info.date1.error) {
        rowErrors.push(row.info.date1.error);
      }
      if (row.info?.date2 && typeof row.info.date2 === 'object' && row.info.date2.error) {
        rowErrors.push(row.info.date2.error);
      }
      if (row.info?.date3 && typeof row.info.date3 === 'object' && row.info.date3.error) {
        rowErrors.push(row.info.date3.error);
      }
      
      if (rowErrors.length > 0) {
        errors.push({
          rowIndex: index + 1,
          errors: rowErrors
        });
      }
    });
    
    return errors;
  };

  // Đọc file Excel
  const readExcelFile = async (file) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.worksheets[0];
      const jsonData = [];
      
      // Lấy headers từ row đầu tiên
      const headers = [];
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value;
      });
      
      // Đọc dữ liệu từ row 2 trở đi
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            rowData[header] = cell.value;
          }
        });
        
        if (Object.keys(rowData).length > 0) {
          jsonData.push(rowData);
        }
      });

      // Validate và format dữ liệu
      const formattedData = jsonData.map((row, index) => {
        // Helper function để parse group values (có thể là string với dấu phẩy)
        const parseGroupValue = (value) => {
          if (!value) return [];
          if (typeof value === 'string') {
            // Tách theo dấu phẩy và loại bỏ khoảng trắng
            return value.split(',').map(item => item.trim()).filter(item => item);
          }
          if (Array.isArray(value)) {
            return value;
          }
          return [value];
        };

        // Helper function để kiểm tra và lấy giá trị (chỉ lấy nếu có dữ liệu)
        const getValueIfNotEmpty = (value) => {
          if (value === null || value === undefined || value === '') {
            return null; // Trả về null để biết là không có dữ liệu
          }
          return value.toString().trim();
        };

        // Helper function để xử lý date values - chỉ hỗ trợ format YYYY-MM-DD
        const getDateValueIfNotEmpty = (value, fieldName = '') => {
          if (value === null || value === undefined || value === '') {
            return null;
          }
          
          let dateStr = value.toString().trim();
          if (!dateStr) return null;
          
          // Loại bỏ dấu ' ở đầu nếu có (Excel text format prefix)
          if (dateStr.startsWith("'")) {
            dateStr = dateStr.substring(1).trim();
          }
          
          // Chỉ chấp nhận format YYYY-MM-DD
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            // Validate date hợp lệ
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              return dateStr; // Trả về nguyên format YYYY-MM-DD
            } else {
              // Date không hợp lệ (VD: 2024-13-45)
              return { error: `${fieldName} có ngày không hợp lệ: "${dateStr}"` };
            }
          } else {
            // Format không đúng - hiển thị giá trị hiện tại
            return { error: `${fieldName} có format không đúng. Giá trị hiện tại: "${dateStr}". Yêu cầu: YYYY-MM-DD (VD: 2024-01-15)` };
          }
        };

        // Helper function để kiểm tra group values
        const getGroupValueIfNotEmpty = (value) => {
          const parsed = parseGroupValue(value);
          return parsed.length > 0 ? parsed : null;
        };

        return {
          key: index,
          rowIndex: index + 1,
          name: getValueIfNotEmpty(row['Name']),
          email: getValueIfNotEmpty(row['Email']),
          company: getValueIfNotEmpty(row['Company']),
          phone: getValueIfNotEmpty(row['Số điện thoại']),
          note: getValueIfNotEmpty(row['Ghi chú']),
          info: {
            group1: getGroupValueIfNotEmpty(row['Group 1']),
            group2: getGroupValueIfNotEmpty(row['Group 2']),
            group3: getGroupValueIfNotEmpty(row['Group 3']),
            group4: getGroupValueIfNotEmpty(row['Group 4']),
            group5: getGroupValueIfNotEmpty(row['Group 5']),
            group6: getGroupValueIfNotEmpty(row['Group 6']),
            group7: getGroupValueIfNotEmpty(row['Group 7']),
            group8: getGroupValueIfNotEmpty(row['Group 8']),
            group9: getGroupValueIfNotEmpty(row['Group 9']),
            group10: getGroupValueIfNotEmpty(row['Group 10']),
            text1: getValueIfNotEmpty(row['Text Field 1']),
            text2: getValueIfNotEmpty(row['Text Field 2']),
            text3: getValueIfNotEmpty(row['Text Field 3']),
            text4: getValueIfNotEmpty(row['Text Field 4']),
            text5: getValueIfNotEmpty(row['Text Field 5']),
            text6: getValueIfNotEmpty(row['Text Field 6']),
            text7: getValueIfNotEmpty(row['Text Field 7']),
            text8: getValueIfNotEmpty(row['Text Field 8']),
            text9: getValueIfNotEmpty(row['Text Field 9']),
            text10: getValueIfNotEmpty(row['Text Field 10']),
            date1: getDateValueIfNotEmpty(row['Date Field 1'], 'Date Field 1'),
            date2: getDateValueIfNotEmpty(row['Date Field 2'], 'Date Field 2'),
            date3: getDateValueIfNotEmpty(row['Date Field 3'], 'Date Field 3'),
          }
        };
      });

      // Validate dữ liệu
      const errors = validateData(formattedData);
      setValidationErrors(errors);
      
      // Thêm validation error vào từng row để AG Grid có thể highlight
      const dataWithValidation = formattedData.map(row => {
        const error = errors.find(err => err.rowIndex === row.rowIndex);
        return {
          ...row,
          _validationError: error || null
        };
      });
      
      setImportData(dataWithValidation);
        
      if (errors.length === 0) {
        message.success(`Đã đọc thành công ${formattedData.length} dòng dữ liệu!`);
      } else {
        message.warning(`Đã đọc ${formattedData.length} dòng dữ liệu, có ${errors.length} dòng có lỗi!`);
      }
    } catch (error) {
      console.error('Error reading Excel file:', error);
      message.error('Lỗi khi đọc file Excel!');
    }
  };

  // Xử lý import
  const handleImport = () => {
    if (importData.length === 0) {
      message.warning('Vui lòng chọn file Excel để import!');
      return;
    }

    if (validationErrors.length > 0) {
      message.warning(`Có ${validationErrors.length} dòng có lỗi. Vui lòng sửa lỗi trước khi import!`);
      return;
    }

    // Chỉ import những dòng không có lỗi
    const validData = importData.filter(row => 
      !validationErrors.some(error => error.rowIndex === row.rowIndex)
    );

    onImport(validData);
  };

  // Reset modal
  const handleCancel = () => {
    setFileList([]);
    setImportData([]);
    setValidationErrors([]);
    onCancel();
  };

  // Cell Editor cho multi-select tags
  const parseTagsFromString = (value) => {
    if (!value) return [];
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(item => item);
    }
    if (Array.isArray(value)) return value;
    return [value];
  };

  // Revalidate dữ liệu sau khi chỉnh sửa
  const handleRevalidate = () => {
    const errors = validateData(importData.map(row => {
      const { _validationError, ...cleanRow } = row;
      return cleanRow;
    }));
    
    setValidationErrors(errors);
    
    // Cập nhật lại validation error cho từng row
    const dataWithValidation = importData.map(row => {
      const error = errors.find(err => err.rowIndex === row.rowIndex);
      return {
        ...row,
        _validationError: error || null
      };
    });
    
    setImportData(dataWithValidation);
    
    if (errors.length === 0) {
      message.success(`Đã kiểm tra thành công! Tất cả ${importData.length} dòng đều hợp lệ.`);
    } else {
      message.warning(`Đã kiểm tra! Có ${errors.length} dòng có lỗi cần sửa.`);
    }
  };

  // Filter configuration helper
  const filter = () => {
    return {
      filter: 'agMultiColumnFilter',
      floatingFilter: true,
      filterParams: {
        filters: [
          {
            filter: 'agTextColumnFilter',
          },
          {
            filter: 'agSetColumnFilter',
          },
        ],
      },
    };
  };

  // AG Grid column definitions
  const columnDefs = useMemo(() => [
    {
      headerName: 'STT',
      field: 'rowIndex',
      width: 70,
      pinned: 'left',
      editable: false,
      cellStyle: { textAlign: 'center' },
      ...filter()
    },
    {
      headerName: 'Tên',
      field: 'name',
      width: 150,
      pinned: 'left',
      editable: true,
      cellStyle: (params) => {
        const error = params.data._validationError;
        // Chỉ bôi đỏ nếu có lỗi liên quan đến Tên
        const hasNameError = error?.errors?.some(err => err.includes('Tên'));
        return { 
          backgroundColor: hasNameError ? '#fff2f0' : 'inherit',
          color: hasNameError ? '#ff4d4f' : 'inherit',
          fontWeight: hasNameError ? 'bold' : 'normal'
        };
      },
      ...filter()
    },
    {
      headerName: 'Email',
      field: 'email',
      pinned: 'left',
      width: 200,
      editable: true,
      cellStyle: (params) => {
        const error = params.data._validationError;
        // Chỉ bôi đỏ nếu có lỗi liên quan đến Email
        const hasEmailError = error?.errors?.some(err => err.includes('Email'));
        return { 
          backgroundColor: hasEmailError ? '#fff2f0' : 'inherit',
          color: hasEmailError ? '#ff4d4f' : 'inherit',
          fontWeight: hasEmailError ? 'bold' : 'normal'
        };
      },
      ...filter()
    },
    {
      headerName: 'Công ty',
      field: 'company',
      width: 150,
      editable: true,
      ...filter()
    },
    {
      headerName: 'SĐT',
      field: 'phone',
      width: 120,
      editable: true,
      ...filter()
    },
    {
      headerName: 'Ghi chú',
      field: 'note',
      width: 220,
      editable: true,
      ...filter()
    },
    {
      headerName: 'Group 1',
      field: 'group1',
      width: 150,
      editable: true,
      cellRenderer: TagsCellRenderer,
      valueGetter: (params) => params.data.info?.group1,
      valueSetter: (params) => {
        const newValue = params.newValue;
        const parsed = parseTagsFromString(newValue);
        params.data.info = params.data.info || {};
        params.data.info.group1 = parsed.length > 0 ? parsed : null;
        return true;
      },
      cellEditor: 'agTextCellEditor',
      valueFormatter: (params) => {
        if (!params.value || !Array.isArray(params.value)) return '';
        return params.value.join(', ');
      },
      ...filter()
    },
    {
      headerName: 'Group 2',
      field: 'group2',
      width: 150,
      editable: true,
      cellRenderer: TagsCellRenderer,
      valueGetter: (params) => params.data.info?.group2,
      valueSetter: (params) => {
        const newValue = params.newValue;
        const parsed = parseTagsFromString(newValue);
        params.data.info = params.data.info || {};
        params.data.info.group2 = parsed.length > 0 ? parsed : null;
        return true;
      },
      cellEditor: 'agTextCellEditor',
      valueFormatter: (params) => {
        if (!params.value || !Array.isArray(params.value)) return '';
        return params.value.join(', ');
      },
      ...filter()
    },
    {
      headerName: 'Group 3',
      field: 'group3',
      width: 150,
      editable: true,
      cellRenderer: TagsCellRenderer,
      valueGetter: (params) => params.data.info?.group3,
      valueSetter: (params) => {
        const newValue = params.newValue;
        const parsed = parseTagsFromString(newValue);
        params.data.info = params.data.info || {};
        params.data.info.group3 = parsed.length > 0 ? parsed : null;
        return true;
      },
      cellEditor: 'agTextCellEditor',
      valueFormatter: (params) => {
        if (!params.value || !Array.isArray(params.value)) return '';
        return params.value.join(', ');
      },
      ...filter()
    },
    {
      headerName: 'Group 4',
      field: 'group4',
      width: 150,
      editable: true,
      cellRenderer: TagsCellRenderer,
      valueGetter: (params) => params.data.info?.group4,
      valueSetter: (params) => {
        const newValue = params.newValue;
        const parsed = parseTagsFromString(newValue);
        params.data.info = params.data.info || {};
        params.data.info.group4 = parsed.length > 0 ? parsed : null;
        return true;
      },
      cellEditor: 'agTextCellEditor',
      valueFormatter: (params) => {
        if (!params.value || !Array.isArray(params.value)) return '';
        return params.value.join(', ');
      },
      ...filter()
    },
    {
      headerName: 'Group 5',
      field: 'group5',
      width: 150,
      editable: true,
      cellRenderer: TagsCellRenderer,
      valueGetter: (params) => params.data.info?.group5,
      valueSetter: (params) => {
        const newValue = params.newValue;
        const parsed = parseTagsFromString(newValue);
        params.data.info = params.data.info || {};
        params.data.info.group5 = parsed.length > 0 ? parsed : null;
        return true;
      },
      cellEditor: 'agTextCellEditor',
      valueFormatter: (params) => {
        if (!params.value || !Array.isArray(params.value)) return '';
        return params.value.join(', ');
      },
      ...filter()
    },
    {
      headerName: 'Group 6',
      field: 'group6',
      width: 150,
      editable: true,
      cellRenderer: TagsCellRenderer,
      valueGetter: (params) => params.data.info?.group6,
      valueSetter: (params) => {
        const newValue = params.newValue;
        const parsed = parseTagsFromString(newValue);
        params.data.info = params.data.info || {};
        params.data.info.group6 = parsed.length > 0 ? parsed : null;
        return true;
      },
      cellEditor: 'agTextCellEditor',
      valueFormatter: (params) => {
        if (!params.value || !Array.isArray(params.value)) return '';
        return params.value.join(', ');
      },
      ...filter()
    },
    {
      headerName: 'Group 7',
      field: 'group7',
      width: 150,
      editable: true,
      cellRenderer: TagsCellRenderer,
      valueGetter: (params) => params.data.info?.group7,
      valueSetter: (params) => {
        const newValue = params.newValue;
        const parsed = parseTagsFromString(newValue);
        params.data.info = params.data.info || {};
        params.data.info.group7 = parsed.length > 0 ? parsed : null;
        return true;
      },
      cellEditor: 'agTextCellEditor',
      valueFormatter: (params) => {
        if (!params.value || !Array.isArray(params.value)) return '';
        return params.value.join(', ');
      },
      ...filter()
    },
    {
      headerName: 'Group 8',
      field: 'group8',
      width: 150,
      editable: true,
      cellRenderer: TagsCellRenderer,
      valueGetter: (params) => params.data.info?.group8,
      valueSetter: (params) => {
        const newValue = params.newValue;
        const parsed = parseTagsFromString(newValue);
        params.data.info = params.data.info || {};
        params.data.info.group8 = parsed.length > 0 ? parsed : null;
        return true;
      },
      cellEditor: 'agTextCellEditor',
      valueFormatter: (params) => {
        if (!params.value || !Array.isArray(params.value)) return '';
        return params.value.join(', ');
      },
      ...filter()
    },
    {
      headerName: 'Group 9',
      field: 'group9',
      width: 150,
      editable: true,
      cellRenderer: TagsCellRenderer,
      valueGetter: (params) => params.data.info?.group9,
      valueSetter: (params) => {
        const newValue = params.newValue;
        const parsed = parseTagsFromString(newValue);
        params.data.info = params.data.info || {};
        params.data.info.group9 = parsed.length > 0 ? parsed : null;
        return true;
      },
      cellEditor: 'agTextCellEditor',
      valueFormatter: (params) => {
        if (!params.value || !Array.isArray(params.value)) return '';
        return params.value.join(', ');
      },
      ...filter()
    },
    {
      headerName: 'Group 10',
      field: 'group10',
      width: 150,
      editable: true,
      cellRenderer: TagsCellRenderer,
      valueGetter: (params) => params.data.info?.group10,
      valueSetter: (params) => {
        const newValue = params.newValue;
        const parsed = parseTagsFromString(newValue);
        params.data.info = params.data.info || {};
        params.data.info.group10 = parsed.length > 0 ? parsed : null;
        return true;
      },
      cellEditor: 'agTextCellEditor',
      valueFormatter: (params) => {
        if (!params.value || !Array.isArray(params.value)) return '';
        return params.value.join(', ');
      },
      ...filter()
    },
    {
      headerName: 'Text 1',
      field: 'text1',
      width: 120,
      editable: true,
      valueGetter: (params) => params.data.info?.text1,
      valueSetter: (params) => {
        params.data.info = params.data.info || {};
        params.data.info.text1 = params.newValue || null;
        return true;
      },
      ...filter()
    },
    {
      headerName: 'Text 2',
      field: 'text2',
      width: 120,
      editable: true,
      valueGetter: (params) => params.data.info?.text2,
      valueSetter: (params) => {
        params.data.info = params.data.info || {};
        params.data.info.text2 = params.newValue || null;
        return true;
      },
      ...filter()
    },
    {
      headerName: 'Text 3',
      field: 'text3',
      width: 120,
      editable: true,
      valueGetter: (params) => params.data.info?.text3,
      valueSetter: (params) => {
        params.data.info = params.data.info || {};
        params.data.info.text3 = params.newValue || null;
        return true;
      },
      ...filter()
    },
    {
      headerName: 'Text 4',
      field: 'text4',
      width: 120,
      editable: true,
      valueGetter: (params) => params.data.info?.text4,
      valueSetter: (params) => {
        params.data.info = params.data.info || {};
        params.data.info.text4 = params.newValue || null;
        return true;
      },
      ...filter()
    },
    {
      headerName: 'Text 5',
      field: 'text5',
      width: 120,
      editable: true,
      valueGetter: (params) => params.data.info?.text5,
      valueSetter: (params) => {
        params.data.info = params.data.info || {};
        params.data.info.text5 = params.newValue || null;
        return true;
      },
      ...filter()
    },
    {
      headerName: 'Text 6',
      field: 'text6',
      width: 120,
      editable: true,
      valueGetter: (params) => params.data.info?.text6,
      valueSetter: (params) => {
        params.data.info = params.data.info || {};
        params.data.info.text6 = params.newValue || null;
        return true;
      },
      ...filter()
    },
    {
      headerName: 'Text 7',
      field: 'text7',
      width: 120,
      editable: true,
      valueGetter: (params) => params.data.info?.text7,
      valueSetter: (params) => {
        params.data.info = params.data.info || {};
        params.data.info.text7 = params.newValue || null;
        return true;
      },
      ...filter()
    },
    {
      headerName: 'Text 8',
      field: 'text8',
      width: 120,
      editable: true,
      valueGetter: (params) => params.data.info?.text8,
      valueSetter: (params) => {
        params.data.info = params.data.info || {};
        params.data.info.text8 = params.newValue || null;
        return true;
      },
      ...filter()
    },
    {
      headerName: 'Text 9',
      field: 'text9',
      width: 120,
      editable: true,
      valueGetter: (params) => params.data.info?.text9,
      valueSetter: (params) => {
        params.data.info = params.data.info || {};
        params.data.info.text9 = params.newValue || null;
        return true;
      },
      ...filter()
    },
    {
      headerName: 'Text 10',
      field: 'text10',
      width: 120,
      editable: true,
      valueGetter: (params) => params.data.info?.text10,
      valueSetter: (params) => {
        params.data.info = params.data.info || {};
        params.data.info.text10 = params.newValue || null;
        return true;
      },
      ...filter()
    },
    {
      headerName: 'Date 1',
      field: 'date1',
      width: 130,
      editable: true,
      cellRenderer: DateCellRenderer,
      valueGetter: (params) => params.data.info?.date1,
      valueSetter: (params) => {
        const newValue = params.newValue;
        params.data.info = params.data.info || {};
        // AG Grid date editor trả về format YYYY-MM-DD
        if (newValue) {
          // Nếu là ISO string (có 'T'), extract date part
          if (typeof newValue === 'string' && newValue.includes('T')) {
            params.data.info.date1 = newValue.split('T')[0];
          } else {
            params.data.info.date1 = newValue;
          }
        } else {
          params.data.info.date1 = null;
        }
        return true;
      },
      cellStyle: (params) => {
        const error = params.data._validationError;
        // Chỉ bôi đỏ nếu có lỗi liên quan đến Date Field 1
        const hasDateError = error?.errors?.some(err => err.includes('Date Field 1'));
        return { 
          backgroundColor: hasDateError ? '#fff2f0' : 'inherit',
          color: hasDateError ? '#ff4d4f' : 'inherit'
        };
      },
      cellEditor: 'agDateCellEditor',
      cellEditorParams: {
        format: 'yyyy-mm-dd',
        min: '1900-01-01',
        max: '2100-12-31'
      },
      ...filter()
    },
    {
      headerName: 'Date 2',
      field: 'date2',
      width: 130,
      editable: true,
      cellRenderer: DateCellRenderer,
      valueGetter: (params) => params.data.info?.date2,
      valueSetter: (params) => {
        const newValue = params.newValue;
        params.data.info = params.data.info || {};
        // AG Grid date editor trả về format YYYY-MM-DD
        if (newValue) {
          // Nếu là ISO string (có 'T'), extract date part
          if (typeof newValue === 'string' && newValue.includes('T')) {
            params.data.info.date2 = newValue.split('T')[0];
          } else {
            params.data.info.date2 = newValue;
          }
        } else {
          params.data.info.date2 = null;
        }
        return true;
      },
      cellStyle: (params) => {
        const error = params.data._validationError;
        // Chỉ bôi đỏ nếu có lỗi liên quan đến Date Field 2
        const hasDateError = error?.errors?.some(err => err.includes('Date Field 2'));
        return { 
          backgroundColor: hasDateError ? '#fff2f0' : 'inherit',
          color: hasDateError ? '#ff4d4f' : 'inherit'
        };
      },
      cellEditor: 'agDateCellEditor',
      cellEditorParams: {
        format: 'yyyy-mm-dd',
        min: '1900-01-01',
        max: '2100-12-31'
      },
      ...filter()
    },
    {
      headerName: 'Date 3',
      field: 'date3',
      width: 130,
      editable: true,
      cellRenderer: DateCellRenderer,
      valueGetter: (params) => params.data.info?.date3,
      valueSetter: (params) => {
        const newValue = params.newValue;
        params.data.info = params.data.info || {};
        // AG Grid date editor trả về format YYYY-MM-DD
        if (newValue) {
          // Nếu là ISO string (có 'T'), extract date part
          if (typeof newValue === 'string' && newValue.includes('T')) {
            params.data.info.date3 = newValue.split('T')[0];
          } else {
            params.data.info.date3 = newValue;
          }
        } else {
          params.data.info.date3 = null;
        }
        return true;
      },
      cellStyle: (params) => {
        const error = params.data._validationError;
        // Chỉ bôi đỏ nếu có lỗi liên quan đến Date Field 3
        const hasDateError = error?.errors?.some(err => err.includes('Date Field 3'));
        return { 
          backgroundColor: hasDateError ? '#fff2f0' : 'inherit',
          color: hasDateError ? '#ff4d4f' : 'inherit'
        };
      },
      cellEditor: 'agDateCellEditor',
      cellEditorParams: {
        format: 'yyyy-mm-dd',
        min: '1900-01-01',
        max: '2100-12-31'
      },
      ...filter()
    },
    {
      headerName: 'Trạng thái',
      field: 'validation',
      pinned: 'left',
      width: 250,
      cellRenderer: ValidationCellRenderer,
      ...filter()
    }
  ], []);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileExcelOutlined style={{ color: '#52c41a' }} />
          <span>Import dữ liệu từ Excel</span>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      width="90%"
      style={{ maxWidth: '1800px' }}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Hủy
        </Button>,
        <Button 
          key="template" 
          icon={<DownloadOutlined />}
          onClick={handleExportTemplate}
        >
          Xuất mẫu
        </Button>,
        <Button 
          key="validate" 
          icon={<CheckCircleOutlined />}
          onClick={handleRevalidate}
          disabled={importData.length === 0}
          danger
          style={{ 
            color: importData.length === 0 ? undefined : '#fff',
            backgroundColor: importData.length === 0 ? undefined : '#ff4d4f'
          }}
        >
          Kiểm tra
        </Button>,
        <Button 
          key="import" 
          type="primary" 
          loading={loading}
          disabled={importData.length === 0 || validationErrors.length > 0}
          onClick={handleImport}
        >
          Import ({importData.length - validationErrors.length}/{importData.length} dòng)
        </Button>
      ]}
    >
      {/* <div style={{ marginBottom: '16px' }}>
        <Paragraph>
          <Text strong>Hướng dẫn:</Text>
        </Paragraph>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Tải file mẫu để xem định dạng dữ liệu</li>
          <li>Điền dữ liệu theo đúng format trong file mẫu</li>
          <li><strong>Email</strong> là trường bắt buộc và phải đúng định dạng</li>
          <li><strong>Tên khách hàng</strong> là trường bắt buộc</li>
          <li><strong>Chức năng:</strong> Nếu email chưa tồn tại → Thêm mới, nếu email đã có → Cập nhật thông tin</li>
          <li><strong>Cập nhật các trường:</strong> Name, Company, Số điện thoại, Ghi chú, Group 1-10, Text Field 1-10, Date Field 1-3, Kịch bản chăm sóc</li>
          <li><strong>Lưu ý quan trọng:</strong> Chỉ những trường có dữ liệu mới được cập nhật. Trường trống sẽ không thay đổi dữ liệu hiện tại</li>
          <li><strong>Group 1-10:</strong> Có thể chọn nhiều giá trị, dùng dấu phẩy ngăn cách (VD: "VIP, Premium")</li>
          <li><strong>Text Field 1-10:</strong> Các cột text tự do, có thể nhập bất kỳ thông tin nào (VD: Địa chỉ, Nghề nghiệp, Sở thích...)</li>
          <li><strong>Date Field 1-3:</strong> Các cột ngày tháng, chỉ hỗ trợ format YYYY-MM-DD (VD: 2024-01-15)</li>
          <li>Upload file Excel (.xlsx, .xls) để import</li>
          <li><strong>✨ Chỉnh sửa trực tiếp:</strong> Click đúp vào ô để chỉnh sửa dữ liệu ngay trong bảng</li>
          <li><strong>🔍 Kiểm tra:</strong> Sau khi chỉnh sửa, nhấn nút "Kiểm tra" để validate lại dữ liệu</li>
          <li>Kiểm tra dữ liệu trước khi import</li>
        </ul>
      </div> */}

      <Dragger
        name="file"
        multiple={false}
        fileList={fileList}
        beforeUpload={() => false} // Ngăn upload tự động
        onChange={handleUpload}
        accept=".xlsx,.xls"
        showUploadList={{
          showDownloadIcon: false,
          showRemoveIcon: true,
        }}
        onDrop={(e) => {
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            const file = files[0]; // Chỉ lấy file đầu tiên
            if (file.name.match(/\.(xlsx|xls)$/i)) {
              // Thay thế file cũ bằng file mới
              setFileList([{ ...file, status: 'done', uid: Date.now() }]);
              readExcelFile(file);
            } else {
              message.error('Chỉ hỗ trợ file Excel (.xlsx, .xls)');
            }
          }
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click hoặc kéo thả file Excel vào đây
        </p>
        <p className="ant-upload-hint">
          Hỗ trợ file .xlsx, .xls. Tối đa 1 file.
        </p>
      </Dragger>

      {importData.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <Text strong>Preview dữ liệu ({importData.length} dòng):</Text>
            {validationErrors.length > 0 && (
              <Tag color="error" icon={<ExclamationCircleOutlined />}>
                {validationErrors.length} dòng có lỗi
              </Tag>
            )}
          </div>
          
          {/* Bảng log lỗi chi tiết */}
          {validationErrors.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <Alert
                message={
                  <div>
                    <Text strong style={{ color: '#ff4d4f' }}>
                      <ExclamationCircleOutlined /> Chi tiết lỗi ({validationErrors.length} dòng)
                    </Text>
                  </div>
                }
                description={
            <Table
                    dataSource={validationErrors}
              pagination={false}
              size="small"
                    rowKey="rowIndex"
                    style={{ marginTop: '8px' }}
                    scroll={{ y: 200 }}
                    columns={[
                      {
                        title: 'Dòng',
                        dataIndex: 'rowIndex',
                        width: 70,
                        align: 'center',
                        render: (text) => <Tag color="red">Dòng {text}</Tag>
                      },
                      {
                        title: 'Lỗi',
                        dataIndex: 'errors',
                        render: (errors) => (
                          <div>
                            {errors.map((err, index) => (
                              <div key={index} style={{ marginBottom: '4px' }}>
                                <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                                <Text>{err}</Text>
          </div>
                            ))}
                          </div>
                        )
                      }
                    ]}
                  />
                }
                type="error"
                showIcon={false}
                style={{ marginBottom: '16px' }}
            />
          </div>
          )}
          
          <div 
            className="ag-theme-quartz" 
            style={{ 
              height: '500px',
              width: '100%'
            }}
          >
            <AgGridReact
              ref={gridRef}
              columnDefs={columnDefs}
              rowData={importData}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
                floatingFilter: false
              }}
              getRowStyle={(params) => {
                // Bôi màu nền nhẹ cho toàn bộ dòng có lỗi
                if (params.data._validationError) {
                  return { 
                    backgroundColor: '#fff2f0'
                  };
                }
                return null;
              }}
              suppressRowHoverHighlight={false}
              rowHeight={40}
              headerHeight={40}
              enableRangeSelection={true}
              enableFillHandle={true}
              undoRedoCellEditing={true}
              undoRedoCellEditingLimit={20}
              enableCellChangeFlash={true}
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ImportModal;
