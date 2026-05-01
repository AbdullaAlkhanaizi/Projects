class WebSocketManager {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.messageHandlers = new Map();
        this.connectionListeners = [];
        this.onlineUsers = new Map(); // userId -> {id, username}
        this.allUsers = new Map(); // userId -> {id, username, nickname, isOnline, lastSeen}
        this.activeChats = new Map(); // userId -> chat window element
        this.recentActivity = new Map(); // userId -> timestamp of last message activity
        this.seenChats = new Map(); // userId -> timestamp when chat was marked as seen
        this.typingTimeout = null;
    }

    connect() {
        if (this.isConnected || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) return;

        if (this.ws) this.ws.close();

        try {
            const protocol = globalThis.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${globalThis.location.host}/ws`;
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;
                this.notifyConnectionListeners('connected');

                if (globalThis.CURRENT_USER) {
                    this.ws.send(JSON.stringify({
                        type: "user_online",
                        userId: globalThis.CURRENT_USER.id,
                        username: globalThis.CURRENT_USER.nickname
                    }));
                    // Display welcome message in connection status
                    const statusElement = document.getElementById('connection-status');
                    if (statusElement) {
                        statusElement.className = 'connection-status connected';
                        statusElement.textContent = ` ● ${globalThis.CURRENT_USER.nickname}`;
                    }
                }

                this.startHeartbeat();
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error, 'Raw data:', event.data);
                }
            };

            this.ws.onclose = (event) => {
                this.isConnected = false;
                this.notifyConnectionListeners('disconnected');

                if (globalThis.CURRENT_USER && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.scheduleReconnect();
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.notifyConnectionListeners('error', error);
            };

        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        this.reconnectAttempts++;
        setTimeout(() => {
            if (globalThis.CURRENT_USER?.id) this.connect();
        }, this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 10000);
    }

    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
            }
        }, 30000);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    }

    sendMessage(type, data, toUserId = null, toUsername = null) {
        if (!this.isConnected || !this.ws) return false;
        try {
            this.ws.send(JSON.stringify({ type, data, toUserId, toUsername, time: Date.now() }));
            return true;
        } catch (error) {
            console.error('Error sending WebSocket message:', error);
            return false;
        }
    }

    handleMessage(message) {
        const handler = this.messageHandlers.get(message.type);
        if (handler) handler(message);
        else this.handleDefaultMessage(message);
    }

    handleDefaultMessage(message) {
        switch (message.type) {
            case 'welcome':
                if (message.data?.users) this.updateAllUsers(message.data.users);
                break;
            case 'private_message':
                this.handleIncomingPrivateMessage(message);
                break;
            case 'user_status':
                this.updateUserStatus(message.data.userId, message.data.username, message.data.status);
                break;
            case 'typing':
                this.showTypingIndicator(message.userId, message.username, message.data.typing);
                break;
            case 'post_update':
                this.handlePostUpdate(message.data);
                break;
            case 'comment_update':
                this.handleCommentUpdate(message.data);
                break;
            case 'user_activity':
                this.handleUserActivity(message.data);
                break;
            case 'pong':
                break;
            default:
                console.log('Unhandled message type:', message.type, message);
        }
    }

    refreshUsersList() {
        const list = document.getElementById('online-users-list');
        if (!list) return;

        // Clean up old activity data (older than 30 minutes)
        const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
        for (const [userId, timestamp] of this.recentActivity.entries()) {
            if (timestamp < thirtyMinutesAgo) {
                this.recentActivity.delete(userId);
                this.seenChats.delete(userId);
            }
        }

        list.innerHTML = '';
        let onlineCount = 0;

        // Convert Map to array and exclude the current user
        const usersArray = Array.from(wsManager.allUsers.values())
            .filter(user => globalThis.CURRENT_USER ? user.id !== globalThis.CURRENT_USER.id : true);

        // Sort: most recent message first, then nickname
        usersArray.sort((a, b) => {
            const aLastMsg = this.recentActivity.get(a.id) || 0;
            const bLastMsg = this.recentActivity.get(b.id) || 0;

            if (aLastMsg !== bLastMsg) {
                return bLastMsg - aLastMsg; // recent message first
            }

            return a.nickname.localeCompare(b.nickname, undefined, { sensitivity: 'base' });
        });

        // Render each user
        usersArray.forEach(user => {
            const lastMsg = this.recentActivity.get(user.id) || 0;
            const hasRecentActivity = lastMsg > (Date.now() - (5 * 60 * 1000));
            const lastSeenTime = this.seenChats.get(user.id) || 0;

            // Show indicator only if there's activity AFTER the last seen time
            const hasUnseenActivity = hasRecentActivity && lastMsg > lastSeenTime;

            const userDiv = document.createElement('div');
            userDiv.className = `user-item ${hasRecentActivity ? 'recent-activity ' : ''}${user.isOnline ? 'online' : 'offline'}`;

            // Status dot
            const statusIcon = user.isOnline
                ? '<span class="status-dot online"></span>'
                : '<span class="status-dot offline"></span>';

            // Activity indicator only for unseen messages
            const activityIndicator = hasUnseenActivity
                ? '<span class="laser-dot"></span>'
                : '';

            userDiv.innerHTML = `
            <div class="user-left">
                ${statusIcon}
                <span class="user-name">${this.escapeHtml(user.nickname)}</span>
            </div>
            <div class="user-activity">${activityIndicator}</div>
        `;

            userDiv.style.cursor = 'pointer';
            userDiv.addEventListener('click', () => {
                wsManager.openPrivateChat(user.id, user.nickname);
            });

            list.appendChild(userDiv);

            if (user.isOnline) onlineCount++;
        });

        // Update counters
        const onlineCounter = document.getElementById('online-count');
        const totalCounter = document.getElementById('total-count');

        if (onlineCounter) onlineCounter.textContent = onlineCount;
        if (totalCounter) totalCounter.textContent = usersArray.length;
    }







    updateAllUsers(users) {
        if (!Array.isArray(users)) return;

        this.allUsers.clear();
        users.forEach(user => {
            if (!user?.id) return;
            this.allUsers.set(user.id, {
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                isOnline: user.isOnline || false,
                lastSeen: user.lastSeen || null
            });
            if (user.isOnline) this.onlineUsers.set(user.id, user);
        });
        this.refreshUsersList();
    }
    updateUserStatus(userId, username, status) {
        const userData = this.allUsers.get(userId) || { id: userId, username, nickname: username };
        userData.isOnline = status === 'online';
        userData.lastSeen = status === 'offline' ? new Date().toISOString() : null;
        this.allUsers.set(userId, userData);

        if (status === 'online') this.onlineUsers.set(userId, { id: userId, username });
        else this.onlineUsers.delete(userId);

        this.refreshUsersList();
    }

    // Mark chat as seen - removes activity indicator but keeps user position for a while
    markChatAsSeen(userId) {
        // Mark as seen with timestamp, but keep recent activity for positioning
        this.seenChats.set(userId, Date.now());

        // Refresh the user list to update the UI (removes indicator but keeps position)
        this.refreshUsersList();

        console.log('✅ Marked chat as seen for user:', userId);
    }

    // --- Private chat and message handling ---
    openPrivateChat(userId, username) {
        console.log('🗨️ Opening private chat with:', username, userId);

        // Mark as seen - remove recent activity indicator
        this.markChatAsSeen(userId);

        // Create or get the chat aside
        let chatAside = document.getElementById('chat-aside');
        if (!chatAside) {
            chatAside = this.createChatAside();
            document.body.appendChild(chatAside);
        }

        // Show the chat aside and set up for this user
        this.showChatForUser(userId, username);
        chatAside.classList.add('active');
        document.body.classList.add('chat-active');

        // Hide the separate users panel since users are now in the chat aside
        const usersPanel = document.getElementById('online-users-panel');
        if (usersPanel) {
            usersPanel.style.display = 'none';
        }

        // Force positioning with inline styles to override any CSS conflicts
        chatAside.style.position = 'fixed';
        chatAside.style.top = '60px';
        chatAside.style.left = '0';
        chatAside.style.right = 'auto';
        chatAside.style.width = '350px';
        chatAside.style.zIndex = '900';
        chatAside.style.height = 'calc(100vh - 60px)';
        chatAside.style.zIndex = '100';
        chatAside.style.display = 'flex';
        chatAside.style.flexDirection = 'column';
        chatAside.style.background = 'rgba(255, 255, 255, 0.05)';
        chatAside.style.backdropFilter = 'blur(25px)';
        chatAside.style.borderRight = '1px solid rgba(255, 255, 255, 0.1)';
        chatAside.style.boxShadow = '5px 0 25px rgba(0, 0, 0, 0.1)';

        // Debug: Log the chat aside element and its styles
        console.log('🔍 Chat aside element:', chatAside);
        console.log('🔍 Chat aside classes:', chatAside.className);
        console.log('🔍 Chat aside position:', globalThis.getComputedStyle(chatAside).position);
        console.log('🔍 Chat aside left:', globalThis.getComputedStyle(chatAside).left);
        console.log('🔍 Chat aside right:', globalThis.getComputedStyle(chatAside).right);
    }

   showChatForUser(userId, username) {
    // Mark as seen when switching to this chat
    this.markChatAsSeen(userId);

    const chatSection = document.getElementById('chat-section');
    const isOnline = this.onlineUsers.has(userId);
    

    chatSection.innerHTML = `
        <div class="chat-header">
            <span class="chat-title"> 
                ${isOnline ? '<span class="status-dot online"></span>'
                : '<span class="status-dot offline"></span>'} 
                ${this.escapeHtml(username)}
            </span>
            <span id="status-${userId}" class="chat-status ${isOnline ? 'online' : 'offline'}"></span>
        </div>
        
        <div class="chat-messages" id="messages-${userId}">
           
        </div>
        
        <div class="typing-indicator" id="typing-${userId}" style="display: none;">
            ${this.escapeHtml(username)} is typing...
        </div>
        
        <div class="chat-input-container">
            <input type="text" class="chat-input" id="input-${userId}" placeholder="Type your message..." maxlength="500"
                onkeypress="wsManager.handleChatKeyPress(event, '${userId}', '${this.escapeHtml(username)}')"
                oninput="wsManager.handleTyping('${userId}', '${this.escapeHtml(username)}')"
                ${isOnline ? '' : 'disabled'}>
            <button id="send-btn-${userId}" class="chat-send-btn"
                onclick="wsManager.sendPrivateMessage('${userId}', '${this.escapeHtml(username)}')"
                ${isOnline ? '' : 'disabled'}>Send</button>
        </div>
    `;

    const input = document.getElementById(`input-${userId}`);
    const button = document.getElementById(`send-btn-${userId}`);
    protectInput(input);
    protectInput(button);

    this.currentChatUser = { userId, username };
    this.activeChats.set(userId, { userId, username });

    this.populateChatUsersList();

    // initial messages load
    let offset = 0;
    const limit = 10;
    this.loadChatHistory(userId, limit, offset, false);

    // scroll-to-load-previous
    const messagesContainer = document.getElementById(`messages-${userId}`);
    messagesContainer.addEventListener('scroll', async () => {
        if (messagesContainer.scrollTop === 0) {
            offset += limit;
            await this.loadChatHistory(userId, limit, offset, true);
        }
    });
    let loader = messagesContainer.querySelector('.chat-loader');

if (!loader) {
    loader = document.createElement('div');
    loader.className = 'chat-loader';
    loader.innerHTML = '<div class="spinner"></div>';
    loader.style.display = 'none'; // hidden by default
    messagesContainer.appendChild(loader);
}

    // highlight user in list
    setTimeout(() => {
        this.highlightSelectedUser(userId);
    }, 10);
}


showLoader(userId, show) {
    ensureLoader(userId);  // make sure it exists
    const loader = document.querySelector(`#messages-${userId} .chat-loader`);
    loader.style.display = show ? 'block' : 'none';
}




    createChatAside() {
        const aside = document.createElement('aside');
        aside.id = 'chat-aside';
        aside.className = 'chat-aside';
        aside.innerHTML = `
            <div class="chat-aside-header">
                <h3>Messages</h3>
                <button class="close-chat-aside" onclick="wsManager.closeChatAside()">&times;</button>
            </div>
         
            <div class="chat-section" id="chat-section">
                <div class="no-chat-selected">
                    <p>Select a user to start chatting</p>
                </div>
            </div>
        `;
        return aside;
    }

    populateChatUsersList() {
        const chatUsersList = document.getElementById('chat-users-list');
        if (!chatUsersList) return;

        chatUsersList.innerHTML = '';

        // Add all users (online and offline) to the chat users list
        this.allUsers.forEach((user, userId) => {
            // Ensure user has required properties
            if (!user || !user.username) {
                console.warn('Invalid user data:', user, 'for userId:', userId);
                return;
            }

            const userElement = document.createElement('div');
            userElement.className = `chat-user-item ${user.isOnline ? 'online' : 'offline'}`;
            userElement.dataset.userId = userId;

            const username = user.username || user.nickname || 'Unknown';
            const displayName = this.escapeHtml(username);

            userElement.innerHTML = `
                <div class="user-avatar ${user.isOnline ? 'online' : 'offline'}">
                    ${username.charAt(0).toUpperCase()}
                </div>
                <div class="user-info">
                    <div class="user-name">${displayName}</div>
                    <div class="user-status">${user.isOnline ? 'Online' : 'Offline'}</div>
                </div>
            `;

            userElement.addEventListener('click', () => {
                this.showChatForUser(userId, username);
            });

            chatUsersList.appendChild(userElement);
        });
    }



    highlightSelectedUser(userId) {
        // Remove previous selection
        const chatUsersList = document.getElementById('chat-users-list');
        if (!chatUsersList) return;

        const allUserItems = chatUsersList.querySelectorAll('.chat-user-item');
        allUserItems.forEach(item => item.classList.remove('selected'));

        // Highlight the selected user
        const selectedUserItem = chatUsersList.querySelector(`[data-user-id="${userId}"]`);
        if (selectedUserItem) {
            selectedUserItem.classList.add('selected');
        }
    }

    closeChatAside() {
        const chatAside = document.getElementById('chat-aside');
        if (chatAside) {
            // Hide the chat aside
            chatAside.classList.remove('active');
            chatAside.style.display = 'none';
            document.body.classList.remove('chat-active');

            // Reset chat section content to placeholder
            const chatSection = document.getElementById('chat-section');
            if (chatSection) {
                chatSection.innerHTML = '<div class="no-chat-selected"><p>Select a user to start chatting</p></div>';
            }

            // Clear selected user highlight
            const selectedUser = document.querySelector('.chat-user-item.selected');
            if (selectedUser) selectedUser.classList.remove('selected');

            // Clear current chat user
            this.currentChatUser = null;
        }

        // Show/restore the online users panel to its original state
        let usersPanel = document.getElementById('online-users-panel');

        if (!usersPanel) {
            // If panel doesn't exist, create it (this recreates the original sidebar)
            createUsersPanel();
            usersPanel = document.getElementById('online-users-panel');
        }

        if (usersPanel) {
            // Show the panel and ensure it's properly positioned
            usersPanel.style.display = 'block';
            usersPanel.style.visibility = 'visible';

            // Reset any inline styles that might interfere
            usersPanel.style.position = '';
            usersPanel.style.left = '';
            usersPanel.style.right = '';
            usersPanel.style.width = '';
            usersPanel.style.height = '';

            // Ensure proper classes
            usersPanel.className = 'online-users-sidebar';

            // Reset header to show "👥 Users" 
            const header = usersPanel.querySelector('.sidebar-header h3');
            if (header) {
                header.textContent = '👥 Users';
            }

            // Make sure the users count is visible
            const usersCount = usersPanel.querySelector('.users-count');
            if (usersCount) {
                usersCount.style.display = 'block';
            }

            // Refresh the users list to show current online/offline status
            this.refreshUsersList();
        }

        // Also ensure toggle sidebar button works properly
        const toggleBtn = document.getElementById('toggle-sidebar');
        if (toggleBtn && usersPanel) {
            // Reset button text based on panel state
            toggleBtn.textContent = usersPanel.classList.contains('collapsed') ? '+' : '−';
        }
    }


async loadChatHistory(userId, limit = 20, offset = 0, append = false) {
    if (append) this.showLoader(userId, true);

    try {
        await new Promise(r => setTimeout(r, 1000)); // fake delay
        const response = await fetch(`/api/user-messages?userId=${userId}&limit=${limit}&offset=${offset}`, {
            credentials: 'same-origin'
        });

        if (!response.ok) return;

        const data = await response.json();
        const messages = data.messages || [];

        if (append) {
            this.prependChatHistory(userId, messages);
        } else {
            this.displayChatHistory(userId, messages);
        }
    } catch (err) {
        console.error('❌ Error loading chat history:', err);
    } finally {
        if (append) this.showLoader(userId, false);
    }
}


prependChatHistory(userId, messages) {
    const messagesContainer = document.getElementById(`messages-${userId}`);
    if (!messagesContainer) return;

    // Save current scroll position
    const oldScrollHeight = messagesContainer.scrollHeight;

    messages.forEach(msg => {
        const messageElement = this.createMessageElement(userId, msg);
        messagesContainer.insertBefore(messageElement, messagesContainer.firstChild);
    });

    // Restore scroll so the chat doesn't jump
    const newScrollHeight = messagesContainer.scrollHeight;
    messagesContainer.scrollTop += newScrollHeight - oldScrollHeight;
}


    displayChatHistory(userId, messages) {
        console.log('📺 Displaying chat history for user:', userId, 'Messages:', messages);
        const messagesContainer = document.getElementById(`messages-${userId}`);
        if (!messagesContainer) {
            console.log('❌ Messages container not found for user:', userId);
            return;
        }
        console.log('✅ Messages container found:', messagesContainer);
        messagesContainer.innerHTML = '';
        messages.forEach(message => this.addMessageToChat(userId, message));
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        console.log('✅ Chat history displayed successfully');
    }

   createMessageElement(userId, message) {
    const messageElement = document.createElement('div');
    const isOwnMessage = message.senderId === globalThis.CURRENT_USER?.id;

    messageElement.className = `chat-message ${isOwnMessage ? 'message-sent' : 'message-received'}`;

    const timestamp = new Date(message.createdAt * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageElement.innerHTML = `
        <div class="message-bubble">
            <div class="message-content">${this.escapeHtml(message.content)}</div>
            <div class="message-meta">
                <span class="message-time">${timestamp}</span>
                ${isOwnMessage ? '<span class="message-status">✓</span>' : ''}
            </div>
        </div>
    `;
    return messageElement;
}

addMessageToChat(userId, message) {
    const messagesContainer = document.getElementById(`messages-${userId}`);
    if (!messagesContainer) return;

    const messageElement = this.createMessageElement(userId, message);
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


    handleIncomingPrivateMessage(wsMessage) {
        const message = wsMessage.data;
        const senderId = message.senderId;

        // Track recent activity for sorting
        this.recentActivity.set(senderId, Date.now());

        // Only add message to chat if the chat is already open
        if (this.activeChats.has(senderId)) {
            this.addMessageToChat(senderId, message);

            // If the chat is open and this user is currently being viewed, mark as seen
            if (this.currentChatUser && this.currentChatUser.userId === senderId) {
                this.markChatAsSeen(senderId);
            }
        }
        // Note: We don't automatically open the chat anymore - user chooses when to open

        this.showMessageNotification(message.sender.nickname, message.content);

        // Refresh user list to update sorting
        this.refreshUsersList();
    }

    showMessageNotification(senderName, content) {
        globalThis.showMessage(`New message from ${senderName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`, 'info');


    }

    handleTyping(userId, username) {
        if (!this.typingTimeout) {
            this.sendMessage('typing', { typing: true }, userId, username);
            this.typingTimeout = setTimeout(() => this.typingTimeout = null, 700);
        }
    }

    showTypingIndicator(userId, username, isTyping) {
        const indicator = document.getElementById(`typing-${userId}`);
        if (!indicator) return;

        if (isTyping) {
            // show typing indicator
            indicator.style.display = 'block';
            clearTimeout(indicator.hideTimeout);
            indicator.hideTimeout = setTimeout(() => {
                indicator.style.display = 'none';
            }, 3000);
        } else {
            // hide typing indicator immediately
            indicator.style.display = 'none';
            clearTimeout(indicator.hideTimeout);
        }
    }



    handleChatKeyPress(event, userId, username) {
        if (event.key === 'Enter') {
            this.sendPrivateMessage(userId, username);

            // send "stop typing"
            this.sendMessage('typing', { typing: false }, userId, username);

            if (this.typingTimeout) {
                clearTimeout(this.typingTimeout);
                this.typingTimeout = null;
            }
        } else {
            this.handleTyping(userId, username);
        }
    }


    async sendPrivateMessage(userId, username) {
        const input = document.getElementById(`input-${userId}`);
        protectInput(input);

        const message = input.value.trim();
        if (!message) return;

        try {
            const response = await fetch('/api/messages/send',  {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ toUserId: userId, content: message })
            });

            if (response.ok) {
                const data = await response.json();
                this.addMessageToChat(userId, data.message);
                input.value = '';

                // Track recent activity for sorting
                this.recentActivity.set(userId, Date.now());

                // Mark as seen immediately since we're the sender
                this.markChatAsSeen(userId);
            } else {
                globalThis.showMessage('Failed to send message', 'error');
            }
        } catch (error) { globalThis.showMessage('Error sending message', 'error'); }
    }



    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    registerMessageHandler(type, handler) { this.messageHandlers.set(type, handler); }
    addConnectionListener(listener) { this.connectionListeners.push(listener); }
    notifyConnectionListeners(status, data = null) {
        this.connectionListeners.forEach(listener => {
            try { listener(status, data); } catch (err) { console.error(err); }
        });
    }

    disconnect() {
        this.isConnected = false;
        this.stopHeartbeat();
        if (this.ws) { this.ws.close(); this.ws = null; }
        this.allUsers.forEach(u => u.isOnline = false);
        this.refreshUsersList();
        this.activeChats.clear();
        // Close chat aside
        this.closeChatAside();
    }

    async fetchAllUsers() {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            if (!data.users) return;

            this.allUsers.clear();
            data.users.forEach(user => {
                this.allUsers.set(user.id, {
                    id: user.id,
                    username: user.username,
                    nickname: user.nickname,
                    isOnline: false,
                    lastSeen: user.lastSeen || null
                });
            });

            this.refreshUsersList();
            console.log(`All users loaded: ${this.allUsers.size}`);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    }

    startUserUpdates() {
        setTimeout(() => this.fetchAllUsers(), 1000);
    }

    handlePostUpdate(data) { if (data.action === 'new_post' && data.postId) globalThis.showMessage(`New post: "${data.post.title}" by ${data.post.author.nickname}`, 'info'); }
    handleCommentUpdate(data) {
        if (data.action === 'new_comment' && data.postId) {
            globalThis.loadComments(data.postId);
        }
    }


    handleUserActivity(data) { if (data.activity) globalThis.showMessage(`User activity: ${data.activity}`, 'info'); }
}


