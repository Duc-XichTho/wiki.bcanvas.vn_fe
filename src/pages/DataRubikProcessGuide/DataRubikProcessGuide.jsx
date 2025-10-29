import React, { useState, useEffect, useRef, useContext } from 'react';
import { Modal, Form, Input, Select, Button, message, Spin, Tooltip, Tabs, Dropdown, AutoComplete, Upload, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined, UploadOutlined, DeleteOutlined, RightOutlined, DownOutlined } from '@ant-design/icons';
import { NewBookmarkIcon, NewBookmarkedIcon, NewSearchIcon } from '../../icon/svg/IconSvg';
import { EditorContent } from '@tiptap/react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getAllProcesses, 
  createProcess, 
  updateProcess, 
  deleteProcess, 
  getDeletedProcesses,
  restoreProcess
} from '../../apis/processService';
import { getAllProcessTabs } from '../../apis/processTabService';
import { 
  getAllProcessItems, 
  getProcessItemsByProcessId, 
  createProcessItem, 
  updateProcessItem, 
  deleteProcessItem, 
  getDeletedProcessItems,
  restoreProcessItem
} from '../../apis/processItemService';
import { getSettingByType } from '../../apis/settingService';
import { uploadFileService } from '../../apis/uploadFileService';
import { getCurrentUserLogin, updateUser } from '../../apis/userService';
import { getAllUserClass } from '../../apis/userClassService';
import { useProcessItemEditor } from './useProcessItemEditor';
import { ProcessItemToolbar } from './ProcessItemToolbar';
import DataRubikProcessGuideMobile from './DataRubikProcessGuideMobile';
import styles from './DataRubikProcessGuide.module.css';
import { BackCanvas, ICON_CROSSROAD_LIST } from '../../icon/svg/IconSvg.jsx';
import FilePreviewModal from '../../components/FilePreviewModal';
import { isFilePreviewable } from '../../components/FilePreviewModal/fileUtils';
import SearchModal from './SearchModal';
import TabBar from './components/TabBar';
import UserProcessGuide from './components/UserProcessGuide';
import { MyContext } from '../../MyContext.jsx';

const { TabPane } = Tabs;

