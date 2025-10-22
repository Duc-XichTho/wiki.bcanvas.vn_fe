import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Pause, Settings, Plus, Trash2, Archive, MessageSquare, CheckCircle, AlertCircle, Bot, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import styles from './AIWorkAutomation.module.css';
import { createAIChatHistoryList, updateAIChatHistoryList, getAIChatHistoryListById, getAllAIChatHistoryList } from '../../apis/aiChatHistoryListService';
import { AIAutomationChatAlarm } from '../../apis/n8nWebhook';
import { marked } from 'marked';
import { v4 as uuidv4 } from 'uuid';
import { BackCanvas, ICON_CROSSROAD_LIST } from '../../icon/svg/IconSvg.jsx';
import { getSettingByType, createSetting, updateSetting } from '../../apis/settingService';
import ContentManagement from './components/ContentManagement';

// Configure marked options
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
});

const AIWorkAutomation = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tool, setTool] = useState(null);
  const [nameTable, setNameTable] = useState('Tài liệu sử dụng BCanvas');
  const getIconSrcById = (tool) => {
    const found = ICON_CROSSROAD_LIST.find(item => item.id == tool.icon);
    return found ? found.icon : undefined;
  };
  // Chat history state
  const [chatHistoryId, setChatHistoryId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [chatHistoryList, setChatHistoryList] = useState([]);
  const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(false);
  
  // Tool and chat type state
  const [selectedTool, setSelectedTool] = useState('chat'); // 'chat' or 'content'
  const [selectedToolId, setSelectedToolId] = useState(1); // select specific tool even if same type
  const [selectedToolType, setSelectedToolType] = useState('chat');
  const [chatsByType, setChatsByType] = useState([]);
  const [isLoadingChatsByType, setIsLoadingChatsByType] = useState(false);
  const [customTools, setCustomTools] = useState([]); // tools fetched from settings
  const [toolsSettingId, setToolsSettingId] = useState(null); // id for AI_AUTOMATION_TOOLS
  const [showCreateToolModal, setShowCreateToolModal] = useState(false);
  const [newToolLabel, setNewToolLabel] = useState('');
  const [newToolCategory, setNewToolCategory] = useState('chat'); // 'chat' or 'rbp'
  const [toolMenu, setToolMenu] = useState({ visible: false, x: 0, y: 0, toolId: null });
  const [webhookSettingId, setWebhookSettingId] = useState(null); // id for AI_AUTOMATION_CUSTOM_WEBHOOK
  const [webhookUrls, setWebhookUrls] = useState({}); // {toolId: webhookUrl}
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [tempWebhookUrl, setTempWebhookUrl] = useState('');
  
  // Content Management tabs state - tool-specific
  const [sheetTabs, setSheetTabs] = useState({}); // {toolId: [{id, title, url}]}
  const [activeTabId, setActiveTabId] = useState(null);
  const [sheetSettingId, setSheetSettingId] = useState(null);
  const [tabMenu, setTabMenu] = useState({ visible: false, x: 0, y: 0, tabId: null });
  
  // Collapsible groups state
  const [groupCollapsed, setGroupCollapsed] = useState({
    chat: false, // expanded by default
    content: false // expanded by default
  });
  

  // Fetch dashboard setting for nameTable
  useEffect(() => {
    getSettingByType('DASHBOARD_SETTING').then(res => {
      if (res.setting.length > 0) {
        // Look for process-guide specifically
        let dashboardSetting = res.setting.find(item => item.id === 'ai-work-automation');
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

  // Load custom tools from settings
  useEffect(() => {
    (async () => {
      try {
        const res = await getSettingByType('AI_AUTOMATION_TOOLS');
        if (res) {
          setToolsSettingId(res.id || null);
          if (Array.isArray(res.setting)) {
            setCustomTools(res.setting);
          }
        }
      } catch (_) {
        // silent
      }
    })();
  }, []);

  // Close tool context menu on outside click
  useEffect(() => {
    const onDocClick = () => setToolMenu({ visible: false, x: 0, y: 0, toolId: null });
    if (toolMenu.visible) {
      document.addEventListener('click', onDocClick);
    }
    return () => document.removeEventListener('click', onDocClick);
  }, [toolMenu.visible]);

  // Load Google Sheet URLs when content tool is selected
  useEffect(() => {
    if (selectedToolType === 'content') {
      loadGoogleSheetUrls(selectedToolId);
    }
  }, [selectedToolType, selectedToolId]);

  // Close tab context menu on outside click
  useEffect(() => {
    const onDocClick = () => setTabMenu({ visible: false, x: 0, y: 0, tabId: null });
    if (tabMenu.visible) {
      document.addEventListener('click', onDocClick);
    }
    return () => document.removeEventListener('click', onDocClick);
  }, [tabMenu.visible]);

  // Load custom webhook urls (per chat subtype)
  useEffect(() => {
    (async () => {
      try {
        const res = await getSettingByType('AI_AUTOMATION_CUSTOM_WEBHOOK');
        if (res) {
          setWebhookSettingId(res.id || null);
        if (res.setting && typeof res.setting === 'object') {
          // Load tool-specific webhooks: {toolId: webhookUrl}
          setWebhookUrls(res.setting);
        }
        }
      } catch (_) {
        // silent
      }
    })();
  }, []);

  const persistWebhookUrls = async (next) => {
    const payload = { type: 'AI_AUTOMATION_CUSTOM_WEBHOOK', setting: next };
    try {
      if (webhookSettingId) {
        await updateSetting({ id: webhookSettingId, ...payload, updated_at: new Date().toISOString(), user_update: 'current_user' });
      } else {
        const created = await createSetting({ ...payload, created_at: new Date().toISOString(), user_create: 'current_user' });
        if (created && created.id) setWebhookSettingId(created.id);
      }
    } catch (_) {
      // silent
    }
  };

  const openWebhookModal = () => {
    const currentUrl = webhookUrls[selectedToolId] || '';
    setTempWebhookUrl(currentUrl);
    setShowWebhookModal(true);
  };

  const saveWebhookUrl = async () => {
    const next = {
      ...webhookUrls,
      [selectedToolId]: tempWebhookUrl || ''
    };
    setWebhookUrls(next);
    await persistWebhookUrls(next);
    setShowWebhookModal(false);
  };

  // Content Management tabs functions - tool-specific
  const loadGoogleSheetUrls = async (toolId) => {
    try {
      const response = await getSettingByType('SHEET_VIEW_LINK');
      if (response) {
        setSheetSettingId(response.id || null);
        const setting = response.setting;
        if (setting && typeof setting === 'object') {
          // Load tool-specific tabs: {toolId: [{id, title, url}]}
          setSheetTabs(setting);
          const toolTabs = setting[toolId] || [];
          setActiveTabId(toolTabs.length > 0 ? toolTabs[0].id : null);
        } else {
          setSheetTabs({});
          setActiveTabId(null);
        }
      } else {
        setSheetSettingId(null);
        setSheetTabs({});
        setActiveTabId(null);
      }
    } catch (error) {
      // silently ignore load errors per previous no-console policy
    }
  };

  const saveSheetTabs = async (toolId, tabs) => {
    const updatedTabs = {
      ...sheetTabs,
      [toolId]: tabs
    };
    const payload = { type: 'SHEET_VIEW_LINK', setting: updatedTabs };
    try {
      if (sheetSettingId) {
        await updateSetting({ id: sheetSettingId, ...payload, updated_at: new Date().toISOString(), user_update: 'current_user' });
      } else {
        const created = await createSetting({ ...payload, created_at: new Date().toISOString(), user_create: 'current_user' });
        // If API returns created entity with id, store it; otherwise reload
        if (created && created.id) {
          setSheetSettingId(created.id);
        } else {
          await loadGoogleSheetUrls(toolId);
        }
      }
      setSheetTabs(updatedTabs);
    } catch (e) {
      // silently ignore save errors per previous no-console policy
    }
  };

  const addNewTab = async () => {
    const currentToolTabs = sheetTabs[selectedToolId] || [];
    const idx = currentToolTabs.length + 1;
    const newTab = { id: Date.now(), title: `Sheet ${idx}`, url: '' };
    const next = [...currentToolTabs, newTab];
    setActiveTabId(newTab.id);
    await saveSheetTabs(selectedToolId, next);
  };

  const openTabMenu = (e, tabId) => {
    e.preventDefault();
    setTabMenu({ visible: true, x: e.clientX, y: e.clientY, tabId });
  };

  const renameTab = async (tabId) => {
    const currentToolTabs = sheetTabs[selectedToolId] || [];
    const current = currentToolTabs.find(t => t.id === tabId);
    if (!current) return;
    const nextTitle = (typeof window !== 'undefined' ? window.prompt('Đổi tên tab', current.title) : current.title) || current.title;
    if (nextTitle !== current.title) {
      const next = currentToolTabs.map(t => t.id === tabId ? { ...t, title: nextTitle } : t);
      await saveSheetTabs(selectedToolId, next);
    }
    setTabMenu({ visible: false, x: 0, y: 0, tabId: null });
  };

  const deleteTab = async (tabId) => {
    const currentToolTabs = sheetTabs[selectedToolId] || [];
    const next = currentToolTabs.filter(t => t.id !== tabId);
    if (activeTabId === tabId) {
      setActiveTabId(next.length ? next[0].id : null);
    }
    await saveSheetTabs(selectedToolId, next);
    setTabMenu({ visible: false, x: 0, y: 0, tabId: null });
  };

  const toggleGroupCollapse = (groupType) => {
    setGroupCollapsed(prev => ({
      ...prev,
      [groupType]: !prev[groupType]
    }));
  };

  const persistCustomTools = async (tools) => {
    const payload = { type: 'AI_AUTOMATION_TOOLS', setting: tools };
    try {
      if (toolsSettingId) {
        await updateSetting({ id: toolsSettingId, ...payload, updated_at: new Date().toISOString(), user_update: 'current_user' });
      } else {
        const created = await createSetting({ ...payload, created_at: new Date().toISOString(), user_create: 'current_user' });
        if (created && created.id) setToolsSettingId(created.id);
      }
    } catch (_) {
      // silent
    }
  };

  const addCustomTool = () => {
    setNewToolLabel('');
    setNewToolCategory('chat');
    setShowCreateToolModal(true);
  };

  const openToolMenu = (e, toolId) => {
    e.preventDefault();
    setToolMenu({ visible: true, x: e.clientX, y: e.clientY, toolId });
  };

  const renameTool = async (toolId) => {
    const current = (customTools || []).find(t => t.id === toolId);
    if (!current) return;
    const nextLabel = (typeof window !== 'undefined' ? window.prompt('Đổi tên công cụ', current.label) : current.label) || current.label;
    if (nextLabel !== current.label) {
      const next = customTools.map(t => t.id === toolId ? { ...t, label: nextLabel } : t);
      setCustomTools(next);
      await persistCustomTools(next);
    }
    setToolMenu({ visible: false, x: 0, y: 0, toolId: null });
  };

  const deleteTool = async (toolId) => {
    const next = (customTools || []).filter(t => t.id !== toolId);
    setCustomTools(next);
    if (selectedToolId === toolId) {
      // fallback to first default tool
      setSelectedTool('chat');
      setSelectedToolType('chat');
      setSelectedToolId(1);
    }
    await persistCustomTools(next);
    setToolMenu({ visible: false, x: 0, y: 0, toolId: null });
  };

  const submitCreateTool = async () => {
    const label = (newToolLabel || '').trim();
    if (!label) {
      setShowCreateToolModal(false);
      return;
    }
    const toolType = newToolCategory === 'rbp' ? 'content' : 'chat'; // Chat Agent -> chat; Thẻ RBP -> content
    const icon = newToolCategory === 'rbp' ? 'file' : 'bot'; // Thẻ RBP -> file; Chat Agent -> bot
    const newTool = { id: Date.now(), label, toolType, __icon: icon };
    const next = [...customTools, newTool];
    setCustomTools(next);
    await persistCustomTools(next);
    setShowCreateToolModal(false);
  };
  
  // Unified messages built from all chats of the selected type
  const unifiedMessages = useMemo(() => {
    if (!Array.isArray(chatsByType) || chatsByType.length === 0) return [];
    // sort chats by created_at ascending so earlier chats appear first
    const chatsSorted = [...chatsByType].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const merged = [];
    chatsSorted.forEach((chat, idx) => {
      if (Array.isArray(chat.chatHistory) && chat.chatHistory.length > 0) {
        // sort messages ascending by timestamp if available
        const msgsSorted = [...chat.chatHistory].sort((m1, m2) => new Date(m1.timestamp || m1.created_at || 0) - new Date(m2.timestamp || m2.created_at || 0));
        msgsSorted.forEach((msg) => {
          merged.push({
            ...msg,
            __sourceChatId: chat.id,
            __sourceIndex: idx
          });
        });
        // add separator marker between chats (except after last)
        if (idx < chatsSorted.length - 1) {
          merged.push({ __separator: true, __sourceIndex: idx });
        }
      } else {
        // no messages -> still add separator if not last, to keep visual grouping
        if (idx < chatsSorted.length - 1) {
          merged.push({ __separator: true, __sourceIndex: idx });
        }
      }
    });
    return merged;
  }, [chatsByType]);

  // Auto-scroll when unified messages change
  useEffect(() => {
    if (unifiedMessages.length > 0) {
      setTimeout(() => scrollToBottom(), 300);
    }
  }, [unifiedMessages]);
  
  // Console log state
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [showConsole, setShowConsole] = useState(true);
  const [isLoadingConsoleLogs, setIsLoadingConsoleLogs] = useState(false);
  
  // Ref for chat messages container
  const chatMessagesRef = useRef(null);
  
  // Filter states
  const [dashboardFilters, setDashboardFilters] = useState({
    platform: 'all',
    search: ''
  });
  
  const [communicatorFilters, setCommunicatorFilters] = useState({
    workflowId: 'all',
    needsAction: 'all',
    search: ''
  });

  // Chat states
  const [chatMessages, setChatMessages] = useState([
    {
      id: "chat_001",
      role: "assistant",
      content: "Hello! I'm your AI Agent. I can help you manage workflows, answer questions, and assist with automation tasks. How can I help you today?",
      timestamp: new Date().toISOString()
    }
  ]);
  
  const [chatInput, setChatInput] = useState('');
  
  // Function to add console log and save to actionLog
  const addConsoleLog = async (logData) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      id: Date.now(),
      timestamp,
      type: logData.type || 'info',
      message: logData.message,
      data: logData.data,
      sessionId: sessionId,
      chatId: chatHistoryId,
      __sourceChatTitle: 'Current Chat' // Add source chat title for display
    };
    
    // Add to console logs state
    setConsoleLogs(prev => [logEntry, ...prev].slice(0, 100)); // Keep last 100 logs
    
    // Save to actionLog column if we have a chatId
    if (chatHistoryId) {
      try {
        const currentChatResponse = await getAIChatHistoryListById(chatHistoryId);
        const updatedActionLog = [...(currentChatResponse.actionLog || []), logEntry];
        
        const chatData = {
          id: chatHistoryId,
          actionLog: updatedActionLog,
          updated_at: timestamp,
          user_update: "current_user"
        };
        
        await updateAIChatHistoryList(chatData);
      } catch (error) {
      }
    }
  };
  
  // Initialize component
  useEffect(() => {
    // Generate a new sessionId for new chats
    if (!sessionId) {
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
    }
    
    // Fetch chat history list for sidebar
    fetchChatHistoryList();
    
    // Load chats for the selected tool
    const type = `ai_automation_chat_${selectedToolId}`;
    fetchChatsByType(type);
    fetchConsoleLogsByType(type);
    
  }, []);


  // Auto-scroll to bottom when chat messages change
  useEffect(() => {
    if (chatMessages.length > 0) {
      // Longer delay to ensure DOM is fully updated
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    }
  }, [chatMessages]);

  // Auto-scroll when AI starts responding (to show the loading spinner)
  useEffect(() => {
    if (isAiResponding) {
      setTimeout(() => {
        scrollToBottom();
      }, 200);
    }
  }, [isAiResponding]);

  // Auto-scroll when switching to chat tab
  useEffect(() => {
    if (activeTab === 'chat' && chatMessages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 400); // Longer delay for tab switch
    }
  }, [activeTab]);

  const loadChatHistory = async (chatId) => {
    try {
      setIsLoadingChat(true);
      
      // Clear console logs first to prevent showing old logs during loading
      setConsoleLogs([]);
      
      const response = await getAIChatHistoryListById(chatId);
      if (response && response.chatHistory) {
        setChatMessages(response.chatHistory);
        setChatHistoryId(chatId);
        
        // Load console logs from actionLog
        if (response.actionLog && Array.isArray(response.actionLog)) {
          // Sort by timestamp (newest first) before setting
          const sortedLogs = response.actionLog
            .sort((a, b) => new Date(b.timestamp || b.created_at || 0) - new Date(a.timestamp || a.created_at || 0))
            .slice(0, 100); // Keep last 100 logs
          setConsoleLogs(sortedLogs);
        } else {
          // Ensure console logs are empty if no actionLog exists
          setConsoleLogs([]);
        }
        
        // Load sessionId from chat history, or generate new one if not found
        if (response.info && response.info.sessionId) {
          setSessionId(response.info.sessionId);
        } else {
          const newSessionId = uuidv4();
          setSessionId(newSessionId);
          // Update the chat history with the new sessionId in info
          const chatData = {
            id: chatId,
            info: {
              ...response.info,
              sessionId: newSessionId
            },
            updated_at: new Date().toISOString(),
            user_update: "current_user"
          };
          await updateAIChatHistoryList(chatData);
        }
        
        // Auto-scroll to bottom after chat is loaded
        setTimeout(() => {
          scrollToBottom();
        }, 300);
      } else {
      }
    } catch (error) {
    } finally {
      setIsLoadingChat(false);
    }
  };

  const startNewChat = async () => {
    // Get the selected tool to determine the specific chat type
    const selectedTool = (customTools && customTools.length > 0 ? customTools : [
      { id: 1, label: 'Chat Agent', toolType: 'chat', __icon: 'bot' },
      { id: 2, label: 'Thẻ RBP', toolType: 'content', __icon: 'file' }
    ]).find(t => t.id === selectedToolId);
    
    // Create tool-specific chat type: ai_automation_chat_{toolId}
    const currentType = `ai_automation_chat_${selectedToolId}`;
    
    // Always create new chat - no matter what
    const newSessionId = uuidv4();
    setConsoleLogs([]);
    const welcomeMessage = {
      id: uuidv4(),
      role: "assistant",
      content: "Hello! I'm your AI Agent. I can help you manage workflows, answer questions, and assist with automation tasks. How can I help you today?",
      timestamp: new Date().toISOString()
    };
    const titleByTool = `${selectedTool?.label || 'Chat Agent'} Chat`;

    try {
      const chatData = {
        info: {
          title: titleByTool,
          description: "Chat with AI Agent for workflow automation",
          sessionId: newSessionId
        },
        chatHistory: [welcomeMessage],
        type: currentType,
        created_at: new Date().toISOString(),
        user_create: "current_user",
        show: true
      };

      const response = await createAIChatHistoryList(chatData);
      
      if (response && response.id) {
        setChatHistoryId(response.id);
        setSessionId(newSessionId);
        setChatMessages([welcomeMessage]);
        // refresh the list for the selected tool
        fetchChatsByType(currentType);
        // No navigation - stay in unified view
      }
    } catch (error) {
    }
  };
  
  const [workflows, setWorkflows] = useState([
    {
      id: "wf_001",
      name: "Email Automation",
      description: "Auto-respond to customer inquiries",
      isActive: true,
      frequency: "15m",
      platform: "n8n",
      status: "active",
      createdAt: "2024-01-15",
      lastRun: "2024-01-20T10:30:00Z"
    },
    {
      id: "wf_002",
      name: "Data Sync",
      description: "Sync CRM data with analytics platform",
      isActive: false,
      frequency: "daily",
      platform: "make",
      status: "active",
      createdAt: "2024-01-10",
      lastRun: "2024-01-19T08:00:00Z"
    },
    {
      id: "wf_003",
      name: "Report Generation",
      description: "Generate weekly performance reports",
      isActive: true,
      frequency: "weekly",
      platform: "n8n",
      status: "active",
      createdAt: "2024-01-05",
      lastRun: "2024-01-15T09:00:00Z"
    },
    {
      id: "wf_004",
      name: "Slack Notifications",
      description: "Send automated Slack alerts for system events",
      isActive: true,
      frequency: "1h",
      platform: "other",
      status: "active",
      createdAt: "2024-01-12",
      lastRun: "2024-01-20T11:00:00Z"
    }
  ]);

  const [communications, setCommunications] = useState([
    {
      id: "msg_001",
      workflowId: "wf_001",
      workflowName: "Email Automation",
      type: "completion",
      message: "Successfully processed 15 customer inquiries",
      timestamp: "2024-01-20T10:30:00Z",
      status: "unread",
      requiresResponse: false
    },
    {
      id: "msg_002",
      workflowId: "wf_003",
      workflowName: "Report Generation",
      type: "notification",
      message: "Weekly report is ready for review. Should I send it to the team?",
      timestamp: "2024-01-20T09:15:00Z",
      status: "unread",
      requiresResponse: true
    },
    {
      id: "msg_003",
      workflowId: "wf_002",
      workflowName: "Data Sync",
      type: "completion",
      message: "Data synchronization completed successfully",
      timestamp: "2024-01-19T08:05:00Z",
      status: "read",
      requiresResponse: false
    },
    {
      id: "msg_004",
      workflowId: "wf_004",
      workflowName: "Slack Notifications",
      type: "notification",
      message: "System detected unusual activity. Should I escalate to the security team?",
      timestamp: "2024-01-20T11:15:00Z",
      status: "unread",
      requiresResponse: true
    }
  ]);

  const toggleWorkflow = (id) => {
    setWorkflows(prev => prev.map(workflow => 
      workflow.id === id ? { ...workflow, isActive: !workflow.isActive } : workflow
    ));
  };

  const updateFrequency = (id, frequency) => {
    setWorkflows(prev => prev.map(workflow => 
      workflow.id === id ? { ...workflow, frequency } : workflow
    ));
  };

  const removeWorkflow = (id) => {
    setWorkflows(prev => prev.map(workflow => 
      workflow.id === id ? { ...workflow, status: "removed" } : workflow
    ));
  };

  const activeWorkflows = workflows.filter(w => w.status === "active");
  const removedWorkflows = workflows.filter(w => w.status === "removed");

  // Filter workflows based on dashboard filters
  const filteredWorkflows = activeWorkflows.filter(workflow => {
    const matchesPlatform = dashboardFilters.platform === 'all' || workflow.platform === dashboardFilters.platform;
    const matchesSearch = workflow.name.toLowerCase().includes(dashboardFilters.search.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(dashboardFilters.search.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  // Filter communications based on communicator filters
  const filteredCommunications = communications.filter(comm => {
    const matchesWorkflowId = communicatorFilters.workflowId === 'all' || comm.workflowId === communicatorFilters.workflowId;
    const matchesNeedsAction = communicatorFilters.needsAction === 'all' || 
                              (communicatorFilters.needsAction === 'true' && comm.requiresResponse) ||
                              (communicatorFilters.needsAction === 'false' && !comm.requiresResponse);
    const matchesSearch = comm.message.toLowerCase().includes(communicatorFilters.search.toLowerCase()) ||
                         comm.workflowName.toLowerCase().includes(communicatorFilters.search.toLowerCase());
    return matchesWorkflowId && matchesNeedsAction && matchesSearch;
  });

  // Get unique workflow IDs for communicator filter
  const uniqueWorkflowIds = [...new Set(communications.map(comm => comm.workflowId))];

  // Helper function to render markdown
  const renderMarkdown = (content) => {
    if (!content) return '';
    try {
      return marked(content);
    } catch (error) {
      return content; // Fallback to plain text
    }
  };

  // Function to scroll to bottom of chat messages
  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      
      const element = chatMessagesRef.current;
      const maxScroll = element.scrollHeight - element.clientHeight;
      
      // Try multiple scroll methods
      try {
        // Method 1: scrollTo with smooth behavior
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
      } catch (error) {
        try {
          // Method 2: scrollTo without smooth behavior
          element.scrollTo(0, element.scrollHeight);
        } catch (error2) {
          // Method 3: Direct scrollTop assignment
          element.scrollTop = element.scrollHeight;
        }
      }
      
      // Verify scroll worked after a delay
      setTimeout(() => {
      }, 200);
    } else {
    }
  };

  // Function to fetch chat history list
  const fetchChatHistoryList = async () => {
    try {
      setIsLoadingChatHistory(true);
      const response = await getAllAIChatHistoryList();
      
      // Filter for ai_automation_chat type
      const automationChats = response.filter(chat => chat.type === 'ai_automation_chat');
      setChatHistoryList(automationChats);
    } catch (error) {
    } finally {
      setIsLoadingChatHistory(false);
    }
  };

  const fetchChatsByType = async (type) => {
    try {
      setIsLoadingChatsByType(true);
      const response = await getAllAIChatHistoryList();
      
      if (response && response.length > 0) {
        const filteredChats = response.filter(chat => chat.type === type);
        setChatsByType(filteredChats);
        
        // Auto-load the newest chat of this type
        if (filteredChats.length > 0) {
          const newestChat = filteredChats.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
          loadChatHistory(newestChat.id);
        } else {
          // No chats of this type exist, clear current chat
          setChatHistoryId(null);
          setChatMessages([]);
          setConsoleLogs([]);
        }
      } else {
        setChatsByType([]);
        setChatHistoryId(null);
        setChatMessages([]);
        setConsoleLogs([]);
      }
    } catch (error) {
    } finally {
      setIsLoadingChatsByType(false);
    }
  };

  const fetchConsoleLogsByType = async (type) => {
    try {
      setIsLoadingConsoleLogs(true);
      const response = await getAllAIChatHistoryList();
      if (response && response.length > 0) {
        const filteredChats = response.filter(chat => chat.type === type);
        // Collect all actionLog entries from chats of this type
        const allActionLogs = [];
        filteredChats.forEach(chat => {
          if (chat.actionLog && Array.isArray(chat.actionLog)) {
            chat.actionLog.forEach(log => {
              allActionLogs.push({
                ...log,
                __sourceChatId: chat.id,
                __sourceChatTitle: chat.info?.title || 'Untitled Chat'
              });
            });
          }
        });
        // Sort by timestamp (newest first)
        allActionLogs.sort((a, b) => new Date(b.timestamp || b.created_at || 0) - new Date(a.timestamp || a.created_at || 0));
        setConsoleLogs(allActionLogs);
      } else {
        setConsoleLogs([]);
      }
    } catch (error) {
    } finally {
      setIsLoadingConsoleLogs(false);
    }
  };

  const handleToolSelect = (toolType, toolId) => {
    // keep legacy state in sync
    setSelectedTool(toolType);
    setSelectedToolId(toolId);
    setSelectedToolType(toolType);
    if (toolType === 'content') {
      // Clear console logs when switching to content tab
      setConsoleLogs([]);
      return;
    }
    // Create tool-specific chat type: ai_automation_chat_{toolId}
    const type = `ai_automation_chat_${toolId}`;
    fetchChatsByType(type);
    fetchConsoleLogsByType(type);
  };


  // Function to handle chat history item click (removed - no individual chat navigation)
  const handleChatHistoryClick = (chatId) => {
    // No longer navigate to individual chats - just refresh the unified view
    const type = selectedTool === 'email' ? 'ai_automation_chat_email' : 'ai_automation_chat_schedule';
    fetchChatsByType(type);
  };


  const sendChatMessage = async () => {
    if (!chatInput.trim() || isAiResponding) return;
    
    
    const userMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date().toISOString()
    };
    
    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    // Optimistically update unified view for existing chat
    if (chatHistoryId) {
      setChatsByType(prev => {
        const updated = Array.isArray(prev) ? prev.map(c => c.id === chatHistoryId ? { ...c, chatHistory: newMessages } : c) : prev;
        return updated;
      });
    }
    const currentInput = chatInput;
    setChatInput('');
    
    
    try {
      // Always use the current chat (should exist due to auto-loading)
      if (!chatHistoryId) {
        return;
      }
      
      // Get current chat data to preserve existing info
      const currentChatResponse = await getAIChatHistoryListById(chatHistoryId);
      // Update existing chat history
      const chatData = {
        id: chatHistoryId,
        chatHistory: newMessages,
        info: {
          ...currentChatResponse.info,
          sessionId: sessionId
        },
        updated_at: new Date().toISOString(),
        user_update: "current_user"
      };
      
      await updateAIChatHistoryList(chatData);
      
      // Call webhook for AI response
      setIsAiResponding(true);
      try {
        let n8nResponse;
        const customUrl = webhookUrls[selectedToolId];
        if (customUrl) {
          const isDev = typeof window !== 'undefined' && window.location && window.location.origin.includes('localhost');
          const url = isDev && customUrl.startsWith('https://nhathvm.app.n8n.cloud')
            ? customUrl.replace('https://nhathvm.app.n8n.cloud', '/n8n')
            : customUrl;
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatInput: currentInput,
              chatHistory: newMessages,
              chatId: chatHistoryId,
              sessionId: sessionId,
              toolType: selectedToolType,
              toolId: selectedToolId
            })
          });
          const data = await resp.json().catch(() => ({}));
          // Preserve HTTP status info for logging/handling
          n8nResponse = {
            data,
            status: resp.status,
            statusText: resp.statusText,
            headers: (() => {
              try {
                return Object.fromEntries(resp.headers.entries());
              } catch (_) {
                return undefined;
              }
            })()
          };
        } else {
          // Fallback to default webhook
          n8nResponse = await AIAutomationChatAlarm({
            chatInput: currentInput,
            chatHistory: newMessages,
            chatId: chatHistoryId,
            sessionId: sessionId
          });
        }
        
        
        // Log specific header values if available
        if (n8nResponse?.headers) {
        }
        
        // Extract the actual response data for processing
        const responseData = n8nResponse?.data || n8nResponse;
        if (Array.isArray(responseData) && responseData.length > 0) {
        }
        
        // Handle different response formats from n8n
        let responseContent = "I'm sorry, I couldn't process your request at the moment.";
        let handled = false;
        
        if (responseData) {
          try {
            // Check for simple object format: {"message": "..."}
            if (typeof responseData === 'object' && !Array.isArray(responseData) && responseData.message) {
              responseContent = responseData.message;
              handled = true;
            }
            // Check for new n8n response format: [{"response": {"body": [{"output": "..."}]}}]
            else if (Array.isArray(responseData) && responseData.length > 0) {
              const firstResponse = responseData[0];
              if (firstResponse && firstResponse.response && firstResponse.response.body) {
                // Handle array format: {"body": [{"output": "..."}]}
                if (Array.isArray(firstResponse.response.body) && firstResponse.response.body.length > 0) {
                  const bodyItem = firstResponse.response.body[0];
                  if (bodyItem && bodyItem.output) {
                    responseContent = bodyItem.output;
                    handled = true;
                  }
                }
                // Handle object format: {"body": {"message": "..."}}
                else if (firstResponse.response.body.message) {
                  responseContent = firstResponse.response.body.message;
                  handled = true;
                }
              }
              // Check if response is an array with time and task properties (alarm format)
              else if (firstResponse && firstResponse.time && firstResponse.task) {
                // Format time to Vietnamese readable format
                const timeDate = new Date(firstResponse.time);
                const formattedTime = timeDate.toLocaleString('vi-VN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  timeZone: 'Asia/Ho_Chi_Minh'
                });
                
                responseContent = `Hiểu rồi, tôi sẽ nhắc bạn ${firstResponse.task} vào lúc ${formattedTime}`;
                handled = true;
              }
            }
          } catch (error) {
            responseContent = "Đã nhận được yêu cầu của bạn.";
            handled = true;
          }
        }
        
        // Only process general response handling if not already handled as alarm response
        if (responseData && !handled) {
          // If response is an array (like your example)
          if (Array.isArray(responseData)) {
            // Check if array contains objects with 'output' property
            if (responseData.length > 0 && responseData[0] && typeof responseData[0] === 'object' && responseData[0].output) {
              responseContent = responseData.map(item => item.output).join('\n\n');
            }
            // If array contains strings, join them
            else if (responseData.every(item => typeof item === 'string')) {
              responseContent = responseData.join('\n\n');
            }
            // If array contains objects, try to extract content
            else {
              responseContent = responseData.map(item => {
                if (typeof item === 'object') {
                  return item.output || item.response || item.content || item.data || JSON.stringify(item);
                }
                return item;
              }).join('\n\n');
            }
          }
          // If response has a specific property
          else if (responseData.response) {
            responseContent = responseData.response;
          }
          // If response has content property
          else if (responseData.content) {
            responseContent = responseData.content;
          }
          // If response has output property
          else if (responseData.output) {
            responseContent = responseData.output;
          }
          // If response is a string
          else if (typeof responseData === 'string') {
            responseContent = responseData;
          }
          // If response has data property
          else if (responseData.data) {
            responseContent = Array.isArray(responseData.data) 
              ? responseData.data.join('\n\n') 
              : responseData.data;
          }
        }
        
        
        // Extract status information from response
        let status = n8nResponse?.status;
        let statusText = n8nResponse?.statusText;
        
        // Handle cloud n8n response format: [{"response": {"statusCode": 200, "body": [...]}}]
        if (Array.isArray(responseData) && responseData.length > 0) {
          const firstResponse = responseData[0];
          if (firstResponse?.response?.statusCode) {
            status = firstResponse.response.statusCode;
            statusText = status === 200 ? 'OK' : 'Error';
          }
        }
        
        // Add simplified n8n response log
        await addConsoleLog({
          type: 'n8n_response',
          message: `N8N Webhook Response - Status: ${status || 'unknown'} ${statusText || 'unknown'}`,
          data: {
            status: status,
            statusText: statusText,
            responseContent: responseContent
          }
        });
        
         const agentResponse = {
           role: "assistant",
           content: responseContent,
           citations: responseData?.citations || null,
           timestamp: new Date().toISOString()
         };
         
         const updatedMessages = [...newMessages, agentResponse];
         setChatMessages(updatedMessages);
         // Optimistically update unified view for existing chat
         if (chatHistoryId) {
           setChatsByType(prev => {
             const updated = Array.isArray(prev) ? prev.map(c => c.id === chatHistoryId ? { ...c, chatHistory: updatedMessages } : c) : prev;
             return updated;
           });
         }
        
        // Update chat history with AI response
        if (chatHistoryId) {
          // Get current chat data to preserve existing info
          const currentChatResponse = await getAIChatHistoryListById(chatHistoryId);
          const chatData = {
            id: chatHistoryId,
            chatHistory: updatedMessages,
            info: {
              ...currentChatResponse.info,
              sessionId: sessionId
            },
            updated_at: new Date().toISOString(),
            user_update: "current_user"
          };
          
          await updateAIChatHistoryList(chatData);
        }
        setIsAiResponding(false);
      } catch (n8nError) {
        
        // Fallback to simulated response if n8n fails
        const agentResponse = {
          role: "assistant",
          content: getAgentResponse(currentInput),
          citations: null,
          timestamp: new Date().toISOString()
        };
        
         const updatedMessages = [...newMessages, agentResponse];
         setChatMessages(updatedMessages);
         if (chatHistoryId) {
           setChatsByType(prev => {
             const updated = Array.isArray(prev) ? prev.map(c => c.id === chatHistoryId ? { ...c, chatHistory: updatedMessages } : c) : prev;
             return updated;
           });
         }
         
         // Update chat history with fallback response
        if (chatHistoryId) {
          // Get current chat data to preserve existing info
          const currentChatResponse = await getAIChatHistoryListById(chatHistoryId);
          const chatData = {
            id: chatHistoryId,
            chatHistory: updatedMessages,
            info: {
              ...currentChatResponse.info,
              sessionId: sessionId
            },
            updated_at: new Date().toISOString(),
            user_update: "current_user"
          };
          
          await updateAIChatHistoryList(chatData);
        }
        setIsAiResponding(false);
      }
      
    } catch (error) {
      // Revert the message if there was an error
      setChatMessages(chatMessages);
      setChatInput(currentInput);
    }
  };

  const getAgentResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('workflow') || input.includes('automation')) {
      return `I can help you with workflow automation! You currently have ${activeWorkflows.length} active workflows. Would you like me to show you their status or help you create a new one?`;
    } else if (input.includes('status') || input.includes('how are')) {
      return `All systems are running smoothly! I'm monitoring ${activeWorkflows.length} active workflows and have processed ${communications.length} recent communications.`;
    } else if (input.includes('help')) {
      return `I can assist you with:
• Managing your automation workflows
• Monitoring workflow status and logs  
• Creating new automations
• Troubleshooting issues
• Answering questions about your setup

What would you like to work on?`;
    } else {
      return `I understand you're asking about "${userInput}". I'm here to help with your automation workflows and any questions you have. Could you provide more details about what you need assistance with?`;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };


  const WorkflowCard = ({ workflow, isRemoved = false }) => (
    <div className={`${styles.card} ${isRemoved ? styles.removedCard : ''}`}>
      <div className={styles.workflowHeader}>
        <h3 className={styles.workflowTitle}>{workflow.name}</h3>
        <span className={`${styles.platformBadge} ${
          workflow.platform === 'n8n' ? styles.n8nBadge : 
          workflow.platform === 'make' ? styles.makeBadge : styles.otherBadge
        }`}>
          {workflow.platform}
        </span>
      </div>
      
      <p className={styles.workflowDescription}>{workflow.description}</p>
      
      <div className={styles.workflowInfo}>
        <span>ID: {workflow.id}</span>
        <span>Last run: {formatTimestamp(workflow.lastRun)}</span>
      </div>
      
      {!isRemoved && (
        <>
          <div className={styles.workflowControls}>
            <button
              className={`${styles.toggleButton} ${workflow.isActive ? styles.activeToggle : ''}`}
              onClick={() => toggleWorkflow(workflow.id)}
            >
              {workflow.isActive ? <Pause size={16} /> : <Play size={16} />}
              {workflow.isActive ? 'Active' : 'Inactive'}
            </button>
            
            <select
              className={styles.select}
              value={workflow.frequency}
              onChange={(e) => updateFrequency(workflow.id, e.target.value)}
            >
              <option value="15m">Every 15 minutes</option>
              <option value="1h">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          
          <div className={styles.workflowControls}>
            <button className={`${styles.actionButton} ${styles.setupButton}`}>
              <Settings size={16} />
            </button>
            <button 
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={() => removeWorkflow(workflow.id)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );

  const AddWorkflowCard = () => (
    <div className={`${styles.card} ${styles.addCard}`}>
      <Plus size={32} />
      <span className={styles.addCardText}>Add New Workflow</span>
    </div>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div 
          className={styles.backCanvas}
          onClick={() => navigate('/dashboard')}
          title="Back to Dashboard"
        >
          <BackCanvas height={20} width={20} />
        </div>
        {tool && <img src={getIconSrcById(tool)} alt={tool.name} width={30} height={30} />}
        <h1 className={styles.topBarTitle}>{nameTable || 'AI Automation Agent'}</h1>
      </header>
      
      <div className={styles.mainLayout}>
        {/* Tool Sidebar */}
        <aside className={styles.toolSidebar}>
          <div className={styles.toolSidebarHeader}>
            <h2 className={styles.toolSidebarTitle}>Tools</h2>
            <button
              className={styles.newChatButton}
              onClick={addCustomTool}
              title="Add tool"
            >
              <Plus size={16} />
              Tạo Tool
            </button>
          </div>
          
          <div className={styles.toolSidebarContent}>
            <div className={styles.toolList}>
              {(() => {
                const tools = customTools && customTools.length > 0 
                  ? customTools 
                  : [
                      { id: 1, label: 'Chat Agent', toolType: 'chat', __icon: 'bot' },
                      { id: 2, label: 'Thẻ RBP', toolType: 'content', __icon: 'file' }
                    ];
                
                // Group tools by type
                const chatTools = tools.filter(t => t.toolType === 'chat');
                const contentTools = tools.filter(t => t.toolType === 'content');
                
                return (
                  <>
                    {/* Chat Agent Group */}
                    {chatTools.length > 0 && (
                      <>
                        <div className={styles.toolGroupHeader} onClick={() => toggleGroupCollapse('chat')}>
                          <h3 className={styles.toolGroupTitle}>Chat Agent</h3>
                          {groupCollapsed.chat ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                        </div>
                        {!groupCollapsed.chat && (
                          <div className={styles.toolGroupContent}>
                            {chatTools.map((t) => (
                              <div key={t.id} className={styles.toolItemWrapper}>
                                <button
                                  className={`${styles.toolItem} ${selectedToolId === t.id ? styles.activeTool : ''}`}
                                  onClick={() => handleToolSelect(t.toolType, t.id)}
                                  onContextMenu={customTools && customTools.length > 0 ? (e) => openToolMenu(e, t.id) : undefined}
                                  title={t.label}
                                >
                                  <Bot size={20} />
                                  <span>{t.label}</span>
                                </button>
                                {toolMenu.visible && toolMenu.toolId === t.id && (
                                  <div className={styles.dropdownMenu}>
                                    <button className={styles.dropdownItem} onClick={() => renameTool(t.id)}>Đổi tên</button>
                                    <div className={styles.dropdownDivider}></div>
                                    <button className={`${styles.dropdownItem} ${styles.danger}`} onClick={() => deleteTool(t.id)}>Xóa công cụ</button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Thẻ RBP Group */}
                    {contentTools.length > 0 && (
                      <>
                        <div className={styles.toolGroupHeader} onClick={() => toggleGroupCollapse('content')}>
                          <h3 className={styles.toolGroupTitle}>Thẻ RBP</h3>
                          {groupCollapsed.content ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                        </div>
                        {!groupCollapsed.content && (
                          <div className={styles.toolGroupContent}>
                            {contentTools.map((t) => (
                              <div key={t.id} className={styles.toolItemWrapper}>
                                <button
                                  className={`${styles.toolItem} ${selectedToolId === t.id ? styles.activeTool : ''}`}
                                  onClick={() => handleToolSelect(t.toolType, t.id)}
                                  onContextMenu={customTools && customTools.length > 0 ? (e) => openToolMenu(e, t.id) : undefined}
                                  title={t.label}
                                >
                                  <FileText size={20} />
                                  <span>{t.label}</span>
                                </button>
                                {toolMenu.visible && toolMenu.toolId === t.id && (
                                  <div className={styles.dropdownMenu}>
                                    <button className={styles.dropdownItem} onClick={() => renameTool(t.id)}>Đổi tên</button>
                                    <div className={styles.dropdownDivider}></div>
                                    <button className={`${styles.dropdownItem} ${styles.danger}`} onClick={() => deleteTool(t.id)}>Xóa công cụ</button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </aside>

        {/* {toolMenu.visible && (
          <div
            className={styles.contextMenu}
            style={{ left: `${toolMenu.x}px`, top: `${toolMenu.y}px` }}
          >
            <button className={styles.contextMenuItem} onClick={() => renameTool(toolMenu.toolId)}>Đổi tên</button>
            <div className={styles.contextMenuDivider}></div>
            <button className={`${styles.contextMenuItem} ${styles.danger}`} onClick={() => deleteTool(toolMenu.toolId)}>Xóa công cụ</button>
          </div>
        )}
         */}
        {showCreateToolModal && (
          <div className={styles.modalBackdrop} onClick={() => setShowCreateToolModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Tạo công cụ</h3>
              </div>
              <div className={styles.modalBody}>
                <label className={styles.modalLabel}>Tên công cụ</label>
                <input
                  type="text"
                  className={styles.modalInput}
                  value={newToolLabel}
                  onChange={(e) => setNewToolLabel(e.target.value)}
                  placeholder="Nhập tên công cụ"
                />

                <label className={styles.modalLabel}>Loại</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioItem}>
                    <input
                      type="radio"
                      name="toolCategory"
                      checked={newToolCategory === 'chat'}
                      onChange={() => setNewToolCategory('chat')}
                    />
                    <span>Chat Agent</span>
                  </label>
                  <label className={styles.radioItem}>
                    <input
                      type="radio"
                      name="toolCategory"
                      checked={newToolCategory === 'rbp'}
                      onChange={() => setNewToolCategory('rbp')}
                    />
                    <span>Thẻ RBP</span>
                  </label>
                </div>

              </div>
              <div className={styles.modalFooter}>
                <button className={styles.modalButton} onClick={() => setShowCreateToolModal(false)}>Hủy</button>
                <button className={styles.modalPrimaryButton} onClick={submitCreateTool}>Tạo</button>
              </div>
            </div>
          </div>
        )}

        {showWebhookModal && (
          <div className={styles.modalBackdrop} onClick={() => setShowWebhookModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Thiết lập Webhook</h3>
              </div>
              <div className={styles.modalBody}>
                <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '0.875rem' }}>
                  Công cụ hiện tại: {(() => {
                    const selectedTool = (customTools && customTools.length > 0 ? customTools : [
                      { id: 1, label: 'Chat Agent', toolType: 'chat', __icon: 'bot' },
                      { id: 2, label: 'Thẻ RBP', toolType: 'content', __icon: 'file' }
                    ]).find(t => t.id === selectedToolId);
                    return selectedTool?.label || 'Chat Agent';
                  })()}
                </p>
                <label className={styles.modalLabel}>URL Webhook</label>
                <input
                  type="url"
                  className={styles.modalInput}
                  value={tempWebhookUrl}
                  onChange={(e) => setTempWebhookUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.modalButton} onClick={() => setShowWebhookModal(false)}>Hủy</button>
                <button className={styles.modalPrimaryButton} onClick={saveWebhookUrl}>Lưu</button>
              </div>
            </div>
          </div>
        )}

        {/* Console Log Section */}
        {showConsole && selectedTool !== 'content' && (
          <aside className={styles.consoleSection}>
            <div className={styles.consoleHeader}>
              <h2 className={styles.consoleTitle}>Console Logs</h2>
              <button 
                className={styles.consoleToggle}
                onClick={() => setShowConsole(false)}
                title="Hide Console"
              >
                ×
              </button>
            </div>
            
            <div className={styles.consoleContent}>
              {isLoadingConsoleLogs ? (
                <div className={styles.consoleEmpty}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading logs...</p>
                </div>
              ) : consoleLogs.length === 0 ? (
                <div className={styles.consoleEmpty}>
                  <p>No logs yet</p>
                  <p style={{ fontSize: '0.75rem', color: '#666666' }}>Send a message to see logs</p>
                </div>
              ) : (
                <div className={styles.consoleLogs}>
                  {consoleLogs.map((log, index) => (
                    <div key={log.id || `log_${index}`} className={`${styles.consoleLog} ${styles[`log_${log.type}`]}`}>
                      <div className={styles.logHeader}>
                        <span className={styles.logType}>{log.type}</span>
                        <span className={styles.logTime}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className={styles.logSource}>
                        From: {log.__sourceChatTitle || 'Unknown Chat'}
                      </div>
                      <div className={styles.logMessage}>{log.message}</div>
                      {log.data && (
                        <details className={styles.logDetails}>
                          <summary>Details</summary>
                          <pre className={styles.logData}>
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
        
        {/* Show Console Button when hidden */}
        {!showConsole && selectedTool !== 'content' && (
          <button 
            className={styles.showConsoleButton}
            onClick={() => setShowConsole(true)}
            title="Show Console Logs"
          >
            📋
          </button>
        )}
        
        {/* Single Chat Window Merged From All Chats Of Selected Type */}
        <main className={styles.chatContainer}>
          <div className={styles.chatContainerHeader}>
            <h3 className={styles.chatContainerTitle}>
              {selectedToolType === 'chat' ? 'Chat Agent' : 'Thẻ RBP'}
            </h3>
            {selectedToolType === 'content' && (
              <div className={styles.tabsList}>
                {((sheetTabs[selectedToolId] || [])).map(tab => (
                  <button
                    key={tab.id}
                    className={`${styles.tabItem} ${activeTabId === tab.id ? styles.activeTabItem : ''}`}
                    onClick={() => setActiveTabId(tab.id)}
                    title={tab.title}
                    onContextMenu={(e) => openTabMenu(e, tab.id)}
                  >
                    {tab.title}
                  </button>
                ))}
                <button className={styles.addTabButton} onClick={addNewTab} title="Thêm mới">
                  <Plus size={16} />
                  Thêm mới
                </button>
              </div>
            )}
            {selectedToolType === 'chat' && (
              <button 
                className={styles.newChatButton}
                onClick={startNewChat}
                title="Tạo chat mới"
              >
                <Plus size={16} />
                Tạo chat mới
              </button>
            )}
            {selectedToolType === 'chat' && (
              <button
                className={styles.newChatButton}
                onClick={openWebhookModal}
                title="Thiết lập Webhook tùy chỉnh"
              >
                <Settings size={16} />
                Webhook
              </button>
            )}
          </div>

          <div className={styles.chatListContainer}>
            {selectedToolType === 'content' ? (
              <ContentManagement 
                sheetTabs={sheetTabs[selectedToolId] || []}
                setSheetTabs={(tabs) => saveSheetTabs(selectedToolId, tabs)}
                activeTabId={activeTabId}
                setActiveTabId={setActiveTabId}
                sheetSettingId={sheetSettingId}
                setSheetSettingId={setSheetSettingId}
                tabMenu={tabMenu}
                setTabMenu={setTabMenu}
                onAddNewTab={addNewTab}
                onRenameTab={renameTab}
                onDeleteTab={deleteTab}
                onOpenTabMenu={openTabMenu}
                onSaveSheetTabs={(tabs) => saveSheetTabs(selectedToolId, tabs)}
              />
            ) : (
              // Chat View for email and schedule tools
              <>
                {isLoadingChatsByType ? (
                  <div className={styles.chatListLoading}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading chats...</p>
                  </div>
                ) : unifiedMessages.length === 0 ? (
                  <div className={styles.chatListEmpty}>
                    <MessageSquare size={32} style={{ color: '#9ca3af', marginBottom: '0.5rem' }} />
                    <p>No messages yet</p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Create a new conversation</p>
                  </div>
                ) : (
                  <div className={styles.chatItemMessages} ref={chatMessagesRef}>
                    {unifiedMessages.map((item, index) => {
                      if (item.__separator) {
                        return <div key={`sep_${index}`} className={styles.chatSeparator}></div>;
                      }
                      const msg = item;
                      return (
                        <div 
                          key={`${msg.id || 'm'}_${msg.timestamp || index}_${msg.__sourceChatId || 'u'}`}
                          className={`${styles.messageContainer} ${
                            msg.role === 'user' ? styles.userMessageContainer : styles.agentMessageContainer
                          }`}
                        >
                          <div className={`${styles.message} ${
                            msg.role === 'user' ? styles.userMessage : styles.agentMessage
                          }`}>
                            {msg.role === 'assistant' ? (
                              <div 
                                className={styles.markdownContent}
                                dangerouslySetInnerHTML={{ 
                                  __html: renderMarkdown(msg.content || msg.message) 
                                }}
                              />
                            ) : (
                              <div style={{ whiteSpace: 'pre-wrap' }}>
                                {msg.content || msg.message}
                              </div>
                            )}
                          </div>
                          <div className={styles.messageTime}>
                            {formatTimestamp(msg.timestamp)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Chat Input - Only show for email and schedule tools */}
          {selectedToolType !== 'content' && (
            <div className={styles.chatInput}>
              <input
                type="text"
                placeholder="Type your message..."
                className={styles.chatInputField}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              />
              <button 
                className={styles.chatSendButton}
                onClick={sendChatMessage}
                disabled={isAiResponding}
                style={{ 
                  opacity: isAiResponding ? 0.6 : 1,
                  cursor: isAiResponding ? 'not-allowed' : 'pointer'
                }}
              >
                {isAiResponding ? 'Sending...' : 'Send'}
              </button>
            </div>
          )}
        </main>
      </div>
      
      {/* Tab context menu */}
      {tabMenu.visible && (
        <div
          className={styles.contextMenu}
          style={{ left: `${tabMenu.x}px`, top: `${tabMenu.y}px` }}
        >
          <button className={styles.contextMenuItem} onClick={() => renameTab(tabMenu.tabId)}>Đổi tên</button>
          <div className={styles.contextMenuDivider}></div>
          <button className={`${styles.contextMenuItem} ${styles.danger}`} onClick={() => deleteTab(tabMenu.tabId)}>Xóa tab</button>
        </div>
      )}
      
    </div>
  );
};

export default AIWorkAutomation;

