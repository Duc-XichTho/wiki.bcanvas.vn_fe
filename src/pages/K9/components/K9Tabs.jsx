import React from 'react';
import styles from '../K9.module.css';

const K9Tabs = ({ activeTab, onTabChange, tabOptions }) => {
	return (
		<div className={styles.tabsWrapper}>
			<div className={styles.tabs}>
				{tabOptions.map(tab => (
					<button
						key={tab.key}
						className={`${styles.tabBtn} ${activeTab === tab.key ? styles.active : ''}`}
						onClick={() => onTabChange(tab.key)}
					>
						{tab.label}
					</button>
				))}
			</div>
		</div>
	);
};

export default K9Tabs;
