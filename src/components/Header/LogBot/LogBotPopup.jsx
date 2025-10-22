import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import styles from "./LogBotPopup.module.css";
import { getAuditLogs } from '../../../apis/auditLogService';
import { format } from 'date-fns';

const AuditBotPopup = ({ onClose }) => {
    const [auditLogs, setAuditLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const contentRef = useRef(null);

    const loadLogs = async () => {
        if (loading || !hasMore) return;

        try {
            setLoading(true);
            const newLogs = await getAuditLogs(page);

            console.log(newLogs);

            if (newLogs.length < 50) {
                setHasMore(false);
            }

            setAuditLogs(prev => [...prev, ...newLogs]);
            setPage(prev => prev + 1);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const handleScroll = () => {
        if (!contentRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        if (scrollHeight - scrollTop - clientHeight < 50) { // Load more when near bottom
            loadLogs();
        }
    };

    const handleDetailsClick = (log) => {
        setSelectedLog(log);
        setShowDetails(true);
    };

    const DetailModal = ({ log, onClose }) => {
        const oldValues = log.oldValues || {};
        const newValues = log.newValues || {};
        // Get all keys and sort them
        const allKeys = [...new Set([...Object.keys(oldValues), ...Object.keys(newValues)])].sort();

        // Helper function to format values
        const formatValue = (value) => {
            if (value === null) return 'null';
            if (value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value);
        };

        // Filter to only show keys with different values
        const changedKeys = allKeys.filter(key => {
            const oldValue = formatValue(oldValues[key]);
            const newValue = formatValue(newValues[key]);
            return oldValue !== newValue;
        });

        return (
            <div className={styles.detailModal}>
                <div className={styles.detailContent}>
                    <div className={styles.detailHeader}>
                        <h3>Chi tiết thay đổi</h3>
                        <button onClick={onClose} className={styles.closeButton}>×</button>
                    </div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.comparisonTable}>
                            <thead>
                                <tr>
                                    <th>Trường dữ liệu</th>
                                    <th>Giá trị cũ</th>
                                    <th>Giá trị mới</th>
                                </tr>
                            </thead>
                            <tbody>
                                {changedKeys.map(key => (
                                    <tr key={key}>
                                        <td>{key}</td>
                                        <td>{formatValue(oldValues[key])}</td>
                                        <td>{formatValue(newValues[key])}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Rnd
            default={{
                x: window.innerWidth / 2 - 400,
                y: window.innerHeight / 2 - 300,
                width: 800,
                height: 600
            }}
            minWidth={600}
            minHeight={400}
            className={styles.popup}
            dragHandleClassName={styles.popupHeader}
        >
            <div className={styles.popupHeader}>
                <h2>Lịch sử thay đổi</h2>
                <button onClick={onClose} className={styles.closeButton}>×</button>
            </div>

            <div
                className={styles.popupContent}
                ref={contentRef}
                onScroll={handleScroll}
            >
                <table className={styles.auditTable}>
                    <thead>
                        <tr>
                            <th>Thời gian</th>
                            <th>User</th>
                            <th>Hành động</th>
                            <th>Bảng tác động</th>
                            <th>ID dòng</th>
                            <th>Cột thay đổi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLogs.map((log) => (
                            <tr key={log.id}>
                                <td>{format(new Date(log.changed_at), 'dd/MM/yyyy HH:mm:ss')}</td>
                                <td>{log.email}</td>
                                <td>{log.operation}</td>
                                <td>{log.tableName}</td>
                                <td>{log.recordId}</td>
                                <td>
                                    <button
                                        className={styles.detailButton}
                                        onClick={() => handleDetailsClick(log)}
                                    >
                                        Chi tiết
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading && (
                    <div className={styles.loading}>
                        Đang tải...
                    </div>
                )}
            </div>

            {showDetails && selectedLog && (
                <DetailModal
                    log={selectedLog}
                    onClose={() => {
                        setShowDetails(false);
                        setSelectedLog(null);
                    }}
                />
            )}
        </Rnd>
    );
};

export default AuditBotPopup;