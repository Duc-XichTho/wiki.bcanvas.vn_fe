import { Button, message, Modal, Tooltip, Upload } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { GROUP_SETTING } from '../../../Consts/GROUP_SETTING.js';
import SettingGroupTable2 from './SettingGroupTable2.jsx';
import css from './SettingGroup.module.css';
import { MyContext } from '../../../MyContext.jsx';
import ActionCreate from '../../Home/AgridTable/actionButton/ActionCreate.jsx';

const SettingGroup = ({table, reload}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [headerName, setHeaderName] = useState(false)
    const [listType, setListType] = useState([])
    const [listCol, setListCol] = useState([])
    const [selectedType, setSelectedType] = useState(null)
    const settingGroupTableRef = useRef(); // Dùng ref để gọi hàm trong component con
    const {
        setIsUpdateNoti,
        isUpdateNoti
    } = useContext(MyContext)
    useEffect(() => {
        GROUP_SETTING.forEach(e => {
            if (e?.table == table) {
                setHeaderName(e.label)
                setListType(e?.setting_type)
            }
        })
    }, [table, isUpdateNoti]);
    const setModalOpen = (value) => {
        setSelectedType(value)
        setIsOpen(true)
    }
    const setModalClose = () => {
        setSelectedType(null)
        setIsOpen(false)
        reload()
    }


    const handleAddNew = () => {
        settingGroupTableRef.current?.addRow();
    };

    // Handle import functionality
    const handleImport = (info) => {
        const { file } = info;
        
        console.log('Import info:', info);
        console.log('File object:', file);
        
        // Get the actual file object
        const fileObj = file.originFileObj || file;
        
        if (fileObj) {
            console.log('File name:', fileObj.name);
            console.log('File type:', fileObj.type);
            console.log('File size:', fileObj.size);
            
            // Call import function from table component
            if (settingGroupTableRef.current?.importData) {
                settingGroupTableRef.current.importData(fileObj);
            } else {
                message.error('Import function not available');
            }
        } else {
            message.error('Không thể đọc file');
        }
    };

    // Handle export functionality
    const handleExport = () => {
        if (settingGroupTableRef.current?.exportData) {
            settingGroupTableRef.current.exportData();
        } else {
            message.info('Export functionality will be implemented');
        }
    };

    // Download template
    const downloadTemplate = () => {
        // Tạo template đẹp với chỉ tên nhóm
        const templateName = selectedType?.type?.includes('kh_') ? 'Kế hoạch' : 'Báo cáo';
        
        // Chỉ lấy cột tên nhóm (thường là cột thứ 2 sau STT)
        const nameColumn = selectedType?.listCol?.find(col => 
            col.field !== 'stt' && 
            (col.field.includes('name') || col.field.includes('ten') || col.headerName.toLowerCase().includes('tên'))
        );
        
        if (nameColumn) {
            const headers = [nameColumn.headerName];
            const sampleData = [
                `${templateName} 1`,
                `${templateName} 2`, 
                `${templateName} 3`,
                `${templateName} 4`,
                `${templateName} 5`
            ];
            
            // Tạo CSV content với BOM để hỗ trợ UTF-8
            const BOM = '\uFEFF';
            const csvContent = [
                headers.join(','),
                ...sampleData.map(data => {
                    // Escape quotes và wrap trong quotes
                    const escapedData = data.toString().replace(/"/g, '""');
                    return `"${escapedData}"`;
                })
            ].join('\r\n');
            
            const blob = new Blob([BOM + csvContent], { 
                type: 'text/csv;charset=utf-8;' 
            });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `Template_${templateName}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            message.success(`Đã tải template ${templateName} thành công!`);
        } else {
            message.warning('Không tìm thấy cột tên nhóm để tạo template');
        }
    };

    return (
        <>
            {(listType && listType?.length > 0) ? listType.map(e => (
                <Button
                    onClick={() => {
                        setModalOpen(e)
                    }}
                >
                    Thiết lập nhóm {e?.type?.includes('kh_') ? `kế hoạch` : `báo cáo`}
                </Button>
            )) : <></>
            }

            <Modal
                title={
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span>{`Cập nhật nhóm ${selectedType?.type?.includes('kh_') ? `kế hoạch - ${headerName}` : `- ${headerName}`}`}</span>
                        <div style={{marginRight: 35, display: 'flex', gap: '8px'}}>
                            <Tooltip title="Tải template mẫu">
                                <Button 
                                    icon={<DownloadOutlined />} 
                                    onClick={downloadTemplate}
                                >
                                    Template
                                </Button>
                            </Tooltip>
                            <Tooltip title="Xuất dữ liệu">
                                <Button 
                                    icon={<DownloadOutlined />} 
                                    onClick={handleExport}
                                >
                                    Xuất
                                </Button>
                            </Tooltip>
                            <Upload
                                accept=".csv"
                                showUploadList={false}
                                onChange={handleImport}
                                beforeUpload={() => false} // Prevent auto upload
                                multiple={false}
                            >
                                <Tooltip title="Import dữ liệu từ file CSV">
                                    <Button 
                                        icon={<UploadOutlined />} 
                                    >
                                        Import
                                    </Button>
                                </Tooltip>
                            </Upload>
                        
                            <ActionCreate handleAddRow={handleAddNew}/>
                        </div>
                    </div>
                }
                className={`${css.modal_group_setting} ${css.customModal}`}
                centered
                open={isOpen}
                onCancel={setModalClose}
                width={1200}
                footer={<>
                    <Button onClick={setModalClose}>Đóng</Button>
                </>}
            >
                <div className={css.container}>
                    {isOpen && <SettingGroupTable2 ref={settingGroupTableRef} selectedType={{...selectedType}}/>}
                </div>
            </Modal>
        </>
    )
}
export default SettingGroup