// Global WebSocket manager instance
const wsManager = new WebSocketManager();

// Auto-connect when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, checking for session...');

    // Wait for app.js to load and set CURRENT_USER
    const waitForUserAndInitialize = () => {
        console.log('🔍 Checking for user and session...');
        console.log('👤 globalThis.CURRENT_USER:', globalThis.CURRENT_USER);
        console.log('🍪 All cookies:', document.cookie);
        console.log('🍪 Session cookie check:', document.cookie.includes('session='));

        if (globalThis.CURRENT_USER && globalThis.CURRENT_USER.id && !wsManager.isConnected) {
            console.log('✅ User found, initializing WebSocket immediately...');

            wsManager.reconnectAttempts = 0;
            wsManager.reconnectDelay = 1000;

            wsManager.connect();
            initializeConnectionStatus();
            initializePrivateMessaging();
            return true;
        } else if (!globalThis.CURRENT_USER || !globalThis.CURRENT_USER.id) {
            console.log('❌ No valid user found - not logged in');
            return false;
        } else if (wsManager.isConnected) {
            console.log('✅ WebSocket already connected');
            return true;
        }
        return false;
    };

    // Try multiple times with increasing delays
    const tryInitialize = (attempt = 1, maxAttempts = 5) => {
        console.log(`🔄 WebSocket initialization attempt ${attempt}/${maxAttempts}`);

        if (waitForUserAndInitialize()) return;

        if (attempt < maxAttempts) {
            const delay = attempt * 500;
            console.log(`⏳ Retrying in ${delay}ms...`);
            setTimeout(() => tryInitialize(attempt + 1, maxAttempts), delay);
        } else {
            console.log('❌ WebSocket initialization failed after all attempts');
        }
    };

    setTimeout(() => tryInitialize(), 100);

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && globalThis.CURRENT_USER) {
            console.log('👁️ Page became visible, checking WebSocket connection...');
            if (!wsManager.isConnected) {
                console.log('🔄 Page visible but WebSocket disconnected, reconnecting...');
                wsManager.reconnectAttempts = 0;
                wsManager.connect();
            } else {
                console.log('✅ WebSocket already connected');
            }
        }
    });

    // Gracefully close WebSocket on page unload
    globalThis.addEventListener('beforeunload', () => {
        if (wsManager.isConnected) {
            console.log('📄 Page unloading, closing WebSocket gracefully...');
            wsManager.ws.close(1000, 'Page unloading');
        }
    });
});

