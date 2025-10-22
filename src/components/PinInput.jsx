import React, { useRef, useState, useEffect } from 'react';

const PinInput = ({ length = 6, value = '', onChange, autoFocus = false }) => {
	const [pins, setPins] = useState(Array(length).fill(''));
	const inputRefs = useRef([]);

	// Cập nhật pins khi value prop thay đổi
	useEffect(() => {
		if (value) {
			const newPins = value.split('').slice(0, length);
			while (newPins.length < length) {
				newPins.push('');
			}
			setPins(newPins);
		} else {
			setPins(Array(length).fill(''));
		}
	}, [value, length]);

	// Auto focus vào ô đầu tiên khi component mount
	useEffect(() => {
		if (autoFocus && inputRefs.current[0]) {
			inputRefs.current[0].focus();
		}
	}, [autoFocus]);

	const handleChange = (index, e) => {
		const val = e.target.value;
		
		// Chỉ cho phép nhập số
		if (val && !/^\d$/.test(val)) {
			return;
		}

		const newPins = [...pins];
		newPins[index] = val;
		setPins(newPins);

		// Gọi onChange callback
		const pinString = newPins.join('');
		if (onChange) {
			onChange(pinString);
		}

		// Auto focus sang ô tiếp theo
		if (val && index < length - 1) {
			inputRefs.current[index + 1]?.focus();
		}

	};

	const handleKeyDown = (index, e) => {
		// Backspace: xóa và quay lại ô trước
		if (e.key === 'Backspace') {
			if (!pins[index] && index > 0) {
				// Nếu ô hiện tại rỗng, quay lại ô trước
				inputRefs.current[index - 1]?.focus();
			} else {
				// Xóa ô hiện tại
				const newPins = [...pins];
				newPins[index] = '';
				setPins(newPins);
				if (onChange) {
					onChange(newPins.join(''));
				}
			}
		}
		// Arrow Left: quay lại ô trước
		else if (e.key === 'ArrowLeft' && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
		// Arrow Right: sang ô sau
		else if (e.key === 'ArrowRight' && index < length - 1) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handlePaste = (e) => {
		e.preventDefault();
		const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
		
		if (pastedData) {
			const newPins = Array(length).fill('');
			pastedData.split('').forEach((char, idx) => {
				if (idx < length) {
					newPins[idx] = char;
				}
			});
			setPins(newPins);
			
			if (onChange) {
				onChange(newPins.join(''));
			}

			// Focus vào ô cuối cùng hoặc ô trống đầu tiên
			const lastFilledIndex = Math.min(pastedData.length - 1, length - 1);
			inputRefs.current[lastFilledIndex]?.focus();
		}
	};

	return (
		<div style={{
			display: 'flex',
			gap: '12px',
			justifyContent: 'center',
			alignItems: 'center'
		}}>
			{pins.map((pin, index) => (
				<input
					key={index}
					ref={(el) => (inputRefs.current[index] = el)}
					type="text"
					inputMode="numeric"
					maxLength={1}
					value={pin}
					onChange={(e) => handleChange(index, e)}
					onKeyDown={(e) => handleKeyDown(index, e)}
					onPaste={handlePaste}
					style={{
						width: '48px',
						height: '56px',
						fontSize: '24px',
						fontWeight: 'bold',
						textAlign: 'center',
						border: '2px solid #d9d9d9',
						borderRadius: '8px',
						outline: 'none',
						transition: 'all 0.3s ease',
						backgroundColor: pin ? '#f0f8ff' : '#fff',
						color: '#262626',
					}}
					onFocus={(e) => {
						e.target.style.borderColor = '#1890ff';
						e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
					}}
					onBlur={(e) => {
						e.target.style.borderColor = '#d9d9d9';
						e.target.style.boxShadow = 'none';
					}}
				/>
			))}
		</div>
	);
};

export default PinInput;

