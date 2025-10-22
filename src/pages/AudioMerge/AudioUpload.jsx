import React, { useState } from 'react';

const AudioUpload = () => {
	const [files, setFiles] = useState([]);

	const handleFileChange = (event) => {
		const selectedFiles = Array.from(event.target.files).filter(file =>
			file.type === 'audio/mpeg'
		);
		setFiles(selectedFiles);
		// In AudioUpload.jsx, after setFiles(selectedFiles);
		if (props.onFilesChange) props.onFilesChange(selectedFiles);
	};

	return (
		<div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
			<h3>Upload MP3 Files</h3>
			<input
				type="file"
				accept="audio/mpeg"
				multiple
				onChange={handleFileChange}
				style={{ marginBottom: '20px' }}
			/>
			{files.length > 0 && (
				<div>
					<h4>Uploaded Files:</h4>
					<ul>
						{files.map((file, index) => (
							<li key={index}>{file.name}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
};

export default AudioUpload;