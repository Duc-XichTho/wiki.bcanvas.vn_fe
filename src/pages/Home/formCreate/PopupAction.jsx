import React from "react";
import {Modal, Select} from "antd";
import SoPreOffset from "../AgridTable/SoLieu/SoTaiKhoanDT/SoPreOffset.jsx";
import SoOffset from "../AgridTable/SoLieu/SoTaiKhoanDT/SoOffset.jsx";

const { Option } = Select;

export default function PopupAction({ table, onClose, open, reload, currentUser }) {
    console.log({ table, onClose, open, reload });
    return (
        <Modal
            open={open}
            centered
            onCancel={onClose}
            cancelText={'Hủy'}
            width={1200}
            title="Thêm mới"
            footer={(<></>)}
        >
            {table === "offset-1" && <SoPreOffset/>}
            {table === "offset-2" && <SoOffset/>}
        </Modal>
    );
}
