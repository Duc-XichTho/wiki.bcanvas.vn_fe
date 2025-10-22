import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.callbacks = {
            onMessage: () => { },
            onConnect: () => { },
            onDisconnect: () => { },
            onError: () => { }
        };
        this.currentTicketId = null;
        this.ticketsWithMessages = new Set(); // Tracks tickets that have messages
    }

    // Initialize Socket.IO connection
    connect(userId, ticketId) {
        // First disconnect any existing socket
        this.disconnect();

        this.currentTicketId = ticketId;

        try {
            // Get the auth token from localStorage
            const token = localStorage.getItem('authToken');

            // Connect to your Socket.IO server
            this.socket = io(import.meta.env.VITE_API_URL, {
                auth: { token },
                withCredentials: true,
                query: {
                    userId,
                    ticketId
                }
            });

            // Debug all events
            this.socket.onAny((event, ...args) => {
                console.log(`[Socket Debug] Event: ${event}`, args);
            });

            // Set up event listeners
            this.socket.on('connect', () => {
                console.log('[Socket] Connected with ID:', this.socket.id);
                this.callbacks.onConnect();

                // Join the ticket room
                this.socket.emit('join_ticket', { ticketId });
                console.log('[Socket] Joining ticket room:', ticketId);
            });

            this.socket.on('joined', (data) => {
                console.log('[Socket] Successfully joined room:', data);
            });

            this.socket.on('disconnect', (reason) => {
                console.log('[Socket] Disconnected:', reason);
                this.callbacks.onDisconnect(reason);
            });

            this.socket.on('connect_error', (error) => {
                console.error('[Socket] Connection error:', error);
                this.callbacks.onError(error);
            });

            // Listen for incoming messages
            this.socket.on('message', (data) => {
                console.log('[Socket] Received message:', data);

                // Process the message
                const messageData = {
                    type: data.type || 'NEW_MESSAGE',
                    id: data.id,
                    name: data.name || 'Unknown',
                    message: data.message || '',
                    user: data.user || '',
                    ticket_Id: data.ticket_Id || this.currentTicketId,
                    timestamp: data.timestamp || new Date().toISOString()
                };

                this.callbacks.onMessage(messageData);
            });

            // Listen for message deletions
            this.socket.on('delete-message', (data) => {
                console.log('[Socket] Message deleted:', data);
                this.callbacks.onMessage({
                    type: 'DELETE_MESSAGE',
                    id: data.id || data.messageId
                });
            });
        } catch (error) {
            console.error('[Socket] Error initializing:', error);
            this.callbacks.onError(error);
        }
    }

    // Register callback functions
    onMessage(callback) {
        this.callbacks.onMessage = (data) => {
            // Record the ticket ID when a message comes in
            if (data.ticket_Id) {
                this.recordTicketWithMessages(data.ticket_Id);
            }
            callback(data);
        };
    }

    onConnect(callback) {
        this.callbacks.onConnect = callback;
    }

    onDisconnect(callback) {
        this.callbacks.onDisconnect = callback;
    }

    onError(callback) {
        this.callbacks.onError = callback;
    }

    // Send a message
    sendMessage(data) {
        if (this.socket && this.socket.connected) {
            console.log('📤 [Socket] Sending message:', data);

            // Make sure we have the current ticket ID and type
            const messageData = {
                ...data,
                ticket_Id: data.ticket_Id || this.currentTicketId,
                type: data.type || 'NEW_MESSAGE'
            };

            // Make sure to include id in the message data
            if (!messageData.id && messageData.id !== 0) {
                console.warn('[Socket] Message missing ID, generating one');
                messageData.id = Date.now().toString();
            }

            this.socket.emit('message', messageData);
            return true;
        } else {
            console.warn('[Socket] Not connected, message not sent');
            return false;
        }
    }

    // Notify that a message was deleted
    notifyMessageDeleted(messageId) {
        if (this.socket && this.socket.connected) {
            console.log('[Socket] Notifying message deletion:', messageId);
            this.socket.emit('delete-message', {
                id: messageId,
                ticket_Id: this.currentTicketId
            });
            return true;
        } else {
            console.warn('[Socket] Not connected, delete notification not sent');
            return false;
        }
    }

    // Disconnect
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.currentTicketId = null;
            console.log('[Socket] Disconnected');
        }
    }

    // Check if connected
    isConnected() {
        return this.socket && this.socket.connected;
    }

    // Add this method to record tickets with messages
    recordTicketWithMessages(ticketId) {
        if (ticketId) {
            this.ticketsWithMessages.add(ticketId);
        }
    }

    // Add this method to check if a ticket has messages
    hasMessages(ticketId) {
        return this.ticketsWithMessages.has(ticketId);
    }

    // Add this method to get all tickets with messages
    getTicketsWithMessages() {
        return Array.from(this.ticketsWithMessages);
    }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;