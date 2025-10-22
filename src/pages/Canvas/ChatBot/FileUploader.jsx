import React, { useState } from 'react';

function FileUploader({ onFileReady }) {
	const [fileName, setFileName] = useState('');

	const handleChange = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		setFileName(file.name);

		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result.split(',')[1]; // bỏ phần "data:application/pdf;base64,"
			onFileReady(result, file.type);
		};
		reader.readAsDataURL(file);
	};

	return (
		<div>
			<input type="file" onChange={handleChange} />
			{fileName && <p>File đã chọn: {fileName}</p>}
		</div>
	);
}

export default FileUploader;
