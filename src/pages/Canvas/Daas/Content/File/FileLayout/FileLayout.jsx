import { useParams } from 'react-router-dom';
import { Tabs } from 'antd';
import { useEffect, useState } from 'react';
import DocAnalyst from '../../DocAnalyst/DocAnalyst.jsx';
import PreviewFile from '../../Preview/PreviewFile.jsx';
import css from './FileLayout.module.css';
import { getFileChildDataById } from '../../../../../../apis/fileChildService.jsx';
import { FileOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

export default function FileLayout() {
	const { idFile } = useParams();
	const [tab, setTab] = useState('preview');
	const [data, setData] = useState();

	// Optional: Lưu tab hiện tại vào sessionStorage để giữ sau khi reload
	useEffect(() => {
		if (idFile) {
			const tab = sessionStorage.getItem('tab');
			if (tab) {
				setTab(tab);
			} else {
				setTab('preview');
			}
		}
		fetchDataFileChild(idFile)
	}, [idFile]);

	const fetchDataFileChild = async () => {
		try {
			const value = await getFileChildDataById(idFile);
			if (value?.id) {
				if (value.url) {
					value.url = encodeURI(value.url);
				}
				setData(value);
			}
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu file con:', error);
		}
	};
	const handleTabChange = (key) => {
		setTab(key);
		sessionStorage.setItem('tab', key);
	};

	const isEncoded = (str) => {
		// Kiểm tra các ký tự bất thường hoặc mã hóa đặc biệt
		return /%[0-9A-F]{2}|\\x[0-9A-F]{2}|Ã|Â|Â|¼|½|¾|¿/.test(str);
	};

	const fixEncoding = (str) => {
		if (!isEncoded(str)) return str; // Nếu không bị mã hóa thì trả về nguyên bản

		try {
			const bytes = new Uint8Array([...str].map(char => char.charCodeAt(0)));
			const decoded = new TextDecoder('utf-8').decode(bytes);
			return decoded;
		} catch {
			return str;
		}
	};

	return (
		<div className={css.main}>
			<div className={css.header}>
				<div className={css.headerContainer}>
					<div className={css.headerContent}>
						{data?.name && (
							<div className={css.fileNameContainer}>
								<FileOutlined style={{ fontSize: '18px', color: '#666' }} />

								<span className={css.fileName}>
									{fixEncoding(data?.name)}
								</span>
							</div>
						)}
						<Tabs 
							activeKey={tab} 
							onChange={handleTabChange}
							className={css.tabs}
						>
							<TabPane tab='Preview File' key='preview' />
							<TabPane tab='Document AI Assistant' key='phan-tich' />
						</Tabs>
					</div>
				</div>
			</div>

			<div className={css.content}>
				{/* Cách này giữ cả 2 component luôn tồn tại, chỉ ẩn hiện bằng CSS */}
				<div style={{ display: tab === 'preview' ? 'inline-block' : 'none', height: '100%', width: '100%' }}>
					<PreviewFile  />
				</div>
				<div style={{ display: tab === 'phan-tich' ? 'inline-block' : 'none', height: '100%', width: '100%' }}>
					<DocAnalyst  />
				</div>
			</div>
		</div>
	);
}

