import React, { useState, useRef, useEffect } from "react";
import styles from "./chatContent.module.css";
import { FaImage } from "react-icons/fa";
import {
	Send,
	Smile,
	Trash2,
	Wifi,
	WifiOff,
	Edit,
	Check,
	X,
	MoreVertical,
	AlertTriangle,
	Image as ImageIcon,
	ArrowUp,
	XCircle,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
// Import message service
import {
	createMessage,
	getMessagesByTicketId,
	deleteMessage,
	updateMessage,
	loadMoreMessages as fetchMoreMessages,
} from "../../../../apis/gateway/messageService";
// Import Socket.IO service (replaced WebSocket service)
import socketService from "../../service/socketService";
import EmojiPicker from "emoji-picker-react";
import { createNotification } from "../../../../apis/gateway/notificationService";
import { sendNotificationEmail } from "../../../../apis/gateway/emailService";

function ChatContent({ selectedTicket, currentUser, userList }) {
	const [messages, setMessages] = useState([]);
	const [newMessage, setNewMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMoreMessages, setHasMoreMessages] = useState(true);
	const [sendingMessage, setSendingMessage] = useState(false);
	const [error, setError] = useState(null);
	const [socketConnected, setSocketConnected] = useState(false);
	const messagesEndRef = useRef(null);
	const messagesContainerRef = useRef(null);
	const [editingMessageId, setEditingMessageId] = useState(null);
	const [editMessageText, setEditMessageText] = useState("");
	const [isUpdatingMessage, setIsUpdatingMessage] = useState(false);
	const editInputRef = useRef(null);
	const [activeMenuId, setActiveMenuId] = useState(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [messageToDelete, setMessageToDelete] = useState(null);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const emojiPickerRef = useRef(null);
	const [attachments, setAttachments] = useState([]);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef(null);
	const emoticonMap = {
		":)": "😊",
		":-)": "😊",
		":D": "😀",
		":-D": "😀",
		":(": "😞",
		":-(": "😞",
		";-)": "😉",
		":P": "😛",
		":-P": "😛",
		":p": "😛",
		":-p": "😛",
		":o": "😮",
		":-o": "😮",
		":O": "😮",
		":-O": "😮",
		":|": "😐",
		":-|": "😐",
		":'(": "😢",
		":*": "😘",
		":-*": "😘",
		"<3": "❤️",
		">:(": "😠",
		">:-(": "😠",
		XD: "😆",
		"^^": "😊",
		":3": "😊",
		"o.O": "😳",
		"O.o": "😳",
		"-_-": "😑",
		"^_^": "😊",
		">_<": "😣",
		"(y)": "👍",
		"(n)": "👎",
	};
	const [initialScrollComplete, setInitialScrollComplete] = useState(false);
	const [isScrolledUp, setIsScrolledUp] = useState(false);
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxImage, setLightboxImage] = useState("");
	const [lightboxImages, setLightboxImages] = useState([]);
	const [lightboxIndex, setLightboxIndex] = useState(0);
	const [mentionSearch, setMentionSearch] = useState("");
	const [showMentionDropdown, setShowMentionDropdown] = useState(false);
	const [mentionDropdownPosition, setMentionDropdownPosition] = useState({ top: 0, left: 0 });
	const [filteredUsers, setFilteredUsers] = useState([]);
	const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
	const mentionDropdownRef = useRef(null);
	const inputRef = useRef(null);
	const [inputValue, setInputValue] = useState("");
	const [tags, setTags] = useState([]);
	const overlayRef = useRef(null);
	const [taggedUsers, setTaggedUsers] = useState([]);
	const [tagCounter, setTagCounter] = useState(0);
	const [chatParticipants, setChatParticipants] = useState(new Set());

	const scrollToBottom = (setInitialScroll = false) => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({
				behavior: setInitialScroll ? "auto" : "smooth",
			});
			if (setInitialScroll) {
				// Set a small timeout to ensure scroll is complete before enabling scroll detection
				setTimeout(() => {
					setInitialScrollComplete(true);
				}, 100);
			}
		}
	};

	const handleScroll = () => {
		const container = messagesContainerRef.current;
		if (!container) return;

		const distanceFromBottom =
			container.scrollHeight - container.scrollTop - container.clientHeight;

		setIsScrolledUp(distanceFromBottom > 200);

		const isAtTop = container.scrollTop < 100;

		if (initialScrollComplete && isAtTop && !isLoadingMore) {
			console.log("At top of scroll area - attempting to load more messages");
			loadMoreMessages();
		}
	};

	useEffect(() => {
		if (selectedTicket?.id && currentUser) {
			setInitialScrollComplete(false);
			loadMessages(selectedTicket.id);
			setupSocketConnection(currentUser.email, selectedTicket.id);
		} else {
			setMessages([]);
			socketService.disconnect();
			setSocketConnected(false);
		}

		return () => {
			socketService.disconnect();
			setSocketConnected(false);
		};
	}, [selectedTicket?.id, currentUser?.email]);

	useEffect(() => {
		if (!isLoading && messages.length > 0 && !initialScrollComplete) {
			setTimeout(() => {
				scrollToBottom(true);
			}, 0);
		} else if (!isLoadingMore) {
			const container = messagesContainerRef.current;
			if (container) {
				const isAtBottom =
					container.scrollHeight - container.scrollTop <=
					container.clientHeight + 150;
				if (isAtBottom) {
					scrollToBottom();
				}
			}
		}
	}, [isLoading, messages, isLoadingMore]);

	useEffect(() => {
		setInitialScrollComplete(false);
	}, [selectedTicket?.id]);

	useEffect(() => {
		if (editingMessageId && editInputRef.current) {
			editInputRef.current.focus();
		}
	}, [editingMessageId]);

	const setupSocketConnection = (userId, ticketId) => {
		socketService.onConnect(() => {
			console.log("Connected to chat socket");
			setSocketConnected(true);
			setError(null);
		});

		socketService.onDisconnect(() => {
			console.log("Disconnected from chat socket");
			setSocketConnected(false);
		});

		socketService.onError((err) => {
			console.error("Socket error:", err);
			setError("Connection to chat server lost. Trying to reconnect...");
			setSocketConnected(false);
		});

		socketService.onMessage((data) => {
			console.log("⚡ Processing incoming socket message:", data);
			handleIncomingMessage(data);
		});

		socketService.connect(userId, ticketId);
	};

	const handleIncomingMessage = (data) => {
		if (!data) return;
		if (data.type === "DELETE_MESSAGE" && data.id) {
			setMessages((prev) => prev.filter((msg) => msg.id !== data.id));
			return;
		}
		if (data.type === "EDIT_MESSAGE" && data.id) {
			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === data.id ? { ...msg, message: data.message } : msg
				)
			);
			return;
		}
		if (
			(data.type === "NEW_MESSAGE" ||
				data.type === "message" ||
				data.type === "media" ||
				data.type === "regular") &&
			data.message
		) {
			const newMsg = {
				id: data.id || Date.now(),
				name: data.name || "Unknown",
				message: data.message,
				user: data.user || "",
				ticket_Id: data.ticket_Id || selectedTicket?.id,
				timestamp: data.timestamp || new Date().toISOString(),
				type: data.type,
			};
			setMessages((prev) => {
				if (!prev.some((msg) => msg.id === newMsg.id)) {
					console.log("✅ Adding new message from socket to UI");
					return [...prev, newMsg];
				}
				console.log("⚠️ Message already exists in state, not adding duplicate");
				return prev;
			});
		}
	};
	const loadMessages = async (ticketId) => {
		try {
			setIsLoading(true);
			setError(null);
			setHasMoreMessages(true);
			const response = await getMessagesByTicketId(ticketId);
			const messageArray = Array.isArray(response)
				? response
				: response.messages || [];
			const hasMore = response.hasMore !== undefined ? response.hasMore : true;
			const filteredMessages = messageArray
				.filter((msg) => msg.show !== false)
				.map((msg) => ({
					...msg,
					timestamp:
						msg.timestamp ||
						msg.createdAt ||
						msg.updatedAt ||
						new Date().toISOString(),
				}));

			setMessages(filteredMessages);
			setHasMoreMessages(hasMore);
		} catch (error) {
			console.error("Error loading messages:", error);
			setError("Failed to load messages. Please try refreshing.");
		} finally {
			setIsLoading(false);
		}
	};

	const loadMoreMessages = async () => {
		if (!selectedTicket?.id || isLoadingMore) return;
		if (!hasMoreMessages) {
			console.log("No more messages available - skipping load");
			return;
		}
		try {
			setIsLoadingMore(true);
			const oldestMessage = messages[0];
			if (!oldestMessage) {
				setHasMoreMessages(false);
				return;
			}
			const response = await fetchMoreMessages(
				selectedTicket.id,
				oldestMessage.id
			);
			const messageArray = Array.isArray(response)
				? response
				: response.messages || [];
			const hasMore =
				response.hasMore !== undefined
					? response.hasMore
					: messageArray.length > 0;
			if (messageArray.length === 0) {
				console.log("No more older messages available");
				setHasMoreMessages(false);
				return;
			}
			const existingMessageIds = new Set(messages.map((msg) => msg.id));
			const newMessages = messageArray
				.filter((msg) => msg.show !== false && !existingMessageIds.has(msg.id))
				.map((msg) => ({
					...msg,
					timestamp:
						msg.timestamp ||
						msg.createdAt ||
						msg.updatedAt ||
						new Date().toISOString(),
				}));
			if (newMessages.length === 0) {
				if (!hasMore) {
					setHasMoreMessages(false);
				}
				return;
			}

			const container = messagesContainerRef.current;
			const scrollHeight = container?.scrollHeight || 0;

			setMessages((prev) => [...newMessages, ...prev]);

			setHasMoreMessages(hasMore);

			setTimeout(() => {
				if (container) {
					container.scrollTop = container.scrollHeight - scrollHeight;
				}
			}, 10);
		} catch (error) {
			console.error("Error loading more messages:", error);
			setError("Failed to load more messages. Please try again.");

			if (
				error.response &&
				(error.response.status === 404 || error.response.status === 400)
			) {
				console.log(
					`No more messages to load (${error.response.status} response)`
				);
				setHasMoreMessages(false);
			}
		} finally {
			setIsLoadingMore(false);
		}
	};

	const formatTime = (timeValue) => {
		if (!timeValue) return "";

		let date;
		try {
			date = new Date(timeValue);
			if (isNaN(date.getTime())) {
				date = new Date();
			}
		} catch (e) {
			date = new Date();
		}

		return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
	};

	const handleMentionSelect = (user) => {
		const nickname = user.nickName || user.name || user.email.split('@')[0];
		const atIndex = inputValue.lastIndexOf('@');
		const displayName = `@${nickname}`;
		const normalizedName = `@${nickname.replace(/\s+/g, '')}`;
		const newTag = {
			id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
			user: user,
			display: displayName,
			normalized: normalizedName,
			start: atIndex,
			end: atIndex + nickname.length + 1
		};
		const beforeMention = inputValue.substring(0, atIndex);
		const afterMentionStart = inputValue.substring(atIndex + mentionSearch.length + 1);
		const hasTrailingSpace = afterMentionStart.startsWith(' ') || afterMentionStart.length === 0;
		const afterSpace = hasTrailingSpace ? '' : ' ';
		const newInputValue = `${beforeMention}${displayName}${afterSpace}${afterMentionStart}`;
		setInputValue(newInputValue);
		setTags(prevTags => [...prevTags, newTag]);
		setNewMessage(newInputValue);
		setShowMentionDropdown(false);
		setMentionSearch("");
		setTimeout(() => {
			if (inputRef.current) {
				const cursorPosition = atIndex + displayName.length + (hasTrailingSpace ? 0 : 1);
				inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
			}
		}, 0);

		setTaggedUsers(prevTaggedUsers => {
			const userAlreadyTagged = prevTaggedUsers.some(taggedUser => taggedUser.email === user.email);
			if (!userAlreadyTagged) {
				return [...prevTaggedUsers, user];
			}
			return prevTaggedUsers;
		});
	};

	const handleMentionKeyDown = (e) => {
		if (!showMentionDropdown) return;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setSelectedMentionIndex(prev => (prev + 1) % filteredUsers.length);
				break;
			case 'ArrowUp':
				e.preventDefault();
				setSelectedMentionIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
				break;
			case 'Enter':
				e.preventDefault();
				e.stopPropagation();
				if (filteredUsers[selectedMentionIndex]) {
					handleMentionSelect(filteredUsers[selectedMentionIndex]);
				}
				break;
			case 'Escape':
				e.preventDefault();
				setShowMentionDropdown(false);
				break;
			default:
				break;
		}
	};

	const handleInputKeyDown = (e) => {
		if (showMentionDropdown) {
			handleMentionKeyDown(e);
			return;
		}
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage(e);
			return;
		}
		if (e.key === 'Backspace' && tags.length > 0) {
			const cursorPos = e.target.selectionStart;
			const tagsBeforeCursor = tags.filter(tag => {
				const tagStart = inputValue.indexOf(tag.display);
				if (tagStart === -1) return false;
				const tagEnd = tagStart + tag.display.length;
				return cursorPos === tagEnd || cursorPos === tagEnd + 1;
			});

			if (tagsBeforeCursor.length > 0) {
				const tagToDelete = tagsBeforeCursor[tagsBeforeCursor.length - 1];
				e.preventDefault();
				const tagPos = inputValue.indexOf(tagToDelete.display);
				if (tagPos === -1) return;
				const newInputValue =
					inputValue.substring(0, tagPos) +
					inputValue.substring(tagPos + tagToDelete.display.length);
				setInputValue(newInputValue);
				setNewMessage(newInputValue);
				setTags(prevTags => prevTags.filter(tag => tag.id !== tagToDelete.id));
				setTimeout(() => {
					if (inputRef.current) {
						inputRef.current.setSelectionRange(tagPos, tagPos);
					}
				}, 0);
			}
		}
	};

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				mentionDropdownRef.current &&
				!mentionDropdownRef.current.contains(event.target) &&
				event.target !== inputRef.current
			) {
				setShowMentionDropdown(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const convertEmoticonsInMessage = (message) => {
		const words = message.split(" ");
		const convertedWords = words.map((word) => {
			return emoticonMap[word] || word;
		});

		return convertedWords.join(" ");
	};

	const handleAttachmentClick = () => {
		fileInputRef.current.click();
	};

	const handleFileChange = (e) => {
		const files = Array.from(e.target.files);
		if (files.length === 0) return;
		const validFiles = files.filter(
			(file) => file.type.startsWith("image/") || file.type === "image/gif"
		);
		if (validFiles.length === 0) {
			setError("Only images and GIFs are supported.");
			return;
		}
		const newAttachments = validFiles.map((file) => ({
			file,
			preview: URL.createObjectURL(file),
			id: `attachment-${Date.now()}-${Math.random()
				.toString(36)
				.substring(2, 11)}`,
		}));

		setAttachments((prev) => [...prev, ...newAttachments]);

		e.target.value = "";
	};

	const removeAttachment = (attachmentId) => {
		setAttachments((prev) => {
			const updatedAttachments = prev.filter(
				(item) => item.id !== attachmentId
			);
			const removedAttachment = prev.find((item) => item.id === attachmentId);
			if (removedAttachment && removedAttachment.preview) {
				URL.revokeObjectURL(removedAttachment.preview);
			}

			return updatedAttachments;
		});
	};

	const handlePaste = (e) => {
		if (e.clipboardData && e.clipboardData.items) {
			const items = Array.from(e.clipboardData.items);
			const imageItems = items.filter((item) => item.type.startsWith("image/"));
			if (imageItems.length > 0) {
				e.preventDefault();

				imageItems.forEach((item) => {
					const file = item.getAsFile();
					if (file) {
						const attachment = {
							file,
							preview: URL.createObjectURL(file),
							id: `attachment-${Date.now()}-${Math.random()
								.toString(36)
								.substring(2, 11)}`,
						};

						setAttachments((prev) => [...prev, attachment]);
					}
				});
			}
		}
	};

	const convertFileToBase64 = (file) => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result);
			reader.onerror = (error) => reject(error);
		});
	};

	const handleSendMessage = async (e) => {
		e.preventDefault();
		if (
			(!newMessage.trim() && attachments.length === 0) ||
			!selectedTicket?.id ||
			!currentUser
		)
			return;

		try {
			setSendingMessage(true);
			let normalizedMessage = newMessage.trim()
				? newMessage.replace(/\s+/g, ' ').trim()
				: "";
			let convertedMessage = normalizedMessage
				? convertEmoticonsInMessage(normalizedMessage)
				: "";
			let messageType = "regular";
			if (attachments.length > 0) {
				setIsUploading(true);
				try {
					const base64Images = await Promise.all(
						attachments.map((attachment) =>
							convertFileToBase64(attachment.file)
						)
					);
					const delimiter = "||IMAGE_DATA||";
					convertedMessage =
						convertedMessage + delimiter + JSON.stringify(base64Images);
					messageType = "media";
				} catch (error) {
					console.error("Error processing images:", error);
					setError("Failed to process images. Please try again.");
					setSendingMessage(false);
					setIsUploading(false);
					return;
				} finally {
					setIsUploading(false);
				}
			}

			const timestamp = new Date().toISOString();
			const messageData = {
				name:
					currentUser.nickName ||
					currentUser.name ||
					currentUser.email.split("@")[0],
				message: convertedMessage,
				user: currentUser.email,
				ticket_Id: selectedTicket.id,
				type: messageType,
				mention: [],
				timestamp,
			};

			const response = await createMessage(messageData);

			const messageWithTimestamp = {
				...response,
				timestamp:
					response.timestamp ||
					response.createdAt ||
					response.updatedAt ||
					timestamp,
			};

			setMessages((prev) => [...prev, messageWithTimestamp]);

			// Create log notifications for all chat participants
			const logPromises = Array.from(chatParticipants).map(async (participantEmail) => {
				const logNotificationData = {
					ticket_id: selectedTicket.id,
					user_email: participantEmail,
					userNoti: currentUser.nickName || currentUser.name,
					content: convertedMessage.split("||IMAGE_DATA||")[0] || "đã gửi một hình ảnh", // Handle media messages
					isLog: true
				};

				try {
					await createNotification(logNotificationData);
				} catch (error) {
					console.error("Error creating log notification:", error);
				}
			});

			// Handle tagged users notifications separately
			if (taggedUsers.length > 0) {
				for (const taggedUser of taggedUsers) {
					const notificationData = {
						ticket_id: selectedTicket.id,
						user_email: taggedUser.email,
						userNoti: currentUser.nickName || currentUser.name,
						content: `đã nhắc đến bạn trong một bình luận`,
						isLog: false
					};

					try {
						await createNotification(notificationData);
						if (taggedUser.isSendEmailMessage) {
							let emailData = {
								to: taggedUser.email,
								subject: `Bạn được nhắc đến`,
								userNoti: currentUser.nickName || currentUser.name,
								content: `đã nhắc đến bạn trong một bình luận`,
								ticket_id: selectedTicket.id,
								user_email: currentUser.email,
								ticketUrl: `${window.location.origin}/gateway?ticket=${selectedTicket.id}`
							};
							await sendNotificationEmail(emailData);
						}
					} catch (notificationError) {
						console.error("Error creating notification:", notificationError);
					}
				}
			}

			// Wait for all log notifications to be created
			await Promise.all(logPromises);

			setNewMessage("");
			setInputValue("");
			setTags([]);
			setTaggedUsers([]);
			setAttachments([]);

			if (inputRef.current) {
				inputRef.current.style.height = 'auto';
			}

			if (socketService.isConnected()) {
				console.log("Emitting message via socket:", messageWithTimestamp);
				socketService.sendMessage({
					...messageWithTimestamp,
					type: messageType,
				});
			} else {
				console.warn(
					"Socket not connected, other users may not receive this message in real-time"
				);
				setError(
					"Connection to chat server lost. Messages may not update in real-time."
				);
			}
		} catch (error) {
			console.error("Error sending message:", error);
			setError("Failed to send message. Please try again.");
		} finally {
			setSendingMessage(false);
		}
	};

	const renderMessageContent = (msg) => {
		if (
			msg.type === "media" &&
			msg.message &&
			msg.message.includes("||IMAGE_DATA||")
		) {
			const parts = msg.message.split("||IMAGE_DATA||");
			const text = parts[0];
			let imageDataArray = [];

			try {
				imageDataArray = JSON.parse(parts[1]);
			} catch (error) {
				console.error("Error parsing image data:", error);
			}

			return (
				<>
					{text && <div className={styles.messageText}>{highlightMentions(text)}</div>}
					<div className={styles.messageAttachments}>
						{imageDataArray.map((imageData, index) => (
							<div key={index} className={styles.attachmentPreview}>
								<img
									src={imageData}
									alt="Attachment"
									className={styles.attachmentImage}
									onClick={() => openLightbox(imageData, imageDataArray, index)}
								/>
							</div>
						))}
					</div>
				</>
			);
		}

		return highlightMentions(msg.message);
	};

	const handleStartEditMessage = (message) => {
		setEditingMessageId(message.id);
		setEditMessageText(message.message);
	};

	const handleCancelEdit = () => {
		setEditingMessageId(null);
		setEditMessageText("");
	};

	const handleSaveEdit = async (messageId) => {
		if (!editMessageText.trim()) {
			return;
		}
		try {
			setIsUpdatingMessage(true);
			await updateMessage({ id: messageId, message: editMessageText.trim() });
			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === messageId
						? { ...msg, message: editMessageText.trim() }
						: msg
				)
			);

			if (socketService.isConnected()) {
				socketService.sendMessage({
					type: "EDIT_MESSAGE",
					id: messageId,
					message: editMessageText.trim(),
				});
			}
			setEditingMessageId(null);
			setEditMessageText("");
		} catch (error) {
			console.error("Error updating message:", error);
			setError("Failed to update message. Please try again.");
		} finally {
			setIsUpdatingMessage(false);
		}
	};

	const isMessageEditable = (message) => {
		if (!isCurrentUser(message.user)) return false;

		const now = new Date();
		const messageTime = new Date(
			message.timestamp || message.createdAt || message.updatedAt
		);
		const diffInMs = now - messageTime;
		const diffInMinutes = diffInMs / (1000 * 60);

		return diffInMinutes < 1;
	};

	const isCurrentUser = (userEmail) => {
		return currentUser && userEmail == currentUser.email;
	};

	const getUserAvatar = (userEmail, displayName = null) => {
		if (isCurrentUser(userEmail)) {
			if (currentUser?.picture) {
				return (
					<img
						src={currentUser.picture}
						alt={displayName || getUserNickname(userEmail)}
						className={styles.avatarImage}
						onError={(e) => {
							e.target.style.display = "none";
							e.target.parentNode.textContent = (
								displayName || getUserNickname(userEmail)
							)
								.charAt(0)
								.toUpperCase();
						}}
					/>
				);
			}
		}

		const userProfile = userList?.find((user) => user.email === userEmail);

		if (userProfile?.picture) {
			return (
				<img
					src={userProfile.picture}
					alt={displayName || getUserNickname(userEmail)}
					className={styles.avatarImage}
					onError={(e) => {
						e.target.style.display = "none";
						e.target.parentNode.textContent = (
							displayName || getUserNickname(userEmail)
						)
							.charAt(0)
							.toUpperCase();
					}}
				/>
			);
		}

		const displayNameToUse = displayName || getUserNickname(userEmail);
		return displayNameToUse ? displayNameToUse.charAt(0).toUpperCase() : "?";
	};

	const getUserNickname = (userEmail) => {
		if (isCurrentUser(userEmail)) {
			return (
				currentUser?.nickName ||
				currentUser?.name ||
				currentUser?.email?.split("@")[0] ||
				"You"
			);
		}

		const userProfile = userList?.find((user) => user.email === userEmail);

		return (
			userProfile?.nickName ||
			userProfile?.name ||
			(userEmail ? userEmail.split("@")[0] : "Unknown User")
		);
	};

	const SocketDebugPanel = () => {
		if (!currentUser?.isAdmin) return null;

		return (
			<div className={styles.debugPanel}>
				<h4>Socket Debug</h4>
				<div className={styles.debugInfo}>
					<div>
						Status: {socketConnected ? "✅ Connected" : "❌ Disconnected"}
					</div>
					<div>Ticket ID: {selectedTicket?.id || "None"}</div>
					<div>User: {currentUser?.email || "None"}</div>
				</div>
				<div className={styles.debugButtons}>
					<button
						onClick={() => {
							if (selectedTicket?.id && currentUser) {
								setupSocketConnection(currentUser.email, selectedTicket.id);
							}
						}}
					>
						Reconnect
					</button>
					<button
						onClick={() => {
							if (socketService.isConnected()) {
								const testMsg = {
									id: `test-${Date.now()}`,
									name: currentUser?.name || "Test User",
									message: `Test message at ${new Date().toLocaleTimeString()}`,
									user: currentUser?.email || "test@example.com",
									ticket_Id: selectedTicket?.id,
									timestamp: new Date().toISOString(),
								};
								socketService.sendMessage(testMsg);
							} else {
								alert("Socket not connected");
							}
						}}
					>
						Test Send
					</button>
					<button
						onClick={() => {
							socketService.disconnect();
							setSocketConnected(false);
						}}
					>
						Disconnect
					</button>
				</div>
			</div>
		);
	};

	const toggleMessageMenu = (messageId, e) => {
		e.stopPropagation();
		setActiveMenuId(activeMenuId === messageId ? null : messageId);
	};

	useEffect(() => {
		const handleClickOutside = () => {
			setActiveMenuId(null);
		};

		document.addEventListener("click", handleClickOutside);
		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	}, []);

	const showDeleteConfirmation = (messageId) => {
		setMessageToDelete(messageId);
		setDeleteModalOpen(true);
		setActiveMenuId(null);
	};

	const cancelDelete = () => {
		setDeleteModalOpen(false);
		setMessageToDelete(null);
	};

	const confirmDelete = async () => {
		if (!messageToDelete) return;

		try {
			await deleteMessage(messageToDelete);
			setMessages((prev) => prev.filter((msg) => msg.id !== messageToDelete));

			if (socketService.isConnected()) {
				socketService.notifyMessageDeleted(messageToDelete);
			}
		} catch (error) {
			console.error("Error deleting message:", error);
			setError("Failed to delete message. Please try again.");
		} finally {
			setDeleteModalOpen(false);
			setMessageToDelete(null);
		}
	};

	const DeleteConfirmationModal = () => {
		if (!deleteModalOpen) return null;

		return (
			<div className={styles.modalOverlay}>
				<div className={styles.modalContent}>
					<div className={styles.modalHeader}>
						<AlertTriangle size={20} className={styles.warningIcon} />
						<h3>Delete Message</h3>
					</div>

					<div className={styles.modalBody}>
						<p>Bạn có chắc muốn xóa tin nhắn này?</p>
						<p className={styles.modalWarning}>
							Hành động này không thể hoàn tác.
						</p>
					</div>

					<div className={styles.modalFooter}>
						<button className={styles.cancelButton} onClick={cancelDelete}>
							Cancel
						</button>
						<button className={styles.deleteButton} onClick={confirmDelete}>
							Delete
						</button>
					</div>
				</div>
			</div>
		);
	};

	const handleEmojiSelect = (emojiData) => {
		setNewMessage((prev) => prev + emojiData.emoji);
		setShowEmojiPicker(false);
	};

	const toggleEmojiPicker = () => {
		setShowEmojiPicker((prev) => !prev);
	};

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				emojiPickerRef.current &&
				!emojiPickerRef.current.contains(event.target) &&
				!event.target.classList.contains(styles.emojiButton)
			) {
				setShowEmojiPicker(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	useEffect(() => {
		document.addEventListener("paste", handlePaste);

		return () => {
			document.removeEventListener("paste", handlePaste);
		};
	}, []);

	useEffect(() => {
		if (messagesContainerRef.current && !isLoading) {
			handleScroll();
		}
	}, [messages, isLoading]);

	useEffect(() => {
		const container = messagesContainerRef.current;
		if (container) {
			container.addEventListener("scroll", handleScroll);
			handleScroll();
		}

		return () => {
			if (container) {
				container.removeEventListener("scroll", handleScroll);
			}
		};
	}, [initialScrollComplete, hasMoreMessages, isLoadingMore]);

	const openLightbox = (imageUrl, allImages = [], index = 0) => {
		setLightboxImage(imageUrl);
		setLightboxImages(allImages);
		setLightboxIndex(index);
		setLightboxOpen(true);
		document.body.style.overflow = "hidden";
	};

	const closeLightbox = () => {
		setLightboxOpen(false);
		setLightboxImage("");
		document.body.style.overflow = "auto";
	};

	const navigateLightbox = (direction) => {
		if (lightboxImages.length <= 1) return;

		let newIndex = lightboxIndex + direction;

		if (newIndex < 0) newIndex = lightboxImages.length - 1;
		if (newIndex >= lightboxImages.length) newIndex = 0;

		setLightboxIndex(newIndex);
		setLightboxImage(lightboxImages[newIndex]);
	};

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (!lightboxOpen) return;

			switch (e.key) {
				case "Escape":
					closeLightbox();
					break;
				case "ArrowLeft":
					navigateLightbox(-1);
					break;
				case "ArrowRight":
					navigateLightbox(1);
					break;
				default:
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [lightboxOpen, lightboxIndex, lightboxImages]);

	const ImageLightbox = () => {
		if (!lightboxOpen) return null;

		return (
			<div className={styles.lightboxOverlay} onClick={closeLightbox}>
				<div
					className={styles.lightboxContent}
					onClick={(e) => e.stopPropagation()}
				>
					<button
						className={styles.lightboxCloseButton}
						onClick={closeLightbox}
					>
						<XCircle size={32} />
					</button>

					{lightboxImages.length > 1 && (
						<>
							<button
								className={`${styles.lightboxNavButton} ${styles.lightboxNavPrev}`}
								onClick={(e) => {
									e.stopPropagation();
									navigateLightbox(-1);
								}}
							>
								<ChevronLeft size={40} />
							</button>

							<button
								className={`${styles.lightboxNavButton} ${styles.lightboxNavNext}`}
								onClick={(e) => {
									e.stopPropagation();
									navigateLightbox(1);
								}}
							>
								<ChevronRight size={40} />
							</button>

							<div className={styles.lightboxCounter}>
								{lightboxIndex + 1} / {lightboxImages.length}
							</div>
						</>
					)}

					<div className={styles.lightboxImageContainer}>
						<img
							src={lightboxImage}
							alt="Full size"
							className={styles.lightboxImage}
						/>
					</div>
				</div>
			</div>
		);
	};

	const highlightMentions = (text) => {
		if (!text) return '';

		const mentionRegex = /@([^\s]+)/g;

		let result = [];
		let lastIndex = 0;
		let key = 0;

		const matches = Array.from(text.matchAll(mentionRegex));

		if (matches.length === 0) return text;

		matches.forEach((match) => {
			const matchIndex = match.index;
			const mentionText = match[0];
			const username = mentionText.substring(1);

			if (matchIndex > lastIndex) {
				result.push(<span key={`text-${key++}`}>{text.substring(lastIndex, matchIndex)}</span>);
			}

			const mentioned = userList?.find(user => {
				const nickname = (user.nickName || user.name || user.email.split('@')[0]);
				return nickname === username;
			});

			if (mentioned) {
				result.push(
					<span key={`mention-${key++}`} className={styles.mentionTag}>
						{mentionText}
					</span>
				);
			} else {
				result.push(<span key={`plain-${key++}`}>{mentionText}</span>);
			}

			lastIndex = matchIndex + mentionText.length;
		});

		if (lastIndex < text.length) {
			result.push(<span key={`text-${key++}`}>{text.substring(lastIndex)}</span>);
		}

		return result;
	};

	const renderInputWithTags = () => {
		if (tags.length === 0) {
			return null;
		}

		const sortedTags = [...tags].sort((a, b) => {
			const posA = inputValue.indexOf(a.display);
			const posB = inputValue.indexOf(b.display);
			return posA - posB;
		});

		const parts = [];
		let lastEnd = 0;

		for (const tag of sortedTags) {
			const tagStart = inputValue.indexOf(tag.display, lastEnd);
			if (tagStart === -1) continue;

			if (tagStart > lastEnd) {
				parts.push({
					type: 'text',
					content: inputValue.substring(lastEnd, tagStart),
				});
			}

			parts.push({
				type: 'tag',
				content: tag.display,
				id: tag.id,
			});

			lastEnd = tagStart + tag.display.length;
		}

		if (lastEnd < inputValue.length) {
			parts.push({
				type: 'text',
				content: inputValue.substring(lastEnd),
			});
		}

		return (
			<div className={styles.taggedInputOverlay} ref={overlayRef}>
				{parts.map((part, index) =>
					part.type === 'tag' ? (
						<span key={part.id} className={styles.inputMentionTag}>
							{part.content}
						</span>
					) : (
						<span key={`text-${index}`}>{part.content}</span>
					)
				)}
			</div>
		);
	};

	const autoResizeTextarea = (e) => {
		const textarea = e.target;
		textarea.style.height = 'auto';
		textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
	};

	const handleInputChange = (e) => {
		const newValue = e.target.value;
		setInputValue(newValue);
		setNewMessage(newValue);

		const lastWord = newValue.split(' ').pop();

		if (lastWord.startsWith('@')) {
			const searchText = lastWord.substring(1).toLowerCase();
			setMentionSearch(searchText);

			const filtered = userList?.filter(user => {
				const displayName = (user.nickName || user.name || '').toLowerCase();
				const email = (user.email || '').toLowerCase();

				return displayName.includes(searchText) || email.includes(searchText);
			}) || [];

			setFilteredUsers(filtered);
			setShowMentionDropdown(true);
		} else {
			setMentionSearch('');
			setShowMentionDropdown(false);
			setFilteredUsers([]);
		}

		if (taggedUsers.length > 0 && Math.abs(newValue.length - inputValue.length) > 1) {
			setTaggedUsers(prevTaggedUsers => {
				const updatedTaggedUsers = prevTaggedUsers.filter(user => {
					const nickname = user.nickName || user.name || '';
					const normalizedNickname = nickname.replace(/\s+/g, '');
					const tagPattern = `@${normalizedNickname}`;

					const normalizedInput = newValue.replace(/\s+/g, ' ');
					return normalizedInput.includes(tagPattern);
				});

				if (updatedTaggedUsers.length !== prevTaggedUsers.length) {
					console.log('Removed tags, updating state', {
						before: prevTaggedUsers.map(u => u.email),
						after: updatedTaggedUsers.map(u => u.email)
					});
					return updatedTaggedUsers;
				}

				return prevTaggedUsers;
			});
		}

		autoResizeTextarea(e);
	};

	useEffect(() => {
		setTaggedUsers([]);
	}, [selectedTicket]);

	useEffect(() => {
		setTagCounter(prev => prev + 1);
	}, [taggedUsers]);

	useEffect(() => {
		const participants = new Set();
		messages.forEach(msg => {
			if (msg.user && msg.user !== currentUser?.email) {
				participants.add(msg.user);
			}
		});
		setChatParticipants(participants);
	}, [messages, currentUser?.email]);

	return (
		<div className={styles.chatContainer}>
			<div className={styles.chatHeader}>
				<div className={styles.chatHeaderContent}>
					<h3>Hội thoại</h3>
					<div className={styles.connectionStatus}>
						{socketConnected ? (
							<span className={styles.connected}>
								<Wifi size={14} /> Live
							</span>
						) : (
							<span className={styles.disconnected}>
								<WifiOff size={14} /> Offline
							</span>
						)}
					</div>
				</div>
				{error && <div className={styles.errorMessage}>{error}</div>}
			</div>

			<div className={styles.messagesContainer} ref={messagesContainerRef}>
				{/* Loading more indicator at the top */}
				{isLoadingMore && (
					<div className={styles.loadMoreSpinner}>
						<div className={styles.spinner}></div>
						<span>Loading earlier messages...</span>
					</div>
				)}

				{/* "Load More" button that shows if there are more messages but we're not currently loading */}
				{hasMoreMessages && !isLoadingMore && messages.length > 0 && (
					<div className={styles.loadMoreContainer}>
						<button
							className={styles.loadMoreButton}
							onClick={loadMoreMessages}
						>
							<ArrowUp size={14} /> Load Earlier Messages
						</button>
					</div>
				)}

				{/* Initial loading state */}
				{isLoading ? (
					<div className={styles.loadingState}>
						<div className={styles.loader}></div>
						<span>Đang tải tin nhắn...</span>
					</div>
				) : messages.length === 0 ? (
					<div className={styles.emptyState}>
						<p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
					</div>
				) : (
					// Messages list
					messages.map((msg) => (
						<div
							key={msg.id}
							className={`${styles.messageItem} ${isCurrentUser(msg.user) ? styles.currentUser : styles.otherUser
								}`}
						>
							<div className={styles.avatarContainer}>
								<div
									className={styles.avatar}
									style={{
										backgroundColor: isCurrentUser(msg.user)
											? "#0084ff"
											: "#4267B2",
									}}
								>
									{getUserAvatar(msg.user, getUserNickname(msg.user))}
								</div>
							</div>
							<div className={styles.messageContent}>
								<div className={styles.senderName}>
									{getUserNickname(msg.user)}
								</div>

								<div className={styles.messageRow}>
									{isCurrentUser(msg.user) && (
										<div className={styles.leftMenuContainer}>
											<button
												className={styles.menuButton}
												onClick={(e) => toggleMessageMenu(msg.id, e)}
												aria-label="Message options"
											>
												<MoreVertical size={14} />
											</button>

											{activeMenuId === msg.id && (
												<div className={styles.messageMenu}>
													{isMessageEditable(msg) && (
														<button
															className={styles.menuIconItem}
															onClick={() => handleStartEditMessage(msg)}
															title="Edit message"
														>
															<Edit size={16} />
														</button>
													)}
													<button
														className={styles.menuIconItem}
														onClick={() => showDeleteConfirmation(msg.id)}
														title="Delete message"
													>
														<Trash2 size={16} />
													</button>
												</div>
											)}
										</div>
									)}

									{editingMessageId === msg.id ? (
										<div className={styles.editMessageContainer}>
											<input
												type="text"
												value={editMessageText}
												onChange={(e) => setEditMessageText(e.target.value)}
												className={styles.editMessageInput}
												ref={editInputRef}
												disabled={isUpdatingMessage}
											/>
											<div className={styles.editActions}>
												<button
													onClick={() => handleSaveEdit(msg.id)}
													className={styles.saveEditButton}
													disabled={isUpdatingMessage}
													title="Save"
												>
													{isUpdatingMessage ? (
														<div className={styles.smallLoader}></div>
													) : (
														<Check size={14} />
													)}
												</button>
												<button
													onClick={handleCancelEdit}
													className={styles.cancelEditButton}
													disabled={isUpdatingMessage}
													title="Cancel"
												>
													<X size={14} />
												</button>
											</div>
										</div>
									) : (
										<div className={styles.messageBubble}>
											{renderMessageContent(msg)}
										</div>
									)}
								</div>

								<div className={styles.messageTime}>
									{formatTime(msg.timestamp || msg.createdAt || msg.updatedAt)}
								</div>
							</div>
						</div>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Add attachment previews */}
			{attachments.length > 0 && (
				<div className={styles.attachmentPreviewContainer}>
					{attachments.map((attachment) => (
						<div key={attachment.id} className={styles.attachmentPreviewItem}>
							<img
								src={attachment.preview}
								alt="Attachment preview"
								className={styles.attachmentThumbnail}
							/>
							<button
								onClick={() => removeAttachment(attachment.id)}
								className={styles.removeAttachmentButton}
								title="Remove attachment"
							>
								<X size={16} />
							</button>
						</div>
					))}
				</div>
			)}

			<div className={styles.chatInputContainer}>
				<form
					onSubmit={(e) => {
						// Only allow form submission when the mention dropdown is not showing
						if (!showMentionDropdown) {
							handleSendMessage(e);
						} else {
							e.preventDefault();
						}
					}}
					className={styles.chatForm}
				>
					{/* Hidden file input */}
					<input
						type="file"
						ref={fileInputRef}
						onChange={handleFileChange}
						style={{ display: "none" }}
						accept="image/*,.gif"
						multiple
					/>

					<button
						type="button"
						className={styles.attachButton}
						onClick={handleAttachmentClick}
						title="Attach images or GIFs"
						disabled={sendingMessage || isUploading}
					>
						<FaImage  size={18} color="blue" />
					</button>

					<div className={styles.inputWrapper} style={{ position: 'relative', flex: 1 }}>
						{/* Add a container for the input and overlay */}
						<div className={styles.taggedInputContainer}>
							<textarea
								value={inputValue}
								onChange={handleInputChange}
								onKeyDown={handleInputKeyDown}
								placeholder={
									isUploading
										? "Uploading..."
										: socketConnected
											? "Nhập tin nhắn của bạn... (Use @ to mention others)"
											: "Đang kết nối lại..."
								}
								className={styles.chatInput}
								disabled={
									!selectedTicket ||
									!currentUser ||
									sendingMessage ||
									isUploading ||
									!socketConnected
								}
								ref={inputRef}
								rows="1" // Start with one row
							/>
							{/* Render the colored overlay for mentions */}
							{renderInputWithTags()}
						</div>

						{/* Mention dropdown */}
						{showMentionDropdown && filteredUsers.length > 0 && (
							<div
								className={styles.mentionDropdown}
								ref={mentionDropdownRef}
								style={{
									bottom: '100%',
									marginBottom: '5px',
									left: 0,
									width: '100%'
								}}
							>
								{filteredUsers.map((user, index) => {
									const nickname = user.nickName || user.name || user.email.split('@')[0];
									return (
										<div
											key={user.email}
											className={`${styles.mentionItem} ${index === selectedMentionIndex ? styles.mentionItemSelected : ''}`}
											onClick={() => handleMentionSelect(user)}
											onMouseEnter={() => setSelectedMentionIndex(index)}
										>
											<div className={styles.mentionAvatar}>
												{getUserAvatar(user.email, nickname)}
											</div>
											<div className={styles.mentionName}>{nickname}</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					<div className={styles.emojiPickerContainer}>
						<button
							type="button"
							className={styles.emojiButton}
							onClick={toggleEmojiPicker}
							title="Add emoji"
							disabled={sendingMessage || isUploading || !socketConnected}
						>
							<Smile size={18} />
						</button>

						{showEmojiPicker && (
							<div className={styles.emojiPickerWrapper} ref={emojiPickerRef}>
								<EmojiPicker
									onEmojiClick={handleEmojiSelect}
									searchDisabled={false}
									skinTonesDisabled
									width={280}
									height={350}
								/>
							</div>
						)}
					</div>

					<button
						type="submit"
						className={styles.sendButton}
						disabled={
							(!newMessage.trim() && attachments.length === 0) ||
							!selectedTicket ||
							!currentUser ||
							sendingMessage ||
							isUploading ||
							!socketConnected
						}
						title={isUploading ? "Uploading attachments..." : "Send message"}
					>
						{sendingMessage || isUploading ? (
							<div className={styles.smallLoader}></div>
						) : (
							<Send size={18} />
						)}
					</button>
				</form>
			</div>

			{/* Add debug panel */}
			<SocketDebugPanel />

			{/* Render the confirmation modal */}
			<DeleteConfirmationModal />

			{/* More visible scroll button with debugging */}
			{isScrolledUp && (
				<button
					className={styles.scrollToBottomButton}
					onClick={() => {
						scrollToBottom();
						setIsScrolledUp(false);
					}}
					title="Scroll to latest messages"
				>
					<ArrowUp size={20} style={{ transform: "rotate(180deg)" }} />
				</button>
			)}

			{/* Add the lightbox */}
			<ImageLightbox />
		</div>
	);
}

export default ChatContent;
