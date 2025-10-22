import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button, Select, Input, message, Spin, Popconfirm, Typography } from 'antd';
import { RobotOutlined, FileTextOutlined, CheckCircleOutlined, DragOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { getAllAIChatHistoryList, createAIChatHistoryList } from '../../../apis/aiChatHistoryListService.jsx';
import { aiGen2 } from '../../../apis/botService.jsx';
import { MODEL_AI_LIST } from '../../../AI_CONST.js';
import css from '../BaoCao/BaoCao.module.css';
import styles from '../../../components/ResourcePanel/ResourcePanel.module.css';
import { getSettingByType } from '../../../apis/settingService.jsx';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AnalysisModalGroupUnit = ({
    visible,
    onClose,
    rowData = [],
    groups = [], // Expects an array of group names, e.g., ['GroupA', 'GroupB']
    currentYearKTQT,
    currentCompanyKTQT,
    currentUser,
    reportType = 'GroupUnit' // 'GroupUnit' or 'GroupMonth'
}) => {
    // Draggable modal states
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const modalRef = useRef(null);

    const [selectedAIModel, setSelectedAIModel] = useState('gpt-5-mini-2025-08-07');
    const [customPrompt, setCustomPrompt] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [hasAnalysis, setHasAnalysis] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [chartColors, setChartColors] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const colorSetting = await getSettingByType('SettingColor');
                if (colorSetting && colorSetting.setting && Array.isArray(colorSetting.setting)) {
                    const colors = colorSetting.setting.map(item => item.color).filter(Boolean);
                    if (colors.length) setChartColors(colors);
                }
            } catch (e) {
                console.error('Error loading chart colors:', e);
            }
        })();
    }, []);

    // Memoize model list để tránh re-render không cần thiết
    const memoizedModelList = useMemo(() => MODEL_AI_LIST, []);

    // Đảm bảo selectedAIModel luôn có giá trị hợp lệ
    useEffect(() => {
        if (!selectedAIModel || !memoizedModelList.find(model => model.value === selectedAIModel)) {
            setSelectedAIModel(memoizedModelList[0]?.value || 'gpt-5-mini-2025-08-07');
        }
    }, [selectedAIModel, memoizedModelList]);

    // Generate default prompt when modal opens and data is available
    useEffect(() => {
        if (visible && rowData.length > 0 && groups.length > 0) {
            const defaultPrompt = `Hãy phân tích báo cáo KQKD theo nhóm đơn vị với các thông tin sau:
- Năm: ${currentYearKTQT}
- Công ty: ${currentCompanyKTQT}
- Loại báo cáo: ${reportType === 'GroupUnit' ? 'Báo cáo KQKD nhóm Đơn vị' : 'Báo cáo KQKD nhóm Đơn vị theo tháng'}
- Các nhóm đơn vị: ${groups.join(', ')}
- Dữ liệu báo cáo: ${rowData.length} khoản mục

Vui lòng đưa ra:
1. Tổng quan về tình hình kinh doanh theo từng nhóm đơn vị.
2. Phân tích hiệu quả hoạt động của từng nhóm đơn vị (doanh thu, chi phí, lợi nhuận).
3. So sánh hiệu quả giữa các nhóm đơn vị.
4. ${reportType === 'GroupMonth' ? 'Phân tích xu hướng theo tháng và lũy kế năm cho từng nhóm.' : 'Phân tích hiệu quả hoạt động theo tháng được chọn.'}
5. Nhận xét và đánh giá hiệu quả hoạt động tổng thể.
6. Đề xuất các biện pháp cải thiện nếu cần.

Hãy trình bày một cách chi tiết, dễ hiểu và có tính thực tiễn.`;
            
            setCustomPrompt(defaultPrompt);
        }
    }, [visible, rowData, groups, currentYearKTQT, currentCompanyKTQT, reportType]);

    // Load analysis history when modal opens
    useEffect(() => {
        const loadAnalysisHistory = async () => {
            if (!visible) return;
            setIsLoadingHistory(true);
            try {
                const allChatHistories = await getAllAIChatHistoryList();
                const existingAnalysis = allChatHistories.find(history => 
                    history.type === 'PHAN_TICH_BAO_CAO' &&
                    history.info?.baoCao === reportType &&
                    history.show === true
                );
                
                if (existingAnalysis && existingAnalysis.chatHistory && existingAnalysis.chatHistory.length > 0) {
                    const lastMessage = existingAnalysis.chatHistory[existingAnalysis.chatHistory.length - 1];
                    if (lastMessage.role === 'assistant') {
                        setAnalysisResult(lastMessage.content);
                        setHasAnalysis(true);
                    }
                }
            } catch (error) {
                console.error('Error loading analysis history:', error);
            } finally {
                setIsLoadingHistory(false);
            }
        };
        loadAnalysisHistory();
    }, [visible, currentYearKTQT, currentCompanyKTQT, reportType]);

    // Hàm lọc dữ liệu để chỉ giữ lại dp và các cột group theo tháng
    const filterDataForAnalysis = (data) => {
        if (!data || !Array.isArray(data)) return [];
        
        // Lấy danh sách các cột group theo tháng
        const groupColumns = [];
        groups.forEach(group => {
            for (let i = 0; i <= 12; i++) { // 0 for cumulative, 1-12 for months
                const columnName = `${group}_${i}`;
                groupColumns.push(columnName);
            }
        });
        
        // Lọc bỏ các cột mà tất cả dòng tổng hợp (layer không có dấu .) đều có giá trị = 0
        const validColumns = groupColumns.filter(columnName => {
            // Lấy tất cả dòng tổng hợp (layer không chứa dấu .)
            const summaryRows = data.filter(row => !row.layer || !row.layer.includes('.'));
            
            // Kiểm tra xem có ít nhất 1 dòng tổng hợp có giá trị khác 0 không
            return summaryRows.some(row => {
                const value = row[columnName];
                return value !== undefined && value !== null && value !== 0;
            });
        });
        
        console.log('Valid columns after filtering:', validColumns);
        
        return data.map(row => {
            const filteredRow = {
                dp: row.dp,
                layer: row.layer
            };
            
            // Chỉ thêm các cột có dữ liệu
            validColumns.forEach(columnName => {
                if (row[columnName] !== undefined) {
                    filteredRow[columnName] = row[columnName];
                }
            });
            
            return filteredRow;
        });
    };

    const handleAnalyze = async () => {
        if (!customPrompt.trim()) {
            message.warning('Vui lòng nhập prompt phân tích');
            return;
        }

        setIsAnalyzing(true);
        try {
            // Lọc dữ liệu để chỉ giữ lại dp và các cột group theo tháng
            const filteredData = filterDataForAnalysis(rowData);
            
            // Log dữ liệu đã lọc
            console.log('=== FILTERED DATA FOR AI ===');
            console.log('Original data length:', rowData.length);
            console.log('Filtered data length:', filteredData.length);
            console.log('Filtered data sample (first 3 rows):', filteredData.slice(0, 3));
            console.log('All filtered data:', filteredData);
            console.log('=== END FILTERED DATA ===');
            
            // Chuẩn bị dữ liệu báo cáo đầy đủ
            const reportData = {
                currentYearKTQT,
                currentCompanyKTQT,
                reportType,
                groups: groups,
                rowData: filteredData,
                summary: {
                    totalItems: filteredData.length,
                    groups: groups.length,
                    revenueItems: filteredData.filter(item => item.dp && item.dp.includes('Doanh Thu')).length,
                    costItems: filteredData.filter(item => item.dp && (item.dp.includes('CF') || item.dp.includes('Chi phí'))).length,
                }
            };

            // Tạo prompt với dữ liệu đầy đủ
            const fullPrompt = `${customPrompt}

Dữ liệu báo cáo chi tiết:
${JSON.stringify(reportData, null, 2)}

Hãy phân tích dữ liệu này một cách toàn diện và đưa ra nhận xét chi tiết.`;

            const response = await aiGen2(
                fullPrompt,
                `Bạn là chuyên gia phân tích tài chính. Hãy phân tích báo cáo KQKD nhóm đơn vị một cách chi tiết và chuyên nghiệp dựa trên dữ liệu được cung cấp.`,
                selectedAIModel,
                'text'
            );
            
            // Xử lý response từ AI
            let analysisContent = '';
            if (response.generated) {
                analysisContent = response.generated;
            } else if (response.response) {
                analysisContent = response.response;
            } else if (response.message) {
                analysisContent = response.message;
            } else if (typeof response === 'string') {
                analysisContent = response;
            } else {
                analysisContent = 'Không thể phân tích dữ liệu.';
            }
            
            console.log('AI Response:', response);
            console.log('Analysis Content:', analysisContent);
            
            setAnalysisResult(analysisContent);
            setHasAnalysis(true);

            // Lưu phân tích vào database
            const newChatHistory = [
                {
                    role: 'user',
                    content: customPrompt,
                    timestamp: new Date().toISOString()
                },
                {
                    role: 'assistant',
                    content: analysisContent,
                    timestamp: new Date().toISOString()
                }
            ];

            const newChatHistoryData = {
                info: {
                    baoCao: reportType, // 'GroupUnit' or 'GroupMonth'
                    currentYearKTQT,
                    currentCompanyKTQT,
                    rowDataCount: filteredData.length,
                },
                chatHistory: newChatHistory,
                type: 'PHAN_TICH_BAO_CAO',
                user_create: currentUser.id,
                show: true,
            };

            await createAIChatHistoryList(newChatHistoryData);
            message.success('Phân tích hoàn thành và đã lưu!');
        } catch (error) {
            console.error('Error during analysis:', error);
            message.error('Có lỗi xảy ra khi phân tích. Vui lòng thử lại.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleResetAnalysis = async () => {
        setAnalysisResult('');
        setHasAnalysis(false);
        setCustomPrompt('');
        message.success('Đã reset phân tích');
    };

    // Draggable functionality
    const handleMouseDown = (e) => {
        if (e.target.closest(`.${css.modalHeader}`)) {
            setIsDragging(true);
            const rect = modalRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragOffset]);

    if (!visible) return null;

    return (
        <div className={css.modalOverlay} onClick={onClose}>
            <div
                ref={modalRef}
                className={`${css.draggableModal} ${isDragging ? css.dragging : ''}`}
                style={{
                    left: position.x,
                    top: position.y,
                    width: '600px',
                    height: '600px'
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={handleMouseDown}
            >
                <div className={css.modalHeader} style={{ backgroundColor: chartColors[0] || '#f0f0f0', color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>
                            Phân tích AI - {reportType === 'GroupUnit' ? 'Nhóm Đơn vị' : 'Nhóm Đơn vị theo tháng'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Button type="text" onClick={onClose} style={{ padding: '4px' }}>
                            ×
                        </Button>
                    </div>
                </div>

                <div className={css.modalBody}>
                    {isLoadingHistory ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                            <Spin size="large" />
                        </div>
                    ) : hasAnalysis ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                    <Text strong>Kết quả phân tích</Text>
                                </div>
                                <Popconfirm
                                    title="Xóa phân tích"
                                    description="Bạn có chắc chắn muốn xóa phân tích hiện tại? Hành động này không thể hoàn tác."
                                    onConfirm={handleResetAnalysis}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                    icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                                >
                                    <Button size="small" danger>
                                        Reset
                                    </Button>
                                </Popconfirm>
                            </div>
                            <div 
                                className={styles.markdownContent}
                                style={{ 
                                    flex: 1, 
                                    overflow: 'auto', 
                                    padding: '12px',
                                    backgroundColor: '#fafafa',
                                    borderRadius: '6px',
                                    border: '1px solid #f0f0f0',
                                    height: '400px',
                                    fontSize: 13
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(marked(analysisResult))
                                }}
                            />
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <Text strong>Chọn mô hình AI:</Text>
                                <Select
                                    value={selectedAIModel}
                                    onChange={setSelectedAIModel}
                                    style={{ width: '100%', marginTop: '8px' }}
                                >
                                    {memoizedModelList.map(model => (
                                        <Option key={model.value} value={model.value}>
                                            {model.name}
                                        </Option>
                                    ))}
                                </Select>
                            </div>

                            <div style={{ marginBottom: '16px', flex: 1 }}>
                                <Text strong>Prompt phân tích:</Text>
                                <TextArea
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    rows={12}
                                    style={{ marginTop: '8px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <Button onClick={onClose}>
                                    Hủy
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={handleAnalyze}
                                    loading={isAnalyzing}
                                    icon={<RobotOutlined />}
                                >
                                    Phân tích
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalysisModalGroupUnit;
