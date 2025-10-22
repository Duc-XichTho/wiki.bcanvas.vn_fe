import css from "../DanhMuc/KeToanQuanTri.module.css";
import React from "react";
import { Popconfirm } from "antd"; // Dùng từ Ant Design

export default function ActionDeleteMany({ handleSaveData, updateData }) {
    return (
        updateData && updateData.length > 0 && (
            <Popconfirm
                title="Bạn có chắc chắn muốn xóa các mục đã chọn?"
                onConfirm={() => handleSaveData(updateData)}
                okText="Xóa"
                cancelText="Hủy"
            >
                <div className={`${css.headerActionButton} ${css.buttonDeleteMany}`}>
                    <div className={css.buttonContent}>
                        <span>Xóa dòng đã chọn</span>
                    </div>
                </div>
            </Popconfirm>
        )
    );
}
