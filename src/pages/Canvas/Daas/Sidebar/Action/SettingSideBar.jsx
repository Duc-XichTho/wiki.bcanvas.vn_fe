import {Modal, Switch, List, Button} from "antd";
import {useEffect, useState} from "react";
import {updateSetting} from "../../../../../apis/settingService.jsx";

export default function SettingSideBar({ open, onClose, data }) {

    const [folderState, setFolderState] = useState(

    );

    useEffect(() => {
        setFolderState(data.setting?.map(item => ({ ...item })) || [])
    }, [data]);

    const handleToggle = (index) => {
        const newFolders = [...folderState];
        newFolders[index].open = !newFolders[index].open;
        setFolderState(newFolders);
    };


    const handleConfirm = async () => {
        if (!data) return;
        const updatedData = {
            ...data,
            setting: folderState
        };
        await updateSetting(updatedData);
        await onClose(updatedData)
    };

    const handleClose = () => {
        setFolderState(data.setting.map(item => ({ ...item })));
        onClose(null);
    };



    return (
        <Modal
            title="Cài Đặt"
            open={open}
            onOk={() => handleConfirm(folderState)}
            onCancel={()=> handleClose(null)}
            footer={null} // Loại bỏ footer mặc định
            width={600}
        >
            <List
                dataSource={folderState}
                renderItem={(item, index) => (
                    <List.Item>
                        <span>{item.name}</span>
                        <Switch checked={item.open}
                                onChange={() => handleToggle(index)}
                                style={{
                                    backgroundColor: item.open ? '#249E57' : '',
                                }}
                        />
                    </List.Item>
                )}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' , gap : '10px' }}>
                <Button onClick={() => handleClose(null)}>Hủy</Button>
                <Button onClick={() => handleConfirm(folderState)}>
                    Xác nhận
                </Button>
            </div>
        </Modal>
    );
}
