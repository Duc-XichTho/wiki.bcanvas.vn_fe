import '../../../index.css';
import React, { useContext, useEffect, useRef, useState } from 'react';
import BaoCaoKQKDFS from './BaoCaoKQKDFS.jsx';
import css from '../BaoCao/BaoCao.module.css';
import { MyContext } from '../../../MyContext.jsx';
import { ChartOpen, DisableChart } from '../../../icon/IconSVG.js';
import { getItemFromIndexedDB2, setItemInIndexedDB2 } from '../storage/storageService.js';
import ActionViewSetting from '../ActionButton/ActionViewSetting.jsx';
import ActionSelectTypeBaoCao from '../ActionButton/ActionSelectTypeBaoCao.jsx';
import ActionSelectMonthBaoCao from '../ActionButton/ActionSelectMonthBaoCao.jsx';
import ActionSelectUnitDisplay from '../ActionButton/ActionSelectUnitDisplay.jsx';
import ActionDisplayModeSwitch from '../ActionButton/ActionDisplayModeSwitch.jsx';
import ActionHideEmptyRows from '../ActionButton/ActionHideEmptyRows.jsx';
import ActionToggleSwitch from '../ActionButton/ActionToggleSwitch.jsx';
import ActionToggleSwitch2 from '../ActionButton/ActionToggleSwitch2.jsx';
import { Button, Dropdown } from 'antd';
import { ChevronDown } from 'lucide-react';
import DanhMucPopUpDiaglog from '../detail/DanhMucPopupDialog.jsx';
import ActionMenuDropdown from '../ActionButton/ActionMenuDropdown.jsx';
import ActionModalButton from '../ActionButton/ActionModalButton.jsx';
import AnalysisModal from '../components/AnalysisModal.jsx';

export default function BaoCaoTongQuat({ company }) {
	const table = 'BaoCaoKDTongQuat';
	const [isKQKDOpen, setIsKQKDOpen] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);
	const { currentMonthKTQT, currentYearKTQT, currentCompanyKTQT, currentUser } = useContext(MyContext);
	const [selectedMonth, setSelectedMonth] = useState(currentMonthKTQT);
	const tableStatusButton = 'BCKDTQStatusButton';
	const [isShowView, setShowView] = useState(false);
	const [isShowView2, setShowView2] = useState(false);
	const [isShowAll1, setShowAll1] = useState(false);
	const [isFullView, setIsFullView] = useState(false);
	const [isHideChart, setIsHideChart] = useState(false);
	const [isHideEmptyColumns, setHideEmptyColumns] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
	const [reportData, setReportData] = useState([]);

	useEffect(() => {
		const fetchSettings = async () => {
			const settings = await getItemFromIndexedDB2(tableStatusButton);
			setShowAll1(settings?.isShowAll1 ?? true);
			setIsFullView(settings?.isFullView ?? true);
			setShowView(settings?.isShowView ?? false);
			setShowView2(settings?.isShowView2 ?? true);
			setIsHideChart(settings?.isHideChart ?? false);
			setSelectedMonth(settings?.selectedMonth ?? currentMonthKTQT);
			setHideEmptyColumns(settings?.isHideEmptyColumns ?? true);
		};

		fetchSettings();
	}, []);

	useEffect(() => {
		const saveSettings = async () => {
			const tableSettings = {
				isShowAll1,
				isFullView,
				isShowView,
				isShowView2,
				isHideChart,
				selectedMonth,
				isHideEmptyColumns,
			};
			await setItemInIndexedDB2(tableStatusButton, tableSettings);
		};
		saveSettings();
	}, [isShowView, isShowView2, isShowAll1, isFullView, isHideChart, selectedMonth, isHideEmptyColumns]);


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

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [selectedMonth]);

	const handleSelectedMonthChange = (e) => {
		setSelectedMonth(Number(e));
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

	const [openView, setOpenView] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [selectedType, setSelectedType] = useState(null);

	const handleOpenViewDanhMuc = () => {
		setOpenView(true);
        setSelectedItem('KMF')
        setSelectedType(1)
        setDropdownOpen(false)
	};

	const handleOpenAnalysisModal = () => {
		setIsAnalysisModalOpen(true);
	};

	const handleCloseAnalysisModal = () => {
		setIsAnalysisModalOpen(false);
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
			<div style={{ display: 'flex', width: '100%' }}>
				<div style={{ width: '100%' }}>
					<div className={css.headerPowersheet}>
						<div className={css.headerTitle}>
							<span>Báo cáo KQKD </span>
							<ActionSelectUnitDisplay />
							{/*<div className={`${css.viewItem}`}*/}
							{/*     onClick={handleHideChart}>*/}
							{/*    <img src={isHideChart ? ChartOpen : DisableChart} alt=""/>*/}
							{/*</div>*/}
							{/*<div className={css.toogleChange}>*/}
							{/*	<ActionToggleSwitch2 label='Ẩn dữ liệu trống'*/}
							{/*						 isChecked={isShowAll1 && isHideEmptyColumns}*/}
							{/*						 onChange={toggleSwitch} />*/}
							{/*	/!*<ActionToggleSwitch label="Ẩn dòng trống" isChecked={isShowAll1}*!/*/}
							{/*	/!*                    onChange={handleIsShowAll1}/>*!/*/}
							{/*	<ActionDisplayModeSwitch isChecked={isFullView} onChange={handleViewFull} />*/}
							{/*</div>*/}
						</div>
						<div className={css.headerAction}>
							<ActionSelectTypeBaoCao options={options} handlers={handlers} />
							<ActionModalButton 
								onClick={handleOpenAnalysisModal}
								title="Phân tích AI"
							/>
							{/*<ActionSelectMonthBaoCao selectedMonth={selectedMonth}*/}
							{/*                         handleSelectedMonthChange={handleSelectedMonthChange}/>*/}

							{/*<div>*/}
							{/*	<ActionViewSetting table={table} />*/}
							{/*</div>*/}

							<ActionMenuDropdown popoverContent={popoverContent}
												dropdownOpen={dropdownOpen}
												setDropdownOpen={setDropdownOpen}
							/>
						</div>
					</div>
					<BaoCaoKQKDFS
						isHideEmptyColumns={isHideEmptyColumns}
						show={isShowView}
						company={company}
						isFullView={isFullView}
						isShowAll={isShowAll1}
						selectedMonth={selectedMonth}
						isHideChart={isHideChart}
						onDataChange={setReportData}
					/>
				</div>
				{/*<div className={css.phantich}>*/}
				{/*    /!*<PhanTichNote table = {table}/>*!/*/}
				{/*</div>*/}
				{
					openView && <DanhMucPopUpDiaglog onClose={() => setOpenView(false)}
													 open={openView}
													 view={selectedItem}
													 table={table}
													 type={selectedType}
					/>
				}
				<AnalysisModal
					visible={isAnalysisModalOpen}
					onClose={handleCloseAnalysisModal}
					rowData={reportData}
					selectedMonth={selectedMonth}
					currentYearKTQT={currentYearKTQT}
					currentCompanyKTQT={currentCompanyKTQT}
					currentUser={currentUser}
				/>
			</div>
		</>
	);
};
