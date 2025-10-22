import { Button, Input, Modal } from 'antd';
import css from './TemplateDescriptionModal.module.css';

export default function TemplateDescriptionModal({
	isOpen,
	onClose,
	onUpdateDescription,
	currentDescriptionTemplate,
	editingDescription,
	setEditingDescription,
	currentUser,
}) {
	if (!currentDescriptionTemplate) return null;

	return (
		<Modal
			title={
				<div className={css.modalTitle}>
					<span>📝 Mô tả mẫu câu hỏi</span>
				</div>
			}
			open={isOpen}
			onCancel={onClose}
			footer={[
				<Button key='cancel' onClick={onClose}>
					Đóng
				</Button>,
				currentUser?.isAdmin && (
					<Button key='update' type='primary' onClick={onUpdateDescription}>
						Cập nhật mô tả
					</Button>
				),
			].filter(Boolean)}
			width={600}
		>
			<div className={css.modalContent}>
				<div className={css.questionSection}>
					<h4 className={css.sectionTitle}>Câu hỏi:</h4>
					<div className={css.questionDisplay}>
						{currentDescriptionTemplate.question}
					</div>
				</div>

				<div className={css.descriptionSection}>
					<h4 className={css.sectionTitle}>
						{currentUser?.isAdmin ? 'Chỉnh sửa mô tả:' : 'Mô tả:'}
					</h4>
					{currentUser?.isAdmin ? (
						<Input.TextArea
							value={editingDescription}
							onChange={(e) => setEditingDescription(e.target.value)}
							placeholder='Nhập mô tả chi tiết về mẫu câu hỏi này...'
							autoSize={{ minRows: 4, maxRows: 8 }}
							className={css.descriptionTextarea}
						/>
					) : (
						<div className={css.descriptionDisplay}>
							{currentDescriptionTemplate.description || 'Chưa có mô tả cho mẫu câu hỏi này.'}
						</div>
					)}
				</div>

				{currentUser?.isAdmin && (
					<div className={css.adminHint}>
						<p className={css.hintText}>
							💡 <strong>Gợi ý:</strong> Mô tả nên giải thích rõ mục đích và cách sử dụng của mẫu
							câu hỏi này.
						</p>
					</div>
				)}
			</div>
		</Modal>
	);
} 