import React, { useState, useEffect } from 'react';
import { DatePicker } from 'antd';
import dayjs from "dayjs";

export const CustomDatePickerEditor = (props) => {
    const [value, setValue] = useState(props.value ? new Date(props.value) : null);

    const handleChange = (date, dateString) => {
        props.stopEditing(); // Dừng chế độ chỉnh sửa
        props.api.stopEditing(); // Cập nhật giá trị vào grid
        props.node.setDataValue(props.column.colId, dateString);
    };



    return (
        <DatePicker
            value={value ? dayjs(value) : null} // dayjs nếu bạn sử dụng Ant Design >= v5
            format="YYYY-MM-DD" // Định dạng ngày
            onChange={handleChange}
        />
    );
};