const DataRubikProcessGuide = () => {
  // Helper function to get icon source by ID
  const getIconSrcById = (tool) => {
    const found = ICON_CROSSROAD_LIST.find(item => item.id == tool.icon);
    return found ? found.icon : undefined;
  };
  const { tabId, processItemId, headingId } = useParams();
  const navigate = useNavigate();
  const [processes, setProcesses] = useState([]);
  const [processItems, setProcessItems] = useState({});
  const [activeHeading, setActiveHeading] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isProcessItemModalVisible, setIsProcessItemModalVisible] = useState(false);
  const [isRenameProcessModalVisible, setIsRenameProcessModalVisible] = useState(false);
  const [isRenameProcessItemModalVisible, setIsRenameProcessItemModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isFilePreviewModalVisible, setIsFilePreviewModalVisible] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState(null);
  const [selectedProcessId, setSelectedProcessId] = useState(null);
  const [selectedProcessForRename, setSelectedProcessForRename] = useState(null);
  const [selectedProcessItemForRename, setSelectedProcessItemForRename] = useState(null);
  const [selectedProcessItemForUpload, setSelectedProcessItemForUpload] = useState(null);
  const [editingProcessItem, setEditingProcessItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedProcesses, setExpandedProcesses] = useState(new Set());
  const [contentHeadings, setContentHeadings] = useState([]);
  const [modifiedContent, setModifiedContent] = useState('');
  const [nameTable, setNameTable] = useState(null);
  const [tool, setTool] = useState(null);
  const [form] = Form.useForm();
  const [processItemForm] = Form.useForm();
  const [renameProcessForm] = Form.useForm();
  const [renameProcessItemForm] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [selectedFile, setSelectedFile] = useState(null);
  const [tiptapContent, setTiptapContent] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [contentSearchValue, setContentSearchValue] = useState('');
  const [sidebarSearchValue, setSidebarSearchValue] = useState('');
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const contentRef = useRef(null);
  console.log('tool', tool);
  // New state variables for deleted items modal
  const [isDeletedItemsModalVisible, setIsDeletedItemsModalVisible] = useState(false);
  const [deletedProcesses, setDeletedProcesses] = useState([]);
  const [deletedProcessItems, setDeletedProcessItems] = useState([]);
  const [loadingDeletedItems, setLoadingDeletedItems] = useState(false);
  const [allItemsForDeletedProcesses, setAllItemsForDeletedProcesses] = useState({});
  
  // Current user state for bookmark functionality
  const [currentUser, setCurrentUser] = useState(null);
  
  // Bookmark filter state
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  
  // Privacy modal state
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);
  const [selectedProcessForPrivacy, setSelectedProcessForPrivacy] = useState(null);
  
  // User class management modal state
  const [isUserProcessGuideModalVisible, setIsUserProcessGuideModalVisible] = useState(false);
  
  // User classes for access control
  const [userClasses, setUserClasses] = useState([]);
  
  // Selected process item state
  const [selectedProcessItem, setSelectedProcessItem] = useState(null);
  
  // Tab management state
  const [activeTabId, setActiveTabId] = useState(null);
  const [activeProcessTab, setActiveProcessTab] = useState(null);
  
  // TipTap editor instance for editing
  const { editor } = useProcessItemEditor(
    isEditing && editingProcessItem ? editingProcessItem.content || '' : '', 
    setTiptapContent
  );

  // Handle tab change
  const handleTabChange = (selectedTab) => {
    if (!selectedTab) {
      return;
    }
    
    setActiveTabId(selectedTab.id);
    setActiveProcessTab(selectedTab);
    
    // Clear current selections when switching tabs
    setSelectedProcessItem(null);
    setActiveHeading('');
    
    // Fetch processes for the selected tab
    fetchProcesses(selectedTab.id);
  };

  // Focus editor when editing starts
  useEffect(() => {
    if (isEditing && editor) {
      setTimeout(() => {
        editor.commands.focus();
      }, 100);
    }
  }, [isEditing, editor]);

  // Search function to find content in process items
  const searchProcessItems = (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const results = [];
    const searchLower = searchTerm.toLowerCase();

    // Search through all process items
    for (const processId in processItems) {
      const process = processes.find(p => p.id.toString() === processId);
      const items = processItems[processId] || [];
      
      items.forEach(item => {
        let titleOccurrences = 0;
        let contentOccurrences = 0;
        let totalOccurrences = 0;

        // Count occurrences in title
        if (item.text.toLowerCase().includes(searchLower)) {
          const titleMatches = item.text.toLowerCase().match(new RegExp(searchLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
          titleOccurrences = titleMatches ? titleMatches.length : 0;
          totalOccurrences += titleOccurrences;
        }

        // Count occurrences in content
        if (item.content && item.content.toLowerCase().includes(searchLower)) {
          const contentMatches = item.content.toLowerCase().match(new RegExp(searchLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
          contentOccurrences = contentMatches ? contentMatches.length : 0;
          totalOccurrences += contentOccurrences;
        }

        // Only add to results if there are matches
        if (totalOccurrences > 0) {
          // Only show content matches with simplified display
          if (contentOccurrences > 0) {
            // Find the closest heading to the match position
          const contentLower = item.content.toLowerCase();
          const matchIndex = contentLower.indexOf(searchLower);
            
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = item.content;
          const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
          
          let closestHeading = null;
          let closestDistance = Infinity;
          
          // Find the heading closest to the match position
          headings.forEach(heading => {
            const headingText = heading.textContent.trim();
            const headingIndex = contentLower.indexOf(headingText.toLowerCase());
            
              // Only consider headings that come BEFORE the search match
              if (headingIndex !== -1 && headingIndex <= matchIndex) {
                const distance = matchIndex - headingIndex; // Distance from heading to match
                
                // Prioritize more specific headings (h3, h4, h5, h6) over broader ones (h1, h2)
                // when they're at similar distances
                let shouldUpdate = false;
                
              if (distance < closestDistance) {
                  shouldUpdate = true;
                } else if (distance === closestDistance && closestHeading) {
                  // If same distance, prefer more specific heading
                  const currentLevel = getHeadingLevel(headingText);
                  const closestLevel = getHeadingLevel(closestHeading.text);
                  if (currentLevel > closestLevel) { // Higher number = more specific
                    shouldUpdate = true;
                  }
                }
                
                if (shouldUpdate) {
                closestDistance = distance;
                
                // Generate proper heading ID using the same function as extractHeadings
                // Use the heading's existing ID if available, otherwise generate a unique one
                // This prevents duplicate heading IDs that cause React key warnings
                // All IDs are prefixed with 'h-' to ensure valid CSS selectors
                let headingId = heading.id;
                if (!headingId) {
                  const baseHeadingId = headingText
                    .toLowerCase()
                    // Replace Vietnamese special characters with their base Latin equivalents
                    .replace(/[ăâắặằẳấầẩậẵẫáàạảã]/g, 'a')
                    .replace(/[ơớờợởôốồổộõỗỡóọòỏ]/g, 'o')
                    .replace(/[íìịỉĩ]/g, 'i')
                    .replace(/[éèẹẻêếềệểẽễ]/g, 'e')
                    .replace(/[ýỳỵỷỹ]/g, 'y')
                    .replace(/[úùụủũưứừựữử]/g, 'u')
                    .replace(/đ/g, 'd')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
                  
                  // Make ID unique by adding timestamp to prevent duplicates
                  // Prefix with 'h-' to ensure valid CSS selectors
                  headingId = `h-${baseHeadingId}-${Date.now()}`;
                }
                
                closestHeading = {
                  text: headingText,
                  id: headingId || `heading-${Date.now()}`
                };
              }
            }
          });

          results.push({
            key: `content-${item.id}`,
            label: (
              <div style={{ padding: '4px 0' }}>
                <div style={{ fontWeight: 'bold' }}>{item.text}</div>
                  <div style={{ fontSize: '12px', color: '#52c41a', fontWeight: 'bold' }}>
                    ({contentOccurrences} lần)
                </div>
              </div>
            ),
            value: item.text,
            processItem: item,
            process: process,
            type: 'content',
              closestHeading: closestHeading,
              occurrences: contentOccurrences
          });
          }
        }
      });
    }

    // Sort results by occurrences (descending)
    results.sort((a, b) => {
      return b.occurrences - a.occurrences;
    });

    setSearchResults(results);
  };

  // Sidebar search function - filter sidebar items
  const searchSidebarItems = (searchTerm) => {
    setSidebarSearchValue(searchTerm);
  };

  // Handle search selection
  const handleSearchSelect = (value, option) => {
    const selectedResult = searchResults.find(result => result.key === option.key);
    if (selectedResult) {
      const { processItem, process, closestHeading } = selectedResult;
      
      // Expand the parent process
      setExpandedProcesses(prev => new Set([...prev, process.id]));
      
      // Set the active heading to the processItem
      setActiveHeading(processItem.text);
      
      // Navigate to the process item with heading if available
      if (closestHeading && selectedResult.type === 'content') {
        navigate(`/process-guide/${activeTabId}/${processItem.id}/${closestHeading.id}`);
          
          // After navigation, highlight the search term in the content
          setTimeout(() => {
            highlightSearchTerm(selectedResult.originalParagraph || '');
          }, 1000); // Wait for navigation to complete
      } else {
        navigate(`/process-guide/${activeTabId}/${processItem.id}`);
      }
      
      // Clear search
      setSearchValue('');
      setSearchResults([]);
    }
  };

  // Handle search modal item selection
  const handleSearchModalItemSelect = (result) => {
    const { processItem, process } = result;
    
    // Expand the parent process
    setExpandedProcesses(prev => new Set([...prev, process.id]));
    
    // Set the active heading to the processItem
    setActiveHeading(processItem.text);
    
    // Find the closest heading to the search term
    let closestHeading = null;
    let closestDistance = Infinity;
    
    if (processItem.content && result.originalParagraph) {
      const content = processItem.content;
      const contentLower = content.toLowerCase();
      const searchText = result.originalParagraph;
      const searchLower = searchText.toLowerCase();
      
      // Find the position of the search term in the content
      let matchIndex = contentLower.indexOf(searchLower);
      
      // Smart matching for long snippets
      if (matchIndex === -1 && searchText.length > 50) {
        const shortSearch = searchText.substring(0, 50).toLowerCase();
        matchIndex = contentLower.indexOf(shortSearch);
      }
      if (matchIndex === -1 && searchText.length > 20) {
        const shortSearch = searchText.substring(0, 20).toLowerCase();
        matchIndex = contentLower.indexOf(shortSearch);
      }
      
      if (matchIndex !== -1) {
        // Use the existing contentHeadings instead of parsing HTML again
        if (contentHeadings.length > 0) {
          // Filter contentHeadings to only include headings from the current process item
          // We need to check if the heading text exists in the current content
          const relevantHeadings = contentHeadings.filter(heading => {
            const headingText = heading.text;
            const headingIndex = contentLower.indexOf(headingText.toLowerCase());
            const isRelevant = headingIndex !== -1;
            return isRelevant;
          });
          
          relevantHeadings.forEach((heading, index) => {
            const headingText = heading.text;
            const headingIndex = contentLower.indexOf(headingText.toLowerCase());
            
            // Only consider headings that come BEFORE the search match
            if (headingIndex !== -1 && headingIndex <= matchIndex) {
              const distance = matchIndex - headingIndex; // Distance from heading to match
              
              // Prioritize more specific headings (h3, h4, h5, h6) over broader ones (h1, h2)
              // when they're at similar distances
              let shouldUpdate = false;
              
              if (distance < closestDistance) {
                shouldUpdate = true;
              } else if (distance === closestDistance && closestHeading) {
                // If same distance, prefer more specific heading
                const currentLevel = getHeadingLevel(headingText);
                const closestLevel = getHeadingLevel(closestHeading.text);
                
                if (currentLevel > closestLevel) { // Higher number = more specific
                  shouldUpdate = true;
                }
              }
              
              if (shouldUpdate) {
                closestDistance = distance;
                
                closestHeading = {
                  text: heading.text,
                  id: heading.id  // Use the existing ID from contentHeadings
                };
              }
            }
          });
        }
        
        // Fallback: if no contentHeadings, parse HTML content
        if (!closestHeading) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = content;
          const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
          
          headings.forEach((heading, index) => {
            const headingText = heading.textContent.trim();
            const headingIndex = contentLower.indexOf(headingText.toLowerCase());
            
            // Only consider headings that come BEFORE the search match
            if (headingIndex !== -1 && headingIndex <= matchIndex) {
              const distance = matchIndex - headingIndex; // Distance from heading to match
              
              // Prioritize more specific headings (h3, h4, h5, h6) over broader ones (h1, h2)
              // when they're at similar distances
              let shouldUpdate = false;
              
              if (distance < closestDistance) {
                shouldUpdate = true;
              } else if (distance === closestDistance && closestHeading) {
                // If same distance, prefer more specific heading
                const currentLevel = getHeadingLevel(headingText);
                const closestLevel = getHeadingLevel(closestHeading.text);
                
                if (currentLevel > closestLevel) { // Higher number = more specific
                  shouldUpdate = true;
                }
              }
              
              if (shouldUpdate) {
                closestDistance = distance;
                
                // Use existing ID if available, otherwise generate a simple one
                let headingId = heading.id;
                if (!headingId) {
                  const baseHeadingId = headingText
                    .toLowerCase()
                    // Replace Vietnamese special characters with their base Latin equivalents
                    .replace(/[ăâắặằẳấầẩậẵẫáàạảã]/g, 'a')
                    .replace(/[ơớờợởôốồổộõỗỡ]/g, 'o')
                    .replace(/[íìịỉĩ]/g, 'i')
                    .replace(/[éèẹẻêếềệểẽễ]/g, 'e')
                    .replace(/[ýỳỵỷỹ]/g, 'y')
                    .replace(/[úùụủũưứừựửữ]/g, 'u')
                    .replace(/đ/g, 'd')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
                  
                  // Use simple index instead of timestamp
                  headingId = `h-${baseHeadingId}`;
                }
                
                closestHeading = {
                  text: headingText,
                  id: headingId
                };
              }
            }
          });
        }
      }
    }
    
    // Navigate to the process item with heading if found
    if (closestHeading) {
      const navigationUrl = `/process-guide/${activeTabId}/${processItem.id}/${closestHeading.id}`;
      navigate(navigationUrl);
    } else {
      const navigationUrl = `/process-guide/${activeTabId}/${processItem.id}`;
      navigate(navigationUrl);
    }
    
    // After navigation, highlight the search term in the content
    setTimeout(() => {
      highlightSearchTerm(result.originalParagraph || '');
    }, 1000); // Wait for navigation to complete
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+Shift+F to open search modal
      if (event.ctrlKey && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        setIsSearchModalVisible(true);
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle mobile view detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check initial size
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);



  // Fetch processes from API
  const fetchProcesses = async (processTabId = null) => {
    try {
      setLoading(true);
      const data = await getAllProcesses();
      
      // Filter only visible processes and map to heading format
      let visibleProcesses = data.filter(process => process.show !== false);
      
      // Filter by processTabId if provided
      if (processTabId) {
        visibleProcesses = visibleProcesses.filter(process => process.processTabId === processTabId);
      }
      
      // Handle processes with null order - assign them to the bottom
      let maxOrder = 0;
      const processesWithOrder = visibleProcesses.map(process => {
        if (process.description && !isNaN(parseInt(process.description))) {
          const order = parseInt(process.description);
          maxOrder = Math.max(maxOrder, order);
          return process;
        }
        return process;
      });
      
      // Assign order to processes with null description (move them to bottom)
      const updatedProcesses = processesWithOrder.map(process => {
        if (!process.description || isNaN(parseInt(process.description))) {
          maxOrder += 1;
  
          return { ...process, description: maxOrder.toString() };
        }
        return process;
      });
      
      // Sort by order
      updatedProcesses.sort((a, b) => {
        const orderA = parseInt(a.description) || 0;
        const orderB = parseInt(b.description) || 0;
        return orderA - orderB;
      });
      
      
      
      const mappedHeadings = updatedProcesses.map(process => ({
        id: process.id,
        text: process.title,
        level: 1,
        description: process.description,
        metadata: process.metadata,
        processTabId: process.processTabId
      }));
      setProcesses(mappedHeadings);
      
      // Automatically expand all processes by default
      const allProcessIds = updatedProcesses.map(process => process.id);
      setExpandedProcesses(new Set(allProcessIds));
      
      // Fetch process items for each process
      await fetchAllProcessItems(updatedProcesses);
    } catch (error) {
      console.error('Error fetching processes:', error);
      message.error('Không thể tải danh sách quy trình');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user classes for access control
  const fetchUserClasses = async () => {
    try {
      const userClassesData = await getAllUserClass();
      
      // Filter for PROCESS_GUIDE module
      let filteredClasses = [];
      if (userClassesData && userClassesData.result && Array.isArray(userClassesData.result)) {
        filteredClasses = userClassesData.result.filter(uc => uc.module === 'PROCESS_GUIDE');
      } else if (Array.isArray(userClassesData)) {
        filteredClasses = userClassesData.filter(uc => uc.module === 'PROCESS_GUIDE');
      } else if (userClassesData && Array.isArray(userClassesData.data)) {
        filteredClasses = userClassesData.data.filter(uc => uc.module === 'PROCESS_GUIDE');
      }
      
      setUserClasses(filteredClasses);
    } catch (error) {
      console.error('Error fetching user classes:', error);
      setUserClasses([]);
    }
  };

  // Helper function to check if current user has access to a process item
  const hasAccessToProcessItem = (processItem) => {
    // If no current user, deny access
    if (!currentUser || !currentUser.email) {
      return false;
    }

    // Admin bypass: If user is admin, allow access to all items
    if (currentUser.isAdmin) {
      return true;
    }

    // If no privacy settings, allow access (public)
    if (!processItem.privacyType || processItem.privacyType === 'public') {
      return true;
    }

    // If no users array or empty, deny access
    if (!processItem.users || !Array.isArray(processItem.users) || processItem.users.length === 0) {
      return false;
    }

    // Check if it's a user class restriction
    if (processItem.privacyType === 'userClass') {
      // Check if user is in any of the allowed user classes
      let hasValidAccess = false;
      let hasOrphanedReferences = false;
      
      for (const userClassId of processItem.users) {
        const userClass = userClasses.find(uc => uc.id === userClassId);
        if (userClass && Array.isArray(userClass.userAccess) && userClass.userAccess.includes(currentUser.email)) {
          hasValidAccess = true;
        } else if (!userClass) {
          // User class was deleted but still referenced
          hasOrphanedReferences = true;
        }
      }
      
      // If user has valid access through any user class, grant access
      if (hasValidAccess) {
        return true;
      }
      
      // If there are orphaned references but no valid access, deny access
      // (This could trigger a cleanup process in the future)
      if (hasOrphanedReferences) {
        console.warn(`🚨 Orphaned user class references found in processItem ${processItem.id}:`, 
          processItem.users.filter(id => !userClasses.find(uc => uc.id === id)));
      }
      
      return false;
    }

    // Check if it's individual user restriction
    if (processItem.privacyType === 'private') {
      return processItem.users.includes(currentUser.email);
    }

    // Default deny access
    return false;
  };

  // Fetch process items for all processes
  const fetchAllProcessItems = async (processList) => {
    try {
      const itemsData = {};
      for (const process of processList) {
        const items = await getProcessItemsByProcessId(process.id);
        const visibleItems = items.filter(item => item.show !== false);
        itemsData[process.id] = visibleItems.map(item => {
          // Determine privacy type based on users column only
          let privacyType = 'public'; // Default to public
          
          if (item.users && Array.isArray(item.users) && item.users.length > 0) {
            const firstUser = item.users[0];
            if (typeof firstUser === 'string' && firstUser.startsWith('userclass_')) {
              privacyType = 'userClass';
            } else {
              privacyType = 'private';
            }
          }


          return {
            id: item.id,
            text: item.title,
            level: 2,
            description: item.description,
            content: item.content,
            processId: item.processId,
            order: item.order || 0,
            metadata: item.metadata,
            privacyType: privacyType,
            users: item.users
          };
        });
      }
      setProcessItems(itemsData);
    } catch (error) {
      console.error('Error fetching process items:', error);
      message.error('Không thể tải danh sách Document');
    }
  };

  useEffect(() => {
    // Don't fetch processes by default - only show when a tab is selected
    // Fetch user classes for access control
    fetchUserClasses();
  }, []);

  // Handle tabId from URL - select the correct tab when component mounts
  useEffect(() => {
    const handleTabSelection = async () => {
      try {
        const tabsData = (await getAllProcessTabs()).filter(tab => tab.title !== "UNIVERSAL_APP");
        console.log(tabsData);


        if (tabId && !activeTabId) {
          // Find the tab by ID and select it
          const targetTab = tabsData.find(tab => tab.id.toString() === tabId);
          if (targetTab) {
            console.log('🎯 Selecting tab from URL:', targetTab);
            handleTabChange(targetTab);
          } else {
            console.warn('⚠️ Tab not found for tabId:', tabId);
            // If tab not found, redirect to first available tab
            if (tabsData.length > 0) {
              const firstTab = tabsData.sort((a, b) => a.id - b.id)[0];
              navigate(`/process-guide/${firstTab.id}${processItemId ? `/${processItemId}` : ''}${headingId ? `/${headingId}` : ''}`);
            }
          }
        } else if (!tabId && tabsData.length > 0) {
          // If no tabId in URL, redirect to first available tab
          const firstTab = tabsData.sort((a, b) => a.id - b.id)[0];
          navigate(`/process-guide/${firstTab.id}${processItemId ? `/${processItemId}` : ''}${headingId ? `/${headingId}` : ''}`);
        }
      } catch (error) {
        console.error('❌ Error fetching tabs for URL tabId:', error);
      }
    };
    
    handleTabSelection();
  }, [tabId, activeTabId, processItemId, headingId, navigate]);

  // Fetch dashboard setting for nameTable
  useEffect(() => {
    getSettingByType('DASHBOARD_SETTING').then(res => {
      if (res.setting.length > 0) {
        // Look for process-guide specifically
        let dashboardSetting = res.setting.find(item => item.id === 'process-guide');
        console.log('dashboardSetting', dashboardSetting);
        if (dashboardSetting) {
          setNameTable(dashboardSetting.name);
          setTool(dashboardSetting);
        } else {
          // Fallback for Process Guide page
          setNameTable('Tài liệu sử dụng BCanvas');
        }
      }
    });
  }, []);

  // Handle URL parameter for direct processItem access
  useEffect(() => {
    if (processItemId && processes.length > 0 && Object.keys(processItems).length > 0) {
      // Find the processItem by ID
      let foundProcessItem = null;
      let foundProcess = null;
      
      for (const processId in processItems) {
        const itemList = processItems[processId];
        const item = itemList.find(item => item.id.toString() === processItemId);
        if (item) {
          foundProcessItem = item;
          foundProcess = processes.find(process => process.id.toString() === processId);
          break;
        }
      }
      
      if (foundProcessItem && foundProcess) {
        // Expand the parent process
        setExpandedProcesses(prev => new Set([...prev, foundProcess.id]));
        // Set the active heading to the processItem
        setActiveHeading(foundProcessItem.text);
        
        // If there's a specific headingId, scroll to it after content loads
        if (headingId) {
          setTimeout(() => {
            // Find the heading by ID and scroll to it
            const headingElement = contentRef.current?.querySelector(`#${headingId}`);
            
            if (headingElement) {
              headingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              // Add a subtle highlight effect
              headingElement.style.backgroundColor = '#fff3cd';
              setTimeout(() => {
                headingElement.style.backgroundColor = '';
              }, 2000);
            }
          }, 500);
        }
      }
    }
  }, [processItemId, headingId, processes, processItems]);

  // Extract headings when a process item is selected
  useEffect(() => {
    // Check if it's a process item (level 2)
    let selectedProcessItem = null;
    for (const processId in processItems) {
      const itemList = processItems[processId];
      selectedProcessItem = itemList.find(item => item.text === activeHeading);
      if (selectedProcessItem) break;
    }

    if (selectedProcessItem && selectedProcessItem.content) {
      const modifiedHtml = extractHeadings(selectedProcessItem.content);
      setModifiedContent(modifiedHtml);
    } else {
      setContentHeadings([]);
      setModifiedContent('');
    }
  }, [activeHeading, processItems]);

  const scrollToHeading = (headingText, processItemId = null, headingId = null) => {
    setActiveHeading(headingText);
    
    // Update URL if it's a processItem
    if (processItemId) {
      if (headingId) {
        navigate(`/process-guide/${activeTabId}/${processItemId}/${headingId}`);
      } else {
        navigate(`/process-guide/${activeTabId}/${processItemId}`);
      }
    } else {
      navigate(`/process-guide/${activeTabId}`);
    }
  };

  const toggleProcessExpansion = (processId) => {
    setExpandedProcesses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(processId)) {
        newSet.delete(processId);
      } else {
        newSet.add(processId);
      }
      return newSet;
    });
  };

  /**
   * Helper function to determine heading level based on text patterns
   * Higher numbers indicate more specific headings
   */
  const getHeadingLevel = (headingText) => {
    // Check for numbered patterns that indicate heading levels
    if (/^\d+\.\s/.test(headingText)) return 3; // "1. ", "2. ", etc.
    if (/^[a-z]\)\s/.test(headingText)) return 4; // "a) ", "b) ", etc.
    if (/^[đĐ]\s/.test(headingText)) return 4; // "đ) ", "Đ) ", etc.
    if (/^Điều\s\d+/.test(headingText)) return 2; // "Điều 29", "Điều 30", etc.
    if (/^Chương\s\d+/.test(headingText)) return 1; // "Chương 1", "Chương 2", etc.
    
    // Default to level 2 for other patterns
    return 2;
  };

  /**
   * Extract headings from HTML content and generate unique IDs
   * This function ensures that even duplicate heading text gets unique IDs
   * by appending an index to prevent React duplicate key warnings
   * All IDs are prefixed with 'h-' to ensure valid CSS selectors
   */
  const extractHeadings = (content) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const headingElements = tempDiv.querySelectorAll('h1, h2, h3');
    
    const extractedHeadings = Array.from(headingElements)
      .filter(heading => {
        // Remove empty headings and headings that only contain whitespace
        const text = heading.textContent.trim();
        return text.length > 0;
      })
      .map((heading, index) => {
        // Generate a unique ID based on heading text and index to avoid duplicates
        const headingText = heading.textContent.trim();
        const baseHeadingId = headingText
          .toLowerCase()
          // Replace Vietnamese special characters with their base Latin equivalents
          .replace(/[ăâắặằẳấầẩậẵẫáàạảã]/g, 'a')
          .replace(/[ơớờợởôốồổộõỗỡ]/g, 'o')
          .replace(/[íìịỉĩ]/g, 'i')
          .replace(/[éèẹẻêếềệểẽễ]/g, 'e')
          .replace(/[ýỳỵỷỹ]/g, 'y')
          .replace(/[úùụủũưứừựữử]/g, 'u')
          .replace(/đ/g, 'd')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        // Make ID unique by adding index to prevent duplicates
        // This ensures that "1. Nguyên tắc kế toán" becomes "h-1-nguyen-tac-ke-toan-0", "h-1-nguyen-tac-ke-toan-1", etc.
        // We prefix with 'h-' to ensure valid CSS selectors (IDs cannot start with numbers)
        const headingId = `h-${baseHeadingId}-${index}`;
        
        // Assign the ID to the heading element in the temp div
        heading.id = headingId;
        
        return {
          id: headingId,
          text: headingText,
          level: parseInt(heading.tagName[1])
        };
      });
    
    setContentHeadings(extractedHeadings);
    
    // Return the modified HTML with IDs
    return tempDiv.innerHTML;
  };

  const scrollToContentHeading = (headingText) => {
    const headingElements = contentRef.current?.querySelectorAll('h1, h2, h3');
    
    const headingElement = Array.from(headingElements || []).find(el =>
      el.textContent.trim().includes(headingText.trim())
    );
    
    if (headingElement) {
      // The heading should already have an ID from extractHeadings
      // If for some reason it doesn't, we'll generate one
      if (!headingElement.id) {
        const baseHeadingId = headingText
          .toLowerCase()
          // Replace Vietnamese special characters with their base Latin equivalents
          .replace(/[ăâắặằẳấầẩậẵẫáàạảã]/g, 'a')
          .replace(/[ơớờợởôốồổộõỗỡ]/g, 'o')
          .replace(/[íìịỉĩ]/g, 'i')
          .replace(/[éèẹẻêếềệểẽễ]/g, 'e')
          .replace(/[ýỳỵỷỹ]/g, 'y')
          .replace(/[úùụủũưứừựữử]/g, 'u')
          .replace(/đ/g, 'd')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        // Find the index of this heading among all headings with the same text
        const sameTextHeadings = Array.from(headingElements).filter(el => 
          el.textContent.trim() === headingText.trim()
        );
        const headingIndex = sameTextHeadings.indexOf(headingElement);
        // Prefix with 'h-' to ensure valid CSS selectors
        const headingId = `h-${baseHeadingId}-${headingIndex}`;
        
        headingElement.id = headingId;
      }
      
      headingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Add a subtle highlight effect
      headingElement.style.backgroundColor = '#fff3cd';
      setTimeout(() => {
        headingElement.style.backgroundColor = '';
      }, 2000);
    }
  };

  /**
   * Highlight search term in the content after navigation
   * @param {string} searchText - The text to highlight
   */
  const highlightSearchTerm = (searchText) => {
    if (!searchText) return;
    
    const contentElement = document.querySelector('.tiptap') || document.querySelector('[contenteditable="true"]');
    if (!contentElement) return;
    
    // Find and highlight the search term
    const content = contentElement.innerHTML;
    const contentLower = content.toLowerCase();
    
    // Try to find the exact search term first, then try with a shorter version if needed
    let searchLower = searchText.toLowerCase();
    let matchIndex = contentLower.indexOf(searchLower);
    
    // If exact match not found, try with first 50 characters (for long snippets)
    if (matchIndex === -1 && searchText.length > 50) {
      searchLower = searchText.substring(0, 50).toLowerCase();
      matchIndex = contentLower.indexOf(searchLower);
    }
    
    // If still not found, try with first 20 characters
    if (matchIndex === -1 && searchText.length > 20) {
      searchLower = searchText.substring(0, 20).toLowerCase();
      matchIndex = contentLower.indexOf(searchLower);
    }
    
    if (matchIndex !== -1) {
      // Create a range to select the text
      const walker = document.createTreeWalker(
        contentElement,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let currentNode;
      let currentOffset = 0;
      let found = false;
      
      while (currentNode = walker.nextNode()) {
        const nodeLength = currentNode.textContent.length;
        if (currentOffset + nodeLength > matchIndex) {
          // Found the node containing our match
          const relativeOffset = matchIndex - currentOffset;
          const range = document.createRange();
          range.setStart(currentNode, relativeOffset);
          range.setEnd(currentNode, relativeOffset + searchLower.length);
          
          // Scroll to the match
          range.getBoundingClientRect();
          currentNode.parentElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Highlight the match temporarily
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            selection.removeAllRanges();
          }, 3000);
          
          found = true;
          break;
        }
        currentOffset += nodeLength;
      }
    }
  };

  // Modal handlers
  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const showProcessItemModal = (processId) => {
    setSelectedProcessId(processId);
    
    // Calculate the next order number based on existing items
    const existingItems = processItems[processId] || [];
    const nextOrder = existingItems.length;
    
    // Set the form with the calculated order
    processItemForm.setFieldsValue({
      order: nextOrder
    });
    
    setIsProcessItemModalVisible(true);
  };

  const handleProcessItemCancel = () => {
    setIsProcessItemModalVisible(false);
    setSelectedProcessId(null);
    processItemForm.resetFields();
    setTiptapContent('');
  };

  // Rename process handlers
  const showRenameProcessModal = (process) => {
    setSelectedProcessForRename(process);
    renameProcessForm.setFieldsValue({
      title: process.text
    });
    setIsRenameProcessModalVisible(true);
  };

  const handleRenameProcessCancel = () => {
    setIsRenameProcessModalVisible(false);
    setSelectedProcessForRename(null);
    renameProcessForm.resetFields();
  };

  const handleRenameProcessSubmit = async (values) => {
    try {
      setLoading(true);
      const processData = {
        id: selectedProcessForRename.id,
        title: values.title,
        show: selectedProcessForRename.show !== false,
        metadata: selectedProcessForRename.metadata || {}
      };
      
      await updateProcess(processData);
      message.success('Đổi tên nhóm thành công!');
      setIsRenameProcessModalVisible(false);
      setSelectedProcessForRename(null);
      renameProcessForm.resetFields();
      fetchProcesses(activeProcessTab?.id); // Refresh the list
    } catch (error) {
      console.error('Error updating process:', error);
      message.error('Không thể đổi tên nhóm');
    } finally {
      setLoading(false);
    }
  };

  // Rename process item handlers
  const showRenameProcessItemModal = (processItem) => {
    setSelectedProcessItemForRename(processItem);
    renameProcessItemForm.setFieldsValue({
      title: processItem.text
    });
    setIsRenameProcessItemModalVisible(true);
  };

  const handleRenameProcessItemCancel = () => {
    setIsRenameProcessItemModalVisible(false);
    setSelectedProcessItemForRename(null);
    renameProcessItemForm.resetFields();
  };

  const handleRenameProcessItemSubmit = async (values) => {
    try {
      setLoading(true);
      const processItemData = {
        id: selectedProcessItemForRename.id,
        title: values.title,
        description: selectedProcessItemForRename.description || '',
        content: selectedProcessItemForRename.content || '',
        processId: selectedProcessItemForRename.processId,
        order: selectedProcessItemForRename.order,
        show: selectedProcessItemForRename.show !== false,
        metadata: selectedProcessItemForRename.metadata || {}
      };
      
      await updateProcessItem(processItemData);
      message.success('Đổi tên document thành công!');
      setIsRenameProcessItemModalVisible(false);
      setSelectedProcessItemForRename(null);
      renameProcessItemForm.resetFields();
      fetchProcesses(activeProcessTab?.id); // Refresh the list
    } catch (error) {
      console.error('Error updating process item:', error);
      message.error('Không thể đổi tên document');
    } finally {
      setLoading(false);
    }
  };

  // Upload file handlers
  const showUploadModal = (processItem) => {
    setSelectedProcessItemForUpload(processItem);
    setIsUploadModalVisible(true);
  };

  const handleUploadCancel = () => {
    setIsUploadModalVisible(false);
    setSelectedProcessItemForUpload(null);
    setSelectedFile(null);
    uploadForm.resetFields();
  };

  const handleUploadSubmit = async (values) => {
    try {
      setLoading(true);
      

      
      if (!selectedFile) {
        message.error('Vui lòng chọn file để tải lên!');
        return;
      }
      
      const uploadedFile = selectedFile;



      // Upload file using uploadFileService
      
      const uploadResponse = await uploadFileService([uploadedFile]);
      

      // Extract file information from response
      const uploadedFileData = uploadResponse.files?.[0]; // Get first file from files array
      if (!uploadedFileData) {
        throw new Error('No file data received from upload service');
      }

      const fileURL = uploadedFileData.fileUrl;
      const fileName = uploadedFileData.fileName;
      const fileExtension = uploadedFileData.fileExtension;

      

      // Get current metadata and add new attachment
      const currentMetadata = selectedProcessItemForUpload.metadata || {};
      const currentAttachments = currentMetadata.attachments || [];
      
      const newAttachment = {
        fileURL,
        fileName,
        fileExtension,
        uploadDate: new Date().toISOString(),
        fileSize: uploadedFile.size,
        originalName: uploadedFile.name,
        mimeType: uploadedFile.type
      };

      const updatedAttachments = [...currentAttachments, newAttachment];
      const updatedMetadata = {
        ...currentMetadata,
        attachments: updatedAttachments
      };

      

      // Update the process item with new metadata
      const processItemData = {
        id: selectedProcessItemForUpload.id,
        title: selectedProcessItemForUpload.text,
        description: selectedProcessItemForUpload.description || '',
        content: selectedProcessItemForUpload.content || '',
        processId: selectedProcessItemForUpload.processId,
        order: selectedProcessItemForUpload.order,
        show: selectedProcessItemForUpload.show !== false,
        metadata: updatedMetadata
      };

      
      
      await updateProcessItem(processItemData);
      
      
      
      message.success('Tải lên file đính kèm thành công!');
      setIsUploadModalVisible(false);
      setSelectedProcessItemForUpload(null);
      setSelectedFile(null);
      uploadForm.resetFields();
      fetchProcesses(activeProcessTab?.id); // Refresh the list
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      if (error.response?.data?.message) {
        message.error(`Lỗi tải lên: ${error.response.data.message}`);
      } else {
        message.error('Không thể tải lên file đính kèm');
      }
    } finally {
      setLoading(false);
    }
  };

  // Video upload handler - just preview, upload when save
  const handleVideoUpload = () => {
    // Create a file input element for video selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('video/')) {
        message.error('Vui lòng chọn file video hợp lệ!');
        return;
      }

      // Validate file size (e.g., max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        message.error('File video quá lớn! Kích thước tối đa là 100MB.');
        return;
      }

      // Create preview URL and store file for later upload
      const previewUrl = URL.createObjectURL(file);
      
      // Update the editingProcessItem state to show video preview
      // Store the file for later upload when save is clicked
      setEditingProcessItem(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          videoPreviewUrl: previewUrl,
          videoFile: file, // Store the file for later upload
          videoFileName: file.name
        }
      }));
      
      message.success('Video đã chọn! Nhấn "Lưu" để tải lên và lưu video.');
    };
    
    input.click();
  };

  // Video removal handler
  const handleRemoveVideo = () => {
    if (editingProcessItem?.metadata?.videoPreviewUrl) {
      // Clean up preview URL if it exists
      URL.revokeObjectURL(editingProcessItem.metadata.videoPreviewUrl);
    }
    
    // Update the editingProcessItem state to remove video
    setEditingProcessItem(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        videoUrl: null,
        videoPreviewUrl: null,
        videoFile: null,
        videoFileName: null
      }
    }));
    
    message.success('Video đã được xóa!');
  };

  // Upload component props
  const uploadProps = {
    beforeUpload: () => false, // Prevent auto upload
    accept: '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.ppt,.pptx',
    maxCount: 1,
    onChange: (info) => {

      
      if (info.fileList && info.fileList.length > 0) {
        const file = info.fileList[0];
        setSelectedFile(file.originFileObj || file);
      } else {
        setSelectedFile(null);
      }
    }
  };

  // File preview handlers
  const showFilePreview = (attachment) => {
    const supportedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx'];
    const fileExtension = attachment.fileExtension.toLowerCase();
    
    if (supportedExtensions.includes(fileExtension)) {
      setSelectedFileForPreview(attachment);
      setIsFilePreviewModalVisible(true);
    } else {
      // For unsupported files, open in new tab
      window.open(attachment.fileURL, '_blank');
    }
  };

  const handleFilePreviewCancel = () => {
    setIsFilePreviewModalVisible(false);
    setSelectedFileForPreview(null);
  };



  // Handle attachment deletion
  const handleDeleteAttachment = async (attachmentToDelete, attachmentIndex) => {
    // Show confirmation dialog first
    Modal.confirm({
      title: 'Xác nhận xóa file đính kèm',
      content: `Bạn có chắc chắn muốn xóa file "${attachmentToDelete.fileName}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setLoading(true);
          
          // Get current process item and metadata
          const allProcessItems = Object.values(processItems).flat();
          const currentProcessItem = allProcessItems.find(item => item.id == processItemId);
          
          if (!currentProcessItem) {
            message.error('Không tìm thấy quy trình để cập nhật');
            return;
          }

          const currentMetadata = currentProcessItem.metadata || {};
          const currentAttachments = currentMetadata.attachments || [];
          
          // Remove the attachment at the specified index
          const updatedAttachments = currentAttachments.filter((_, index) => index !== attachmentIndex);
          
          const updatedMetadata = {
            ...currentMetadata,
            attachments: updatedAttachments
          };

          // Update the process item with updated metadata
          const processItemData = {
            id: currentProcessItem.id,
            title: currentProcessItem.text,
            description: currentProcessItem.description || '',
            content: currentProcessItem.content || '',
            processId: currentProcessItem.processId,
            order: currentProcessItem.order,
            show: currentProcessItem.show !== false,
            metadata: updatedMetadata
          };

          await updateProcessItem(processItemData);
          
          message.success('Đã xóa file đính kèm thành công!');
          fetchProcesses(activeProcessTab?.id); // Refresh the list
        } catch (error) {
          console.error('Error deleting attachment:', error);
          message.error('Không thể xóa file đính kèm');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Handle process move up
  const handleMoveProcessUp = async (process) => {
    
    try {
      setLoading(true);
      
      // Get current order from description field, default to 0 if null
      const currentOrder = process.description ? parseInt(process.description) : 0;
      
      // Find the process above (with lower order number)
      const processesWithOrder = processes.map(p => ({
        ...p,
        order: p.description ? parseInt(p.description) : 0
      }));
      
      // Sort by order to get proper sequence
      processesWithOrder.sort((a, b) => a.order - b.order);
      
      // Find current process index
      const currentIndex = processesWithOrder.findIndex(p => p.id === process.id);
      
      if (currentIndex <= 0) {
        message.warning('Quy trình đã ở vị trí đầu tiên');
        return;
      }
      
      // Get the process above
      const processAbove = processesWithOrder[currentIndex - 1];
      const orderAbove = processAbove.order;
      
      // Swap orders: current process gets orderAbove, process above gets currentOrder
      const updatedCurrentProcess = {
        id: process.id,
        title: process.text,
        description: orderAbove.toString(),
        processTabId: process.processTabId || null,
        show: process.show !== false,
        metadata: process.metadata || {}
      };
      
      const updatedProcessAbove = {
        id: processAbove.id,
        title: processAbove.text,
        description: currentOrder.toString(),
        processTabId: processAbove.processTabId || null,
        show: processAbove.show !== false,
        metadata: processAbove.metadata || {}
      };
      
      // Update both processes
      await Promise.all([
        updateProcess(updatedCurrentProcess),
        updateProcess(updatedProcessAbove)
      ]);
      message.success('Đã di chuyển quy trình lên trên');
      fetchProcesses(activeProcessTab?.id); // Refresh the list
    } catch (error) {
      console.error('❌ Error moving process up:', error);
      message.error('Không thể di chuyển quy trình');
    } finally {
      setLoading(false);
    }
  };

  // Handle process move down
  const handleMoveProcessDown = async (process) => {
    
    try {
      setLoading(true);
      
      // Get current order from description field, default to 0 if null
      const currentOrder = process.description ? parseInt(process.description) : 0;
      
      // Find the process below (with higher order number)
      const processesWithOrder = processes.map(p => ({
        ...p,
        order: p.description ? parseInt(p.description) : 0
      }));
      
      // Sort by order to get proper sequence
      processesWithOrder.sort((a, b) => a.order - b.order);
      
      // Find current process index
      const currentIndex = processesWithOrder.findIndex(p => p.id === process.id);
      
      if (currentIndex === -1 || currentIndex >= processesWithOrder.length - 1) {
        message.warning('Quy trình đã ở vị trí cuối cùng');
        return;
      }
      
      // Get the process below
      const processBelow = processesWithOrder[currentIndex + 1];
      const orderBelow = processBelow.order;
      
      // Swap orders: current process gets orderBelow, process below gets currentOrder
      const updatedCurrentProcess = {
        id: process.id,
        title: process.text,
        description: orderBelow.toString(),
        processTabId: process.processTabId || null,
        show: process.show !== false,
        metadata: process.metadata || {}
      };
      
      const updatedProcessBelow = {
        id: processBelow.id,
        title: processBelow.text,
        description: currentOrder.toString(),
        processTabId: processBelow.processTabId || null,
        show: processBelow.show !== false,
        metadata: processBelow.metadata || {}
      };
      
      // Update both processes
      await Promise.all([
        updateProcess(updatedCurrentProcess),
        updateProcess(updatedProcessBelow)
      ]);
      message.success('Đã di chuyển quy trình xuống dưới');
      fetchProcesses(activeProcessTab?.id); // Refresh the list
    } catch (error) {
      console.error('❌ Error moving process down:', error);
      message.error('Không thể di chuyển quy trình');
    } finally {
      setLoading(false);
    }
  };

  // Handle processItem move up
  const handleMoveProcessItemUp = async (processItem, processId) => {
    try {
      setLoading(true);
      
      // Get current process items for this process
      const currentProcessItems = processItems[processId] || [];
      
      // Sort by order to get proper sequence
      const sortedItems = [...currentProcessItems].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Find current item index
      const currentIndex = sortedItems.findIndex(item => item.id === processItem.id);
      
      if (currentIndex <= 0) {
        message.warning('Document đã ở vị trí đầu tiên');
        return;
      }
      
      // Get the item above
      const itemAbove = sortedItems[currentIndex - 1];
      const orderAbove = itemAbove.order || 0;
      const currentOrder = processItem.order || 0;
      
      // Swap orders: current item gets orderAbove, item above gets currentOrder
      const updatedCurrentItem = {
        id: processItem.id,
        title: processItem.text,
        description: processItem.description || '',
        content: processItem.content || '',
        processId: processItem.processId,
        order: orderAbove,
        show: processItem.show !== false,
        metadata: processItem.metadata || {}
      };
      
      const updatedItemAbove = {
        id: itemAbove.id,
        title: itemAbove.text,
        description: itemAbove.description || '',
        content: itemAbove.content || '',
        processId: itemAbove.processId,
        order: currentOrder,
        show: itemAbove.show !== false,
        metadata: itemAbove.metadata || {}
      };
      
      // Update both process items
      await Promise.all([
        updateProcessItem(updatedCurrentItem),
        updateProcessItem(updatedItemAbove)
      ]);
      
      message.success('Đã di chuyển document lên trên');
      fetchProcesses(activeProcessTab?.id); // Refresh the list
    } catch (error) {
      console.error('Error moving process item up:', error);
      message.error('Không thể di chuyển document');
    } finally {
      setLoading(false);
    }
  };

  // Handle processItem move down
  const handleMoveProcessItemDown = async (processItem, processId) => {
    try {
      setLoading(true);
      
      // Get current process items for this process
      const currentProcessItems = processItems[processId] || [];
      
      // Sort by order to get proper sequence
      const sortedItems = [...currentProcessItems].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Find current item index
      const currentIndex = sortedItems.findIndex(item => item.id === processItem.id);
      
      if (currentIndex === -1 || currentIndex >= sortedItems.length - 1) {
        message.warning('Mục quy trình đã ở vị trí cuối cùng');
        return;
      }
      
      // Get the item below
      const itemBelow = sortedItems[currentIndex + 1];
      const orderBelow = itemBelow.order || 0;
      const currentOrder = processItem.order || 0;
      
      // Swap orders: current item gets orderBelow, item below gets currentOrder
      const updatedCurrentItem = {
        id: processItem.id,
        title: processItem.text,
        description: processItem.description || '',
        content: processItem.content || '',
        processId: processItem.processId,
        order: orderBelow,
        show: processItem.show !== false,
        metadata: processItem.metadata || {}
      };
      
      const updatedItemBelow = {
        id: itemBelow.id,
        title: itemBelow.text,
        description: itemBelow.description || '',
        content: itemBelow.content || '',
        processId: itemBelow.processId,
        order: currentOrder,
        show: itemBelow.show !== false,
        metadata: itemBelow.metadata || {}
      };
      
      // Update both process items
      await Promise.all([
        updateProcessItem(updatedCurrentItem),
        updateProcessItem(updatedItemBelow)
      ]);
      
      message.success('Đã di chuyển document xuống dưới');
      fetchProcesses(activeProcessTab?.id); // Refresh the list
    } catch (error) {
      console.error('Error moving process item down:', error);
      message.error('Không thể di chuyển document');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (processItem) => {
    setEditingProcessItem(processItem);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingProcessItem(null);
    setTiptapContent('');
  };

  const saveContent = async () => {
    try {
      setLoading(true);
      // Get content from editor directly to ensure we have the current content
      const currentContent = editor ? editor.getHTML() : (tiptapContent || editingProcessItem.content || '');
      
      let finalMetadata = { ...editingProcessItem.metadata };
      
      // If there's a video file to upload, upload it first
      if (editingProcessItem.metadata?.videoFile) {
        try {
          const uploadResponse = await uploadFileService([editingProcessItem.metadata.videoFile]);
          const uploadedFileData = uploadResponse.files?.[0];
          
          if (uploadedFileData) {
            finalMetadata = {
              ...finalMetadata,
              videoUrl: uploadedFileData.fileUrl,
              videoFileName: uploadedFileData.fileName
            };
            
            // Clean up preview URL and file
            if (editingProcessItem.metadata.videoPreviewUrl) {
              URL.revokeObjectURL(editingProcessItem.metadata.videoPreviewUrl);
            }
            delete finalMetadata.videoPreviewUrl;
            delete finalMetadata.videoFile;
          }
        } catch (error) {
          console.error('❌ Error uploading video:', error);
          message.error('Không thể tải lên video');
          return;
        }
      }
      
      const processItemData = {
        id: editingProcessItem.id,
        title: editingProcessItem.text,
        description: '',
        content: currentContent,
        processId: editingProcessItem.processId,
        order: editingProcessItem.order,
        show: true,
        metadata: finalMetadata
      };
      
      await updateProcessItem(processItemData);
      setIsEditing(false);
      setEditingProcessItem(null);
      setTiptapContent('');
      fetchProcesses(activeProcessTab?.id); // Refresh the list
      // Show success message after a short delay
      setTimeout(() => {
        message.success('Cập nhật nội dung thành công!');
      }, 300);
    } catch (error) {
      console.error('Error updating process item:', error);
      message.error('Không thể cập nhật nội dung');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Calculate the next order number for new processes
      const maxOrder = processes.length > 0 
        ? Math.max(...processes.map(p => parseInt(p.description) || 0))
        : 0;
      const nextOrder = maxOrder + 1;
      
      
      
      const processData = {
        title: values.title,
        description: nextOrder.toString(), // Set order in description field
        processTabId: activeProcessTab?.id, // Assign to current active tab
        show: true,
        metadata: {
          content: {
            sections: [],
            attachments: [],
            tags: [],
            estimatedTime: '',
            difficulty: 'medium'
          },
          version: '1.0',
          lastUpdated: new Date().toISOString()
        }
      };
      
      await createProcess(processData);
      message.success('Tạo quy trình mới thành công!');
      setIsModalVisible(false);
      form.resetFields();
      fetchProcesses(activeProcessTab?.id); // Refresh the list
    } catch (error) {
      console.error('Error creating process:', error);
      message.error('Không thể tạo quy trình mới');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessItemSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Calculate the next order number for new process items in this process
      const currentProcessItems = processItems[selectedProcessId] || [];
      const maxOrder = currentProcessItems.length > 0 
        ? Math.max(...currentProcessItems.map(item => item.order || 0))
        : 0;
      const nextOrder = maxOrder + 1;
      
      const processItemData = {
        title: values.title,
        description: '', // Empty description since we only use content
        content: tiptapContent || '',
        processId: selectedProcessId,
        order: nextOrder, // Set order to max + 1 (bottom of the list)
        show: true,
        metadata: {}
      };
      
      await createProcessItem(processItemData);
      message.success('Tạo mục quy trình mới thành công!');
      setIsProcessItemModalVisible(false);
      setSelectedProcessId(null);
      processItemForm.resetFields();
      setTiptapContent('');
      fetchProcesses(activeProcessTab?.id); // Refresh the list
    } catch (error) {
      console.error('Error creating process item:', error);
      message.error('Không thể tạo mục quy trình mới');
    } finally {
      setLoading(false);
    }
  };

  // Delete functions
  const handleDeleteProcess = async (processId, processTitle) => {
    try {
      setLoading(true);
      await deleteProcess(processId);
      message.success(`Đã xóa quy trình "${processTitle}" thành công!`);
      
      // Clear active heading if it was the deleted process
      const deletedProcess = processes.find(p => p.id === processId);
      if (deletedProcess && activeHeading === deletedProcess.text) {
        setActiveHeading('');
        navigate(`/process-guide/${activeTabId}`);
      }
      
      fetchProcesses(activeProcessTab?.id); // Refresh the list
    } catch (error) {
      console.error('Error deleting process:', error);
      message.error('Không thể xóa quy trình');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProcessItem = async (processItemId, processItemTitle) => {
    try {
      setLoading(true);
      await deleteProcessItem(processItemId);
      message.success(`Đã xóa mục quy trình "${processItemTitle}" thành công!`);
      
      // Clear active heading if it was the deleted process item
      if (activeHeading === processItemTitle) {
        setActiveHeading('');
        navigate(`/process-guide/${activeTabId}`);
      }
      
      fetchProcesses(activeProcessTab?.id); // Refresh the list
    } catch (error) {
      console.error('Error deleting process item:', error);
      message.error('Không thể xóa mục quy trình');
    } finally {
      setLoading(false);
    }
  };

  // Update selectedProcessItem when activeHeading changes
  useEffect(() => {
    if (activeHeading && Object.keys(processItems).length > 0) {
      let foundProcessItem = null;
      for (const processId in processItems) {
        const itemList = processItems[processId];
        foundProcessItem = itemList.find(item => item.text === activeHeading);
        if (foundProcessItem) break;
      }
      
      if (foundProcessItem) {
        // Check if user has access to this process item
        if (hasAccessToProcessItem(foundProcessItem)) {
          setSelectedProcessItem(foundProcessItem);
        } else {
          // User doesn't have access, redirect to process guide home
          setSelectedProcessItem(null);
          setActiveHeading('');
          navigate(`/process-guide/${activeTabId}`);
          message.warning('Bạn không có quyền truy cập vào tài liệu này');
        }
      } else {
        setSelectedProcessItem(null);
      }
    } else {
      setSelectedProcessItem(null);
    }
  }, [activeHeading, processItems, userClasses, currentUser]);

  const renderContent = () => {
    // Show message when no tab is selected
    if (!activeProcessTab) {
      return (
        <div className={styles.content}>
          <p>Chọn một tab để xem các quy trình.</p>
        </div>
      );
    }

    // Check if it's a process (level 1)
    const selectedProcess = processes.find(process => process.text === activeHeading);
    
    // Check if it's a process item (level 2)
    let currentSelectedProcessItem = null;
    for (const processId in processItems) {
      const itemList = processItems[processId];
      currentSelectedProcessItem = itemList.find(item => item.text === activeHeading);
      if (currentSelectedProcessItem) break;
    }

    if (!activeHeading) {
      return (
        <div className={styles.content}>
          <p>Chọn một document từ sidebar để xem hướng dẫn chi tiết.</p>
        </div>
      );
    }

    // Check if it's a process item (level 2)
    if (selectedProcessItem) {
      return (
        <div className={styles.content}>
          
          {isEditing && editingProcessItem?.id === selectedProcessItem.id ? (
                <div>
                  {/* Video Upload Section */}
                  <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Button 
                        icon={<UploadOutlined />}
                        onClick={handleVideoUpload}
                        loading={loading}
                        size="small"
                      >
                        Tải lên Video
                      </Button>
                      {editingProcessItem?.metadata?.videoUrl && (
                        <span style={{ fontSize: '12px', color: '#52c41a' }}>
                          ✓ Video đã tải lên
                        </span>
                      )}
                      {editingProcessItem?.metadata?.videoPreviewUrl && !editingProcessItem?.metadata?.videoUrl && (
                        <span style={{ fontSize: '12px', color: '#1890ff' }}>
                          📹 Video đã chọn (chưa lưu)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Video Preview in Editing Mode */}
                  {(editingProcessItem?.metadata?.videoUrl || editingProcessItem?.metadata?.videoPreviewUrl) && (
                    <div style={{ marginBottom: '20px', position: 'relative' }}>
                      <video 
                        controls 
                        style={{ width: '100%', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        src={editingProcessItem.metadata.videoUrl || editingProcessItem.metadata.videoPreviewUrl}
                      >
                        Trình duyệt của bạn không hỗ trợ video.
                      </video>
                      <Button
                        type="text"
                        danger
                        size="small"
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid #ff4d4f',
                          borderRadius: '4px'
                        }}
                        onClick={() => handleRemoveVideo()}
                        title="Xóa video"
                      >
                        ✕
                      </Button>
                    </div>
                  )}
                  
                  <ProcessItemToolbar editor={editor} />
                  <div className={styles.tiptapEditor}>
                    <EditorContent editor={editor} />
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <Button 
                      type="primary" 
                      onClick={saveContent}
                      loading={loading}
                    >
                      Lưu
                    </Button>
                    <Button onClick={cancelEditing}>
                      Hủy
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className={styles.processItemActionsContainer} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', gap: '8px', alignItems: 'center' }}>
                    {/* Content Search Bar */}
                    <AutoComplete
                      value={contentSearchValue}
                      placeholder="Tìm kiếm nội dung..."
                      style={{ width: '600px' }}
                      onSearch={(value) => {
                        setContentSearchValue(value);
                        if (!value || value.trim().length < 2 || !selectedProcessItem?.content) return;
                        
                        // Search only in the current process item's content
                        const searchResults = [];
                        const searchLower = value.toLowerCase();
                        const content = selectedProcessItem.content;
                        
                        if (content && content.toLowerCase().includes(searchLower)) {
                          // Find all occurrences of the search term
                          const contentLower = content.toLowerCase();
                          let matchIndex = 0;
                          
                          while ((matchIndex = contentLower.indexOf(searchLower, matchIndex)) !== -1) {
                            const startIndex = Math.max(0, matchIndex - 50);
                            const endIndex = Math.min(content.length, matchIndex + value.length + 50);
                            let snippet = content.substring(startIndex, endIndex);
                            
                            // Add ellipsis if needed
                            if (startIndex > 0) snippet = '...' + snippet;
                            if (endIndex < content.length) snippet = snippet + '...';
                            
                            // Highlight the search term
                            const highlightedSnippet = snippet.replace(
                              new RegExp(value, 'gi'),
                              match => `<mark style="background-color: #ffd54f; padding: 0 2px;">${match}</mark>`
                            );
                            
                            searchResults.push({
                              key: `content-${selectedProcessItem.id}-${matchIndex}`,
                              label: (
                                <div style={{ padding: '4px 0' }}>
                                  <div 
                                    style={{ 
                                      fontSize: '12px', 
                                      color: '#333', 
                                      lineHeight: '1.4'
                                    }}
                                    dangerouslySetInnerHTML={{ __html: highlightedSnippet }}
                                  />
                                </div>
                              ),
                              value: `Match ${searchResults.length + 1}`,
                              matchIndex: matchIndex,
                              snippet: snippet,
                              highlightedSnippet: highlightedSnippet
                            });
                            
                            matchIndex += value.length; // Move to next potential match
                          }
                        }
                        
                        // Update search results state
                        setSearchResults(searchResults);
                      }}
                      options={searchResults}
                      onSelect={(value, option) => {
                        if (option.matchIndex !== undefined && selectedProcessItem?.content) {
                          // Clear the search input and results
                          setContentSearchValue('');
                          setSearchResults([]);
                          
                          // Find the closest heading to the match using existing contentHeadings
                          const content = selectedProcessItem.content;
                          const contentLower = content.toLowerCase();
                          let closestHeading = null;
                          let closestDistance = Infinity;
                          
                          // Use the existing contentHeadings instead of parsing HTML again
                          if (contentHeadings.length > 0) {
                            contentHeadings.forEach(heading => {
                              const headingText = heading.text;
                              const headingIndex = contentLower.indexOf(headingText.toLowerCase());
                              
                              // Only consider headings that come BEFORE the search match
                              if (headingIndex !== -1 && headingIndex <= option.matchIndex) {
                                const distance = option.matchIndex - headingIndex; // Distance from heading to match
                                
                                // Prioritize more specific headings (h3, h4, h5, h6) over broader ones (h1, h2)
                                // when they're at similar distances (within 100 characters)
                                let shouldUpdate = false;
                                
                                if (distance < closestDistance) {
                                  shouldUpdate = true;
                                } else if (distance === closestDistance && closestHeading) {
                                  // If same distance, prefer more specific heading
                                  const currentLevel = getHeadingLevel(headingText);
                                  const closestLevel = getHeadingLevel(closestHeading.text);
                                  if (currentLevel > closestLevel) { // Higher number = more specific
                                    shouldUpdate = true;
                                  }
                                }
                                
                                if (shouldUpdate) {
                                  closestDistance = distance;
                                  
                                  closestHeading = {
                                    text: heading.text,
                                    id: heading.id  // Use the existing ID from contentHeadings
                                  };
                                }
                              }
                            });
                          }
                          
                          // Fallback: if no contentHeadings, parse HTML content
                          if (!closestHeading) {
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = content;
                            const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
                            
                            headings.forEach(heading => {
                              const headingText = heading.textContent.trim();
                              const headingIndex = contentLower.indexOf(headingText.toLowerCase());
                              
                              // Only consider headings that come BEFORE the search match
                              if (headingIndex !== -1 && headingIndex <= option.matchIndex) {
                                const distance = option.matchIndex - headingIndex; // Distance from heading to match
                                
                                // Prioritize more specific headings (h3, h4, h5, h6) over broader ones (h1, h2)
                                // when they're at similar distances
                                let shouldUpdate = false;
                                
                                if (distance < closestDistance) {
                                  shouldUpdate = true;
                                } else if (distance === closestDistance && closestHeading) {
                                  // If same distance, prefer more specific heading
                                  const currentLevel = getHeadingLevel(headingText);
                                  const closestLevel = getHeadingLevel(closestHeading.text);
                                  if (currentLevel > closestLevel) { // Higher number = more specific
                                    shouldUpdate = true;
                                  }
                                }
                                
                                if (shouldUpdate) {
                                  closestDistance = distance;
                                  
                                  // Use existing ID if available, otherwise generate a simple one
                                  let headingId = heading.id;
                                  if (!headingId) {
                                    const baseHeadingId = headingText
                                      .toLowerCase()
                                      // Replace Vietnamese special characters with their base Latin equivalents
                                      .replace(/[ăâắặằẳấầẩậẵẫáàạảã]/g, 'a')
                                      .replace(/[ơớờợởôốồổộõỗỡ]/g, 'o')
                                      .replace(/[íìịỉĩ]/g, 'i')
                                      .replace(/[éèẹẻêếềệểẽễ]/g, 'e')
                                      .replace(/[ýỳỵỷỹ]/g, 'y')
                                      .replace(/[úùụủũưứừựữử]/g, 'u')
                                      .replace(/đ/g, 'd')
                                      .replace(/[^a-z0-9\s-]/g, '')
                                      .replace(/\s+/g, '-')
                                      .replace(/-+/g, '-')
                                      .replace(/^-|-$/g, '');
                                    
                                    // Use simple index instead of timestamp
                                    headingId = `h-${baseHeadingId}`;
                                  }
                                  
                                  closestHeading = {
                                    text: headingText,
                                    id: headingId
                                  };
                                }
                              }
                            });
                          }
                          
                          // Navigate to the closest heading
                          if (closestHeading) {
                            navigate(`/process-guide/${activeTabId}/${selectedProcessItem.id}/${closestHeading.id}`);
                            
                            // After navigation, highlight the search term in the content
                            setTimeout(() => {
                              highlightSearchTerm(option.snippet || '');
                            }, 1000); // Wait for navigation to complete
                          } else {
                            // Fallback: navigate to the process item without heading
                            navigate(`/process-guide/${activeTabId}/${selectedProcessItem.id}`);
                            
                            // After navigation, highlight the search term in the content
                            setTimeout(() => {
                              highlightSearchTerm(option.snippet || '');
                            }, 1000); // Wait for navigation to complete
                          }
                        }
                      }}
                      allowClear
                      notFoundContent="Không tìm thấy nội dung"
                      dropdownClassName={styles.searchDropdown}
                    />
                    
                    {/* Mobile View Checkbox */}
                    {selectedProcessItem && currentUser?.isSuperAdmin && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Checkbox
                          checked={selectedProcessItem?.metadata?.haveMobileView || false}
                          onChange={(e) => handleMobileViewChange(e.target.checked)}
                          title="Đánh dấu có Mobile View"
                        >
                          Có Mobile View
                        </Checkbox>
                      </div>
                    )}
                    
                    {currentUser?.isSuperAdmin && (
                      <Button 
                        type="text" 
                        icon={<UploadOutlined />}
                        onClick={() => showUploadModal(selectedProcessItem)}
                        title="Tải lên file đính kèm"
                      />
                    )}
                    {currentUser?.isSuperAdmin && (
                      <Button 
                        type="text" 
                        icon={<EditOutlined />}
                        onClick={() => startEditing(selectedProcessItem)}
                        title="Chỉnh sửa nội dung"
                      />
                    )}
                    <Button 
                      type="text" 
                      icon={
                        currentUser?.info?.bookmarks?.some(
                          bookmark => bookmark.id === selectedProcessItem?.id && bookmark.type === 'processItem'
                        ) ? <NewBookmarkedIcon /> : <NewBookmarkIcon />
                      }
                      onClick={() => handleBookmarkProcessItem(selectedProcessItem)}
                      title="Bookmark document này"
                      style={{ 
                        color: currentUser?.info?.bookmarks?.some(
                          bookmark => bookmark.id === selectedProcessItem?.id && bookmark.type === 'processItem'
                        ) ? '#1890ff' : '#666'
                      }}
                    />
                  </div>
                  {/* Video Preview Section */}
                  {selectedProcessItem?.metadata?.videoUrl && (
                    <div style={{ marginBottom: '20px', position: 'relative' }}>
                      <video 
                        controls 
                        style={{ width: '100%', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        src={selectedProcessItem.metadata.videoUrl}
                      >
                        Trình duyệt của bạn không hỗ trợ video.
                      </video>
                      {isEditing && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid #ff4d4f',
                            borderRadius: '4px'
                          }}
                          onClick={() => handleRemoveVideo()}
                          title="Xóa video"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {selectedProcessItem.content ? (
                    <div 
                      ref={contentRef}
                      className={styles.processItemContent}
                      dangerouslySetInnerHTML={{ __html: modifiedContent || selectedProcessItem.content }}
                    />
                  ) : (
                    <p>Chưa có nội dung cho mục quy trình này.</p>
                  )}
                </div>
              )}
            </div>
          );
    }

         // Check if it's a process
     if (selectedProcess) {
       const metadata = selectedProcess.metadata || {};
       const content = metadata.content || {};
       
       return (
         <div className={styles.content}>
           <h1>{selectedProcess.text}</h1>
           
           <section>
             <h2>Mô tả</h2>
             <p>{selectedProcess.description || 'Chưa có mô tả cho quy trình này.'}</p>
           </section>

           <section>
             <h2>Thông tin chi tiết</h2>
             <div className={styles.processDetails}>
               <p><strong>ID:</strong> {selectedProcess.id}</p>
               {content.estimatedTime && (
                 <p><strong>Thời gian ước tính:</strong> {content.estimatedTime}</p>
               )}
               {content.difficulty && (
                 <p><strong>Độ khó:</strong> {content.difficulty}</p>
               )}
               {content.tags && content.tags.length > 0 && (
                 <div>
                   <p><strong>Tags:</strong></p>
                   <div className={styles.tagsContainer}>
                     {content.tags.map((tag, index) => (
                       <span key={index} className={styles.tag}>{tag}</span>
                     ))}
                   </div>
                 </div>
               )}
             </div>
           </section>

           {content.sections && content.sections.length > 0 && (
             <section>
               <h2>Nội dung chi tiết</h2>
               <div className={styles.contentSections}>
                 {content.sections.map((section, index) => (
                   <div key={index} className={styles.contentSection}>
                     <h3>{section.title}</h3>
                     {section.type === 'text' && (
                       <p>{section.content}</p>
                     )}
                     {section.type === 'list' && (
                       <ul>
                         {section.content.map((item, itemIndex) => (
                           <li key={itemIndex}>{item}</li>
                         ))}
                       </ul>
                     )}
                   </div>
                 ))}
               </div>
             </section>
           )}

           <section>
             <h2>Các document</h2>
             {processItems[selectedProcess.id] && processItems[selectedProcess.id].length > 0 ? (
               <div className={styles.processItemsList}>
                 {processItems[selectedProcess.id]
                   .sort((a, b) => a.order - b.order)
                   .map((item, index) => (
                     <div key={item.id} className={styles.processItemCard}>
                       <h3>{index + 1}. {item.text}</h3>
                       <p>{item.description || 'Chưa có mô tả.'}</p>
                     </div>
                   ))}
               </div>
             ) : (
               <p>Chưa có document nào cho nhóm này.</p>
             )}
           </section>
         </div>
       );
     }

    return (
      <div className={styles.content}>
        <h1>Không tìm thấy</h1>
        <p style={{ marginTop: '8px' }}>Nhóm hoặc document bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
      </div>
    );
  };

  // Deleted items modal handlers
  const showDeletedItemsModal = async () => {
    setIsDeletedItemsModalVisible(true);
    await fetchDeletedItems();
  };

  const handleDeletedItemsCancel = () => {
    setIsDeletedItemsModalVisible(false);
    setDeletedProcesses([]);
    setDeletedProcessItems([]);
  };

  const fetchDeletedItems = async () => {
    try {
      setLoadingDeletedItems(true);
      const [deletedProcessesData, deletedProcessItemsData] = await Promise.all([
        getDeletedProcesses(),
        getDeletedProcessItems()
      ]);
      

      
      setDeletedProcesses(deletedProcessesData || []);
      setDeletedProcessItems(deletedProcessItemsData || []);
      
      // Fetch all items for deleted processes to show complete document list
      if (deletedProcessesData && deletedProcessesData.length > 0) {
        const allItemsForDeletedProcesses = await fetchAllItemsForDeletedProcesses(deletedProcessesData);
        // Store this data for use in the modal
        setAllItemsForDeletedProcesses(allItemsForDeletedProcesses);
      }
    } catch (error) {
      console.error('Error fetching deleted items:', error);
      message.error('Không thể tải danh sách items đã xóa');
    } finally {
      setLoadingDeletedItems(false);
    }
  };

  // Fetch all items for deleted processes (including deleted and active ones)
  const fetchAllItemsForDeletedProcesses = async (deletedProcessesList) => {
    try {
      const allItemsData = {};
      for (const process of deletedProcessesList) {
        // Fetch all items for this process (including deleted ones)
        const items = await getProcessItemsByProcessId(process.id);
        allItemsData[process.id] = items || [];
      }
      return allItemsData;
    } catch (error) {
      console.error('Error fetching all items for deleted processes:', error);
      return {};
    }
  };

  // Fetch current user for bookmark functionality
  const fetchCurrentUser = async () => {
    try {
      const { data, error } = await getCurrentUserLogin();
      if (error) {
        console.error('Error fetching current user:', error);
        return;
      }
      setCurrentUser(data);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  // Handle bookmarking a process item
  const handleBookmarkProcessItem = async (processItem) => {
    
    if (!currentUser) {
      message.error('Vui lòng đăng nhập để sử dụng tính năng bookmark');
      return;
    }

    try {
      // Get current info or initialize empty object
      const currentInfo = currentUser.info || {};
      
      // Get current bookmarks from info or initialize empty array
      const currentBookmarks = currentInfo.bookmarks || [];
      
      // Check if item is already bookmarked
      const isAlreadyBookmarked = currentBookmarks.some(
        bookmark => bookmark.id === processItem.id && bookmark.type === 'processItem'
      );

      if (isAlreadyBookmarked) {
        message.info('Document này đã được bookmark rồi');
        return;
      }

      // Create bookmark object
      const newBookmark = {
        id: processItem.id,
        type: 'processItem',
        title: processItem.title || processItem.text,
        description: processItem.description || '',
        processId: processItem.processId,
        timestamp: new Date().toISOString(),
        url: window.location.pathname
      };



      // Add to bookmarks in info
      const updatedBookmarks = [...currentBookmarks, newBookmark];
      const updatedInfo = { ...currentInfo, bookmarks: updatedBookmarks };
      
      // Update user with new info (including bookmarks)
      await updateUser(currentUser.email, {
        ...currentUser,
        info: updatedInfo
      });

      // Update local state
      setCurrentUser(prev => ({
        ...prev,
        info: updatedInfo
      }));

      message.success('Đã bookmark document thành công!');
    } catch (error) {
      console.error('Error bookmarking process item:', error);
      message.error('Không thể bookmark document');
    }
  };

  // Toggle bookmark filter to show only bookmarked items
  const toggleBookmarkFilter = () => {
    setShowBookmarksOnly(!showBookmarksOnly);
    if (!showBookmarksOnly) {
      message.info('Đang hiển thị các document đã bookmark');
    } else {
      message.info('Đang hiển thị tất cả document');
    }
  };

  const handleRestoreProcess = async (id) => {
    try {
      await restoreProcess(id);
      message.success('Khôi phục process thành công!');
      await Promise.all([
        fetchDeletedItems(), // Refresh the deleted items list
        fetchProcesses(activeProcessTab?.id) // Refresh the main processes list
      ]);
    } catch (error) {
      console.error('Error restoring process:', error);
      message.error('Không thể khôi phục process');
    }
  };

  const handleRestoreProcessItem = async (id) => {
    try {
      await restoreProcessItem(id);
      message.success('Khôi phục process item thành công!');
      await Promise.all([
        fetchDeletedItems(), // Refresh the deleted items list
        fetchProcesses(activeProcessTab?.id) // Refresh the main processes list
      ]);
    } catch (error) {
      console.error('Error restoring process item:', error);
      message.error('Không thể khôi phục process item');
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Handle mobile view change
  const handleMobileViewChange = async (checked) => {
    if (!selectedProcessItem) return;
    
    try {
      // Prepare the updated metadata
      const updatedMetadata = {
        ...selectedProcessItem.metadata,
        haveMobileView: checked
      };
      
      // Update the process item with new metadata
      const updatedProcessItem = {
        ...selectedProcessItem,
        metadata: updatedMetadata
      };
      
      // Call the API to update the process item
      await updateProcessItem(updatedProcessItem);
      
      // Update local state to reflect the change
      setProcessItems(prev => {
        const newProcessItems = { ...prev };
        const processId = selectedProcessItem.processId.toString();
        
        if (newProcessItems[processId]) {
          newProcessItems[processId] = newProcessItems[processId].map(item => 
            item.id === selectedProcessItem.id 
              ? { ...item, metadata: updatedMetadata }
              : item
          );
        }
        
        return newProcessItems;
      });
      
      // Update the selected process item
      setSelectedProcessItem(prev => prev ? { ...prev, metadata: updatedMetadata } : null);
      
      message.success(`Đã ${checked ? 'bật' : 'tắt'} Mobile View cho document "${selectedProcessItem.text}"`);
      
    } catch (error) {
      console.error('Lỗi khi cập nhật Mobile View:', error);
      message.error('Có lỗi xảy ra khi cập nhật Mobile View');
    }
  };

  // Handle privacy modal
  const showPrivacyModal = (processItem) => {
    setSelectedProcessForPrivacy(processItem);
    setIsPrivacyModalVisible(true);
  };

  const handlePrivacySave = async (processItemId, privacySettings) => {
    try {
      setLoading(true);
      
      // Find the process item to get its current data
      let currentProcessItem = null;
      let processId = null;
      for (const pid in processItems) {
        const items = processItems[pid];
        const item = items.find(item => item.id === processItemId);
        if (item) {
          currentProcessItem = item;
          processId = pid;
          break;
        }
      }
      
      if (!currentProcessItem) {
        message.error('Không tìm thấy document để cập nhật');
        return;
      }
      
      // Update the process item with privacy settings
      const updatedProcessItem = {
        id: currentProcessItem.id,
        title: currentProcessItem.text,
        description: currentProcessItem.description || '',
        content: currentProcessItem.content || '',
        processId: parseInt(processId),
        order: currentProcessItem.order || 0,
        show: currentProcessItem.show !== false,
        privacyType: privacySettings.privacyType,
        users: privacySettings.allowedUsers, // Save to users column (JSONB)
        metadata: currentProcessItem.metadata || {}
      };
      
      await updateProcessItem(updatedProcessItem);
      
      // Update local state
      setProcessItems(prev => {
        const updated = { ...prev };
        const items = updated[processId];
        const itemIndex = items.findIndex(item => item.id === processItemId);
        if (itemIndex !== -1) {
          updated[processId] = [...items];
          updated[processId][itemIndex] = { 
            ...items[itemIndex], 
            privacyType: privacySettings.privacyType,
            users: privacySettings.allowedUsers
          };
        }
        return updated;
      });
      
      message.success('Cập nhật quyền riêng tư thành công');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      message.error('Không thể cập nhật quyền riêng tư');
    } finally {
      setLoading(false);
    }
  };

  // Render mobile view if screen width is below 768px
  if (isMobile) {
    return (
      <DataRubikProcessGuideMobile
        // Main content props
        selectedProcessItem={selectedProcessItem}
        modifiedContent={modifiedContent}
        contentRef={contentRef}
        isEditing={isEditing}
        editor={editor}
        handleSave={saveContent}
        handleCancel={cancelEditing}
        handleBookmarkProcessItem={handleBookmarkProcessItem}
        currentUser={currentUser}
        startEditing={startEditing}
        ProcessItemToolbar={ProcessItemToolbar}
        contentHeadings={contentHeadings}
        scrollToContentHeading={scrollToContentHeading}
        activeHeading={activeHeading}
        highlightSearchTerm={highlightSearchTerm}
        
        // Tab-related props
        activeTabId={activeTabId}
        activeProcessTab={activeProcessTab}
        handleTabChange={handleTabChange}
        
        // Sidebar props
        sidebarContent={
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarHeaderRow}>
                {/* <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={showModal}
                  className={styles.addButton}
                >
                  Folder
                </Button> */}
                <div className={styles.sidebarActions}>
                  <Tooltip title={showBookmarksOnly ? "Hiển thị tất cả document" : "Chỉ hiển thị document đã bookmark"}>
                    <Button
                      size="small"       
                      onClick={toggleBookmarkFilter}
                      className={styles.actionButton}
                      style={{
                        color: showBookmarksOnly ? '#1890ff' : '#262626',
                        backgroundColor: showBookmarksOnly ? '#e6f7ff' : 'white',
                        borderColor: showBookmarksOnly ? '#1890ff' : '#d9d9d9'
                      }}
                    >
                      {showBookmarksOnly ? <NewBookmarkedIcon /> : <NewBookmarkIcon />}
                    </Button>
                  </Tooltip>
                  <Tooltip title="Xem items đã xóa">
                    {/* <Button
                      size="small"              
                      onClick={showDeletedItemsModal}
                      className={styles.actionButton}
                      style={{
                        color: '#262626',
                        backgroundColor: 'white',
                        borderColor: '#d9d9d9'
                      }}
                    >
                      <DeleteOutlined />
                    </Button> */}
                  </Tooltip>
                </div>
              </div>
              <div className={styles.sidebarSearchContainer}>
                <Input 
                  value={sidebarSearchValue}
                  onChange={(e) => setSidebarSearchValue(e.target.value)}
                  placeholder="Tìm kiếm file..."
                  prefix={<SearchOutlined />}
                  className={styles.sidebarSearchInput}
                />
              </div>
            </div>
            
            {loading ? (
              <div className={styles.loadingContainer}>
                <Spin size="small" />
                <span>Đang tải...</span>
              </div>
            ) : (
              <div className={styles.headingsList}>
                {processes
                  .filter(process => {
                    const shouldShowProcess = !showBookmarksOnly || 
                      (processItems[process.id] && processItems[process.id].some(item => 
                        currentUser?.info?.bookmarks?.some(
                          bookmark => bookmark.id === item.id && bookmark.type === 'processItem'
                        )
                      ));
                    
                    const searchMatch = !sidebarSearchValue || 
                      process.text.toLowerCase().includes(sidebarSearchValue.toLowerCase());
                    
                    return shouldShowProcess && searchMatch;
                  })
                  .map(process => {
                    const items = processItems[process.id] || [];
                    const filteredItems = items.filter(item => {
                      // Check access control first
                      if (!hasAccessToProcessItem(item)) {
                        return false;
                      }
                      
                      if (showBookmarksOnly) {
                        return currentUser?.info?.bookmarks?.some(
                          bookmark => bookmark.id === item.id && bookmark.type === 'processItem'
                        );
                      }
                      
                      return !item.deleted;
                    });
                    
                    const shouldShowProcess = !showBookmarksOnly || filteredItems.length > 0;
                    
                    // Don't render process if it shouldn't be shown
                    if (!shouldShowProcess) {
                      return null;
                    }
                    
                    return (
                      <div key={process.id}>
                        <div className={styles.processHeader}>
                          <Dropdown
                            menu={{
                              items: [
                                {
                                  key: 'moveUp',
                                  label: '⬆️ Di chuyển lên',
                                  onClick: () => handleMoveProcessUp(process)
                                },
                                {
                                  key: 'moveDown',
                                  label: '⬇️ Di chuyển xuống',
                                  onClick: () => handleMoveProcessDown(process)
                                },
                                {
                                  type: 'divider'
                                },
                                {
                                  key: 'rename',
                                  label: 'Đổi tên nhóm',
                                  onClick: () => showRenameProcessModal(process)
                                },
                                {
                                  type: 'divider'
                                },
                                {
                                  key: 'delete',
                                  label: 'Xóa nhóm',
                                  danger: true,
                                  onClick: () => {
                                    Modal.confirm({
                                      title: 'Xác nhận xóa',
                                      content: `Bạn có chắc chắn muốn xóa "${process.text}"? Hành động này sẽ xóa tất cả các document con.`,
                                      okText: 'Xóa',
                                      okType: 'danger',
                                      cancelText: 'Hủy',
                                      onOk: () => handleDeleteProcess(process.id, process.text)
                                    });
                                  }
                                }
                              ]
                            }}
                            trigger={['contextMenu']}
                          >
                            <div
                              className={`${styles.headingItem} ${activeHeading === process.text ? styles.active : ''}`}
                              data-level={process.level}
                              onClick={() => toggleProcessExpansion(process.id)}
                            >
                              {expandedProcesses.has(process.id) ? <DownOutlined /> : <RightOutlined />}
                              {process.text}
                            </div>
                          </Dropdown>
                          <Tooltip title="Thêm document">
                            <Button
                              type="text"
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                showProcessItemModal(process.id);
                              }}
                              className={styles.addProcessItemButton}
                            />
                          </Tooltip>
                        </div>
                        
                        {/* Process Items */}
                        {expandedProcesses.has(process.id) && (
                          <div className={styles.processItemsContainer}>
                            {filteredItems.length > 0 ? (
                              filteredItems
                              .sort((a, b) => a.order - b.order)
                              .map(item => (
                                <div
                                  key={item.id}
                                  className={`${styles.headingItem} ${activeHeading === item.text ? styles.active : ''}`}
                                  data-level={item.level}
                                  onClick={() => scrollToHeading(item.text, item.id)}
                                >
                                  <span style={{ flex: 1 }}>{item.text}</span>
                                  {currentUser?.info?.bookmarks?.some(
                                    bookmark => bookmark.id === item.id && bookmark.type === 'processItem'
                                  ) && (
                                    <NewBookmarkedIcon 
                                      style={{ 
                                        color: '#1890ff', 
                                        fontSize: '12px', 
                                        marginLeft: '8px',
                                        flexShrink: 0
                                      }} 
                                      title="Đã bookmark"
                                    />
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className={styles.emptyProcessItems}>
                                <p>Chưa có document nào trong nhóm này.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        }
        
        // Content headings sidebar props
        contentHeadingsSidebar={
          <div className={styles.contentHeadingsSidebar}>
            <div className={styles.attachmentsSection}>
              <h4>Đính kèm</h4>
              {selectedProcessItem?.metadata?.attachments && selectedProcessItem.metadata.attachments.length > 0 ? (
                <div className={styles.attachmentsList}>
                  {selectedProcessItem.metadata.attachments.map((attachment, index) => (
                    <div 
                      key={index} 
                      className={`${styles.attachmentItem} ${isFilePreviewable(attachment.fileExtension) ? styles.clickable : ''}`}
                      onClick={() => isFilePreviewable(attachment.fileExtension) && showFilePreview(attachment)}
                      style={{ cursor: isFilePreviewable(attachment.fileExtension) ? 'pointer' : 'default' }}
                    >
                      <div className={styles.attachmentIcon}>
                        {attachment.fileExtension === '.pdf' && '📄'}
                        {attachment.fileExtension === '.doc' && '📝'}
                        {attachment.fileExtension === '.docx' && '📝'}
                        {attachment.fileExtension === '.xls' && '📊'}
                        {attachment.fileExtension === '.xlsx' && '📊'}
                        {attachment.fileExtension === '.ppt' && '📊'}
                        {attachment.fileExtension === '.pptx' && '📊'}
                        {attachment.fileExtension === '.jpg' && '🖼️'}
                        {attachment.fileExtension === '.jpeg' && '🖼️'}
                        {attachment.fileExtension === '.png' && '🖼️'}
                        {attachment.fileExtension === '.gif' && '🖼️'}
                        {attachment.fileExtension === '.txt' && '📄'}
                        {attachment.fileExtension === '.zip' && '🗜️'}
                        {attachment.fileExtension === '.rar' && '🗜️'}
                        {!['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.gif', '.txt', '.zip', '.rar'].includes(attachment.fileExtension) && '📄'}
                      </div>
                      <div className={styles.attachmentInfo}>
                        <div className={styles.attachmentName}>{attachment.fileName}</div>
                        <div className={styles.attachmentMeta}>
                          {attachment.fileSize} • {attachment.fileExtension}
                        </div>
                      </div>
                      <a
                        href={attachment.fileUrl}
                        download={attachment.fileName}
                        className={styles.attachmentDownload}
                        title="Tải xuống"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ⬇️
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Không có file đính kèm</p>
              )}
            </div>
            
            <div className={styles.contentHeadingsList}>
              <h4>Mục lục</h4>
              {contentHeadings.length > 0 ? (
                contentHeadings.map((heading, index) => (
                  <div
                    key={index}
                    className={`${styles.contentHeadingItem} level${heading.level}`}
                    onClick={() => scrollToContentHeading(heading.text)}
                  >
                    {heading.text}
                  </div>
                ))
              ) : (
                <p>Không có mục lục</p>
              )}
            </div>
          </div>
        }
        
        // Search modal props
        setIsSearchModalVisible={setIsSearchModalVisible}
        
        // File preview props
        showFilePreview={showFilePreview}
        isFilePreviewable={isFilePreviewable}
        isFilePreviewModalVisible={isFilePreviewModalVisible}
        selectedFileForPreview={selectedFileForPreview}
        handleFilePreviewCancel={handleFilePreviewCancel}
        
        // Video management props
        handleRemoveVideo={handleRemoveVideo}
        
        // Loading state
        loading={loading}
      />
    );
  }

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1}}>
          <div 
            className={styles.backCanvas}
            onClick={() => navigate('/dashboard')}
            title="Back to Dashboard"
          >
            <BackCanvas height={20} width={20} />
          </div>
          {tool && <img src={getIconSrcById(tool)} alt={tool.name} width={30} height={30} />}
          <h1 className={styles.topBarTitle}>{nameTable || 'Tài liệu sử dụng BCanvas'}</h1>
          
          <div className={styles.searchContainer}>
            <Tooltip title="Tìm kiếm trong tài liệu (Ctrl+Shift+F)">
              <Button
                type="primary"
                icon={<NewSearchIcon />}
                onClick={() => setIsSearchModalVisible(true)}
                size="middle"
                className={styles.searchButton}
              >
                Tìm kiếm tất cả
              </Button>
            </Tooltip>
            {currentUser?.isSuperAdmin && (
              <Button
                type="default"
                icon={<EditOutlined />}
                onClick={() => setIsUserProcessGuideModalVisible(true)}
                size="middle"
                className={styles.userClassButton}
                style={{ marginLeft: '8px' }}
              >
                Cài đặt nhóm người dùng
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Tab Bar */}
      <TabBar 
        onTabChange={handleTabChange}
        activeTabId={activeTabId}
        shouldAutoSelect={!tabId}
        currentUser={currentUser}
      />
      
      <div className={styles.content}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarHeaderRow}>
            {currentUser?.isSuperAdmin && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={showModal}
                size="small"
                className={styles.addButton}
              >
                Folder
              </Button>
            )}
              <div className={styles.sidebarActions}>
                <Tooltip title={showBookmarksOnly ? "Hiển thị tất cả document" : "Chỉ hiển thị document đã bookmark"}>
                  <Button
                    size="small"
                    onClick={toggleBookmarkFilter}
                    className={styles.actionButton}
                    style={{
                      color: showBookmarksOnly ? '#1890ff' : '#262626',
                      backgroundColor: showBookmarksOnly ? '#e6f7ff' : 'white',
                      borderColor: showBookmarksOnly ? '#1890ff' : '#d9d9d9'
                    }}
                  >
                    Xem {showBookmarksOnly ? <NewBookmarkedIcon /> : <NewBookmarkIcon />}
                  </Button>
                </Tooltip>
                {currentUser?.isSuperAdmin && (
                  <Tooltip title="Xem items đã xóa">
                    <Button
                      size="small"
                      onClick={showDeletedItemsModal}
                      className={styles.actionButton}
                      style={{
                        color: '#262626',
                        backgroundColor: 'white',
                        borderColor: '#d9d9d9'
                      }}
                    >
                      Đã xoá <DeleteOutlined />
                    </Button>
                  </Tooltip>
                )}
              </div>
            </div>
            <div className={styles.sidebarSearchContainer}>
              <Input 
                value={sidebarSearchValue}
                onChange={(e) => searchSidebarItems(e.target.value)}
                placeholder="Tìm kiếm file..."
                prefix={<SearchOutlined />}
                size="small"
                allowClear
                style={{ width: '180px' }}
              />
            </div>
          </div>
          
          {loading ? (
            <div className={styles.loadingContainer}>
              <Spin size="small" />
              <span>Đang tải...</span>
            </div>
          ) : !activeProcessTab ? (
            <div className={styles.loadingContainer}>
              <span>Chọn một tab để xem các nhóm</span>
            </div>
          ) : (
            processes.map((process) => {
              // Filter process items based on search term and bookmark filter
              const processItemsList = processItems[process.id] || [];
              const searchLower = sidebarSearchValue.toLowerCase();
              
              let filteredItems = processItemsList;
              let shouldShowProcess = true;
              
              // Apply access control filter first
              filteredItems = processItemsList.filter(item => hasAccessToProcessItem(item));
              
              // Apply search filter
              if (sidebarSearchValue.trim()) {
                filteredItems = filteredItems.filter(item => 
                  item.text.toLowerCase().includes(searchLower)
                );
                // Only show process if it has matching items for search
                shouldShowProcess = filteredItems.length > 0;
              }
              
              // Apply bookmark filter - only show processes with bookmarked items
              if (showBookmarksOnly && currentUser?.info?.bookmarks) {
                const bookmarkedItemIds = currentUser.info.bookmarks
                  .filter(bookmark => bookmark.type === 'processItem')
                  .map(bookmark => bookmark.id);
                
                // Filter items to show only bookmarked ones
                filteredItems = filteredItems.filter(item => 
                  bookmarkedItemIds.includes(item.id)
                );
                
                // Only show process if it has bookmarked items
                shouldShowProcess = filteredItems.length > 0;
              } else if (!sidebarSearchValue.trim()) {
                // For normal view without search, always show all processes regardless of items
                shouldShowProcess = true;
              }
              
              // Don't render process if it shouldn't be shown
              if (!shouldShowProcess) {
                return null;
              }
              
              return (
                <div key={process.id}>
                  <div className={styles.processHeader}>
                    <Dropdown
                      menu={{
                        items: [
                          ...(currentUser?.isSuperAdmin ? [
                            {
                              key: 'moveUp',
                              label: '⬆️ Di chuyển lên',
                              onClick: () => handleMoveProcessUp(process)
                            },
                            {
                              key: 'moveDown',
                              label: '⬇️ Di chuyển xuống',
                              onClick: () => handleMoveProcessDown(process)
                            },
                            {
                              type: 'divider'
                            },
                            {
                              key: 'rename',
                              label: 'Đổi tên nhóm',
                              onClick: () => showRenameProcessModal(process)
                            },
                            {
                              type: 'divider'
                            },
                            {
                              key: 'delete',
                              label: 'Xóa nhóm',
                              danger: true,
                              onClick: () => {
                                Modal.confirm({
                                  title: 'Xác nhận xóa',
                                  content: `Bạn có chắc chắn muốn xóa "${process.text}"? Hành động này sẽ xóa tất cả các document con.`,
                                  okText: 'Xóa',
                                  okType: 'danger',
                                  cancelText: 'Hủy',
                                  onOk: () => handleDeleteProcess(process.id, process.text)
                                });
                              }
                            }
                          ] : [])
                        ]
                      }}
                      trigger={['contextMenu']}
                    >
                      <div
                        className={`${styles.headingItem} ${activeHeading === process.text ? styles.active : ''}`}
                        data-level={process.level}
                        onClick={() => toggleProcessExpansion(process.id)}
                      >
                        {expandedProcesses.has(process.id) ? <DownOutlined /> : <RightOutlined />}
                        {process.text}
                      </div>
                    </Dropdown>
                    {currentUser?.isSuperAdmin && (
                      <Tooltip title="Thêm document">
                        <Button
                          type="text"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            showProcessItemModal(process.id);
                          }}
                          className={styles.addProcessItemButton}
                        />
                      </Tooltip>
                    )}
                  </div>
                  
                  {/* Process Items */}
                  {expandedProcesses.has(process.id) && (
                    <div className={styles.processItemsContainer}>
                      {filteredItems.length > 0 ? (
                        filteredItems
                        .sort((a, b) => a.order - b.order)
                        .map((item) => (
                          <Dropdown
                            key={item.id}
                            menu={{
                              items: [
                                ...(currentUser?.isSuperAdmin ? [
                                  {
                                    key: 'moveUp',
                                    label: '⬆️ Di chuyển lên',
                                    onClick: () => handleMoveProcessItemUp(item, process.id)
                                  },
                                  {
                                    key: 'moveDown',
                                    label: '⬇️ Di chuyển xuống',
                                    onClick: () => handleMoveProcessItemDown(item, process.id)
                                  },
                                  {
                                    type: 'divider'
                                  },
                                  {
                                    key: 'rename',
                                    label: 'Đổi tên document',
                                    onClick: () => showRenameProcessItemModal(item)
                                  },
                                  {
                                    key: 'privacy',
                                    label: 'Chỉnh sửa quyền riêng tư',
                                    onClick: () => showPrivacyModal(item)
                                  },
                                  {
                                    type: 'divider'
                                  },
                                  {
                                    key: 'delete',
                                    label: 'Xóa document',
                                    danger: true,
                                    onClick: () => {
                                      Modal.confirm({
                                        title: 'Xác nhận xóa',
                                        content: `Bạn có chắc chắn muốn xóa document "${item.text}"?`,
                                        okText: 'Xóa',
                                        okType: 'danger',
                                        cancelText: 'Hủy',
                                        onOk: () => handleDeleteProcessItem(item.id, item.text)
                                      });
                                    }
                                  }
                                ] : [
                                  {
                                    key: 'privacy',
                                    label: 'Chỉnh sửa quyền riêng tư',
                                    onClick: () => showPrivacyModal(item)
                                  }
                                ])
                              ]
                            }}
                            trigger={['contextMenu']}
                          >
                            <div
                              className={`${styles.headingItem} ${activeHeading === item.text ? styles.active : ''}`}
                              data-level={item.level}
                              onClick={() => scrollToHeading(item.text, item.id)}
                            >
                                <span style={{ flex: 1 }}>{item.text}</span>
                                {currentUser?.info?.bookmarks?.some(
                                  bookmark => bookmark.id === item.id && bookmark.type === 'processItem'
                                ) && (
                                  <NewBookmarkedIcon 
                                    style={{ 
                                      color: '#1890ff', 
                                      fontSize: '12px', 
                                      marginLeft: '8px',
                                      flexShrink: 0
                                    }} 
                                    title="Đã bookmark"
                                  />
                                )}
                            </div>
                          </Dropdown>
                          ))
                      ) : (
                        <div style={{
                          padding: '8px 12px',
                          fontSize: '11px',
                          color: '#999',
                          fontStyle: 'italic',
                          textAlign: 'center'
                        }}>
                          {showBookmarksOnly ? 'Không có document nào được bookmark trong nhóm này' : 'Không có document nào'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className={styles.quillMain}>
          {/* Content Headings Sidebar - Only show when viewing a process item */}
          {activeHeading && (
            <div className={styles.contentHeadingsSidebar}>
              <div className={styles.sidebarHeader}>
                {/* Attached Files Section */}
                {(() => {
                  // Find the current process item to get its metadata
                  let currentProcessItem = null;
                  for (const processId in processItems) {
                    const itemList = processItems[processId];
                    currentProcessItem = itemList.find(item => item.text === activeHeading);
                    if (currentProcessItem) break;
                  }
                  
                  const attachments = currentProcessItem?.metadata?.attachments || [];
                  
                  return attachments.length > 0 ? (
                    <div className={styles.attachmentsSection}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#262626' }}>
                        File đính kèm ({attachments.length})
                      </h4>
                      <div className={styles.attachmentsList}>
                        {attachments.map((attachment, index) => (
                          <div 
                            key={index} 
                            className={`${styles.attachmentItem} ${isFilePreviewable(attachment.fileExtension) ? styles.clickable : ''}`}
                            onClick={() => isFilePreviewable(attachment.fileExtension) && showFilePreview(attachment)}
                            style={{ cursor: isFilePreviewable(attachment.fileExtension) ? 'pointer' : 'default' }}
                          >
                            <div className={styles.attachmentIcon}>
                              {attachment.fileExtension === '.pdf' && '📄'}
                              {attachment.fileExtension === '.doc' && '📝'}
                              {attachment.fileExtension === '.docx' && '📝'}
                              {attachment.fileExtension === '.txt' && '📄'}
                              {attachment.fileExtension === '.jpg' && '🖼️'}
                              {attachment.fileExtension === '.jpeg' && '🖼️'}
                              {attachment.fileExtension === '.png' && '🖼️'}
                              {attachment.fileExtension === '.gif' && '🖼️'}
                              {attachment.fileExtension === '.xlsx' && '📊'}
                              {attachment.fileExtension === '.xls' && '📊'}
                              {attachment.fileExtension === '.ppt' && '📊'}
                              {attachment.fileExtension === '.pptx' && '📊'}
                              {!['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.xlsx', '.xls', '.ppt', '.pptx'].includes(attachment.fileExtension) && '📎'}
                            </div>
                            <div className={styles.attachmentInfo}>
                              <div className={styles.attachmentName} title={attachment.fileName}>
                                {attachment.fileName}
                              </div>
                            </div>
                            <a 
                              href={attachment.fileURL} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={styles.attachmentDownload}
                              title="Tải xuống file"
                              onClick={(e) => e.stopPropagation()}
                            >
                              ⬇️
                            </a>
                            {currentUser?.isSuperAdmin && (
                              <button
                                className={styles.attachmentDelete}
                                title="Xóa file đính kèm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAttachment(attachment, index);
                                }}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
              <div className={styles.contentHeadingsList}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#262626' }}>Mục lục</h3>
                {contentHeadings.length > 0 ? (
                  contentHeadings.map((heading) => (
                    <div
                      key={heading.id}
                      className={`${styles.contentHeadingItem} ${styles[`level${heading.level}`]}`}
                      onClick={() => {
                        scrollToContentHeading(heading.text);
                        // Update URL with heading ID
                        if (processItemId) {
                          navigate(`/process-guide/${activeTabId}/${processItemId}/${heading.id}`);
                        }
                      }}
                    >
                      {heading.text}
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '12px', color: '#999', margin: '8px 0' }}>Không có mục lục</p>
                )}
              </div>
            </div>
          )}
          
          <div className={styles.mainContent}>
            {renderContent()}
          </div>
        </div>
      </div>

       {/* Add Process Modal */}
       <Modal
         title="Thêm nhóm mới"
         open={isModalVisible}
         onCancel={handleCancel}
         footer={null}
         width={600}
       >
         <Form
           form={form}
           layout="vertical"
           onFinish={handleSubmit}
         >
           <Form.Item
             name="title"
             label="Tiêu đề"
             rules={[
               { required: true, message: 'Vui lòng nhập tiêu đề!' },
               { max: 255, message: 'Tiêu đề không được quá 255 ký tự!' }
             ]}
           >
             <Input placeholder="Nhập tiêu đề nhóm" />
           </Form.Item>

           <Form.Item>
             <div style={{ textAlign: 'right' }}>
               <Button onClick={handleCancel} style={{ marginRight: 8 }}>
                 Hủy
               </Button>
               <Button type="primary" htmlType="submit" loading={loading}>
                 Tạo nhóm
               </Button>
             </div>
           </Form.Item>
         </Form>
       </Modal>

       {/* Add Process Item Modal */}
       <Modal
         title="Thêm document mới"
         open={isProcessItemModalVisible}
         onCancel={handleProcessItemCancel}
         footer={null}
         width={600}
       >
         <Form
           form={processItemForm}
           layout="vertical"
           onFinish={handleProcessItemSubmit}
         >
           <Form.Item
             name="title"
             label="Tiêu đề"
             rules={[
               { required: true, message: 'Vui lòng nhập tiêu đề!' },
               { max: 255, message: 'Tiêu đề không được quá 255 ký tự!' }
             ]}
           >
             <Input placeholder="Nhập tiêu đề document" />
           </Form.Item>


           <Form.Item>
             <div style={{ textAlign: 'right' }}>
               <Button onClick={handleProcessItemCancel} style={{ marginRight: 8 }}>
                 Hủy
               </Button>
               <Button type="primary" htmlType="submit" loading={loading}>
                 Tạo document
               </Button>
             </div>
           </Form.Item>
         </Form>
       </Modal>

       {/* Rename Process Modal */}
       <Modal
         title="Đổi tên nhóm"
         open={isRenameProcessModalVisible}
         onCancel={handleRenameProcessCancel}
         footer={null}
         width={500}
       >
         <Form
           form={renameProcessForm}
           layout="vertical"
           onFinish={handleRenameProcessSubmit}
         >
           <Form.Item
             name="title"
             label="Tên nhóm mới"
             rules={[
               { required: true, message: 'Vui lòng nhập tên nhóm!' },
               { max: 255, message: 'Tên nhóm không được quá 255 ký tự!' }
             ]}
           >
             <Input placeholder="Nhập tên nhóm mới" />
           </Form.Item>

           <Form.Item>
             <div style={{ textAlign: 'right' }}>
               <Button onClick={handleRenameProcessCancel} style={{ marginRight: 8 }}>
                 Hủy
               </Button>
               <Button type="primary" htmlType="submit" loading={loading}>
                 Đổi tên
               </Button>
             </div>
           </Form.Item>
         </Form>
       </Modal>

       {/* Rename Process Item Modal */}
       <Modal
         title="Đổi tên document"
         open={isRenameProcessItemModalVisible}
         onCancel={handleRenameProcessItemCancel}
         footer={null}
         width={500}
       >
         <Form
           form={renameProcessItemForm}
           layout="vertical"
           onFinish={handleRenameProcessItemSubmit}
         >
           <Form.Item
             name="title"
             label="Tên document mới"
             rules={[
               { required: true, message: 'Vui lòng nhập tên document!' },
               { max: 255, message: 'Tên document không được quá 255 ký tự!' }
             ]}
           >
             <Input placeholder="Nhập tên document mới" />
           </Form.Item>

           <Form.Item>
             <div style={{ textAlign: 'right' }}>
               <Button onClick={handleRenameProcessItemCancel} style={{ marginRight: 8 }}>
                 Hủy
               </Button>
               <Button type="primary" htmlType="submit" loading={loading}>
                 Đổi tên
               </Button>
             </div>
           </Form.Item>
         </Form>
       </Modal>

       {/* Upload File Modal */}
       <Modal
         title="Tải lên file đính kèm"
         open={isUploadModalVisible}
         onCancel={handleUploadCancel}
         footer={null}
         width={500}
       >
         <Form
           form={uploadForm}
           layout="vertical"
           onFinish={handleUploadSubmit}
         >
           <Form.Item
             label="Chọn file"
           >
             <Upload {...uploadProps}>
               <Button icon={<UploadOutlined />}>Chọn file</Button>
             </Upload>
             {selectedFile && (
               <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
                 <div style={{ fontSize: '12px', color: '#52c41a' }}>
                   <strong>File đã chọn:</strong> {selectedFile.name}
                 </div>
               </div>
             )}
           </Form.Item>

           <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
             <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
               <strong>File được hỗ trợ:</strong>
             </div>
             <div style={{ fontSize: '11px', color: '#888' }}>
               PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, GIF, XLSX, XLS, PPT, PPTX
             </div>
           </div>

           <Form.Item>
             <div style={{ textAlign: 'right' }}>
               <Button onClick={handleUploadCancel} style={{ marginRight: 8 }}>
                 Hủy
               </Button>
               <Button type="primary" htmlType="submit" loading={loading}>
                 Tải lên
               </Button>
             </div>
           </Form.Item>
         </Form>
       </Modal>

       {/* File Preview Modal */}
       <FilePreviewModal
         isVisible={isFilePreviewModalVisible}
         selectedFile={selectedFileForPreview}
         onCancel={handleFilePreviewCancel}
       />

       {/* Deleted Items Modal */}
       <Modal
         title="Items đã xóa"
         open={isDeletedItemsModalVisible}
         onCancel={handleDeletedItemsCancel}
         footer={null}
         width="80%"
         style={{ top: 20 }}
       >
         {loadingDeletedItems ? (
           <div style={{ textAlign: 'center', padding: '40px' }}>
             <Spin size="large" />
             <div style={{ marginTop: '16px' }}>Đang tải...</div>
           </div>
         ) : (
           <div>
             {/* Deleted Processes Section */}
             <div style={{ marginBottom: '24px' }}>
               <h3 style={{ marginBottom: '16px', color: '#1890ff' }}>
                 Nhóm đã xóa ({deletedProcesses.length})
               </h3>
               {deletedProcesses.length > 0 ? (
                 <div>
                   {deletedProcesses.map((process) => {
                     // Find ALL process items that belong to this process (both deleted and active)
                     const allProcessItemsForProcess = allItemsForDeletedProcesses[process.id] || [];
                     const deletedProcessItemsForProcess = deletedProcessItems.filter(
                       item => item.processId === process.id || item.processId === process.id.toString()
                     );
                     

                     
                     // Check if there are any process items with matching processId
                     const matchingDeletedItems = deletedProcessItems.filter(item => {
                       return item.processId === process.id;
                     });
                     

                     
                     // Combine both arrays and remove duplicates
                     const allItems = [...allProcessItemsForProcess];
                     deletedProcessItemsForProcess.forEach(deletedItem => {
                       if (!allItems.some(item => item.id === deletedItem.id)) {
                         allItems.push(deletedItem);
                       }
                     });
                     

                     
                     return (
                       <div
                         key={process.id}
                         style={{
                           padding: '16px',
                           border: '1px solid #d9d9d9',
                           borderRadius: '8px',
                           marginBottom: '16px',
                           backgroundColor: '#fafafa'
                         }}
                       >
                         {/* Process Header */}
                         <div style={{
                           display: 'flex',
                           justifyContent: 'space-between',
                           alignItems: 'center',
                           marginBottom: '12px',
                           paddingBottom: '8px',
                           borderBottom: '1px solid #e8e8e8'
                         }}>
                           <div>
                             <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                               {process.title || process.text}
                             </div>
                             {process.description && (
                               <div style={{ fontSize: '12px', color: '#666' }}>
                                 {process.description}
                               </div>
                             )}
                           </div>
                           <Button
                             type="primary"
                             size="small"
                             onClick={() => handleRestoreProcess(process.id)}
                           >
                             Khôi phục nhóm
                           </Button>
                         </div>
                         
                         {/* All Process Items List */}
                         {allItems.length > 0 ? (
                           <div>
                             <div style={{ 
                               fontSize: '14px', 
                               fontWeight: '500', 
                               color: '#666', 
                               marginBottom: '8px' 
                             }}>
                               Tất cả documents trong nhóm ({allItems.length}):
                             </div>
                             {allItems.map((item) => {
                               const isDeleted = deletedProcessItems.some(deletedItem => deletedItem.id === item.id);
                               
                               return (
                                 <div
                                   key={item.id}
                                   style={{
                                     padding: '8px 12px',
                                     border: '1px solid #e8e8e8',
                                     borderRadius: '4px',
                                     marginBottom: '6px',
                                     backgroundColor: isDeleted ? '#fff2f0' : '#fff',
                                     borderLeft: isDeleted ? '4px solid #ff4d4f' : '1px solid #e8e8e8',
                                     display: 'flex',
                                     justifyContent: 'space-between',
                                     alignItems: 'center'
                                   }}
                                 >
                                   <div>
                                     <div style={{ 
                                       fontWeight: '500', 
                                       marginBottom: '2px',
                                       color: isDeleted ? '#cf1322' : '#262626'
                                     }}>
                                       {item.title || item.text}
                                       {isDeleted && (
                                         <span style={{ 
                                           fontSize: '11px', 
                                           color: '#ff4d4f', 
                                           marginLeft: '8px',
                                           fontWeight: 'normal'
                                         }}>
                                           🗑️ Đã xóa
                                         </span>
                                       )}
                                     </div>
                                     {item.description && (
                                       <div style={{ fontSize: '11px', color: '#888' }}>
                                         {item.description}
                                       </div>
                                     )}
                                     {item.content && (
                                       <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                                         {item.content.substring(0, 80)}...
                                       </div>
                                     )}
                                   </div>
                                   {isDeleted ? (
                                     <span style={{ 
                                       fontSize: '12px', 
                                       color: '#ff4d4f',
                                       fontWeight: '500',
                                       padding: '4px 8px',
                                       backgroundColor: '#fff2f0',                                    
                                       borderRadius: '4px'
                                     }}>
                                       🗑️ Đã xóa
                                     </span>
                                   ) : (
                                     <span style={{ 
                                       fontSize: '11px', 
                                       color: '#52c41a',
                                       fontWeight: '500' 
                                     }}>
                                       ✅ Hoạt động
                                     </span>
                                   )}
                                 </div>
                               );
                             })}
                           </div>
                         ) : (
                           <div style={{ 
                             textAlign: 'center', 
                             padding: '12px', 
                             color: '#999', 
                             fontSize: '12px',
                             fontStyle: 'italic'
                           }}>
                             Không có documents nào trong nhóm này
                           </div>
                         )}
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                   Không có nhóm nào đã xóa
                 </div>
               )}
             </div>

             {/* Deleted Process Items Section */}
             <div>
               <h3 style={{ marginBottom: '16px', color: '#1890ff' }}>
                 Document đã xóa (thuộc nhóm còn hoạt động) ({deletedProcessItems.filter(item => 
                   !deletedProcesses.some(process => process.id === item.processId)
                 ).length})
               </h3>
               {deletedProcessItems.filter(item => 
                 !deletedProcesses.some(process => process.id === item.processId)
               ).length > 0 ? (
                 <div>
                   {deletedProcessItems
                     .filter(item => !deletedProcesses.some(process => process.id === item.processId))
                     .map((item) => {
                       // Find the parent process to show its name
                       const parentProcess = processes.find(process => process.id === item.processId);
                       
                       return (
                         <div
                           key={item.id}
                           style={{
                             padding: '12px',
                             border: '1px solid #d9d9d9',
                             borderRadius: '6px',
                             marginBottom: '8px',
                             backgroundColor: '#fafafa',
                             display: 'flex',
                             justifyContent: 'space-between',
                             alignItems: 'center'
                           }}
                         >
                           <div>
                             <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                               {item.title || item.text}
                             </div>
                             {parentProcess && (
                               <div style={{ fontSize: '12px', color: '#1890ff', marginBottom: '2px' }}>
                                 📁 Thuộc nhóm: {parentProcess.title || parentProcess.text}
                               </div>
                             )}
                             {item.description && (
                               <div style={{ fontSize: '12px', color: '#666' }}>
                                 {item.description}
                               </div>
                             )}
                             {item.content && (
                               <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                 {item.content.substring(0, 100)}...
                               </div>
                             )}
                           </div>
                           <Button
                             type="primary"
                             size="small"
                             onClick={() => handleRestoreProcessItem(item.id)}
                           >
                             Khôi phục
                           </Button>
                         </div>
                       );
                     })}
                 </div>
               ) : (
                 <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                   Không có document nào đã xóa (thuộc nhóm còn hoạt động)
                 </div>
               )}
             </div>
           </div>
         )}
       </Modal>

       {/* Search Modal */}
       <SearchModal
         visible={isSearchModalVisible}
         onClose={() => setIsSearchModalVisible(false)}
         processItems={processItems}
         processes={processes}
         onItemSelect={handleSearchModalItemSelect}
       />

       {/* Privacy Settings Modal */}
       <UserProcessGuide
         visible={isPrivacyModalVisible}
         onCancel={() => setIsPrivacyModalVisible(false)}
         processItem={selectedProcessForPrivacy}
         onSave={handlePrivacySave}
       />

       {/* User Class Management Modal */}
       <UserProcessGuide
         visible={isUserProcessGuideModalVisible}
         onCancel={() => setIsUserProcessGuideModalVisible(false)}
         isUserClassManagement={true}
       />
     </div>
   );
};

export default DataRubikProcessGuide;
