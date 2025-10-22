import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './ProposalMaker.module.css';
import { getProposalDocumentDataById, updateProposalDocument as updateProposalDocumentApi } from '../../apis/proposalDocumentService.jsx';
import PreviewModal from './components/modals/PreviewModal.jsx';
import { Spin, Alert, Card } from 'antd';
import { FileText, Lock, AlertCircle, User, Key } from 'lucide-react';
import { Monitor, Smartphone } from 'lucide-react';

const ProposalPublic = () => {
    const [isMobile, setIsMobile] = React.useState(false);
    const { id } = useParams();
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [document, setDocument] = React.useState(null);
    const [username, setUsername] = React.useState('');
    const [passwordInput, setPasswordInput] = React.useState('');
    const [authorized, setAuthorized] = React.useState(false);
    const navigate = useNavigate();
    const [variableValues, setVariableValues] = React.useState({});

    const renderContentWithVariables = (templateContent, varValues) => {
        if (!templateContent || !varValues) return templateContent;
        
        let renderedContent = templateContent;
        
        // Replace all variables in template
        Object.entries(varValues).forEach(([varName, value]) => {
          if (value && value.trim()) {
            // Replace both formats: <var> and &lt;var&gt;
            const patterns = [
              new RegExp(`<${varName}>`, 'g'),
              new RegExp(`&lt;${varName}&gt;`, 'g')
            ];
            
            patterns.forEach(pattern => {
              renderedContent = renderedContent.replace(pattern, value);
            });
          }
        });
        
        return renderedContent;
      };

      React.useEffect(() => {
        const checkMobile = () => {
          setIsMobile(window.innerWidth < 1024);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
      }, []);

    React.useEffect(() => {
        const fetchDoc = async () => {
            try {
                const data = await getProposalDocumentDataById(id);
                const doc = data?.data || data;
                setDocument(doc);
                setVariableValues(doc?.variableValues || {});
                if (!doc?.isShared) {
                    setError('Document is not shared');
                }
            } catch (e) {
                setError('Cannot load document');
            } finally {
                setLoading(false);
            }
        };
        fetchDoc();
    }, [id]);

    const handleAuthorize = (e) => {
        e?.preventDefault?.();
        if (!username.trim()) {
            alert('Vui lòng nhập tên người dùng');
            return;
        }
        const protectedByPassword = !!(document?.password && String(document.password).length > 0);
        if (protectedByPassword && passwordInput !== document.password) {
            alert('Sai mật khẩu');
            return;
        }
        setAuthorized(true);
    };

    if (loading) {
        return (
            <div className={styles.containerMain}>

                <div className={styles.main} style={{ height: 'calc(100vh - 4rem)' }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        gap: '24px'
                    }}>
                        <Spin size="large" />
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{
                                fontSize: '20px',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '8px'
                            }}>
                                Đang tải tài liệu...
                            </h3>
                            <p style={{
                                fontSize: '14px',
                                color: '#6b7280',
                                margin: 0
                            }}>
                                Vui lòng chờ trong giây lát
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.containerMain}>

                <div className={styles.main} style={{ height: 'calc(100vh - 4rem)' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        padding: '20px'
                    }}>
                        <Card style={{
                            maxWidth: '480px',
                            width: '100%',
                            textAlign: 'center',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                            <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
                            <h3 style={{
                                fontSize: '20px',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '12px'
                            }}>
                                Không thể tải tài liệu
                            </h3>
                            <p style={{
                                fontSize: '14px',
                                color: '#6b7280',
                                marginBottom: '20px'
                            }}>
                                {error === 'Document is not shared'
                                    ? 'Tài liệu này chưa được chia sẻ công khai.'
                                    : 'Có lỗi xảy ra khi tải tài liệu. Vui lòng thử lại sau.'
                                }
                            </p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                style={{
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                Quay lại
                            </button>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (!document) return null;

    if (!authorized) {
        const needPassword = !!(document.password && String(document.password).length > 0);
        return (
            <div className={styles.containerMain}>
                <div className={styles.main} style={{ height: 'calc(100vh - 4rem)' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        padding: '20px'
                    }}>
                        <Card style={{
                            maxWidth: '480px',
                            width: '100%',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <FileText size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
                                <h3 style={{
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    color: '#374151',
                                    marginBottom: '8px'
                                }}>
                                    Truy cập tài liệu
                                </h3>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    margin: 0
                                }}>
                                    {document.name}
                                </p>
                                {needPassword && (
                                    <div style={{
                                        background: '#fef3c7',
                                        border: '1px solid #f59e0b',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        marginTop: '12px',
                                        fontSize: '12px',
                                        color: '#92400e'
                                    }}>
                                        <Lock size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                        Tài liệu này được bảo vệ bằng mật khẩu
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gap: '16px' }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#374151',
                                        marginBottom: '6px'
                                    }}>
                                        <User size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                        Tên của bạn
                                    </label>
                                    <input
                                        className={styles.inputText}
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Nhập tên để hiển thị trong thảo luận"
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    />
                                    <p style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        margin: '4px 0 0 0'
                                    }}>
                                        Tên này sẽ hiển thị khi bạn thêm thảo luận hoặc trả lời
                                    </p>
                                </div>

                                {needPassword && (
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#374151',
                                            marginBottom: '6px'
                                        }}>
                                            <Key size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                            Mật khẩu tài liệu
                                        </label>
                                        <input
                                            type="password"
                                            className={styles.inputText}
                                            value={passwordInput}
                                            onChange={(e) => setPasswordInput(e.target.value)}
                                            placeholder="Nhập mật khẩu để truy cập tài liệu"
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                fontSize: '14px'
                                            }}
                                        />
                                        <p style={{
                                            fontSize: '12px',
                                            color: '#6b7280',
                                            margin: '4px 0 0 0'
                                        }}>
                                            Mật khẩu này do chủ sở hữu tài liệu thiết lập
                                        </p>
                                    </div>
                                )}

                                <button
                                    className={styles.btnPrimary}
                                    onClick={handleAuthorize}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}
                                >
                                    {needPassword ? 'Truy cập tài liệu' : 'Xem tài liệu'}
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (isMobile) {
        return (
          <div className={styles.mobileWarning}>
            <div className={styles.mobileWarningContent}>
              <Smartphone className={styles.mobileWarningIcon} />
              <h2 className={styles.mobileWarningTitle}>Chỉ dành cho Desktop</h2>
              <p className={styles.mobileWarningText}>
                Ứng dụng tạo đề xuất này được tối ưu hóa chỉ để sử dụng trên desktop. 
                Vui lòng truy cập ứng dụng này từ máy tính desktop hoặc laptop để có trải nghiệm tốt nhất.
              </p>
              <div className={styles.mobileWarningAction}>
                <Monitor className={styles.mobileWarningActionIcon} />
                <span className={styles.mobileWarningActionText}>Chuyển sang desktop để tiếp tục</span>
              </div>
            </div>
          </div>
        );
      }

    return (
        <PreviewModal
            renderContentWithVariables={renderContentWithVariables}
            variableValues={variableValues}
            isPreviewPublic={true}
            open={true}
            selectedDocument={document}
            onClose={() => { }}
            currentUser={username}
            onPersist={async (updated) => {
                try {
                    await updateProposalDocumentApi({ id: updated.id, discussions: updated.discussions, referenceLinks: updated.referenceLinks });
                    setDocument(updated);
                } catch (e) { console.error(e); }
            }}
        />
    );
};

export default ProposalPublic;


