import { Eye, Settings } from 'lucide-react';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MyContext } from '../../MyContext.jsx';
import { createNewProposalDocument, getAllProposalDocument, updateProposalDocument as updateProposalDocumentApi } from '../../apis/proposalDocumentService.jsx';
import { getSettingByType, getSchemaTools } from '../../apis/settingService.jsx';
import { createTimestamp, formatDateTimestamp } from "../../generalFunction/format.js";
import { BackCanvas, ICON_CROSSROAD_LIST } from '../../icon/svg/IconSvg.jsx';
import styles from './ProposalMaker.module.css';
import LeftSidebar from './components/LeftSidebar.jsx';
import MiddleEditor from './components/MiddleEditor.jsx';
import RightSidebar from './components/RightSidebar.jsx';
import AuthModal from './components/modals/AuthModal.jsx';
import DuplicateDocumentModal from './components/modals/DuplicateDocumentModal.jsx';
import NewDocumentModal from './components/modals/NewDocumentModal.jsx';
import PreviewModal from './components/modals/PreviewModal.jsx';
import { Monitor, Smartphone } from 'lucide-react';

const ProposalMakerApp = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showNewDocument, setShowNewDocument] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [duplicateDocument, setDuplicateDocument] = useState(null);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagTypes, setSelectedTagTypes] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [documentInfo, setDocumentInfo] = useState({
    pic: '',
    note: '',
    password: ''
  });

  // Separate state for reference links (array of objects)
  const [referenceLinks, setReferenceLinks] = useState([]);

  // State for tag editing
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTagType, setNewTagType] = useState('');
  const [newTagId, setNewTagId] = useState('');

  // Authentication state for interactive link
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authCredentials, setAuthCredentials] = useState({
    username: '',
    password: ''
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { currentUser } = useContext(MyContext);
  const [userName, setUserName] = useState(null);


  // Editor ref for WYSIWYG functionality

  // Available tags
  const tagTypes = ['Proposal', 'Contract', 'Report', 'Presentation', 'Guide', 'Policy'];
  const tagIds = ['Marketing', 'Sales', 'HR', 'Finance', 'Legal', 'Operations', 'IT', 'Customer Service'];

  // Dynamic tag visibility (limit to 2 rows, show +n more)
  const typeTagsContainerRef = React.useRef(null);
  const idTagsContainerRef = React.useRef(null);
  const [typeVisibleCount, setTypeVisibleCount] = useState(tagTypes.length);
  const [idVisibleCount, setIdVisibleCount] = useState(tagIds.length);
  const [showAllTypeTags, setShowAllTypeTags] = useState(false);
  const [showAllIdTags, setShowAllIdTags] = useState(false);
  const [nameTable, setNameTable] = useState(null);
  const [tool, setTool] = useState(null);
  const [masterTool, setMasterTool] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setUserName(currentUser?.email || 'Anonymous');
  }, [currentUser]);

  // Hàm kết hợp với thông tin từ schema master
  const combineWithMasterInfo = async (currentTool) => {
    try {
      const masterResponse = await getSchemaTools('master');
      const masterAppsList = masterResponse?.setting || [];
      
      if (masterAppsList && masterAppsList.length > 0) {
        const masterApp = masterAppsList.find(masterApp => masterApp.id === currentTool.id);
        if (masterApp) {
          console.log(`ProposalMaker: Combining tool ${currentTool.id} with master info`);
          return {
            ...currentTool,
            name: masterApp.name,
            icon: masterApp.icon
          };
        }
      }
      return currentTool;
    } catch (error) {
      console.error('Error getting master apps for proposal maker:', error);
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

  useEffect(() => {
    getDashboardSetting();
  }, [location]);


  const getIconSrcById = (tool) => {
    const found = ICON_CROSSROAD_LIST.find(item => item.id == tool.icon);
    return found ? found.icon : undefined;
  };


  const computeVisibleCountFromButtons = (buttons, maxRows = 2) => {
    if (!buttons || buttons.length === 0) return 0;
    const rowTops = [];
    let count = 0;
    for (let i = 0; i < buttons.length; i++) {
      const top = buttons[i].offsetTop;
      if (rowTops.length === 0 || top !== rowTops[rowTops.length - 1]) {
        rowTops.push(top);
        if (rowTops.length > maxRows) break;
      }
      if (rowTops.length <= maxRows) count++;
    }
    return count;
  };

  const measureTypeTags = () => {
    if (!typeTagsContainerRef.current || showAllTypeTags) return;
    const container = typeTagsContainerRef.current;
    const buttons = Array.from(container.querySelectorAll('.' + styles.tagButton));
    // Temporarily ensure all are displayed for measurement
    const prevDisplay = buttons.map(b => b.style.display);
    buttons.forEach(b => { b.style.display = 'inline-flex'; });
    const count = computeVisibleCountFromButtons(buttons, 2);
    setTypeVisibleCount(Math.min(count, tagTypes.length));
    // Restore inline styles (let React control actual display)
    buttons.forEach((b, i) => { b.style.display = prevDisplay[i] || ''; });
  };

  const measureIdTags = () => {
    if (!idTagsContainerRef.current || showAllIdTags) return;
    const container = idTagsContainerRef.current;
    const buttons = Array.from(container.querySelectorAll('.' + styles.tagButton));
    const prevDisplay = buttons.map(b => b.style.display);
    buttons.forEach(b => { b.style.display = 'inline-flex'; });
    const count = computeVisibleCountFromButtons(buttons, 2);
    setIdVisibleCount(Math.min(count, tagIds.length));
    buttons.forEach((b, i) => { b.style.display = prevDisplay[i] || ''; });
  };

  React.useEffect(() => {
    // Measure on mount and when showAll toggles off
    measureTypeTags();
    measureIdTags();
    const onResize = () => {
      measureTypeTags();
      measureIdTags();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAllTypeTags, showAllIdTags, tagTypes.length, tagIds.length]);


  // Flat data structure - each object represents one record (load from API)
  const [documents, setDocuments] = useState([]);

  // Flat structure for discussions (load from documents.discussions)
  const [discussions, setDiscussions] = useState([]);

  // Variable values for current editing
  const [variableValues, setVariableValues] = useState({});

  const [highlightedDiscussionId, setHighlightedDiscussionId] = useState(null);




  // Extract variables from HTML content robustly
  const extractVariables = useCallback((contentHtml) => {
    if (!contentHtml) return '';
    const variablesSet = new Set();

    try {
      // 1) Find variables in format <variable_name> or &lt;variable_name&gt;
      const variableRegex = /[<&]lt;([a-zA-Z0-9_\-\.]+)[>&]gt;/g;
      let match;

      while ((match = variableRegex.exec(contentHtml)) !== null) {
        const name = (match[1] || '').trim();
        if (name && name.length > 0) {
          variablesSet.add(name);
        }
      }

      // 2) Also check for simple <var> format (but exclude common HTML tags)
      const htmlTags = new Set(['html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'u', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'col', 'colgroup', 'blockquote', 'code', 'pre', 'style']);
      const simpleRegex = /<([a-zA-Z0-9_\-\.]+)>/g;

      while ((match = simpleRegex.exec(contentHtml)) !== null) {
        const name = (match[1] || '').trim();
        // Only add if it's not a common HTML tag and has reasonable length
        if (name && name.length > 0 && name.length <= 50 && !htmlTags.has(name.toLowerCase())) {
          variablesSet.add(name);
        }
      }

    } catch (e) {
      console.error('extractVariables parse error:', e);
    }

    return Array.from(variablesSet).join(',');
  }, []);

  // Parse variables from string to array
  const parseVariables = (variableString) => {
    if (!variableString) return [];
    return variableString.split(',').filter(v => v.trim());
  };

  const handleEditorChange = async (data) => {
    if (!data || !selectedDocument) return;
    try {
      const variables = extractVariables(data);
      const updatedTime = createTimestamp();
      const updated = { ...selectedDocument, content: data, variables, updated_at: updatedTime, updatedAt: updatedTime };
      setSelectedDocument(updated);
      setDocuments(documents.map(d => d.id === selectedDocument.id ? updated : d));
      await updateProposalDocumentApi({ id: updated.id, content: data, variables, updated_at: createTimestamp() });
    } catch (e) {
      console.error('Update content failed:', e);
    }
  };


  // Normalize/serialize helpers for API <-> UI
  const normalizeDocument = (doc) => ({
    id: doc.id,
    name: doc.name || '',
    content: doc.content || '',
    variables: doc.variables || '',
    variableValues: doc.variableValues || {},
    tagType: doc.tagType ?? doc.tag_type ?? '',
    tagId: doc.tagId ?? doc.tag_id ?? '',
    isLocked: doc.isLocked ?? doc.is_locked ?? false,
    isShared: doc.isShared ?? doc.is_shared ?? false,
    password: doc.password ?? doc.share_password_hash ?? '',
    pic: doc.pic || '',
    note: doc.note ?? doc.description ?? '',
    referenceLinks: doc.referenceLinks ?? doc.reference_links ?? [],
    discussions: doc.discussions ?? [],
    createdAt: doc.createdAt ?? doc.created_at ?? '',
    updatedAt: doc.updatedAt ?? doc.updated_at ?? ''
  });

  const serializeDocument = (doc) => ({
    id: doc.id,
    name: doc.name,
    content: doc.content,
    variables: doc.variables,
    variableValues: doc.variableValues,
    tagType: doc.tagType,
    tagId: doc.tagId,
    isLocked: doc.isLocked,
    isShared: doc.isShared,
    password: doc.password,
    pic: doc.pic,
    note: doc.note,
    referenceLinks: doc.referenceLinks,
    discussions: doc.discussions,
    created_at: doc.createdAt || new Date().toISOString(),
    updated_at: createTimestamp()
  });

  // Initial load from API
  React.useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const data = await getAllProposalDocument();
        const list = Array.isArray(data) ? data.sort((a, b) => a.id - b.id) : (data?.data || []);
        const normalized = list.map(n => normalizeDocument(n));
        setDocuments(normalized);
        const allDiscussions = normalized.flatMap(d => (d.discussions || []).map(it => ({ ...it, documentId: d.id })));
        setDiscussions(allDiscussions);
      } catch (err) {
        console.error('Fetch documents failed:', err);
      }
    };
    fetchDocuments();
  }, []);

  // Effect to update editor when document changes
  React.useEffect(() => {
    if (selectedDocument) {
      // Load variable values from document
      setVariableValues(selectedDocument.variableValues || {});

      // Update document info from flat structure
      setDocumentInfo({
        pic: selectedDocument.pic || '',
        note: selectedDocument.note || '',
        password: selectedDocument.password || ''
      });

      // Update reference links
      setReferenceLinks(selectedDocument.referenceLinks || []);
    }
  }, [selectedDocument?.id]);

  // Create new document
  const handleCreateDocument = async () => {
    if (newDocumentName.trim()) {
      const payload = {
        name: newDocumentName.trim(),
        content: null,
        variables: 'bien_mau',
        tagType: 'Proposal',
        tagId: 'Marketing',
        isLocked: false,
        isShared: false,
        pic: '',
        note: '',
        password: '',
        referenceLinks: [],
        discussions: [],
        created_at: createTimestamp()
      };
      try {
        const res = await createNewProposalDocument(payload);
        const created = normalizeDocument(res?.data || res);
        const updated = [...documents, created];
        setDocuments(updated);
        setSelectedDocument(created);
        setNewDocumentName('');
        setShowNewDocument(false);
        setVariableValues({});
      } catch (e) {
        console.error('Create document failed:', e);
        alert('Tạo document thất bại');
      }
    }
  };

  // Duplicate document
  const handleDuplicate = (document) => {
    setDuplicateDocument(document);
    setNewDocumentName(`${document.name} - Copy`);
    setShowDuplicateModal(true);
  };

  const confirmDuplicate = async () => {
    if (duplicateDocument && newDocumentName.trim()) {
      const payload = {
        ...serializeDocument(duplicateDocument),
        id: undefined,
        name: newDocumentName.trim(),
        isLocked: false,
        isShared: false,
        created_at: createTimestamp(),
        updated_at: createTimestamp(),
        discussions: null
      };
      try {
        const res = await createNewProposalDocument(payload);
        const created = normalizeDocument(res?.data || res);
        setDocuments([...documents, created]);
        setSelectedDocument(created);
        setShowDuplicateModal(false);
        setDuplicateDocument(null);
        setNewDocumentName('');
      } catch (e) {
        console.error('Duplicate failed:', e);
        alert('Duplicate thất bại');
      }
    }
  };

  // Update document info
  const updateDocumentInfo = async (field, value) => {
    if (selectedDocument) {
      const updatedTime = createTimestamp();
      const updatedDocument = {
        ...selectedDocument,
        [field]: value,
        updated_at: updatedTime,
        updatedAt: updatedTime
      };
      setDocuments(documents.map(d => d.id === selectedDocument.id ? updatedDocument : d));
      setSelectedDocument(updatedDocument);
      setDocumentInfo(prev => ({ ...prev, [field]: value }));
      try { await updateProposalDocumentApi(serializeDocument(updatedDocument)); } catch (e) { console.error('Update info failed:', e); }
    }
  };

  // Handle variable change - Simple approach
  const handleVariableChange = (varName, value) => {
    if (selectedDocument && selectedDocument.isLocked) return;

    const newVariableValues = { ...variableValues, [varName]: value };
    setVariableValues(newVariableValues);

    // Save variable values to API
    if (selectedDocument) {
      const updatedTime = createTimestamp();
      const updated = { ...selectedDocument, variableValues: newVariableValues, updated_at: updatedTime, updatedAt: updatedTime };
      setSelectedDocument(updated);
      setDocuments(documents.map(d => d.id === selectedDocument.id ? updated : d));

      updateProposalDocumentApi({
        id: updated.id,
        variableValues: newVariableValues,
        updated_at: updatedTime
      }).catch(e => {
        console.error('Update variable values failed:', e);
      });
    }
  };

  // Render content with variables for display
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

  // Toggle document lock
  const toggleDocumentLock = async (docId) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    const updatedTime = createTimestamp();
    const updated = { ...doc, isLocked: !doc.isLocked, updated_at: updatedTime, updatedAt: updatedTime };
    setDocuments(documents.map(d => d.id === docId ? updated : d));
    if (selectedDocument && selectedDocument.id === docId) {
      setSelectedDocument(updated);
    }

    try { await updateProposalDocumentApi(serializeDocument(updated)); } catch (e) { console.error('Toggle lock failed:', e); }
  };

  // Toggle document share
  const toggleDocumentShare = async (docId) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    const updatedTime = createTimestamp();
    const updated = { ...doc, isShared: !doc.isShared, updated_at: updatedTime, updatedAt: updatedTime };
    setDocuments(documents.map(d => d.id === docId ? updated : d));
    if (selectedDocument && selectedDocument.id === docId) {
      setSelectedDocument(updated);
    }
    try { await updateProposalDocumentApi(serializeDocument(updated)); } catch (e) { console.error('Toggle share failed:', e); }
  };

  // Update document tags
  const updateDocumentTags = async (docId, tagType, tagId) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    const updatedTime = createTimestamp();
    const updated = { ...doc, tagType, tagId, updated_at: updatedTime, updatedAt: updatedTime };
    setDocuments(documents.map(d => d.id === docId ? updated : d));
    if (selectedDocument && selectedDocument.id === docId) {
      setSelectedDocument(updated);
    }
    try { await updateProposalDocumentApi(serializeDocument(updated)); } catch (e) { console.error('Update tags failed:', e); }
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTagType = selectedTagTypes.length === 0 || selectedTagTypes.includes(doc.tagType);
    const matchesTagId = selectedTagIds.length === 0 || selectedTagIds.includes(doc.tagId);
    return matchesSearch && matchesTagType && matchesTagId;
  });

  // Handle interactive link access
  const handleInteractiveLinkAccess = () => {
    setShowPreviewModal(true);
    // if (selectedDocument && selectedDocument.isShared) {
    //   if (selectedDocument.password) {
    //     setShowAuthModal(true);
    //   } else {
    //     // No password required, open directly
    //     setIsAuthenticated(true);
    //     setUserName(currentUser?.email);
    //     setShowPreviewModal(true);
    //   }
    // } else {
    //   setIsAuthenticated(true);
    //   setUserName(currentUser?.email);
    //   setShowPreviewModal(true);
    // }
  };

  // Authenticate user
  const handleAuthentication = () => {
    if (authCredentials.password === selectedDocument.password && authCredentials.username.trim()) {
      setIsAuthenticated(true);
      setUserName(currentUser?.email);
      setShowAuthModal(false);
      setShowPreviewModal(true);
      setAuthCredentials({ username: '', password: '' });
    } else {
      alert('Sai mật khẩu hoặc tên người dùng không hợp lệ!');
    }
  };

  // Reference links management
  const addReferenceLink = async () => {
    const newLink = { id: Date.now(), title: '', url: '' };
    const updatedLinks = [...referenceLinks, newLink];
    setReferenceLinks(updatedLinks);
    if (selectedDocument) {
      const updatedTime = createTimestamp();
      const updatedDocument = { ...selectedDocument, referenceLinks: updatedLinks, updated_at: updatedTime, updatedAt: updatedTime };
      setDocuments(documents.map(d => d.id === selectedDocument.id ? updatedDocument : d));
      setSelectedDocument(updatedDocument);
      try { await updateProposalDocumentApi(serializeDocument(updatedDocument)); } catch (e) { console.error('Add ref link failed:', e); }
    }
  };

  const updateReferenceLink = async (id, field, value) => {
    const nextLinks = referenceLinks.map(link => link.id === id ? { ...link, [field]: value } : link);
    setReferenceLinks(nextLinks);
    // Also update the document
    if (selectedDocument) {
      const updatedTime = createTimestamp();
      const updatedDocument = {
        ...selectedDocument,
        referenceLinks: nextLinks,
        updated_at: updatedTime,
        updatedAt: updatedTime
      };
      setDocuments(documents.map(d => d.id === selectedDocument.id ? updatedDocument : d));
      setSelectedDocument(updatedDocument);
      try { await updateProposalDocumentApi(serializeDocument(updatedDocument)); } catch (e) { console.error('Update ref link failed:', e); }
    }
  };

  const removeReferenceLink = async (id) => {
    const updatedLinks = referenceLinks.filter(link => link.id !== id);
    setReferenceLinks(updatedLinks);

    // Also update the document
    if (selectedDocument) {
      const updatedTime = createTimestamp();
      const updatedDocument = {
        ...selectedDocument,
        referenceLinks: updatedLinks,
        updated_at: updatedTime,
        updatedAt: updatedTime
      };
      setDocuments(documents.map(d => d.id === selectedDocument.id ? updatedDocument : d));
      setSelectedDocument(updatedDocument);
      try { await updateProposalDocumentApi(serializeDocument(updatedDocument)); } catch (e) { console.error('Remove ref link failed:', e); }
    }
  };

  // Tag management
  const addNewTagType = () => {
    if (newTagType.trim() && !tagTypes.includes(newTagType.trim())) {
      // In a real app, this would update the global tagTypes array
      // For demo purposes, we'll just show it works locally
      alert(`New tag type "${newTagType.trim()}" would be added to the system`);
      setNewTagType('');
    }
  };

  const addNewTagId = () => {
    if (newTagId.trim() && !tagIds.includes(newTagId.trim())) {
      // In a real app, this would update the global tagIds array
      alert(`New tag ID "${newTagId.trim()}" would be added to the system`);
      setNewTagId('');
    }
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
    <div className={styles.containerMain}>
      {/* Header */}
      <div className={styles.headerBar}>
        <div className={styles.wrapperMax}>
          <div className={styles.headerRow}>
            <div className={styles.headerTitleRow}>
              <div className={styles.backCanvas}
                onClick={() =>
                  navigate('/dashboard')
                }
              >
                <BackCanvas height={20} width={20} />
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

              <div className={styles.headerLogo}>
                {masterTool ? masterTool.name : nameTable}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.main} style={{ height: 'calc(100vh - 4rem)' }}>
        <div className={styles.mainGrid}>
          <div className={styles.leftCol}>
            <LeftSidebar
              documents={documents}
              setDocuments={setDocuments}
              tagTypes={tagTypes}
              tagIds={tagIds}
              selectedTagTypes={selectedTagTypes}
              setSelectedTagTypes={setSelectedTagTypes}
              selectedTagIds={selectedTagIds}
              setSelectedTagIds={setSelectedTagIds}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredDocuments={filteredDocuments}
              selectedDocument={selectedDocument}
              setSelectedDocument={(doc) => { setSelectedDocument(doc); setVariableValues({}); }}
              handleDuplicate={handleDuplicate}
              onNewDocument={() => setShowNewDocument(true)}
              formatDateTimestamp={formatDateTimestamp}
            />
          </div>

          {/* Middle Panel - Editor */}
          <div className={styles.middleCol}>
            <MiddleEditor
              selectedDocument={selectedDocument}
              handleEditorChange={handleEditorChange}
              headerActionsRight={(
                <>
                  {selectedDocument && (
                    <button onClick={handleInteractiveLinkAccess} className={styles.btnInteractive}>
                      <Eye className={styles.iconXs} />
                      Interactive Link
                    </button>
                  )}
                  <button className={styles.settingsBtn} title="Settings">
                    <Settings className={styles.settingsIcon} />
                  </button>
                </>
              )}
            />
          </div>

          {/* Right Panel - Info & Variables */}
          <div className={styles.rightCol}>
            <RightSidebar
              selectedDocument={selectedDocument}
              documentInfo={documentInfo}
              updateDocumentInfo={updateDocumentInfo}
              referenceLinks={referenceLinks}
              addReferenceLink={addReferenceLink}
              updateReferenceLink={updateReferenceLink}
              removeReferenceLink={removeReferenceLink}
              parseVariables={parseVariables}
              variableValues={variableValues}
              handleVariableChange={handleVariableChange}
              isEditingTags={isEditingTags}
              setIsEditingTags={setIsEditingTags}
              tagTypes={tagTypes}
              tagIds={tagIds}
              updateDocumentTags={updateDocumentTags}
              newTagType={newTagType}
              setNewTagType={setNewTagType}
              addNewTagType={addNewTagType}
              newTagId={newTagId}
              setNewTagId={setNewTagId}
              addNewTagId={addNewTagId}
              toggleDocumentLock={toggleDocumentLock}
              toggleDocumentShare={toggleDocumentShare}
            />
          </div>
        </div>
      </div>

      {/* Remove the old text selection confirmation popup since we're using floating button now */}

      <NewDocumentModal open={showNewDocument} newDocumentName={newDocumentName} setNewDocumentName={setNewDocumentName} onCreate={handleCreateDocument} onClose={() => setShowNewDocument(false)} />

      <DuplicateDocumentModal open={showDuplicateModal} newDocumentName={newDocumentName} setNewDocumentName={setNewDocumentName} onConfirm={confirmDuplicate} onClose={() => { setShowDuplicateModal(false); setDuplicateDocument(null); }} />

      <AuthModal open={showAuthModal} authCredentials={authCredentials} setAuthCredentials={setAuthCredentials} onAuthenticate={handleAuthentication} onClose={() => setShowAuthModal(false)} />


      <PreviewModal
        open={showPreviewModal && !!selectedDocument}
        selectedDocument={selectedDocument}
        onClose={() => {
          setShowPreviewModal(false);
          setIsAuthenticated(false);
        }}
        currentUser={userName}
        variableValues={variableValues}
        renderContentWithVariables={renderContentWithVariables}
        onPersist={async (updated) => {
          try {
            const updatedTime = createTimestamp();
            await updateProposalDocumentApi({ id: updated.id, discussions: updated.discussions, referenceLinks: updated.referenceLinks, updated_at: updatedTime });
            setSelectedDocument({ ...updated, updated_at: updatedTime, updatedAt: updatedTime });
            setDocuments(documents.map(d => d.id === updated.id ? { ...updated, updated_at: updatedTime, updatedAt: updatedTime } : d));
          } catch (e) { console.error(e); }
        }}
      />



    </div>
  );
};

export default ProposalMakerApp;