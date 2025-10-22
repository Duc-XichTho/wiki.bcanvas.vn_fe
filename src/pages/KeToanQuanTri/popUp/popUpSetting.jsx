import { Modal, Switch, List, Select } from "antd";
import {useEffect, useState} from "react";
import {updateSetting} from "../../../apis/settingService.jsx";

export default function PopUpSetting({ open, onClose, data, permissions, currentUser }) {
    // Lọc các permission mà user hiện tại có quyền (email nằm trong userAccess)
    const allowedPermissions = currentUser?.isAdmin
        ? (permissions || [])
        : (permissions || []).filter(p => Array.isArray(p.userAccess) && p.userAccess.includes(currentUser?.email));

    // Mặc định chọn userclass đầu tiên mà user có quyền
    const [selectedUserClass, setSelectedUserClass] = useState(allowedPermissions[0]?.id || null);
    // Cấu hình folder cho từng userclass
    const [folderState, setFolderState] = useState([]);

    // Khi đổi userclass, cập nhật folderState theo setting của userclass đó
    useEffect(() => {
        if (!data || !selectedUserClass) return;
        // data.setting là object: { [userClassId]: [ ...folders ] }
        let folders = data.setting?.[selectedUserClass];
        // Nếu chưa có cấu hình cho userclass này, lấy từ userclass đầu tiên có hoặc mảng rỗng
        if (!folders || folders.length === 0) {
            const firstSetting = Object.values(data.setting || {}).find(arr => Array.isArray(arr) && arr.length > 0);
            folders = firstSetting || [];
        }
        setFolderState(folders.map(item => ({ ...item })));
    }, [data, selectedUserClass]);

    // Khi permissions thay đổi, cập nhật userclass mặc định nếu cần
    useEffect(() => {
        if (allowedPermissions.length > 0 && !selectedUserClass) {
            setSelectedUserClass(allowedPermissions[0].id);
        }
    }, [allowedPermissions, selectedUserClass]);

    const handleToggle = (index) => {
        const newFolders = [...folderState];
        newFolders[index].open = !newFolders[index].open;
        setFolderState(newFolders);
    };

    const handleConfirm = async () => {
        if (!data || !selectedUserClass) return;
        // Cập nhật setting cho userclass đang chọn
        const updatedData = {
            ...data,
            setting: {
                ...data.setting,
                [selectedUserClass]: folderState
            }
        };
        await updateSetting(updatedData);
        await onClose(updatedData)
    };

    const handleClose = () => {
        if (!data || !selectedUserClass) return onClose(null);
        setFolderState(data.setting?.[selectedUserClass]?.map(item => ({ ...item })) || []);
        onClose(null);
    };

    return (
        <Modal
            title="Cài Đặt theo từng quyền (userclass)"
            open={open}
            onOk={handleConfirm}
            onCancel={handleClose}
            okText="Xác nhận"
            cancelText="Hủy"
            width={600}
        >
            <div style={{ marginBottom: 16 }}>
                <span>Chọn quyền (userclass): </span>
                <Select
                    style={{ minWidth: 220 }}
                    value={selectedUserClass}
                    onChange={setSelectedUserClass}
                    allowClear
                >
                    {allowedPermissions.map(p => (
                        <Select.Option key={p.id} value={p.id}>{p.name || p.id}</Select.Option>
                    ))}
                </Select>
            </div>
            <List
                dataSource={folderState}
                renderItem={(item, index) => (
                    <List.Item>
                        <span>{item.name}</span>
                        <Switch checked={item.open} onChange={() => handleToggle(index)} />
                    </List.Item>
                )}
            />
        </Modal>
    );
}
