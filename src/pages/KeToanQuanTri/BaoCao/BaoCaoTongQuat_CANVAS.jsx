import React, { useContext, useEffect, useRef, useState } from 'react';
import BaoCaoKQKDFS_CANVAS from './BaoCaoKQKDFS_CANVAS.jsx';
import { useParams } from 'react-router-dom';
import css from '../BaoCao/BaoCao.module.css';
// AG GRID
import '../../Home/AgridTable/agComponent.css';
// API
import { getItemFromIndexedDB2, setItemInIndexedDB2 } from '../storage/storageService.js';
// FUNCTION
import ActionToggleSwitch from '../ActionButton/ActionToggleSwitch.jsx';
import ActionViewSetting from '../ActionButton/ActionViewSetting.jsx';
import ActionDisplayModeSwitch from '../ActionButton/ActionDisplayModeSwitch.jsx';
import ActionSelectTypeBaoCao from '../ActionButton/ActionSelectTypeBaoCao.jsx';
import { MyContext } from '../../../MyContext.jsx';
import { getCurrentUserLogin } from '../../../apis/userService.jsx';
import NotAccessible from '../../Canvas/NotAccessible.jsx';
import { KHONG_THE_TRUY_CAP } from '../../../Consts/TITLE_HEADER.js';
import { getPermissionDataCty } from '../../Canvas/getPermissionDataNhomBC.js';
import { CANVAS_DATA_PACK } from '../../../CONST.js';
import ActionSelectCompanyBaoCao from '../ActionButton/ActionSelectCompanyBaoCao.jsx';
import ActionDisplayRichNoteSwitch from '../ActionButton/ActionDisplayRichNoteSwitch.jsx';
import ActionToggleSwitch2 from '../ActionButton/ActionToggleSwitch2.jsx';
import { Button, Dropdown, Popover } from 'antd';
import { ChevronDown } from 'lucide-react';
import DanhMucPopUpDiaglog from '../detail/DanhMucPopupDialog.jsx';
import ActionMenuDropdown from '../ActionButton/ActionMenuDropdown.jsx';

