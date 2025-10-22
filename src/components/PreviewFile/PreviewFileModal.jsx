import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'antd';
import PreviewFile from './PreviewFile';

const PreviewFileModal = ({
							  open,
							  onClose,
							  fileUrl,
							  fileName,
							  title,
						  }) => {
	return (
		<Modal
			title={title || `Preview: ${fileName || 'File'}`}
			open={open}
			onCancel={onClose}
			footer={null}
			width="60vw"
			height='80vh'
			destroyOnClose={true}
		>
			{fileUrl && (
				<PreviewFile
					fileUrl={fileUrl}
					fileName={fileName}
					height="65vh"
					showHeader={false}
					showDownload={true}
				/>
			)}
		</Modal>
	);
};

PreviewFileModal.propTypes = {
	open: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	fileUrl: PropTypes.string,
	fileName: PropTypes.string,
	title: PropTypes.string,
};

export default PreviewFileModal;
