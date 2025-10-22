import {Input, Modal} from "antd";
import React from "react";

export default function EditFileNote({isShowModalChangeName , handleChangeName , setIsShowModalChangeName , setName , name}) {
    return (
        <Modal
            title="Quản lý danh mục"
            open={isShowModalChangeName}
            onOk={handleChangeName}
            onCancel={() => {
                setIsShowModalChangeName(false);
            }}
            okText="Lưu"
            cancelText="Hủy"
        >
            <Input
                placeholder="Nhập tên mới"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{marginBottom: 10}}
            />
        </Modal>
    )
}