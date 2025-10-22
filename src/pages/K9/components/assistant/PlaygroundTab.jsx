import React, { useState, useEffect, useContext } from 'react';
import { Input, Button, Avatar, Dropdown, Modal, Select, message, List, Card, Popconfirm, Empty } from 'antd';
import { 
  SendOutlined, 
  RobotOutlined, 
  UserOutlined, 
  BulbOutlined, 
  SaveOutlined, 
  PlusOutlined,
  DeleteOutlined,
  MessageOutlined,
  HistoryOutlined 
} from '@ant-design/icons';
import styles from '../../K9.module.css';
import { aiChat } from '../../../../apis/aiGen/botService';
import { 
  createNewChatSession, 
  addMessageToChat, 
  getActiveChatSessions,
  getAiChatHistoryById,
  deleteAiChatHistory 
} from '../../../../apis/aiGen/aiChatHistoryService';
import { MyContext } from '../../../../MyContext';

const { TextArea } = Input;
const { Option } = Select;

const PlaygroundTab = ({ onSaveToThesis, thesis }) => {
  const { currentUser } = useContext(MyContext);
  const [selectedAdvisor, setSelectedAdvisor] = useState('alex');
  const [selectedJob, setSelectedJob] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState('');
  const [selectedThesisId, setSelectedThesisId] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Xin chào! Tôi là Alex, chuyên gia phân tích đầu tư. Tôi sẽ giúp bạn phân tích thị trường và tạo investment thesis. Bạn có thể chọn job template hoặc đặt câu hỏi trực tiếp.',
      timestamp: new Date(),
      canSave: false
    }
  ]);

  // Chat session management
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionModalVisible, setNewSessionModalVisible] = useState(false);

  // Advisor configurations
  const advisors = [
    {
      key: 'alex',
      name: 'Alex - Market Analyst',
      description: 'Chuyên gia phân tích thị trường và xu hướng đầu tư',
      avatar: '📊',
      specialty: 'Market Analysis',
      systemMessage: 'Bạn là Alex, chuyên gia phân tích thị trường và xu hướng đầu tư. Hãy trả lời các câu hỏi về phân tích thị trường, xu hướng đầu tư, và đánh giá cổ phiếu một cách chuyên nghiệp và chi tiết.'
    },
    {
      key: 'sophia',
      name: 'Sophia - Financial Expert',
      description: 'Chuyên gia tài chính và báo cáo doanh nghiệp',
      avatar: '📈',
      specialty: 'Financial Analysis',
      systemMessage: 'Bạn là Sophia, chuyên gia tài chính và báo cáo doanh nghiệp. Hãy trả lời các câu hỏi về phân tích tài chính, báo cáo tài chính, và đánh giá hiệu quả hoạt động doanh nghiệp một cách chuyên nghiệp và chi tiết.'
    },
    {
      key: 'david',
      name: 'David - Sector Specialist',
      description: 'Chuyên gia phân tích ngành và cơ hội đầu tư',
      avatar: '🏭',
      specialty: 'Sector Analysis',
      systemMessage: 'Bạn là David, chuyên gia phân tích ngành và cơ hội đầu tư. Hãy trả lời các câu hỏi về phân tích ngành, cơ hội đầu tư theo ngành, và xu hướng phát triển của các lĩnh vực kinh tế một cách chuyên nghiệp và chi tiết.'
    }
  ];

  // Job templates
  const jobTemplates = [
    {
      key: 'stock-news',
      label: 'Tóm tắt tin tức cổ phiếu',
      template: 'Hãy tóm tắt và phân tích những tin tức gần đây liên quan đến cổ phiếu [STOCK_CODE]. Đánh giá tác động đến giá cổ phiếu và đưa ra khuyến nghị đầu tư.'
    },
    {
      key: 'sector-analysis',
      label: 'Phân tích ngành và cơ hội',
      template: 'Phân tích tình hình ngành [SECTOR] hiện tại, xác định các cơ hội đầu tư tiềm năng và những rủi ro cần lưu ý.'
    },
    {
      key: 'financial-comparison',
      label: 'So sánh tỷ số tài chính',
      template: 'So sánh các tỷ số tài chính chính của [STOCK_CODES] trong cùng ngành. Phân tích điểm mạnh, điểm yếu và đưa ra khuyến nghị đầu tư.'
    },
    {
      key: 'valuation-analysis',
      label: 'Phân tích định giá',
      template: 'Thực hiện phân tích định giá cho cổ phiếu [STOCK_CODE] sử dụng các phương pháp DCF, P/E, P/B. Đánh giá liệu cổ phiếu có đang được định giá thấp hay cao.'
    },
    {
      key: 'risk-assessment',
      label: 'Đánh giá rủi ro',
      template: 'Đánh giá các rủi ro tiềm ẩn khi đầu tư vào [STOCK_CODE/SECTOR]. Đưa ra chiến lược quản lý rủi ro phù hợp.'
    }
  ];

  const currentAdvisor = advisors.find(a => a.key === selectedAdvisor);

  // Load chat sessions on component mount
  useEffect(() => {
    if (currentUser) {
      loadChatSessions();
    }
  }, [currentUser]);

  // Load chat sessions
  const loadChatSessions = async () => {
    if (!currentUser) return;
    
    setLoadingSessions(true);
    try {
      const sessions = await getActiveChatSessions(currentUser.email || currentUser.id);
      setChatSessions(sessions || []);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      message.error('Không thể tải danh sách chat sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  // Load chat history for selected session
  const loadChatHistory = async (sessionId) => {
    try {
      const chatData = await getAiChatHistoryById(sessionId);
      if (chatData?.chat_history) {
        const formattedMessages = chatData.chat_history.map((msg, index) => ({
          id: index + 1,
          type: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: new Date(msg.timestamp || new Date()),
          canSave: msg.role === 'assistant' && msg.role !== 'system'
        }));
        setMessages(formattedMessages);
        setSelectedAdvisor(chatData.advisorType || 'alex');
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      message.error('Không thể tải lịch sử chat');
    }
  };

  // Convert UI messages to API format
  const convertToApiFormat = (uiMessages) => {
    const apiMessages = [];
    
    // Add system message first
    apiMessages.push({
      role: 'system',
      content: currentAdvisor?.systemMessage || 'Bạn là chuyên gia phân tích dữ liệu và đầu tư.'
    });
    
    // Convert UI messages to API format
    uiMessages.forEach(msg => {
      if (msg.type === 'user') {
        apiMessages.push({
          role: 'user',
          content: msg.content
        });
      } else if (msg.type === 'assistant' && msg.id !== 1) { // Skip welcome message
        apiMessages.push({
          role: 'assistant',
          content: msg.content
        });
      }
    });
    
    return apiMessages;
  };

  // Create new chat session
  const createNewSession = async () => {
    if (!currentUser) {
      message.error('Vui lòng đăng nhập để tạo chat session');
      return;
    }

    if (!newSessionTitle.trim()) {
      message.error('Vui lòng nhập tiêu đề cho chat session');
      return;
    }

    try {
      const newSession = await createNewChatSession(
        currentUser.email || currentUser.id,
        selectedAdvisor,
        newSessionTitle.trim(),
        'claude-3-5-haiku-20241022'
      );

      if (newSession.success) {
        message.success('Tạo chat session thành công');
        setNewSessionModalVisible(false);
        setNewSessionTitle('');
        await loadChatSessions();
        
        // Switch to new session
        setCurrentSessionId(newSession.data.id);
        setMessages([{
          id: 1,
          type: 'assistant',
          content: `Xin chào! Tôi là ${currentAdvisor.name}. ${currentAdvisor.description}. Tôi sẽ hỗ trợ bạn trong lĩnh vực ${currentAdvisor.specialty}. Bạn cần tôi giúp gì?`,
          timestamp: new Date(),
          canSave: false
        }]);
      }
    } catch (error) {
      console.error('Error creating new session:', error);
      message.error('Không thể tạo chat session mới');
    }
  };

  // Select chat session
  const selectChatSession = (sessionId) => {
    setCurrentSessionId(sessionId);
    loadChatHistory(sessionId);
  };

  // Delete chat session
  const deleteChatSession = async (sessionId) => {
    try {
      await deleteAiChatHistory(sessionId);
      message.success('Xóa chat session thành công');
      
      // If deleted session was current session, clear current session
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([{
          id: 1,
          type: 'assistant',
          content: 'Xin chào! Tôi là Alex, chuyên gia phân tích đầu tư. Tôi sẽ giúp bạn phân tích thị trường và tạo investment thesis. Bạn có thể chọn job template hoặc đặt câu hỏi trực tiếp.',
          timestamp: new Date(),
          canSave: false
        }]);
      }
      
      await loadChatSessions();
    } catch (error) {
      console.error('Error deleting chat session:', error);
      message.error('Không thể xóa chat session');
    }
  };

  const handleAdvisorChange = (advisor) => {
    setSelectedAdvisor(advisor.key);
    const welcomeMessage = {
      id: Date.now(),
      type: 'assistant',
      content: `Xin chào! Tôi là ${advisor.name}. ${advisor.description}. Tôi sẽ hỗ trợ bạn trong lĩnh vực ${advisor.specialty}. Bạn cần tôi giúp gì?`,
      timestamp: new Date(),
      canSave: false
    };
    setMessages([welcomeMessage]);
    setCurrentSessionId(null); // Reset current session when changing advisor
  };

  const handleJobSelect = (jobKey) => {
    const job = jobTemplates.find(j => j.key === jobKey);
    if (job) {
      setInputMessage(job.template);
      setSelectedJob(jobKey);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      canSave: false
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInputMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      // Check if we need to create a new session
      if (!currentSessionId) {
        if (!currentUser) {
          message.error('Vui lòng đăng nhập để chat');
          setIsTyping(false);
          return;
        }

        // Create new session automatically
        const sessionTitle = `Chat ${new Date().toLocaleString('vi-VN')}`;
        const newSession = await createNewChatSession(
          currentUser.email || currentUser.id,
          selectedAdvisor,
          sessionTitle,
          'claude-3-5-haiku-20241022'
        );

        if (newSession.success) {
          setCurrentSessionId(newSession.data.id);
          await loadChatSessions();
        }
      }

      // Convert current messages to API format
      const chatHistory = convertToApiFormat([...messages, userMessage]);
      
      // Call the real AI API
      const response = await aiChat(
        chatHistory,
        currentInputMessage,
        'claude-3-5-haiku-20241022'
      );

      // Add AI response to messages
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.response || response.message || 'Xin lỗi, tôi không thể trả lời câu hỏi này.',
        timestamp: new Date(),
        canSave: true
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // Save messages to database if we have a session
      if (currentSessionId) {
        try {
          // Add user message
          await addMessageToChat(currentSessionId, {
            role: 'user',
            content: currentInputMessage,
            timestamp: new Date().toISOString()
          });

          // Add assistant message
          await addMessageToChat(currentSessionId, {
            role: 'assistant',
            content: assistantMessage.content,
            timestamp: new Date().toISOString()
          });

          // Check if we've reached the 5 message limit
          const currentSession = await getAiChatHistoryById(currentSessionId);
          if (currentSession?.chat_history?.length >= 5) {
            message.warning('Đã đạt giới hạn 5 tin nhắn cho session này. Vui lòng tạo session mới để tiếp tục.');
          }
        } catch (error) {
          console.error('Error saving messages:', error);
          message.warning('Không thể lưu tin nhắn vào database');
        }
      }

    } catch (error) {
      console.error('Error sending message to AI:', error);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.',
        timestamp: new Date(),
        canSave: false
      };
      
      setMessages(prev => [...prev, errorMessage]);
      message.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSaveResponse = (messageContent) => {
    setSelectedResponse(messageContent);
    setSaveModalVisible(true);
  };

  const handleConfirmSave = () => {
    if (!selectedThesisId) {
      message.error('Vui lòng chọn thesis để lưu');
      return;
    }
    
    onSaveToThesis(selectedResponse, selectedThesisId);
    message.success('Đã lưu phản hồi vào thesis');
    setSaveModalVisible(false);
    setSelectedResponse('');
    setSelectedThesisId('');
  };

  const advisorMenuItems = advisors.map(advisor => ({
    key: advisor.key,
    label: (
      <div className={styles.advisorMenuItem}>
        <span className={styles.advisorAvatar}>{advisor.avatar}</span>
        <div>
          <div className={styles.advisorName}>{advisor.name}</div>
          <div className={styles.advisorDesc}>{advisor.description}</div>
        </div>
      </div>
    ),
    onClick: () => handleAdvisorChange(advisor)
  }));

  return (
    <div className={styles.playgroundContainer}>
      <div className={styles.playgroundContent}>
        {/* Chat Sessions Sidebar */}
        <div className={styles.chatSessionsSidebar}>
          <div className={styles.sidebarHeader}>
            <h3><HistoryOutlined /> Chat Sessions</h3>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              size="small"
              onClick={() => setNewSessionModalVisible(true)}
            >
              Tạo mới
            </Button>
          </div>
          
          <div className={styles.sessionsList}>
            {loadingSessions ? (
              <div className={styles.loadingText}>Đang tải...</div>
            ) : chatSessions.length === 0 ? (
              <Empty 
                description="Chưa có chat session nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                size="small"
                dataSource={chatSessions}
                renderItem={(session) => (
                  <List.Item
                    className={`${styles.sessionItem} ${currentSessionId === session.id ? styles.activeSession : ''}`}
                    onClick={() => selectChatSession(session.id)}
                  >
                    <div className={styles.sessionContent}>
                      <div className={styles.sessionTitle}>
                        <MessageOutlined /> {session.title}
                      </div>
                      <div className={styles.sessionInfo}>
                        <span className={styles.advisorType}>{session.advisorType}</span>
                        <span className={styles.messageCount}>
                          {session.chat_history?.length || 0}/5
                        </span>
                      </div>
                    </div>
                    <Popconfirm
                      title="Xóa chat session?"
                      description="Bạn có chắc chắn muốn xóa chat session này?"
                      onConfirm={(e) => {
                        e.stopPropagation();
                        deleteChatSession(session.id);
                      }}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        size="small"
                        className={styles.deleteButton}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </List.Item>
                )}
              />
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className={styles.chatMainArea}>
          {/* Advisor Selection */}
          <div className={styles.advisorSection}>
            <div className={styles.sectionLabel}>Chọn Advisor:</div>
            <Dropdown
              menu={{ items: advisorMenuItems }}
              placement="bottomLeft"
              trigger={['click']}
            >
              <Button className={styles.advisorButton}>
                <span className={styles.advisorAvatar}>{currentAdvisor?.avatar}</span>
                <div className={styles.advisorInfo}>
                  <div className={styles.advisorName}>{currentAdvisor?.name}</div>
                  <div className={styles.advisorSpecialty}>{currentAdvisor?.specialty}</div>
                </div>
              </Button>
            </Dropdown>
          </div>

          {/* Job Templates */}
          <div className={styles.jobSection}>
            <div className={styles.sectionLabel}>Job Templates:</div>
            <div className={styles.jobButtons}>
              {jobTemplates.map(job => (
                <Button
                  key={job.key}
                  size="small"
                  icon={<BulbOutlined />}
                  onClick={() => handleJobSelect(job.key)}
                  className={`${styles.jobButton} ${selectedJob === job.key ? styles.selected : ''}`}
                >
                  {job.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Current Session Info */}
          {currentSessionId && (
            <div className={styles.currentSessionInfo}>
              <span>Session hiện tại: {chatSessions.find(s => s.id === currentSessionId)?.title}</span>
              <span className={styles.messageLimit}>
                {messages.filter(m => m.type !== 'system').length}/5 tin nhắn
              </span>
            </div>
          )}

          {/* Chat Interface */}
          <div className={styles.chatContainer}>
            <div className={styles.messagesArea}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`${styles.messageWrapper} ${
                    message.type === 'user' ? styles.userMessage : styles.assistantMessage
                  }`}
                >
                  <Avatar
                    size={32}
                    icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    className={styles.messageAvatar}
                    style={message.type === 'assistant' ? { background: '#667eea' } : {}}
                  />
                  <div className={styles.messageContent}>
                    <div className={styles.messageText}>
                      {message.content}
                      {message.canSave && (
                        <Button
                          size="small"
                          icon={<SaveOutlined />}
                          onClick={() => handleSaveResponse(message.content)}
                          className={styles.saveButton}
                          type="link"
                        >
                          Lưu vào Thesis
                        </Button>
                      )}
                    </div>
                    <div className={styles.messageTime}>
                      {message.timestamp.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className={`${styles.messageWrapper} ${styles.assistantMessage}`}>
                  <Avatar
                    size={32}
                    icon={<RobotOutlined />}
                    className={styles.messageAvatar}
                    style={{ background: '#667eea' }}
                  />
                  <div className={styles.messageContent}>
                    <div className={styles.typingIndicator}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.inputArea}>
              <div className={styles.inputWrapper}>
                <TextArea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập câu hỏi hoặc chọn job template..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  className={styles.messageInput}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className={styles.sendButton}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Session Modal */}
      <Modal
        title="Tạo Chat Session Mới"
        open={newSessionModalVisible}
        onOk={createNewSession}
        onCancel={() => {
          setNewSessionModalVisible(false);
          setNewSessionTitle('');
        }}
        okText="Tạo"
        cancelText="Hủy"
      >
        <div className={styles.newSessionForm}>
          <div className={styles.formLabel}>Tiêu đề session:</div>
          <Input
            value={newSessionTitle}
            onChange={(e) => setNewSessionTitle(e.target.value)}
            placeholder="Nhập tiêu đề cho chat session..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                createNewSession();
              }
            }}
          />
        </div>
      </Modal>

      {/* Save to Thesis Modal */}
      <Modal
        title="Lưu phản hồi vào Thesis"
        open={saveModalVisible}
        onOk={handleConfirmSave}
        onCancel={() => setSaveModalVisible(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <div className={styles.saveModalContent}>
          <div className={styles.modalLabel}>Chọn Thesis:</div>
          <Select
            placeholder="Chọn thesis để lưu phản hồi"
            style={{ width: '100%', marginBottom: 16 }}
            value={selectedThesisId}
            onChange={setSelectedThesisId}
          >
            {thesis.map(t => (
              <Option key={t.id} value={t.id}>
                {t.title} - {new Date(t.date).toLocaleDateString('vi-VN')}
              </Option>
            ))}
          </Select>
          <div className={styles.modalLabel}>Nội dung sẽ lưu:</div>
          <div className={styles.responsePreview}>
            {selectedResponse.substring(0, 200)}...
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PlaygroundTab;
