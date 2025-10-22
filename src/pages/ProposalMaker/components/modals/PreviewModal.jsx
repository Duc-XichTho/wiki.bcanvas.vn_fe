import React from 'react';
import styles from '../../ProposalMaker.module.css';
import { X, MessageCircle, Navigation, Target, User, Share2, ExternalLink, Link, Download } from 'lucide-react';
import { formatDateToDDMMYYYY } from '../../../../generalFunction/format.js';
import TipTapProposalMaker from '../../Tiptap/TipTapProposalMaker.jsx';
import DiscussionFormModal from './DiscussionFormModal.jsx';
import { Input, Button, message } from 'antd';
import html2pdf from 'html2pdf.js';
import { log } from 'mathjs';

const { TextArea } = Input;

const PreviewModal = ({
  isPreviewPublic,
  open,
  selectedDocument,
  onClose,
  currentUser,
  variableValues,
  renderContentWithVariables,
  onPersist
}) => {
  if (!open || !selectedDocument) return null;

  const contentRef = React.useRef(null);
  const [activeTocIndex, setActiveTocIndex] = React.useState(-1);
  const [showFloatingButton, setShowFloatingButton] = React.useState(false);
  const [selectedText, setSelectedText] = React.useState('');
  const [highlightedDiscussionId, setHighlightedDiscussionId] = React.useState(null);
  const [showDiscussionForm, setShowDiscussionForm] = React.useState(false);
  const [discussionText, setDiscussionText] = React.useState('');
  const [replyInputs, setReplyInputs] = React.useState({});

  // Get rendered content with variables replaced
  const renderedContent = React.useMemo(() => {
    if (!selectedDocument?.content || !renderContentWithVariables) return selectedDocument?.content || '';
    return renderContentWithVariables(selectedDocument.content, variableValues || {});
  }, [selectedDocument?.content, variableValues, renderContentWithVariables]);


  const tocItems = React.useMemo(() => {
    try {
      const content = renderedContent || '';
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const items = [];
      const headings = doc.querySelectorAll('h1, h2, h3');
      headings.forEach((el, idx) => {
        const level = el.tagName === 'H1' ? 1 : el.tagName === 'H2' ? 2 : 3;
        const text = (el.textContent || '').trim();
        if (text) items.push({ level, text, id: `heading-${idx}` });
      });
      return items;
    } catch (e) {
      return [];
    }
  }, [renderedContent]);

  const scrollToHeading = (headingText) => {
    try {
      const container = contentRef.current;
      if (!container || !headingText) return;
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      for (const heading of headings) {
        const text = (heading.textContent || '').trim();
        if (!text) continue;
        if (text.includes(headingText) || headingText.includes(text)) {
          const prevBg = heading.style.backgroundColor;
          heading.style.backgroundColor = '#dbeafe';
          heading.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
          setTimeout(() => { heading.style.backgroundColor = prevBg; }, 1200);
          break;
        }
      }
    } catch (_) { }
  };

  React.useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const onScroll = () => {
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const scrollTop = container.scrollTop;
      let current = -1;
      headings.forEach((h, idx) => {
        if (h.offsetTop - 100 <= scrollTop) current = idx;
      });
      setActiveTocIndex(current);
    };
    container.addEventListener('scroll', onScroll);
    onScroll();
    return () => container.removeEventListener('scroll', onScroll);
  }, [selectedDocument?.id]);

  // Floating button selection
  React.useEffect(() => {
    const onMouseUp = () => {
      const sel = window.getSelection();
      const txt = sel ? sel.toString().trim() : '';
      if (txt && txt.length > 3) {
        setSelectedText(txt);
        setShowFloatingButton(true);
      }
    };
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, []);

  const clearSelection = () => {
    setShowFloatingButton(false);
    setSelectedText('');
    if (window.getSelection) window.getSelection().removeAllRanges();
  };

  const getCurrentDocumentDiscussions = () => {
    const all = selectedDocument?.discussions || [];
    const roots = all.filter(d => d.parentId === null);
    return roots.map(root => ({ ...root, replies: all.filter(r => r.parentId === root.id) }));
  };

  const navigateToDiscussion = (discussionId, textToFind) => {
    if (!contentRef.current || !textToFind) return;
    const walker = document.createTreeWalker(contentRef.current, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.includes(textToFind)) {
        node.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedDiscussionId(discussionId);
        setTimeout(() => setHighlightedDiscussionId(null), 5000);
        break;
      }
    }
  };

  const openDiscussionForm = () => {
    setShowDiscussionForm(true);
  };

  const onAddDiscussion = () => {
    if (!discussionText.trim()) return;
    const newDiscussion = {
      id: Math.max(0, ...((selectedDocument.discussions || []).map(d => d.id))) + 1,
      documentId: selectedDocument.id,
      selectedText: selectedText || '',
      comment: discussionText.trim(),
      author: currentUser || 'Anonymous',
      timestamp: new Date().toLocaleString('vi-VN'),
      parentId: null
    };
    const updated = { ...selectedDocument, discussions: [...(selectedDocument.discussions || []), newDiscussion]  };
    onPersist?.(updated);
    setShowDiscussionForm(false);
    setDiscussionText('');
    clearSelection();
  };

  const addReply = (discussionId, replyText) => {
    if (!replyText || !replyText.trim()) return;
    const newReply = {
      id: Math.max(0, ...((selectedDocument.discussions || []).map(d => d.id))) + 1,
      documentId: selectedDocument.id,
      selectedText: '',
      comment: replyText.trim(),
      author: currentUser || 'Anonymous',
      timestamp: new Date().toLocaleString('vi-VN'),
      parentId: discussionId
    };
    const updated = { ...selectedDocument, discussions: [...(selectedDocument.discussions || []), newReply] };
    onPersist?.(updated);
  };

  console.log(selectedDocument);

  const toggleReplyInput = (discussionId) => {
    setReplyInputs(prev => ({
      ...prev,
      [discussionId]: !prev[discussionId]
    }));
  };

  const handleReplySubmit = (discussionId) => {
    const replyText = replyInputs[`${discussionId}_text`] || '';
    if (replyText.trim()) {
      addReply(discussionId, replyText);
      setReplyInputs(prev => ({
        ...prev,
        [discussionId]: false,
        [`${discussionId}_text`]: ''
      }));
    }
  };

  const handleReplyInputChange = (discussionId, value) => {
    setReplyInputs(prev => ({
      ...prev,
      [`${discussionId}_text`]: value
    }));
  };

  const handleShare = async () => {
    if (!selectedDocument?.id) return;

    const shareUrl = `${window.location.origin}/proposal/${selectedDocument.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      message.success('Đã sao chép đường dẫn chia sẻ!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      message.success('Đã sao chép đường dẫn chia sẻ!');
    }
  };

  const handleExportPDF = async () => {
    try {
      message.loading('Đang tạo PDF...', 0);

      // Create a temporary container for the PDF content
      const pdfContainer = document.createElement('div');
      pdfContainer.style.cssText = `
        padding: 40px;
        font-family: 'Times New Roman', serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        background: white;
      `;

      // Add document title
      const titleElement = document.createElement('h1');
      titleElement.textContent = selectedDocument.name;
      titleElement.style.cssText = `
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 20px;
        color: #2A6FCC;
        border-bottom: 2px solid #2A6FCC;
        padding-bottom: 10px;
      `;
      pdfContainer.appendChild(titleElement);

      // Add document metadata
      const metaElement = document.createElement('div');

      pdfContainer.appendChild(metaElement);

      // Add the rendered content
      const contentElement = document.createElement('div');
      contentElement.innerHTML = renderedContent;
      contentElement.style.cssText = `
        font-size: 14px;
        line-height: 1.8;
      `;
      pdfContainer.appendChild(contentElement);

      // Configure PDF options
      const pdfOptions = {
        margin: [10, 10, 10, 10],
        filename: `${selectedDocument.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      };

      // Generate PDF
      await html2pdf().from(pdfContainer).set(pdfOptions).save();

      message.destroy();
      message.success('PDF đã được tạo thành công!');
    } catch (error) {
      message.destroy();
      console.error('PDF export error:', error);
      message.error('Có lỗi xảy ra khi tạo PDF. Vui lòng thử lại.');
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.previewModal}>
        <div className={styles.previewHeader}>
          <div className={styles.inlineGap4}>
            <h3 className={styles.modalTitle}>{selectedDocument.name}</h3>
            <span className={styles.previewMeta}>Last updated: {formatDateToDDMMYYYY(selectedDocument.update_at || selectedDocument.updatedAt || selectedDocument.created_at || selectedDocument.createdAt)}</span>
          </div>
          {
            !isPreviewPublic && (
              <button onClick={onClose} className={styles.closeGhost}>
                <X className={styles.iconMd} />
              </button>
            )
          }

        </div>

        <div className={styles.contentPanels}>
          <div className={styles.tocCol}>
            <div className={styles.p4}>
              <h4 className={styles.tocTitle}>
                <Navigation className={styles.iconSmBlue} />
                Mục lục
              </h4>
              <div className={styles.tocList} >
                {tocItems.map((item, index) => (
                  <div
                    key={index}
                    className={`${styles.tocItem} ${activeTocIndex === index ? styles.tocItemActive : ''} ${item.level === 1 ? styles.tocH1 : item.level === 2 ? styles.tocH2 : styles.tocH3}`}
                    onClick={() => { setActiveTocIndex(index); scrollToHeading(item.text); }}
                    title={`Navigate to: ${item.text}`}
                  >
                    <div className={styles.tocItemInner}>
                      <Navigation className={styles.iconXsBlueHidden} />
                      <span className={styles.flex1}>{item.text}</span>
                      {/* {item.level === 1 && <span className={styles.tocBadgeH1}>1</span>}
                      {item.level === 2 && <span className={styles.tocBadgeH2}>2</span>}
                      {item.level === 3 && <span className={styles.tocBadgeH3}>3</span>} */}
                    </div>
                  </div>
                ))}

              </div>
            </div>
          </div>

          <div className={styles.docMainCol}>
            <div className={styles.docMainInner} ref={contentRef}>

              <TipTapProposalMaker
                selectedDocument={{ ...selectedDocument, content: renderedContent }}
                showToolbar={false}
                onUpdate={() => { }}
              />
              {showFloatingButton && selectedText && (
                <div className={styles.fabFull}>
                  <div className={styles.flex1} onClick={openDiscussionForm}>
                    <div className={styles.fabHeader}>
                      <MessageCircle className={styles.iconSm} />
                      <span className={styles.fabTitle}>Add Discussion</span>
                    </div>
                    <div className={styles.fabQuote}>
                      "{selectedText.length > 30 ? `${selectedText.substring(0, 30)}...` : selectedText}"
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelection();
                    }}
                    className={styles.fabClose}
                    title="Close"
                  >
                    <X className={styles.iconSm} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={styles.sideRight}>
            <div className={styles.sideRightInner}>
              <div className={styles.fullWidth}>
                <h4 className={styles.h4Title}>
                  <Link className={styles.iconSmBlue} />
                  Liên kết tham khảo
                </h4>
                {selectedDocument?.referenceLinks?.length > 0 ? (
                  <div className={styles.vSpace3}>
                    {selectedDocument.referenceLinks.map((link) => {
                      // Parse URL to get domain and path
                      let domain = '';
                      let path = '';
                      let displayUrl = link.url;

                      try {
                        const url = new URL(link.url);
                        domain = url.hostname;
                        path = url.pathname + url.search + url.hash;
                        displayUrl = domain + path;
                      } catch (e) {
                        // If URL is invalid, use as is
                        displayUrl = link.url;
                      }

                      return (
                        <div key={link.id}
                          className={styles.referenceLinkCard}
                          onClick={() => {
                            // Ensure URL has protocol
                            let urlToOpen = link.url;
                            if (!urlToOpen.startsWith('http://') && !urlToOpen.startsWith('https://')) {
                              urlToOpen = 'https://' + urlToOpen;
                            }
                            window.open(urlToOpen, '_blank', 'noopener,noreferrer');
                          }}
                          title={`Mở ${link.title || link.url}`}
                        >
                          {/* Compact icon */}
                          <div className={styles.referenceLinkIcon}>
                            <ExternalLink size={12} color="white" />
                          </div>

                          {/* Content */}
                          <div className={styles.referenceLinkContent} >
                            <div className={styles.referenceLinkTitle}>
                              {link.title || 'Liên kết không có tiêu đề'}
                            </div>
                            <div className={styles.referenceLinkMeta} >
                              {domain && (
                                <span className={styles.referenceLinkDomain}>
                                  {domain}
                                </span>
                              )}
                              <span className={styles.referenceLinkUrl}>
                                {path || displayUrl}
                              </span>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className={styles.referenceLinkArrow}>
                            →
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.referenceLinksEmpty}>
                    <Link size={20} color="#94a3b8" className= {styles.referenceLinksEmptyIcon} />
                    <p className={styles.referenceLinksEmptyText}>
                      Chưa có liên kết tham khảo 
                    </p>
                  </div>
                )}
              </div>

              <div>
                <div className={styles.betweenRowMb3}>
                  <h4 className={styles.h4TitleRow}>
                    <MessageCircle className={styles.iconSmBlue} />
                    Thảo luận ({getCurrentDocumentDiscussions().length})
                  </h4>
                  <button onClick={() => openDiscussionForm()} className={styles.btnXsPrimary} title="Add new discussion">
                    <MessageCircle className={styles.iconXs} />
                    Add
                  </button>
                </div>

                <div className={styles.vSpace3}>
                  {getCurrentDocumentDiscussions().map((discussion) => (
                    <div key={discussion.id} className={`${styles.discussionCard} ${highlightedDiscussionId === discussion.id ? styles.discussionActive : ''}`}>
                      <div className={styles.mb3}>
                        <div className={styles.discussionHeader}>
                          <MessageCircle className={styles.iconSmBlue} />
                          <span className={styles.discussionSection}>{discussion.selectedText ? 'Context' : 'General'}</span>
                          {discussion.selectedText ? (
                            <button onClick={() => navigateToDiscussion(discussion.id, discussion.selectedText)} className={styles.btnXsPrimary} title="Navigate to text">
                              <Target className={styles.iconXs} />
                              Find
                            </button>
                          ) : (
                            <span className={styles.discussionGeneral}>General</span>
                          )}
                        </div>

                        {discussion.selectedText ? (
                          <div className={styles.selectedTextBox}>
                            <span className={styles.selectedLabel}>Selected text:</span>
                            <br />
                            "{discussion.selectedText.length > 100 ? discussion.selectedText.substring(0, 100) + '...' : discussion.selectedText}"
                          </div>
                        ) : null}

                        <div className={styles.commentText}>{discussion.comment}</div>
                        <div className={styles.commentMeta}>
                          <User className={styles.iconXs} />
                          {discussion.author} • {discussion.timestamp}
                        </div>
                      </div>

                      {discussion.replies.length > 0 && (
                        <div className={styles.repliesBox}>
                          <div className={styles.repliesHeader}>{discussion.replies.length} replies:</div>
                          {discussion.replies.map((reply) => (
                            <div key={reply.id} className={styles.replyItem}>
                              <div className={styles.replyText}>{reply.comment}</div>
                              <div className={styles.replyMeta}>
                                <User className={styles.iconXs} />
                                {reply.author} • {reply.timestamp}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button onClick={(e) => { e.stopPropagation(); toggleReplyInput(discussion.id); }} className={styles.replyToggle}><MessageCircle className={styles.iconXs} />{replyInputs[discussion.id] ? 'Hủy' : 'Trả lời'}</button>
                      {replyInputs[discussion.id] && (
                        <div className={styles.replyInputContainer}>
                          <TextArea
                            className={styles.replyInput}
                            value={replyInputs[`${discussion.id}_text`] || ''}
                            onChange={(e) => handleReplyInputChange(discussion.id, e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleReplySubmit(discussion.id);
                              }
                            }}
                            placeholder="Nhập trả lời..."
                            rows={3}
                          />
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleReplySubmit(discussion.id)}
                          >
                            Gửi
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  {getCurrentDocumentDiscussions().length === 0 && (
                    <div className={styles.emptyDiscuss}>
                      <MessageCircle className={styles.emptyDiscussIcon} />
                      <p className={styles.textSmMuted}>Chưa có thảo luận nào.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footerBar}>
          <div className={styles.footerMeta}>User: {currentUser || 'Anonymous'} • Discussions: {getCurrentDocumentDiscussions().length}</div>
          <div className={styles.footerActions}>
            {!isPreviewPublic && (
              <button onClick={handleShare} className={styles.btnOutline} title="Chia sẻ tài liệu">
                <Share2 className={`${styles.iconSm} ${styles.shareButtonIcon}`} />
                Chia sẻ
              </button>
            )}
            <button onClick={handleExportPDF} className={styles.btnOutline} title="Xuất PDF">
              <Download className={`${styles.iconSm} ${styles.shareButtonIcon}`} />
              Export PDF
            </button>
            {
              !isPreviewPublic && (
                <button onClick={onClose} className={styles.btnPrimary}>
                  Đóng
                </button>
              )
            }

          </div>
        </div>
        <DiscussionFormModal
          open={showDiscussionForm}
          selectedText={selectedText}
          discussionText={discussionText}
          setDiscussionText={setDiscussionText}
          onAddDiscussion={onAddDiscussion}
          onClose={() => { setShowDiscussionForm(false); setDiscussionText(''); }}
        />
      </div>
    </div>
  );
};

export default PreviewModal;


