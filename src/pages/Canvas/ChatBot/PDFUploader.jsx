// PDFUploader.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { answerHuggingFile } from '../../../apis/botService.jsx';

const PDFUploader = () => {
	const [file, setFile] = useState(null);
	const [extractedText, setExtractedText] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const handleFileChange = (event) => {
		setFile(event.target.files[0]);
		setError(null);
	};

	const handleUpload = async () => {
		if (!file) {
			setError('Please select a file');
			return;
		}

		const formData = new FormData();
		formData.append('file', file);

		setLoading(true);
		try {
			// Log the FormData content for debugging
			console.log('File being uploaded:', file.name, file.type, file.size);

			const response = await answerHuggingFile(formData);
			console.log(response);
		} catch (error) {
			console.error('Upload error:', error);
			setError(
				error.response?.data?.error ||
				error.message ||
				'Failed to process PDF file'
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			<input type="file" accept=".pdf" onChange={handleFileChange} />
			<button onClick={handleUpload} disabled={!file || loading}>
				{loading ? 'Processing...' : 'Upload and Process PDF'}
			</button>

			{error && <div style={{ color: 'red' }}>{error}</div>}

			{extractedText && (
				<div>
					<h3>Extracted Text:</h3>
					<pre style={{ whiteSpace: 'pre-wrap' }}>{extractedText}</pre>
				</div>
			)}
		</div>
	);
};

export default PDFUploader;