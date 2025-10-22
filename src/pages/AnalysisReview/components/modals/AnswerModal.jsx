import React from 'react';
import { Modal, Typography, Space, Divider } from 'antd';

const { Text, Title } = Typography;

const AnswerModal = ({ visible, onCancel, selectedAnswer }) => {
	if (!selectedAnswer) return null;

	return (
		<Modal
			title={`Phân tích: ${selectedAnswer.title}`}
			open={visible}
			onCancel={onCancel}
			footer={null}
			width={800}
			style={{ top: '10vh' }}
		>
			<Space direction="vertical" style={{ width: '100%' }} size="large">
				{selectedAnswer.prompt && (
					<div>
						<Title level={5} style={{ margin: 0, marginBottom: 8 }}>
							Prompt:
						</Title>
						<div style={{
							padding: '12px',
							backgroundColor: '#f5f5f5',
							borderRadius: '6px',
							border: '1px solid #e0e0e0',
							fontSize: '14px',
							lineHeight: '1.6',
							whiteSpace: 'pre-wrap',
						}}>
							{selectedAnswer.prompt}
						</div>
					</div>
				)}

				{selectedAnswer.answer && (
					<div>
						<Title level={5} style={{ margin: 0, marginBottom: 8 }}>
							Answer:
						</Title>
						<div style={{
							padding: '12px',
							backgroundColor: '#f8f9fa',
							borderRadius: '6px',
							border: '1px solid #e0e0e0',
							fontSize: '14px',
							lineHeight: '1.6',
							whiteSpace: 'pre-wrap',
						}}>
							{selectedAnswer.answer}
						</div>
					</div>
				)}

				{!selectedAnswer.prompt && !selectedAnswer.answer && (
					<div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
						<Text>Không có dữ liệu phân tích</Text>
					</div>
				)}
			</Space>
		</Modal>
	);
};

export default AnswerModal; 