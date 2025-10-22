import React, { useState, useEffect, useRef } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const CustomDateTimePickerEditor = (props) => {
  // Lấy params từ cellEditorParams
  const {
    showTime = false,
    format = 'YYYY-MM-DD',
    use12Hours = false,
  } = props.colDef.cellEditorParams || {};

  // Giá trị ban đầu
  const [value, setValue] = useState(
    props.value ? dayjs(props.value) : null
  );
  const pickerRef = useRef();

  useEffect(() => {
    // Tự động focus khi render
    if (pickerRef.current && pickerRef.current.focus) {
      setTimeout(() => pickerRef.current.focus(), 100);
    }
  }, []);

  const handleChange = (date, dateString) => {
    setValue(date);
    // Trả về ISO string hoặc null
    const iso = date ? date.toISOString() : null;
    props.api.stopEditing();
    props.node.setDataValue(props.column.colId, iso);
  };

  return (
    <DatePicker
      ref={pickerRef}
      value={value}
      format={format}
      showTime={showTime ? { format: use12Hours ? 'hh:mm A' : 'HH:mm', use12Hours } : false}
      onChange={handleChange}
      style={{ width: '100%' }}
      autoFocus
      allowClear
      placeholder={showTime ? 'Chọn ngày/giờ' : 'Chọn ngày'}
    />
  );
};

export default CustomDateTimePickerEditor; 