function ensureLoader(userId) {
    const container = document.getElementById(`messages-${userId}`);
    if (!container.querySelector('.chat-loader')) {
        const loader = document.createElement('div');
        loader.classList.add('chat-loader');
        loader.style.display = 'none';
        loader.innerHTML = '<div class="spinner"></div>';
        container.appendChild(loader);
    }
}

// Initialize connection status indicator
function protectInput(input) {
    if (!input) return;

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === 'disabled') {
                if (!input.disabled) input.disabled = true; // re-disable
            }
        });
    });

    observer.observe(input, { attributes: true });
}


function initializeConnectionStatus() {
    const statusElement = document.getElementById('connection-status');
    if (!statusElement) {
        console.warn('Connection status element not found in header');
        return;
    }

    wsManager.addConnectionListener((status) => {
        switch (status) {
            case 'connected':
                // Only update if it's not already showing a welcome message
                if (!statusElement.textContent.includes('Welcome')) {
                    statusElement.className = 'connection-status connected';
                    statusElement.textContent = '● Connected';
                }
                break;
            case 'disconnected':
                statusElement.className = 'connection-status disconnected';
                statusElement.textContent = '● Offline';
                break;
            case 'error':
                statusElement.className = 'connection-status disconnected';
                statusElement.textContent = '● Connection Error';
                break;
        }
    });
}
// Initialize private messaging interface
function initializePrivateMessaging() {
    createUsersPanel();
}

