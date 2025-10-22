import { Button, Dropdown, message, Modal, Popconfirm, Popover, Table } from 'antd';
import React, {useContext, useEffect, useState} from "react";
import * as XLSX from 'xlsx';
import {ChevronDown} from 'lucide-react';
import {InboxOutlined} from "@ant-design/icons";
import Dragger from "antd/es/upload/Dragger.js";
import {createTemplateRow, deleteTemplateRowByTableId} from "../../../../apis/templateSettingService.jsx";
import {toast} from "react-toastify";
import {handleAddAgl} from "../../functionKTQT/handleAddAgl.js";
import {getCurrentDateTimeWithHours} from "../../functionKTQT/formatDate.js";
import {MyContext} from "../../../../MyContext.jsx";
import {use} from "react";
import {log} from "mathjs";
import {createNewSettingGroup} from "../../../../apisKTQT/settingGroupService.jsx";
import {getAllCompany} from "../../../../apis/companyService.jsx";
import {createNewKmf, updateKmf} from "../../../../apisKTQT/kmfService.jsx";

const DropdownImportDM_KMF = ({table, columnDefs, company, data, title_table, reload, type_setting_group, listGroup, listUnit, groupFieldName}) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isModalImportOpen, setIsModalImportOpen] = useState(false);
    const [isImportChoicePopoverVisible, setIsImportChoicePopoverVisible] = useState(false);
    const [templateColumns, setTemplateColumns] = useState([]);
    const [importColumns, setImportColumns] = useState([]);
    const [importedData, setImportedData] = useState([]);
    let {
        setIsUpdateNoti,
        isUpdateNoti
    } = useContext(MyContext);

    async function exportDanhMucTemplate() {
        if (!columnDefs) return;

        // Filter out action columns and get only visible columns
        const exportColumns = columnDefs.filter(col =>
            !['action', 'id'].includes(col.field) &&
            !col.hide
        );

        // Create headers array
        const headers = exportColumns.map(col => col.headerName || '');

        // Create empty row as template
        const emptyRow = exportColumns.map(() => '');

        // Create worksheet data with headers and empty row
        const wsData = [
            headers,
            emptyRow
        ];

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        const colWidths = headers.map(header => ({
            wch: Math.max(20, (header?.length || 0) * 1.2)
        }));
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Template');

        // Save file
        XLSX.writeFile(wb, `Template_${table}.xlsx`);
    }

    async function exportDanhMucData() {
        if (!columnDefs || !data) return;

        // Filter out action columns and get only visible columns
        const exportColumns = columnDefs.filter(col =>
            !['action', 'id'].includes(col.field) &&
            !col.hide
        );

        // Create headers array
        const headers = exportColumns.map(col => col.headerName || '');

        // Map data to match columns
        const rowsData = data.map(row =>
            exportColumns.map(col => row[col.field] || '')
        );

        // Create worksheet data with headers and rows
        const wsData = [
            headers,
            ...rowsData
        ];

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        const colWidths = headers.map(header => ({
            wch: Math.max(20, (header?.length || 0) * 1.2)
        }));
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Data');

        // Save file
        XLSX.writeFile(wb, `Data_${table}_${company}.xlsx`);
    }

    const items = [
        {
            key: '0',
            label: 'Xuất file mẫu',
            onClick: exportDanhMucTemplate,
        },
        {
            key: '1',
            label: 'Xuất file dữ liệu',
            onClick: exportDanhMucData,
        },
        {
            key: '2',
            label: 'Import dữ liệu',
            onClick: () => {
                setIsModalImportOpen(true);
            },
        },
    ];
    const importChoiceContent = (
        <div
            style={{
                width: '300px',
                height: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
            }}
        >
            <p>Tính năng này sẽ ghi đè dữ liệu hiện tại và thêm mới nếu bản ghi chưa tồn tại và không thể hoản tác!</p>
            <div
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '20px',
                }}
            >
                <Button
                    key="cancel"
                    type="primary"
                    onClick={() => setIsImportChoicePopoverVisible(false)}
                >
                    Huỷ
                </Button>
                
                <Button 
                    key="add" 
                    type="primary" 
                    onClick={() => handleImportChoice('add')}
                >
                    Bắt đầu
                </Button>
            </div>
        </div>
    );

    const handleFileUpload = (file) => {
        const reader = new FileReader();
        const exportColumns = columnDefs.filter(col =>
            !['action', 'id'].includes(col.field) &&
            !col.hide
        );

        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});

            if (jsonData.length > 0) {
                const headers = jsonData[0]
                    .map((header) => (header ? header.trim() : null))
                    .filter((header) => header);

                // Check missing columns using headerName
                const missingColumns = exportColumns
                    .map((column) => column.headerName.trim())
                    .filter(
                        (columnName) => !headers.includes(columnName)
                    );

                if (missingColumns.length > 0) {
                    message.error(`Thiếu các cột bắt buộc: ${missingColumns.join(', ')}`);
                    return;
                }

                const rows = jsonData.slice(1);

                // Map columns using field instead of headerName
                const columns = exportColumns.map((col) => ({
                    title: col.headerName,
                    dataIndex: col.field,
                    key: col.field,
                }));

                // Map data using headerName to field mapping
                const headerToField = {};
                exportColumns.forEach(col => {
                    headerToField[col.headerName.trim()] = col.field;
                });

                const dataSource = rows.map((row, index) => {
                    const rowData = {};
                    headers.forEach((header, i) => {
                        const field = headerToField[header];
                        if (field) {
                            rowData[field] = row[i];
                        }
                    });
                    return {...rowData, key: index};
                });

                setImportColumns(columns);
                setImportedData(dataSource);
                console.log(dataSource)
                message.success('Đọc file thành công!', 2);
            }
        };
        reader.readAsArrayBuffer(file);
    };


    const handleImport = async () => {
        try {
            const listCom = await getAllCompany();
            const existingRecords = data || [];
            const invalidRecords = [];
            const updatedRecords = [];
            const newRecords = [];
            const invalidCompanyRecords = [];
            
            const validCompanyCodes = listCom.map(com => com.code?.toString().trim().toLowerCase());

            // Process and validate records
            importedData.forEach(row => {
                const processedRow = {};
                Object.keys(row).forEach(key => {
                    const value = row[key]?.toString().trim();
                    if (!['code', 'group'].includes(key)) {
                        processedRow[key] = value ? value.toUpperCase() : '';
                    } else {
                        processedRow[key] = value || '';
                    }
                });

                const companyCode = processedRow.company?.toString().trim().toLowerCase();

                // Validate company
                if (!validCompanyCodes.includes(companyCode)) {
                    invalidCompanyRecords.push(`${processedRow.name || 'Không có tên'} (Công ty: ${processedRow.company || 'Không có'})`);
                    return;
                }

                // Validate required fields
                const hasAllFields = processedRow.name?.toString().trim() &&
                    processedRow.company?.toString().trim()

                if (!hasAllFields) {
                    invalidRecords.push(processedRow.name || 'Không có tên');
                    return;
                }

                // Check for existing record
                const existingRecord = existingRecords.find(existingRow =>
                    existingRow.company?.toString().trim().toUpperCase() === processedRow.company &&
                    existingRow.name?.toString().trim().toUpperCase() === processedRow.name
                );

                if (existingRecord) {
                    updatedRecords.push({ ...existingRecord, ...processedRow });
                } else {
                    newRecords.push(processedRow);
                }
            });

            // Handle updates first
            for (const record of updatedRecords) {
                await updateKmf({ ...record, id: record.id });
            }

            // Then handle new records
            for (const record of newRecords) {
                await createNewKmf(record);
            }

            setIsUpdateNoti(!isUpdateNoti);
            reload();

            const summaryMessage = (<>
                <div>Import thành công!</div>
                <div>- <span style={{color:'green'}}>{newRecords.length}</span> bản ghi được thêm mới</div>
                <div>- <span style={{color:'blue'}}>{updatedRecords.length}</span> bản ghi được cập nhật</div>
                <div>- <span style={{color:'red'}}>{invalidRecords.length}</span> bản ghi bị bỏ qua do thiếu thông tin: {invalidRecords.join(', ')}</div>
                <div>- <span style={{color:'red'}}>{invalidCompanyRecords.length}</span> bản ghi bị bỏ qua do mã công ty không hợp lệ: {invalidCompanyRecords.join(', ')}</div>
            </>);
            message.info(summaryMessage, 5);
            setIsImportChoicePopoverVisible(false);
            setTimeout(() => {
                setIsModalImportOpen(false);
                setImportedData([]);
                setImportColumns([]);
            }, 100);
        } catch (error) {
            console.error('Lỗi khi import dữ liệu:', error);
            message.error('Đã xảy ra lỗi khi import dữ liệu!');
        }
    };

    const handleImportChoice = (choice) => {
        if (choice == 'overwrite') {
            alert('Tính năng đang được xây dựng')
        } else {
            handleImport();
        }
    };
    const closeModal = () => {
        setIsModalImportOpen(false)
        setImportedData([])
        setImportColumns([])
    }

    return (
        <>
            <Dropdown
                open={dropdownOpen}
                onClose={() => setDropdownOpen(false)}
                menu={{
                    items: items,
                }}
            >
                <Button onClick={() => setDropdownOpen(prevState => !prevState)}>
                    <ChevronDown size={15}/>
                </Button>
            </Dropdown>
            <Modal
                open={isModalImportOpen}
                title={`Import - ${title_table}`}
                onCancel={closeModal}
                width={800}
                footer={[
                    <Button key="cancel" onClick={closeModal}>
                        Hủy
                    </Button>,

                    <Popconfirm
                        title="Chọn phương thức import"
                        description="Bạn muốn ghi đè dữ liệu hiện tại hay thêm mới?"
                        onConfirm={() => handleImportChoice('add')}
                        onCancel={() => handleImportChoice('overwrite')}
                        okText="Thêm mới"
                        cancelText="Ghi đè"
                        disabled={importedData.length === 0}
                    >
                        <Button
                            key="import"
                            type="primary"
                            disabled={importedData.length === 0}
                        >
                            Import
                        </Button>
                    </Popconfirm>,,
                ]}
            >
                <Dragger
                    accept=".xls,.xlsx" // Chỉ cho phép chọn file Excel
                    beforeUpload={(file) => {
                        handleFileUpload(file);
                        return false; // Ngăn chặn việc tự động upload
                    }}
                    showUploadList={false}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined/> {/* Icon kéo thả */}
                    </p>
                    <p className="ant-upload-text">
                        Kéo và thả file Excel vào đây hoặc nhấn để chọn file
                    </p>
                    <p className="ant-upload-hint">Chỉ hỗ trợ file có định dạng .xls hoặc .xlsx</p>
                </Dragger>
                {importedData.length > 0 && (
                    <Table
                        columns={importColumns}
                        dataSource={importedData}
                        pagination={false}
                        scroll={{x: true}}
                        style={{marginTop: 16, height: '400px', overflow: 'auto'}}
                    />
                )}
            </Modal>
        </>
    );
};

export default DropdownImportDM_KMF;