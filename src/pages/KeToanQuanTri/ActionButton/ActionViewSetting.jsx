import React, { useState } from 'react';
import { Menu, Popover } from 'antd';
import { SettingCardTemplateIcon } from '../../../icon/IconSVG.js';
import css from '../../Home/SubStep/SubStepItem/Mau/Mau.module.css';
import DanhMucPopUpDiaglog from '../detail/DanhMucPopupDialog.jsx';

export default function ActionViewSetting({ table }) {
	const [visible, setVisible] = useState(false);
	const [openView, setOpenView] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [selectedType, setSelectedType] = useState(null);

	const handleMenuClick = (value, type) => {
		setSelectedItem(value);
		setSelectedType(type);
		setOpenView(true);
		setVisible(false);
	};

	const tableOptions = {
		'BaoCaoGroupUnit': [
			{ label: 'Xem KMF', value: 'KMF', type: 1 },
			{ label: 'Xem Đơn vị', value: 'DonVi', type: 1 },
		],
		'Plan': [
			{ label: 'Xem KMF', value: 'KMF', type: 2 },
			{ label: 'Xem Đơn vị', value: 'DonVi', type: 2 },
		],
		'BaoCaoPBNhomSP': [
			{ label: 'Xem KMF', value: 'KMF', type: 1 },
			{ label: 'Xem Sản phẩm', value: 'SanPham', type: 1 },
		],
		'BaoCaoNhomKenh': [
			{ label: 'Xem KMF', value: 'KMF', type: 1 },
			{ label: 'Xem Kênh', value: 'Kenh', type: 1 },
		],
		'BCNhomVV': [
			{ label: 'Xem KMF', value: 'KMF', type: 1 },
			{ label: 'Xem Vụ việc', value: 'Vuviec', type: 1 },
		],
		'BaoCaoKDTongQuat': [
			{ label: 'Xem KMF', value: 'KMF', type: 1 },
		],
		'BaoCaoThuChi': [
			{ label: 'Xem KMNS', value: 'KMNS', type: 1 },
		],

		'TONGQUAT_COMPANY': [
			{ label: 'Xem KMF', value: 'KMF', type: 1 },
		],
		'BaoCaoGroupUnitCanvas': [
			{ label: 'Xem KMF', value: 'KMF', type: 1 },
			{ label: 'Xem Đơn vị', value: 'DonVi', type: 1 },
		],
		'BaoCaoThuChiCanvas': [
			{ label: 'Xem KMNS', value: 'KMNS', type: 1 },
		],
		'BaoCaoPBNhomSPCanvas': [
			{ label: 'Xem KMF', value: 'KMF', type: 1 },
			{ label: 'Xem Sản phẩm', value: 'SanPham', type: 1 },
		],
		'BCNhomVVCanvas': [
			{ label: 'Xem KMF', value: 'KMF', type: 1 },
			{ label: 'Xem Vụ việc', value: 'Vuviec', type: 1 },
		],
		'BaoCaoNhomKenhCanvas': [
			{ label: 'Xem KMF', value: 'KMF', type: 1 },
			{ label: 'Xem Kênh', value: 'Kenh', type: 1 },
		],

	};

	// Lấy các option cho bảng hiện tại dựa trên `table`
	const getOptionsForTable = () => {
		return (tableOptions[table] || []).map(option => (
			<Menu.Item key={option.value} onClick={() => handleMenuClick(option.value, option.type)}>
				{option.label}
			</Menu.Item>
		));
	};

	const content = <Menu className={css.customMenu}>{getOptionsForTable()}</Menu>;

	return (
		<div style={{ display: 'flex', alignItems: 'center' }}>
			<Popover
				content={content}
				trigger='click'
				visible={visible}
				onVisibleChange={(val) => setVisible(val)}
				placement='bottom'
			>
				<img src={SettingCardTemplateIcon} alt='' style={{ cursor: 'pointer' }} />
			</Popover>
			{
				openView && <DanhMucPopUpDiaglog onClose={() => setOpenView(false)}
												 open={openView}
												 view={selectedItem}
												 table={table}
												 type={selectedType}
				/>
			}

		</div>
	);
}
