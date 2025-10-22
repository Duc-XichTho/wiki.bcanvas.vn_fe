import css from "./HeaderDM.module.css";
import * as React from "react";
import {useContext, useState, useEffect} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import { Bell } from 'lucide-react';
import { Badge, Tooltip, Modal, message } from 'antd';
import { io } from 'socket.io-client';
import { getTemplateInfoByTableId } from "../../../apis/templateSettingService";
import ProfileSelect from "../../Home/SelectComponent/ProfileSelect.jsx";
import { BackCanvas, ICON_CROSSROAD_LIST } from '../../../icon/svg/IconSvg.jsx';
import {MyContext} from "../../../MyContext.jsx";
import DataPermission from "../DataPermission.jsx";
import { getSettingByType, getSchemaTools } from "../../../apis/settingService.jsx";
import { getAuditLogs, getCountAuditLogByTableName } from "../../../apis/auditLogService.jsx";
import AuditLogViewer from "../../AnalysisReview/components/AuditLogViewer";

export default function HeaderDM() {
    const navigate = useNavigate();
    const Theme = localStorage.getItem('theme');
    const {currentUser, } = useContext(MyContext);
    const [isDataPermissionOpen, setIsDataPermissionOpen] = useState(false);
    const [nameTable, setNameTable] = useState(null);
    const [tool, setTool] = useState(null);
    const [masterTool, setMasterTool] = useState(null);
    const [auditLogCounts, setAuditLogCounts] = useState({
        TemplateData: 0,
        TemplateTable: 0,
        ApprovedVersionItem: 0
    });
    const [totalAuditLogs, setTotalAuditLogs] = useState(0);
    const [auditLogModalVisible, setAuditLogModalVisible] = useState(false);
    const location = useLocation();
    const socketRef = React.useRef(null);
    const seenNotiKeysRef = React.useRef(new Set());
    const lastShownAtRef = React.useRef(new Map());

    // Hàm kết hợp với thông tin từ schema master
    const combineWithMasterInfo = async (currentTool) => {
        try {
            const masterResponse = await getSchemaTools('master');
            const masterAppsList = masterResponse?.setting || [];
            
            if (masterAppsList && masterAppsList.length > 0) {
                const masterApp = masterAppsList.find(masterApp => masterApp.id === currentTool.id);
                if (masterApp) {
                    return {
                        ...currentTool,
                        name: masterApp.name,
                        icon: masterApp.icon
                    };
                }
            }
            return currentTool;
        } catch (error) {
            console.error('Error getting master apps for header:', error);
            return currentTool;
        }
    };

    const getDashboardSetting = async () => {
        try {
            const res = await getSettingByType('DASHBOARD_SETTING');
            if (res.setting.length > 0) {
                let dashboardSetting = res.setting.find(item => location.pathname.includes(item.id));
                if (dashboardSetting) {
                    // Kết hợp với thông tin từ schema master
                    const combinedTool = await combineWithMasterInfo(dashboardSetting);
                    setNameTable(combinedTool.name);
                    setTool(combinedTool);
                    setMasterTool(combinedTool);
                }
                else {
                    setNameTable('DATA MANAGER');
                }
            }
        } catch (error) {
            console.log('error', error);
        }
    }

    // Fetch audit log counts for all tables
    const fetchAuditLogCounts = async () => {
        try {
            let logs = await getAuditLogs();
            const tableNames = ['TemplateData', 'TemplateTable', 'ApprovedVersionItem'];
            const promises = tableNames.map(tableName => getCountAuditLogByTableName(tableName));
            const results = await Promise.all(promises);
            
            const counts = {};
            let total = 0;
            tableNames.forEach((tableName, index) => {
                counts[tableName] = results[index] || 0;
                total += results[index] || 0;
            });
            
            setAuditLogCounts(counts);
            setTotalAuditLogs(total);
        } catch (error) {
            console.error('Error fetching audit log counts:', error);
        }
    };

    useEffect(() => {
        getDashboardSetting();
    }, [currentUser, location]);

    useEffect(() => {
        fetchAuditLogCounts();
    }, []);

    // Socket: listen for autorun complete and toast (only on data-manager pages)
    useEffect(() => {
        const inDataManager = location.pathname.includes('data-manager');
        if (inDataManager) {
            try {
                const backendUrl = import.meta.env.VITE_API_URL;
                if (!backendUrl) return;
                if (!socketRef.current) {
                    socketRef.current = io(backendUrl, {
                      path: '/socket.io',
                      transports: ['websocket', 'polling'],
                      withCredentials: true,
                      reconnection: true,
                      reconnectionAttempts: 5,
                      timeout: 10000
                    });
                  }

                const handler = async (payload) => {
                    try {
                        if (!payload) return;
                        const templateInfo = await getTemplateInfoByTableId(payload.templateId);
                        const name = templateInfo?.name || payload.templateId;
                        const notiKey = `${payload.templateId}|${payload.completedAt}`;
                        if (seenNotiKeysRef.current.has(notiKey)) return;
                        seenNotiKeysRef.current.add(notiKey);

                        const now = Date.now();
                        const last = lastShownAtRef.current.get(payload.templateId) || 0;
                        if (now - last < 4000) return;
                        lastShownAtRef.current.set(payload.templateId, now);

                        const msgKey = `autorun_${payload.templateId}`;
                        message.open({ key: msgKey, type: 'success', content: `Dữ liệu của bảng (${name}) vừa được cập nhật tự động. Bấm Refresh để thể hiện dữ liệu mới nhất.`, duration: 4 });
                        
                        // Emit custom event để trigger refresh trong ShowData
                        const refreshEvent = new CustomEvent('autorunDataUpdated', {
                            detail: { templateId: payload.templateId, templateName: name }
                        });
                        window.dispatchEvent(refreshEvent);
                    } catch (_) {}
                };

                socketRef.current.off('autorun_complete');
                socketRef.current.on('autorun_complete', handler);

                return () => {
                    try { socketRef.current && socketRef.current.off('autorun_complete'); } catch (_) {}
                };
            } catch (_) {}
        } else {
            try {
                if (socketRef.current) {
                    socketRef.current.off('autorun_complete');
                    socketRef.current.disconnect();
                    socketRef.current = null;
                }
                seenNotiKeysRef.current.clear();
            } catch (_) {}
        }
    }, [location]);

    const getIconSrcById = (tool) => {
        const found = ICON_CROSSROAD_LIST.find(item => item.id == tool.icon);
        return found ? found.icon : undefined;
    };

    const handleAuditLogClick = () => {
        // Mở modal hiển thị tất cả các loại audit log
        setAuditLogModalVisible(true);
    };

    return (
        <>
            <div className={css.navContainer} style={{ backgroundColor: Theme === 'dark' ? '#1E2A3B' : '#f0f0f0' }}>
                <div className={css.header_left}>
                    <div className={css.backCanvas}
                         onClick={() =>
                             navigate('/dashboard')
                         }
                         style={{ backgroundColor: Theme === 'dark' ? 'transparent' : '#fff' ,
                            boxShadow: Theme === 'dark' ? 'none' : '0 0 10px 0 rgba(0, 0, 0, 0.1)'
                         }}
                    >
                        <BackCanvas height={Theme === 'dark' ? 25 : 20} width={Theme === 'dark' ? 25 : 20} color={Theme === 'dark' ? '#fff' : '#454545'}/>
                    </div>
                    {masterTool && (
                        <>
                            {masterTool.icon ? (
                                (() => {
                                    const iconSrc = getIconSrcById(masterTool);
                                    return iconSrc ? (
                                        <img src={iconSrc} alt={masterTool.name} width={30} height={30} />
                                    ) : (
                                        <span style={{ fontSize: '20px' }}>{masterTool.icon}</span>
                                    );
                                })()
                            ) : (
                                <span style={{ fontSize: '20px' }}>🛠️</span>
                            )}
                        </>
                    )}
                    <div className={css.headerLogo} style={{ color: Theme === 'dark' ? '#fff' : '#454545' }}>
                        {masterTool ? masterTool.name : nameTable}
                    </div>
                    {currentUser && (currentUser.isAdmin || currentUser.isEditor || currentUser.isSuperAdmin) &&
                        <button
                            className={css.dataPermissionBtn}
                            onClick={() => setIsDataPermissionOpen(true)}
                        >
                            Phân quyền Data
                        </button>}
                </div>
                <div className={css.header_right}>
                    <div className={css.runningText}></div>
                    {/*<Tooltip title={`Tổng số lượt audit log: ${totalAuditLogs}`}>*/}
                    {/*    <Badge count={totalAuditLogs} offset={[0, 0]}>*/}
                    {/*        <Bell*/}
                    {/*            size={20}*/}
                    {/*            style={{ cursor: 'pointer', marginRight: '8px' }}*/}
                    {/*            onClick={handleAuditLogClick}*/}
                    {/*            color={Theme === 'dark' ? '#fff' : '#262626'}*/}
                    {/*        />*/}
                    {/*    </Badge>*/}
                    {/*</Tooltip>*/}
                    <div className={css.username}>
                        <ProfileSelect />
                    </div>
                </div>
            </div>

            <DataPermission
                isOpen={isDataPermissionOpen}
                onClose={() => setIsDataPermissionOpen(false)}
            />

            {/* Audit Log Modal */}
            <Modal
                // title="Lịch sử thay đổi - Tất cả các loại"
                open={auditLogModalVisible}
                onCancel={() => setAuditLogModalVisible(false)}
                footer={null}
                width="90%"
                style={{ top: 20 }}
                bodyStyle={{ 
                    maxHeight: 'calc(100vh - 200px)', 
                    overflow: 'auto',
                    padding: '24px'
                }}
            >
                {auditLogModalVisible && (
                    <>
                        {console.log('🔍 Opening modal with all audit log types')}
                        <AuditLogViewer tableNames={['TemplateData', 'TemplateTable', 'ApprovedVersionItem']} />
                    </>
                )}
            </Modal>
        </>
    );
}
