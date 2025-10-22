import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTemplateByFileNoteId, getTemplateColumn } from '../../../../../../../apis/templateSettingService.jsx';
import TemplateFormLink from './TemplateFormLink.jsx';
import { getFileNotePadByIdController } from '../../../../../../../apis/fileNotePadService.jsx';

export default function HomeTemplateLink() {
	const { id } = useParams();
	const [templateData, setTemplateData] = useState(null);
	const [fileNoteData, setFileNoteData] = useState(null);
	const [templateColumns, setTemplateColumns] = useState([]);
	const navigate = useNavigate();

	const handleCloseFormModal = () => {
		navigate('/canvas');

	};


	const handleCreate = () => {
	};

	const fetchData = async (id) => {
		const idPasser = Number(id);
		const fileNote = await getFileNotePadByIdController(idPasser);
		setFileNoteData(fileNote);
		const templateInfo = await getTemplateByFileNoteId(fileNote.id);
		const template = templateInfo[0];
		const templateColumn = await getTemplateColumn(template.id);
		setTemplateData(template);
		setTemplateColumns(templateColumn);
	};


	useEffect(() => {
		if (id) {
			fetchData(id);
		}
	}, [id]);


	return (
		<>
			<Modal
				title={
					<span style={{
						fontSize: '28px',
						whiteSpace: 'normal',
						wordWrap: 'break-word',
					}}>{`Nhập liệu ${fileNoteData?.name} `}
					</span>
				}
				open={true}
				footer={null}
				width={800}
				centered
				closable={false}
			>
				<TemplateFormLink
					fileNoteData={fileNoteData}
					templateColumns={templateColumns}
					templateData={templateData}
					fileNoteId={id}
					onSuccess={() => {
						handleCreate();
					}}
					onCancel={handleCloseFormModal}
				/>
			</Modal>
		</>
	);

}