// Create users panel (shows all users with online/offline status)
async function createUsersPanel() {
    // Only create users panel if user is authenticated
    if (!globalThis.CURRENT_USER || !globalThis.CURRENT_USER.id) {
        console.log('❌ Not creating users panel - user not authenticated');
        return;
    }

    if (document.getElementById('online-users-panel')) return;

    const usersPanel = document.createElement('div');
    usersPanel.id = 'online-users-panel';
    usersPanel.className = 'online-users-sidebar';
    usersPanel.innerHTML = `
        <div class="sidebar-header">
            <h3>👥 Users</h3>
            <div class="users-count">
                <span id="online-count">0</span> online, 
                <span id="total-count">0</span> total
            </div>
        </div>
        <div id="online-users-list" class="online-users-list">
            <div class="loading">Loading users...</div>
        </div>
    `;
    document.body.appendChild(usersPanel);

    document.getElementById('toggle-sidebar').addEventListener('click', () => {
        usersPanel.classList.toggle('collapsed');
        document.getElementById('toggle-sidebar').textContent = usersPanel.classList.contains('collapsed') ? '+' : '−';
    });

    wsManager.registerMessageHandler('welcome', (msg) => {
        if (!msg.data || !msg.data.users) return;
        wsManager.allUsers.clear();
        msg.data.users.forEach(u => wsManager.allUsers.set(u.id, u));
        wsManager.refreshUsersList();
    });
    wsManager.registerMessageHandler('user_status', (msg) => {
        const userId = msg.data.userId;
        const isOnline = msg.data.status === 'online';
        if (wsManager.allUsers.has(userId)) {
            const user = wsManager.allUsers.get(userId);
            user.isOnline = isOnline;
            wsManager.allUsers.set(userId, user);
        } else {
            wsManager.allUsers.set(userId, {
                id: userId,
                nickname: msg.data.username,
                isOnline
            });
        }
        wsManager.refreshUsersList();
    });

}


