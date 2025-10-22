import React, { useEffect, useRef, useImperativeHandle, useState, forwardRef } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const AntdDatePickerEditor = forwardRef((props, ref) => {
	const { value } = props;
	const inputRef = useRef();
	const [currentValue, setCurrentValue] = useState(value ? dayjs(value) : null);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	useImperativeHandle(ref, () => ({
		getValue: () => {
			return currentValue ? currentValue.toDate().toISOString() : '';
		}
	}));

	const handleChange = (date) => {
		setCurrentValue(date);
		// Không stopEditing ở đây, để user có thể chọn xong mới enter/tab ra ngoài
	};

	return (
		<DatePicker
			ref={inputRef}
			value={currentValue}
			format={props.colDef?.dateFormat === 'MM/DD/YYYY' ? 'MM/DD/YYYY' : 'DD/MM/YYYY'}
			onChange={handleChange}
			style={{ width: '100%' }}
			allowClear
			onBlur={() => props.api.stopEditing()}
		/>
	);
});

export default AntdDatePickerEditor; 