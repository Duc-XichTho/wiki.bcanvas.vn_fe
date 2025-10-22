import { Button, Input, Modal, Switch } from 'antd';
import css from './TemplateEditModal.module.css';

export default function TemplateEditModal({
	isOpen,
	onClose,
	onEditTemplate,
	currentEditTemplate,
	setCurrentEditTemplate,
	newTemplate,
	setNewTemplate,
	templateDescription,
	setTemplateDescription,
	templateCategory,
	setTemplateCategory,
	templateStatus,
	setTemplateStatus,
	editTemplateAutoChart,
	setEditTemplateAutoChart,
	CATEGORY_CONFIG,
	currentUser,
}) {
	if (!currentEditTemplate) return null;

	return (
		<Modal
			title={
				<div className={css.modalTitle}>
					<span>✏️ Chỉnh sửa mẫu câu hỏi</span>
				</div>
			}
			open={isOpen}
			onCancel={onClose}
			footer={[
				<Button key='cancel' onClick={onClose}>
					Hủy
				</Button>,
				<Button key='save' type='primary' onClick={onEditTemplate}>
					Lưu thay đổi
				</Button>,
			]}
			width={700}
		>
			<div className={css.modalContent}>
				<div className={css.questionSection}>
					<h4 className={css.sectionTitle}>Câu hỏi:</h4>
					<Input.TextArea
						value={newTemplate || currentEditTemplate.question}
						onChange={(e) => setNewTemplate(e.target.value)}
						placeholder='Nhập mẫu câu hỏi...'
						autoSize={{ minRows: 3, maxRows: 6 }}
						className={css.questionTextarea}
					/>
				</div>

				<div className={css.categorySection}>
					<h4 className={css.sectionTitle}>Loại câu hỏi:</h4>
					<select
						value={templateCategory}
						onChange={(e) => setTemplateCategory(e.target.value)}
						className={css.categorySelect}
					>
						{CATEGORY_CONFIG.map(({ category, title }) => (
							<option key={category} value={category}>
								{category}: {title}
							</option>
						))}
					</select>
				</div>

				<div className={css.statusSection}>
					<h4 className={css.sectionTitle}>Trạng thái:</h4>
					<select
						value={templateStatus}
						onChange={(e) => setTemplateStatus(e.target.value)}
						className={css.statusSelect}
					>
						<option value='active'>🟢 Hoạt động</option>
						<option value='coming_soon'>🟡 Coming Soon</option>
					</select>
				</div>

				<div className={css.chartSection}>
					<h4 className={css.sectionTitle}>Tự động tạo biểu đồ:</h4>
					<div className={css.chartToggle}>
						<Switch
							checked={editTemplateAutoChart}
							onChange={setEditTemplateAutoChart}
							checkedChildren='Bật'
							unCheckedChildren='Tắt'
							size='small'
						/>
						<span className={css.chartDescription}>
							{editTemplateAutoChart ?
								'✅ Sẽ tự động tạo biểu đồ khi người dùng sử dụng template này' :
								'ℹ️ Chỉ phân tích dữ liệu, không tạo biểu đồ'
							}
						</span>
					</div>
				</div>

				<div className={css.hintSection}>
					<p className={css.hintText}>
						💡 <strong>Gợi ý:</strong> Sử dụng <code>[TÊN_BIẾN]</code> để tạo placeholder. Ví
						dụ: <code>[KHU_VỰC]</code>, <code>[THỜI_GIAN]</code>
					</p>
				</div>
			</div>
		</Modal>
	);
} 