// Manual WebSocket initialization
function initializeWebSocket() {
    console.log('🔌 Manual WebSocket initialization called');
    if (globalThis.CURRENT_USER && globalThis.CURRENT_USER.id && !wsManager.isConnected) {
        wsManager.connect();

        initializeConnectionStatus();
        initializePrivateMessaging();
        return true;
    } else if (wsManager.isConnected) {
        return true;
    } else {
        return false;
    }
}

// Debug functions
function debugAllUsers() {
    console.log('=== DEBUG ALL USERS ===');
    console.log('Current user:', globalThis.CURRENT_USER);
    console.log('WebSocket connected:', wsManager.isConnected);
    console.log('Online users count:', wsManager.onlineUsers.size);
    console.log('All users count:', wsManager.allUsers.size);
    console.log('Online users:', Array.from(wsManager.onlineUsers.entries()));
    console.log('All users:', Array.from(wsManager.allUsers.entries()));
    wsManager.refreshUsersList();
}

function forceCreateUsersPanel() {
    const existingPanel = document.getElementById('online-users-panel');
    if (existingPanel) existingPanel.remove();
    createUsersPanel();
}

function hideUsersPanel() {
    const existingPanel = document.getElementById('online-users-panel');
    if (existingPanel) {
        existingPanel.remove();
    }
}

