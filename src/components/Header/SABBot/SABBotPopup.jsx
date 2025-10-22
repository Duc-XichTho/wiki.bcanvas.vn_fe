import React, { useState, useEffect, useRef, useContext } from "react";
import { Rnd } from "react-rnd";
import styles from "./SABBotPopup.module.css";
import { botSystem } from "../../../CONST";
import { MyContext } from "../../../MyContext.jsx";
// ICONj
import { Send, Minimize2, X, Trash2, Loader2 } from "lucide-react";
import { answerQuestion } from "../../../apis/botService";
import { SabIcon } from "../../../icon/IconSVG.js";
import { IconButton } from "@mui/material";
// API
import {
  getConversationByEmail,
  updateConversation,
} from "../../../apis/conversationService";
import { updateSetting } from "../../../apis/settingService.jsx";
import { toast } from "react-toastify";

const models = [
  { key: "claude-3-5-sonnet-20240620", value: "Claude 3.5 Sonnet" },
  { key: 'haiku', value: 'Haiku 3.5' },
];

// Loader Component
const LoadingIndicator = () => (
  <div className={styles.loadingContainer}>
    <Loader2 className={styles.spinningLoader} size={24} />
  </div>
);

// Confirm Delete Modal
const ConfirmDeleteModal = ({ onClose, onConfirmDelete }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <h3 className={styles.modalTitle}>Xóa cuộc trò chuyện</h3>
        <p className={styles.modalDescription}>
          Hành động này sẽ không thể hoàn tác. Bạn có chắc chắn muốn xóa cuộc
          trò chuyện này?
        </p>
        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.modalCancelButton}>
            Hủy
          </button>
          <button
            onClick={onConfirmDelete}
            className={styles.modalDeleteButton}
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

const SABBotPopup = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { currentUser, botSetting, setBotSetting } = useContext(MyContext);
  const messageContainerRef = useRef(null);

  const getData = async () => {
    try {
      const response = await getConversationByEmail(currentUser.email);
      if (response) {
        setMessages(response.conversation || []);
        setConversationId(response.id);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim()) {
      const userMessage = {
        id: Date.now(),
        text: inputMessage,
        type: "user",
      };
      setIsLoading(true);
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      if (botSetting.setting.used >= botSetting.setting.limit) {
        toast.error("Vượt quá giới hạn Token");
      }

      try {
        const answer = await answerQuestion({
          system: botSystem,
          prompt: inputMessage,
          model: models[0].key,
          data: `----------`,
          templateId: conversationId,
          newChat: messages.length === 0,
        });
        const botMessage = {
          id: Date.now() + 1,
          text: answer.answer,
          type: "bot",
        };
        const finalMessages = [...updatedMessages, botMessage];
        let updatedBot = botSetting;
        updatedBot.setting.used =
          parseInt(updatedBot.setting.used) + answer.usage.total_tokens;
        updatedBot = await updateSetting(updatedBot);
        setBotSetting(updatedBot);
        setMessages(finalMessages);
        setInputMessage("");
        try {
          await updateConversation({
            id: conversationId,
            email: currentUser.email,
            conversation: finalMessages,
          });
        } catch (updateError) {
          console.error("Error updating conversation:", updateError);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== userMessage.id)
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteConversation = async () => {
    try {
      await updateConversation({
        id: conversationId,
        email: currentUser.email,
        conversation: [],
      });
      setMessages([]);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error clearing conversation:", error);
    }
  };

  const renderMessages = () => {
    return messages.map((msg) => (
      <div
        key={msg.id}
        className={`${styles.message} ${
          msg.type === "user" ? styles.userMessage : styles.botMessage
        }`}
      >
        {msg.text.split("\n").map((line, index) => (
          <React.Fragment key={index}>
            {line}
            <br />
          </React.Fragment>
        ))}
      </div>
    ));
  };

  if (isMinimized) {
    return (
      <IconButton
        className={styles.minimizedButton}
        onClick={() => setIsMinimized(false)}
      >
        <img src={SabIcon} alt="" />
        {/*SAB Bot*/}
      </IconButton>
    );
  }

  return (
    <>
      {showDeleteConfirm && (
        <ConfirmDeleteModal
          onClose={() => setShowDeleteConfirm(false)}
          onConfirmDelete={handleDeleteConversation}
        />
      )}
      <Rnd
        default={{
          x: window.innerWidth - 573,
          y: window.innerHeight - 500,
          width: 350,
          height: 500,
        }}
        minWidth={300}
        minHeight={400}
        bounds="window"
        className={styles.rndContainer}
      >
        <div className={styles.popupContainer}>
          <div className={styles.popupHeader}>
            <h2 className={styles.popupTitle}>SAB Bot</h2>
            <div className={styles.headerActions}>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={styles.headerButton}
              >
                <Trash2 size={20} />
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className={styles.headerButton}
              >
                <Minimize2 size={20} />
              </button>
              <button onClick={onClose} className={styles.headerButton}>
                <X size={20} />
              </button>
            </div>
          </div>
          <div
            ref={messageContainerRef}
            className={styles.messageContainer}
            style={{ overflowY: "auto" }}
          >
            {renderMessages()}
            {isLoading && <LoadingIndicator />}
          </div>
          <div className={styles.inputContainer}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && !isLoading && handleSendMessage()
              }
              placeholder="Type your message..."
              className={styles.inputField}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              className={styles.sendButton}
              disabled={isLoading}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </Rnd>
    </>
  );
};

export default SABBotPopup;
