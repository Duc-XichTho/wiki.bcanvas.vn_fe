import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Button, Input, message, Select, Table } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { createNewSettingGroup, getAllSettingGroup } from '../../../apisKTQT/settingGroupService';
import { getCurrentDateTimeWithHours } from '../functionKTQT/formatDate';
import { handleSaveAgl } from '../functionKTQT/handleSaveAgl.js';
import PopupDeleteRenderer from '../popUp/popUpDelete.jsx';
import css from './SettingGroup.module.css';

const SettingGroupTable2 = forwardRef(({ selectedType }, ref) => {
    const table = 'SettingGroupTable';
    const [dataSource, setDataSource] = useState([]);
    const [loading, setLoading] = useState(false);
    const fetchSettingGroupTable = async () => {
        setLoading(true);
        const data = await getAllSettingGroup();
        const filteredData = data.filter(e => e?.type === selectedType?.type).sort((a, b) => a.stt - b.stt);;
        setDataSource(filteredData);
        setTimeout(() => setLoading(false), 300);
    };


    useEffect(() => {
        fetchSettingGroupTable();
    }, [selectedType]);

    const moveRow = async (index, direction) => {
        const newData = [...dataSource];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newData.length) return;
        const currentStt = newData[index].stt;
        const targetStt = newData[targetIndex].stt;
        [newData[index], newData[targetIndex]] = [newData[targetIndex], newData[index]];
        newData[index].stt = currentStt;
        newData[targetIndex].stt = targetStt;
        setDataSource(newData);

        await handleSaveAgl(newData, table,);

    };

    const handleChange = async (value, record, field) => {
        const newData = dataSource.map(item =>
            item.id === record.id ? {...item, [field]: value} : item
        );
        setDataSource(newData);
        await handleSaveAgl(newData, table);

    };

    const handleAddRow = async () => {
        const newItem = {
            stt: dataSource.length + 1,
            createAt: getCurrentDateTimeWithHours(),
            type: selectedType?.type,
            show: true,
        };
        await createNewSettingGroup(newItem);
        await fetchSettingGroupTable();
    };

    // Export data to CSV
    const exportData = () => {
        if (dataSource.length === 0) {
            message.warning('Không có dữ liệu để xuất');
            return;
        }

        // Chỉ xuất cột tên nhóm
        const nameColumn = selectedType?.listCol?.find(col => 
            col.field !== 'stt' && 
            (col.field.includes('name') || col.field.includes('ten') || col.headerName.toLowerCase().includes('tên'))
        );
        
        if (!nameColumn) {
            message.error('Không tìm thấy cột tên nhóm để xuất');
            return;
        }

        const templateName = selectedType?.type?.includes('kh_') ? 'Kế hoạch' : 'Báo cáo';
        
        // Tạo CSV content với BOM để hỗ trợ UTF-8
        const BOM = '\uFEFF';
        const headers = [nameColumn.headerName];
        
        const csvContent = [
            headers.join(','),
            ...dataSource.map(row => {
                const value = row[nameColumn.field] || '';
                // Escape quotes và wrap trong quotes
                const escapedValue = value.toString().replace(/"/g, '""');
                return `"${escapedValue}"`;
            })
        ].join('\r\n');

        // Tạo blob với BOM và encoding đúng
        const blob = new Blob([BOM + csvContent], { 
            type: 'text/csv;charset=utf-8;' 
        });
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Danh_sach_${templateName}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success(`Xuất danh sách ${templateName} thành công!`);
    };

    // Import data from CSV
    const importData = (file) => {
        console.log('Starting import with file:', file);
        console.log('Selected type:', selectedType);
        console.log('List columns:', selectedType?.listCol);
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
            try {
                const csv = e.target.result;
                console.log('CSV content:', csv);
                
                const lines = csv.split('\n').filter(line => line.trim());
                console.log('CSV lines:', lines);
                
                if (lines.length < 2) {
                    message.error('File CSV phải có ít nhất 1 dòng dữ liệu');
                    return;
                }
                
                // Parse CSV more robustly
                const parseCSVLine = (line) => {
                    const result = [];
                    let current = '';
                    let inQuotes = false;
                    
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        if (char === '"') {
                            inQuotes = !inQuotes;
                        } else if (char === ',' && !inQuotes) {
                            result.push(current.trim());
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    result.push(current.trim());
                    return result;
                };
                
                const headers = parseCSVLine(lines[0]);
                console.log('Parsed headers:', headers);
                
                // Tìm cột tên nhóm - mở rộng tìm kiếm
                const nameColumn = selectedType?.listCol?.find(col => {
                    if (col.field === 'stt') return false;
                    
                    // Kiểm tra field name
                    const fieldMatch = col.field && (
                        col.field.toLowerCase().includes('name') || 
                        col.field.toLowerCase().includes('ten') ||
                        col.field.toLowerCase().includes('title') ||
                        col.field.toLowerCase().includes('label')
                    );
                    
                    // Kiểm tra header name
                    const headerMatch = col.headerName && (
                        col.headerName.toLowerCase().includes('tên') ||
                        col.headerName.toLowerCase().includes('name') ||
                        col.headerName.toLowerCase().includes('tiêu đề') ||
                        col.headerName.toLowerCase().includes('nhóm')
                    );
                    
                    return fieldMatch || headerMatch;
                });
                
                console.log('Found name column:', nameColumn);
                
                if (!nameColumn) {
                    message.error('Không tìm thấy cột tên nhóm trong cấu hình. Các cột có sẵn: ' + 
                        selectedType?.listCol?.map(col => col.headerName).join(', '));
                    return;
                }
                
                const importedData = lines.slice(1)
                    .filter(line => line.trim())
                    .map((line, index) => {
                        const values = parseCSVLine(line);
                        console.log(`Line ${index + 1} values:`, values);
                        
                        const newItem = {
                            stt: dataSource.length + index + 1,
                            createAt: getCurrentDateTimeWithHours(),
                            type: selectedType?.type,
                            show: true,
                        };
                        
                        // Map tất cả các cột có sẵn
                        headers.forEach((header, idx) => {
                            const column = selectedType?.listCol?.find(col => 
                                col.headerName === header || 
                                col.headerName.toLowerCase() === header.toLowerCase()
                            );
                            
                            if (column && values[idx] && values[idx] !== '') {
                                newItem[column.field] = values[idx];
                                console.log(`Mapped ${column.field} = ${values[idx]}`);
                            }
                        });
                        
                        return newItem;
                    });

                console.log('Imported data:', importedData);

                if (importedData.length === 0) {
                    message.warning('Không có dữ liệu hợp lệ để import');
                    return;
                }

                // Create each item individually using the same API as handleAddRow
                let successCount = 0;
                let errorCount = 0;
                
                for (const item of importedData) {
                    try {
                        await createNewSettingGroup(item);
                        successCount++;
                    } catch (error) {
                        console.error('Error creating item:', item, error);
                        errorCount++;
                    }
                }
                
                // Refresh data after import
                await fetchSettingGroupTable();
                
                if (errorCount === 0) {
                    message.success(`Import thành công ${successCount} nhóm ${selectedType?.type?.includes('kh_') ? 'kế hoạch' : 'báo cáo'}`);
                    resolve({ success: successCount, error: errorCount });
                } else {
                    message.warning(`Import hoàn thành: ${successCount} thành công, ${errorCount} lỗi`);
                    resolve({ success: successCount, error: errorCount });
                }
            } catch (error) {
                message.error('Lỗi khi import dữ liệu: ' + error.message);
                console.error('Import error:', error);
                reject(error);
            }
        };
        reader.onerror = () => {
            message.error('Lỗi khi đọc file');
            reject(new Error('File read error'));
        };
        reader.readAsText(file, 'UTF-8');
        });
    };


    useImperativeHandle(ref, () => ({
        addRow: handleAddRow,
        fetchData: fetchSettingGroupTable,
        exportData: exportData,
        importData: importData,
    }));

    const columns = [
        ...selectedType?.listCol
            ?.map(col => ({
                title: col.headerName,
                dataIndex: col.field,
                key: col.field,
                width: col.width,
                render: (text, record, index) =>
                    col.field === 'stt' ? (
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <div className={css.moveButtons}>
                                <Button
                                    icon={<ArrowUpOutlined/>}
                                    size="small"
                                    onClick={() => moveRow(index, -1)}
                                    disabled={index === 0}
                                />
                                <Button
                                    icon={<ArrowDownOutlined/>}
                                    size="small"
                                    onClick={() => moveRow(index, 1)}
                                    disabled={index === dataSource.length - 1}
                                />
                            </div>
                        </div>
                    ) : col.options ? (
                        <Select
                            defaultValue={text}
                            style={{width: '100%'}}
                            onChange={(value) => handleChange(value, record, col.field)}
                        >
                            {col.options.map(option => (
                                <Select.Option key={option.value} value={option.value}>
                                    {option.label}
                                </Select.Option>
                            ))}
                        </Select>
                    ) : (
                        <Input
                            defaultValue={text}
                            onChange={(e) => handleChange(e.target.value, record, col.field)}
                        />
                    ),
            })),
        {
            title: 'Xóa',
            key: 'delete',
            align: 'center',
            width: 60,
            render: (_, record) => (
                <PopupDeleteRenderer
                    {...record}
                    id={record.id}
                    table={table}
                    reloadData={fetchSettingGroupTable}
                />
            ),
        }
    ];

    return (
        <div className={css.tableContainer}>
            <Table
                dataSource={dataSource}
                columns={columns}
                rowKey="id"
                pagination={false}
                loading={loading}
                scroll={{y: 400}}
                size="small"
                bordered
            />
        </div>
    );
})
export default SettingGroupTable2;

