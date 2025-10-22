import React from 'react';
import { Button, Dropdown, Space, Typography, CheckOutlined } from 'antd';
import styles from '../BusinessMeasurementTab.module.css';

const { Text } = Typography;

const TagFilters = ({
	businessTags,
	storeTags,
	selectedBusinessTags,
	selectedStoreTags,
	setSelectedBusinessTags,
	setSelectedStoreTags,
	showAllBusinessTags,
	showAllStoreTags,
	setShowAllBusinessTags,
	setShowAllStoreTags,
	selectedColors,
	windowWidth,
}) => {
	const handleBusinessTagClick = (tag) => {
		if (tag === 'All') {
			setSelectedBusinessTags(['All']);
		} else {
			const newTags = selectedBusinessTags.includes(tag)
				? selectedBusinessTags.filter(t => t !== tag)
				: [...selectedBusinessTags.filter(t => t !== 'All'), tag];
			setSelectedBusinessTags(newTags.length === 0 ? ['All'] : newTags);
		}
	};

	const handleStoreTagClick = (tag) => {
		if (tag === 'All') {
			setSelectedStoreTags(['All']);
		} else {
			const newTags = selectedStoreTags.includes(tag)
				? selectedStoreTags.filter(t => t !== tag)
				: [...selectedStoreTags.filter(t => t !== 'All'), tag];
			setSelectedStoreTags(newTags.length === 0 ? ['All'] : newTags);
		}
	};

	const getVisibleBusinessTags = () => {
		const limit = windowWidth <= 480 ? 3 : windowWidth <= 768 ? 4 : 6;
		return showAllBusinessTags ? businessTags : businessTags.slice(0, limit);
	};

	const getVisibleStoreTags = () => {
		const limit = windowWidth <= 480 ? 3 : windowWidth <= 768 ? 4 : 6;
		return showAllStoreTags ? storeTags : storeTags.slice(0, limit);
	};

	const getBusinessTagsLimit = () => {
		return windowWidth <= 480 ? 3 : windowWidth <= 768 ? 4 : 6;
	};

	const getStoreTagsLimit = () => {
		return windowWidth <= 480 ? 3 : windowWidth <= 768 ? 4 : 6;
	};

	return (
		<>
			{/* Business Tags Section */}
			<div className={styles.businessTagsContainer}>
				<div className={styles.businessTagsHeader}>
					<Text type='secondary' className={styles.businessTagsLabel}>
						Function:
					</Text>
					<Space size={4} wrap style={{ flex: 1 }}>
						{getVisibleBusinessTags().map((tag) => (
							<Button
								key={`business-${tag}`}
								type="default"
								size={windowWidth <= 480 ? 'small' : 'small'}
								style={{
									fontSize: windowWidth <= 480 ? '11px' : '12px',
									padding: windowWidth <= 480 ? '2px 6px' : '4px 8px',
									height: windowWidth <= 480 ? '24px' : '28px',
									minWidth: windowWidth <= 480 ? 'auto' : '60px',
									backgroundColor: selectedBusinessTags.includes(tag) ? selectedColors[0]?.color || '#13C2C2' : undefined,
									borderColor: selectedBusinessTags.includes(tag) ? selectedColors[0]?.color || '#13C2C2' : undefined,
									color: selectedBusinessTags.includes(tag) ? 'white' : undefined,
								}}
								onClick={() => handleBusinessTagClick(tag)}
							>
								{tag}
							</Button>
						))}
						{!showAllBusinessTags && businessTags.length > getBusinessTagsLimit() && (
							windowWidth <= 768 ? (
								<Dropdown
									menu={{
										items: businessTags.slice(getBusinessTagsLimit()).map((tag) => ({
											key: tag,
											label: (
												<div style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
												}}>
													<span>{tag}</span>
													{selectedBusinessTags.includes(tag) &&
														<CheckOutlined
															style={{ color: selectedColors[0]?.color || '#13C2C2' }} />}
												</div>
											),
											onClick: () => handleBusinessTagClick(tag),
										})),
									}}
									trigger={['click']}
									placement='bottomLeft'
								>
									<Button
										size={windowWidth <= 480 ? 'small' : 'small'}
										style={{
											fontSize: windowWidth <= 480 ? '11px' : '12px',
											padding: windowWidth <= 480 ? '2px 6px' : '4px 8px',
											height: windowWidth <= 480 ? '24px' : '28px',
										}}
									>
										+{businessTags.length - getBusinessTagsLimit()}
									</Button>
								</Dropdown>
							) : (
								<Button
									size={windowWidth <= 480 ? 'small' : 'small'}
									style={{
										fontSize: windowWidth <= 480 ? '11px' : '12px',
										padding: windowWidth <= 480 ? '2px 6px' : '4px 8px',
										height: windowWidth <= 480 ? '24px' : '28px',
									}}
									onClick={() => setShowAllBusinessTags(true)}
								>
									+{businessTags.length - getBusinessTagsLimit()}
								</Button>
							)
						)}
						{showAllBusinessTags && (
							<Button
								size={windowWidth <= 480 ? 'small' : 'small'}
								style={{
									fontSize: windowWidth <= 480 ? '11px' : '12px',
									padding: windowWidth <= 480 ? '2px 6px' : '4px 8px',
									height: windowWidth <= 480 ? '24px' : '28px',
								}}
								onClick={() => setShowAllBusinessTags(false)}
							>
								Thu gọn
							</Button>
						)}
					</Space>
				</div>
			</div>

			{/* Store Tags Section */}
			<div style={{
				flex: windowWidth <= 768 ? '1' : '1',
				minWidth: windowWidth <= 768 ? 'auto' : '200px',
			}}>
				<div style={{
					display: 'flex',
					alignItems: 'center',
					gap: 8,
					marginBottom: 8,
					flexWrap: 'wrap',
				}}>
					<Text type='secondary' style={{
						fontSize: windowWidth <= 480 ? 11 : 12,
						fontWeight: 500,
						whiteSpace: 'nowrap',
					}}>
						Unit:
					</Text>
					<Space size={4} wrap style={{ flex: 1 }}>
						{getVisibleStoreTags().map((tag) => (
							<Button
								key={`store-${tag}`}
								type="default"
								size={windowWidth <= 480 ? 'small' : 'small'}
								style={{
									fontSize: windowWidth <= 480 ? '11px' : '12px',
									padding: windowWidth <= 480 ? '2px 6px' : '4px 8px',
									height: windowWidth <= 480 ? '24px' : '28px',
									minWidth: windowWidth <= 480 ? 'auto' : '60px',
									backgroundColor: selectedStoreTags.includes(tag) ? selectedColors[0]?.color || '#13C2C2' : undefined,
									borderColor: selectedStoreTags.includes(tag) ? selectedColors[0]?.color || '#13C2C2' : undefined,
									color: selectedStoreTags.includes(tag) ? 'white' : undefined,
								}}
								onClick={() => handleStoreTagClick(tag)}
							>
								{tag}
							</Button>
						))}
						{!showAllStoreTags && storeTags.length > getStoreTagsLimit() && (
							windowWidth <= 768 ? (
								<Dropdown
									menu={{
										items: storeTags.slice(getStoreTagsLimit()).map((tag) => ({
											key: tag,
											label: (
												<div style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
												}}>
													<span>{tag}</span>
													{selectedStoreTags.includes(tag) &&
														<CheckOutlined
															style={{ color: selectedColors[0]?.color || '#13C2C2' }} />}
												</div>
											),
											onClick: () => handleStoreTagClick(tag),
										})),
									}}
									trigger={['click']}
									placement='bottomLeft'
								>
									<Button
										size={windowWidth <= 480 ? 'small' : 'small'}
										style={{
											fontSize: windowWidth <= 480 ? '11px' : '12px',
											padding: windowWidth <= 480 ? '2px 6px' : '4px 8px',
											height: windowWidth <= 480 ? '24px' : '28px',
										}}
									>
										+{storeTags.length - getStoreTagsLimit()}
									</Button>
								</Dropdown>
							) : (
								<Button
									size={windowWidth <= 480 ? 'small' : 'small'}
									style={{
										fontSize: windowWidth <= 480 ? '11px' : '12px',
										padding: windowWidth <= 480 ? '2px 6px' : '4px 8px',
										height: windowWidth <= 480 ? '24px' : '28px',
									}}
									onClick={() => setShowAllStoreTags(true)}
								>
									+{storeTags.length - getStoreTagsLimit()}
								</Button>
							)
						)}
						{showAllStoreTags && (
							<Button
								size={windowWidth <= 480 ? 'small' : 'small'}
								style={{
									fontSize: windowWidth <= 480 ? '11px' : '12px',
									padding: windowWidth <= 480 ? '2px 6px' : '4px 8px',
									height: windowWidth <= 480 ? '24px' : '28px',
								}}
								onClick={() => setShowAllStoreTags(false)}
							>
								Thu gọn
							</Button>
						)}
					</Space>
				</div>
			</div>
		</>
	);
};

export default TagFilters;