// Test WebSocket and API connectivity
function testWebSocketConnection() {
    console.log('🧪 TESTING WEBSOCKET CONNECTION');

    fetch('/api/users', { credentials: 'same-origin' })
        .then(r => r.json())
        .then(data => console.log('API all users:', data.users?.length || 0))
        .catch(e => console.error('Users API error:', e));

    fetch('/api/online-users', { credentials: 'same-origin' })
        .then(r => r.json())
        .then(data => {
            if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
                data.onlineUsers.forEach(user => {
                    wsManager.updateUserStatus(user.id, user.username, 'online');
                });
            }
        })
        .catch(e => console.error('Online users API error:', e));

    if (!wsManager.isConnected) wsManager.connect();
}


// Expose globally
// ===== websocket global exposes (replace globalThis.* with globalThis.*) =====
globalThis.WebSocketManager = WebSocketManager;
globalThis.wsManager = wsManager;
globalThis.initializeWebSocket = initializeWebSocket;
globalThis.debugAllUsers = debugAllUsers;
globalThis.forceCreateUsersPanel = forceCreateUsersPanel;
globalThis.hideUsersPanel = hideUsersPanel;
globalThis.testWebSocketConnection = testWebSocketConnection;
globalThis.quickDebugAllUsers = quickDebugAllUsers;

