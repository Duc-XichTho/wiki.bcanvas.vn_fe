import { useState, useEffect } from 'react';
import css from './CLDaiDuongXanh.module.css';
import Body from './components/Body/Body.jsx';
import { Switch, Dropdown, Button, Modal, Input, Select, message } from 'antd';
import { SettingOutlined, BulbOutlined } from '@ant-design/icons';
import { getFullFileNotePad } from "../../../../apis/fileNotePadService.jsx";
import CompetitiveFactorsGrid from './components/Footer/Footer.jsx';
import React from 'react';
import { getAllPhanTichNote, createPhanTichNote, updatePhanTichNote } from '../../../../apisKTQT/phantichNoteService.jsx';
import { answerSingleQuestion } from '../../../../apis/botService.jsx';
import { MODEL_AI } from '../../../../CONST.js';
import { marked } from 'marked';
import '../Pestel/PestelHighlight.css';

function formatOceanContent(raw) {
	if (!raw) return '';
	return marked.parse(raw);
}

export default function CLDDX() {
	const [showBody, setShowBody] = useState(true);
	const [parentElement, setParentElement] = useState({});
	const [childElements, setChildElements] = useState([]);

	// Modal state
	const [showConfigModal, setShowConfigModal] = useState(false);
	const [aiProvider, setAiProvider] = useState('CLAUDE');
	const [selectedModel, setSelectedModel] = useState(MODEL_AI['CLAUDE'][0].value);
	const [prompt, setPrompt] = useState('');
	const [loading, setLoading] = useState(false);

	// Load prompt config khi mở modal
	useEffect(() => {
		if (showConfigModal) {
			(async () => {
				setLoading(true);
				try {
					const notes = await getAllPhanTichNote();
					const found = notes.find(n => n.table === 'PROMPT_DAI_DUONG_XANH');
					if (found) {
						try {
							const parsed = JSON.parse(found.body);
							setPrompt(parsed.prompt || '');
							if (parsed.provider && parsed.model) {
								setAiProvider(parsed.provider);
								setSelectedModel(parsed.model);
							} else if (parsed.model) {
								// Backward compatibility: if only model, default provider to CLAUDE if model matches, else GPT
								const provider = Object.keys(MODEL_AI).find(p => MODEL_AI[p].some(m => m.value === parsed.model)) || 'CLAUDE';
								setAiProvider(provider);
								setSelectedModel(parsed.model);
							} else {
								setAiProvider('CLAUDE');
								setSelectedModel(MODEL_AI['CLAUDE'][0].value);
							}
						} catch {
							setPrompt('');
							setAiProvider('CLAUDE');
							setSelectedModel(MODEL_AI['CLAUDE'][0].value);
						}
					} else {
						setPrompt('');
						setAiProvider('CLAUDE');
						setSelectedModel(MODEL_AI['CLAUDE'][0].value);
					}
				} catch (e) {
					message.error('Không tải được prompt!');
				}
				setLoading(false);
			})();
		}
	}, [showConfigModal]);

	// Khi đổi provider thì reset model về model đầu tiên của provider đó
	useEffect(() => {
		setSelectedModel(MODEL_AI[aiProvider][0].value);
	}, [aiProvider]);

	// Lưu cấu hình prompt/model
	const handleSaveConfig = async () => {
		setLoading(true);
		try {
			const notes = await getAllPhanTichNote();
			const found = notes.find(n => n.table === 'PROMPT_DAI_DUONG_XANH');
			const configBody = JSON.stringify({ prompt, provider: aiProvider, model: selectedModel });
			if (found) {
				await updatePhanTichNote(found.id, { body: configBody });
			} else {
				await createPhanTichNote({ body: configBody, table: 'PROMPT_DAI_DUONG_XANH' });
			}
			message.success('Đã lưu cấu hình!');
			setShowConfigModal(false);
		} catch (e) {
			message.error('Lưu thất bại!');
		}
		setLoading(false);
	};

	const fetchData = async () => {
		try {
			const data = await getFullFileNotePad();
			const parentElementData = data.find(element => element.name === 'OCEAN_PARENT');
			setParentElement(parentElementData);

			// const childElementsData = data.filter(element => element.name.includes('CLDDX_CHILD_'));
			// setChildElements(childElementsData);
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const toggleBody = () => {
		setShowBody(!showBody);
	};

	// Hàm gọi AI và lưu kết quả vào phanTichNote
	const handleRunAnalysis = async () => {
		try {
			// Lấy prompt/model từ cấu hình
			const notes = await getAllPhanTichNote();
			const config = notes.find(n => n.table === 'PROMPT_DAI_DUONG_XANH');
			const system = ''
			if (!config) {
				message.error('Chưa cấu hình prompt/model!');
				return;
			}
			let prompt = '', model = '', provider = '';
			try {
				const parsed = JSON.parse(config.body);
				prompt = parsed.prompt;
				model = parsed.model;
				provider = parsed.provider;
			} catch {
				message.error('Cấu hình không hợp lệ!');
				return;
			}
			if (!prompt || !model) {
				message.error('Thiếu prompt hoặc model!');
				return;
			}
			// BẮT ĐẦU LOADING
			window.dispatchEvent(new Event('start-ocean-analysis-loading'));
			message.loading({ content: 'Đang phân tích AI...', key: 'ai' });
			const aiRes = await answerSingleQuestion({ prompt, model, system });
			// Lưu kết quả vào phanTichNote (table: 'CONG_CU_DAI_DUONG_XANH')
			const note = notes.find(n => n.table === 'CONG_CU_DAI_DUONG_XANH');
			if (note) {
				await updatePhanTichNote(note.id, { body: aiRes.answer });
			} else {
				await createPhanTichNote({ body: aiRes.answer, table: 'CONG_CU_DAI_DUONG_XANH' });
			}
			message.success({ content: 'Đã lưu kết quả AI!', key: 'ai' });
			// KẾT THÚC LOADING
			window.dispatchEvent(new Event('end-ocean-analysis-loading'));
			// Reload editor (có thể dùng event hoặc state tuỳ ý)
			window.dispatchEvent(new Event('reload-tiptap2-cong-cu-dai-duong-xanh'));
		} catch (e) {
			message.error('Phân tích AI thất bại!');
			window.dispatchEvent(new Event('end-ocean-analysis-loading'));
		}
	};

	return (
		<div className={css.main}>
			<div className={css.header}>
				<span>CL ĐẠI DƯƠNG XANH</span>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					<Dropdown
						menu={{
							items: [
								{
									key: 'config',
									icon: <SettingOutlined style={{ color: '#259c63' }} />,
									label: 'Cấu hình prompt/model Claude',
									onClick: () => setShowConfigModal(true),
								},
								{
									key: 'run',
									label: 'Phân tích Đại dương xanh',
									onClick: handleRunAnalysis,
								},
							],
						}}
						placement="bottomLeft"
						trigger={'click'}
					>
						<Button style={{ width: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
							<SettingOutlined style={{ fontSize: '12px' }} />
						</Button>
					</Dropdown>
					<Switch
						checked={showBody}
						onChange={toggleBody}
						checkedChildren="Show Info"
						unCheckedChildren="Hide Info"
						style={{ backgroundColor: showBody ? '#259C63' : undefined }}
					/>

				</div>
			</div>
			<Modal
				open={showConfigModal}
				onCancel={() => setShowConfigModal(false)}
				title="Cấu hình Claude & Prompt cho Đại Dương Xanh"
				footer={null}
				width={500}
			>
				<div style={{ marginBottom: 16 }}>
					<div style={{ fontWeight: 600, marginBottom: 8 }}>Chọn AI Provider</div>
					<Select
						value={aiProvider}
						onChange={setAiProvider}
						options={Object.keys(MODEL_AI).map(key => ({ value: key, label: key }))}
						style={{ width: 200 }}
					/>
				</div>
				<div style={{ marginBottom: 16 }}>
					<div style={{ fontWeight: 600, marginBottom: 8 }}>Chọn Model</div>
					<Select
						value={selectedModel}
						onChange={setSelectedModel}
						options={MODEL_AI[aiProvider].map(m => ({ value: m.value, label: m.name }))}
						style={{ width: 300 }}
					/>
				</div>
				<div style={{ marginBottom: 16 }}>
					<div style={{ fontWeight: 600, marginBottom: 8 }}>Prompt</div>
					<Input.TextArea
						value={prompt}
						onChange={e => setPrompt(e.target.value)}
						rows={6}
						placeholder="Nhập prompt cho Claude..."
					/>
				</div>
				<Button type="primary" loading={loading} onClick={handleSaveConfig} style={{ width: '100%' }}>
					Lưu cấu hình
				</Button>
			</Modal>
			<div className={css.content}>
				<div className={css.leftContent}>
					<div className={css.footer}>
						<CompetitiveFactorsGrid />
					</div>
				</div>
				{showBody && (
					<div className={css.rightInfo}>
						<Body />
					</div>
				)}
			</div>

		</div>
	);
}