export default function BaoCaoTongQuat_CANVAS() {
	const key = 'TONGQUAT';
	const tableField = key + '_FIELD';
	const table = key + '_COMPANY';
	const { companySelect, id, tabSelect } = useParams();
	const [isKQKDOpen, setIsKQKDOpen] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);
	const tableStatusButton = `BCKDTQStatusButtonCanvas_${id}`;
	const [isShowView, setShowView] = useState(false);
	const [isShowView2, setShowView2] = useState(false);
	const [isShowAll1, setShowAll1] = useState(false);
	const [isFullView, setIsFullView] = useState(tabSelect == 'daas' ? true : false);
	const [isShowInfo, setIsShowInfo] = useState(tabSelect == 'daas' ? true : false);
	const [isHideChart, setIsHideChart] = useState(false);
	const [isHideEmptyColumns, setHideEmptyColumns] = useState(false);
	const [listCom, setListCom] = useState([]);
	const [companySelected, setCompanySelected] = useState([]);
	const [titleName, setTitleName] = useState('');
	const { userClasses, fetchUserClasses, uCSelected_CANVAS } = useContext(MyContext) || {};
	const fetchAndSetTitleName = async () => {
		try {
			const user = await getCurrentUserLogin();
			const listComs = await getPermissionDataCty('cty', user, userClasses, fetchUserClasses, uCSelected_CANVAS);
			if (listComs?.length > 0 || user.data.isAdmin || listComs.some(e => e.code == 'HQ')) {
				setListCom(listComs);
				setTitleName(CANVAS_DATA_PACK.find(e => e.value == key)?.name);
			} else {
				setTitleName(KHONG_THE_TRUY_CAP);
			}

		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu:', error);
		}
	};
	useEffect(() => {
		if (!companySelected && companySelected?.length == 0) {
			setCompanySelected(listCom);
		}
	}, [companySelected]);

	useEffect(() => {
		const fetchSettings = async () => {
			const settings = await getItemFromIndexedDB2(tableStatusButton);
			setShowAll1(settings?.isShowAll1 ?? true);
			setIsFullView(settings?.isFullView ?? true);
			setShowView(settings?.isShowView ?? false);
			setShowView2(settings?.isShowView2 ?? true);
			setIsHideChart(settings?.isHideChart ?? false);
			setIsShowInfo(settings?.isShowInfo ?? false);
			setHideEmptyColumns(settings?.isHideEmptyColumns ?? true);
			setCompanySelected(settings?.companySelected || []);
		};

		fetchSettings();
		fetchAndSetTitleName();

	}, [id]);

	useEffect(() => {
		const tableSettings = {
			companySelected,
			isShowAll1,
			isFullView,
			isShowView,
			isShowView2,
			isHideChart,
			isShowInfo,
			isHideEmptyColumns,
		};
		setItemInIndexedDB2(tableStatusButton, tableSettings);
	}, [isShowView, isShowView2, isShowAll1, isFullView, isHideChart, companySelected, isShowInfo, isHideEmptyColumns]);


	const handleClickView = () => {
		setShowView((prev) => !prev);
		setShowView2(false);
	};
	const handleHideChart = () => {
		setIsHideChart((prev) => !prev);
	};

	const handleClickView2 = () => {
		setShowView2((prev) => !prev);
		setShowView(false);
	};

	const handleIsShowAll1 = () => {
		setShowAll1((prevIsShowAll1) => {
			setHideEmptyColumns(!prevIsShowAll1);
			return !prevIsShowAll1;
		});
	};

	const toggleSwitch = () => {
		handleIsShowAll1();
	};


	const handleClickOutside = (event) => {
		if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
			setIsDropdownOpen(false);
		}
	};

	const handlers = {
		A: () => {
			handleClickView();
		},
		B: () => {
			handleClickView2();
		},

	};

	const options = [
		{ value: 'A', label: 'Nhóm theo bản chất biến phí, định phí', used: isShowView },
		{ value: 'B', label: 'Nhóm khoản mục KQKD dựa theo TK kế toán', used: isShowView2 },
	];

	const handleViewFull = () => {
		setIsFullView(!isFullView);
	};
	const handleShowInfo = () => {
		setIsShowInfo(prevState => !prevState);
	};

	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [openView, setOpenView] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [selectedType, setSelectedType] = useState(null);

	const handleOpenViewDanhMuc = () => {
		setOpenView(true);
		setSelectedItem('KMF');
		setSelectedType(1);
		setDropdownOpen(false);
	};

	const items = [
		{
			key: '0',
			label: (
				<span>{isShowAll1 && isHideEmptyColumns ? '✅ Bật ẩn dữ liệu trống' : '❌ Tắt ẩn dữ liệu trống'}</span>
			),
			onClick: toggleSwitch,
		},
		{
			key: '1',
			label: (
				<span>{isFullView ? '✅ Bật rút gọn' : '❌ Tắt rút gọn'}</span>
			),
			onClick: handleViewFull,
		},
		{
			key: '2',
			label: (
				<span>{isShowInfo ? '✅ Bật ghi chú' : '❌ Tắt ghi chú'}</span>
			),
			onClick: handleShowInfo,
		},
		{
			key: '3',
			label: (
				<span>
                🔄 Xem KMF
            </span>
			),
			onClick: handleOpenViewDanhMuc,
		},
	];

	const popoverContent = (
		<div className={css.popoverContent}>
			{items.map((item) => (
				<div
					key={item.key}
					onClick={item.onClick}
					className={css.popoverItem}
				>
					{item.label}
				</div>
			))}
		</div>
	);

	return (
		<>

			<div className={css.main}>
				<div style={{ width: '100%' }}>
					<NotAccessible NotAccessible={titleName} />
					<div className={css.headerPowersheet}>
						<div className={css.headerTitle}>
                               <span>{titleName}
								   {(companySelected?.length > 0 ? companySelected : []).map((e, index) => (
									   <React.Fragment key={index}>
										   {index == 0 && ` - `}
										   {e.name}
										   {index !== (companySelected?.length > 0 ? companySelected.length : 0) - 1 && ', '}
									   </React.Fragment>
								   ))}
                               </span>
						</div>
					</div>

					<div className={css.headerPowersheet2}>
						<p><img src='/Group%20197.png' alt='Đơn vị: VND'
								style={{ width: '130px', marginLeft: '3px' }} /></p>
						{/*<div className={css.toogleChange}>*/}
						{/*    <ActionToggleSwitch2 label="Ẩn dữ liệu trống" isChecked={isShowAll1 && isHideEmptyColumns}*/}
						{/*                         onChange={toggleSwitch}/>*/}
						{/*    /!*<ActionToggleSwitch label="Ẩn dòng trống" isChecked={isShowAll1}*!/*/}
						{/*    /!*                    onChange={handleIsShowAll1}/>*!/*/}
						{/*    <ActionDisplayModeSwitch isChecked={isFullView} onChange={handleViewFull}/>*/}
						{/*    <ActionDisplayRichNoteSwitch isChecked={isShowInfo} onChange={handleShowInfo}/>*/}
						{/*</div>*/}
						<div className={css.headerAction}>
							<ActionSelectCompanyBaoCao options={listCom} handlers={setCompanySelected}
													   valueSelected={companySelected} />
							<ActionSelectTypeBaoCao options={options} handlers={handlers} />
							{/*<div>*/}
							{/*    <ActionViewSetting table={table}/>*/}
							{/*</div>*/}

							{/*<Dropdown*/}
							{/*	open={dropdownOpen}*/}
							{/*	onClose={() => setDropdownOpen(false)}*/}
							{/*	menu={{*/}
							{/*		items: items,*/}
							{/*	}}*/}
							{/*	trigger={'click'}*/}
							{/*>*/}
							{/*	<Button onClick={() => setDropdownOpen(prevState => !prevState)}*/}
							{/*			className={css.customButton}>*/}
							{/*		<ChevronDown size={15} />*/}
							{/*	</Button>*/}
							{/*</Dropdown>*/}
							<ActionMenuDropdown popoverContent={popoverContent}
												dropdownOpen={dropdownOpen}
												setDropdownOpen={setDropdownOpen}
							/>
						</div>
					</div>
					{
						openView && <DanhMucPopUpDiaglog onClose={() => setOpenView(false)}
														 open={openView}
														 view={selectedItem}
														 table={table}
														 type={selectedType}
						/>
					}


					<BaoCaoKQKDFS_CANVAS
						isShowInfo={isShowInfo}
						isHideEmptyColumns={isHideEmptyColumns}
						show={isShowView}
						isFullView={isFullView}
						isShowAll={isShowAll1}
						isHideChart={isHideChart}
						listCom={companySelected?.length > 0 ? companySelected : []}
					/>
				</div>
			</div>
		</>
	);
};