globalThis.debugWebSocketState = function () {
    console.log('=== WEBSOCKET DEBUG ===');
    console.log('globalThis.CURRENT_USER:', globalThis.CURRENT_USER);
    console.log('wsManager.isConnected:', wsManager.isConnected);
    console.log('WebSocket state:', wsManager.ws ? wsManager.ws.readyState : 'N/A');
    if (!wsManager.isConnected && globalThis.CURRENT_USER) wsManager.connect();
};

globalThis.printAllUsers = function () {
    console.log('=== ALL USERS DEBUG ===');
    console.log('Online users map size:', wsManager.onlineUsers.size);
    console.log('All users map size:', wsManager.allUsers.size);
    wsManager.refreshUsersList();
};

function quickDebugAllUsers() {
    console.log('=== QUICK DEBUG ALL USERS ===');
    console.log('Current user:', globalThis.CURRENT_USER);
    console.log('WebSocket connected:', wsManager.isConnected);
    console.log('Online users count:', wsManager.onlineUsers.size);
    console.log('All users count:', wsManager.allUsers.size);

    fetch('/api/users', { credentials: 'same-origin' })
        .then(r => r.json())
        .then(data => console.log('API all users:', data.users?.length || 0))
        .catch(e => console.error('Users API error:', e));

    fetch('/api/online-users', { credentials: 'same-origin' })
        .then(r => r.json())
        .then(data => {
            if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
                data.onlineUsers.forEach(user => {
                    wsManager.updateUserStatus(user.id, user.username, 'online');
                });
            }
        })
        .catch(e => console.error('Online users API error:', e));
}

globalThis.quickDebugAllUsers = quickDebugAllUsers;

globalThis.debugWebSocketState = function () {
    console.log('=== WEBSOCKET DEBUG ===');
    console.log('globalThis.CURRENT_USER:', globalThis.CURRENT_USER);
    console.log('wsManager.isConnected:', wsManager.isConnected);
    console.log('WebSocket state:', wsManager.ws ? wsManager.ws.readyState : 'N/A');
    if (!wsManager.isConnected && globalThis.CURRENT_USER) wsManager.connect();
};

globalThis.printAllUsers = function () {
    console.log('=== ALL USERS DEBUG ===');
    console.log('Online users map size:', wsManager.onlineUsers.size);
    console.log('All users map size:', wsManager.allUsers.size);
    wsManager.refreshUsersList();
};

