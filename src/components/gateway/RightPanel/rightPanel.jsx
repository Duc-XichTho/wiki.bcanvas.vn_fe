import React from 'react';
import styles from './rightPanel.module.css';
// COMPONENT
import MainContent from './mainContent/mainContent';
import ChatContent from './chatContent/chatContent';
// ICON
import { Ticket, MessageSquare } from 'lucide-react';

function RightPanel({ setSelectedTicket, selectedTicket, tags, setTickets, currentUser, userList, permission }) {
	return (
		<div className={styles.mainContainer}>
			{selectedTicket ? (
				<>
					<div className={styles.mainContent}>
						<MainContent
							selectedTicket={selectedTicket}
							tags={tags}
							setTickets={setTickets}
							currentUser={currentUser}
							userList={userList}
							permission={permission}
							setSelectedTicket={setSelectedTicket}
						/>
					</div>
					<div className={styles.chatContent}>
						<ChatContent
							selectedTicket={selectedTicket}
							currentUser={currentUser}
							userList={userList}
						/>
					</div>
				</>
			) : (
				<div className={styles.emptyStateContainer}>
					<div className={styles.emptyState}>
						<div className={styles.emptyStateIcon}>
							<Ticket size={48} />
							<MessageSquare size={48} />
						</div>
						<h2 className={styles.emptyStateTitle}>Không có ticket nào được chọn</h2>
						<p className={styles.emptyStateDescription}>
							Vui lòng chọn một ticket từ danh sách bên trái để xem chi tiết và hội thoại
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

export default RightPanel;
