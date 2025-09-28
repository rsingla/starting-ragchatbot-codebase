// API base URL - use relative path to work from any host
const API_URL = '/api';

// Global state
let currentSessionId = null;
let sessionHistory = []; // Store previous sessions
let currentSessionIndex = -1; // Track current session in history

// DOM elements
let chatMessages, chatInput, sendButton, totalCourses, courseTitles;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements after page loads
    chatMessages = document.getElementById('chatMessages');
    chatInput = document.getElementById('chatInput');
    sendButton = document.getElementById('sendButton');
    totalCourses = document.getElementById('totalCourses');
    courseTitles = document.getElementById('courseTitles');
    
    setupEventListeners();
    createNewSession();
    loadCourseStats();
});

// Event Listeners
function setupEventListeners() {
    // Chat functionality
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    
    // Suggested questions
    document.querySelectorAll('.suggested-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const question = e.target.getAttribute('data-question');
            chatInput.value = question;
            sendMessage();
        });
    });

    // New chat button
    const newChatButton = document.getElementById('newChatBtn');
    if (newChatButton) {
        newChatButton.addEventListener('click', () => {
            createNewSession();
        });
    }
}


// Chat Functions
async function sendMessage() {
    const query = chatInput.value.trim();
    if (!query) return;

    // Disable input
    chatInput.value = '';
    chatInput.disabled = true;
    sendButton.disabled = true;

    // Add user message
    addMessage(query, 'user');

    // Add loading message - create a unique container for it
    const loadingMessage = createLoadingMessage();
    chatMessages.appendChild(loadingMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch(`${API_URL}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                session_id: currentSessionId
            })
        });

        if (!response.ok) throw new Error('Query failed');

        const data = await response.json();
        
        // Update session ID - always use the latest session ID from response
        currentSessionId = data.session_id;

        // Replace loading message with response
        loadingMessage.remove();
        addMessage(data.answer, 'assistant', data.sources);
        
        // Save session to history after getting response
        if (currentSessionId) {
            addSessionToHistory();
        }

    } catch (error) {
        // Replace loading message with error
        loadingMessage.remove();
        addMessage(`Error: ${error.message}`, 'assistant');
    } finally {
        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.focus();
    }
}

function createLoadingMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="loading">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    return messageDiv;
}

function addMessage(content, type, sources = null, isWelcome = false) {
    const messageId = Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}${isWelcome ? ' welcome-message' : ''}`;
    messageDiv.id = `message-${messageId}`;
    
    // Convert markdown to HTML for assistant messages
    const displayContent = type === 'assistant' ? marked.parse(content) : escapeHtml(content);
    
    let html = `<div class="message-content">${displayContent}</div>`;
    
    if (sources && sources.length > 0) {
        const sourcesList = sources.map((source, index) => {
            if (typeof source === 'string') {
                // Handle legacy string format
                return `<li class="source-item">
                    <span class="source-number">${index + 1}.</span>
                    <span class="source-text">${source}</span>
                </li>`;
            } else if (source && source.source) {
                // Handle new object format with link
                if (source.link) {
                    return `<li class="source-item">
                        <span class="source-number">${index + 1}.</span>
                        <a href="${source.link}" target="_blank" rel="noopener noreferrer" class="source-link">
                            ${source.source}
                            <svg class="external-link-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15,3 21,3 21,9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </a>
                    </li>`;
                } else {
                    return `<li class="source-item">
                        <span class="source-number">${index + 1}.</span>
                        <span class="source-text">${source.source}</span>
                    </li>`;
                }
            }
            return `<li class="source-item">
                <span class="source-number">${index + 1}.</span>
                <span class="source-text">${source}</span>
            </li>`;
        }).join('');
        
        html += `
            <details class="sources-collapsible">
                <summary class="sources-header">
                    <span class="sources-title">Sources</span>
                    <span class="sources-count">(${sources.length})</span>
                </summary>
                <div class="sources-content">
                    <ul class="sources-list">${sourcesList}</ul>
                </div>
            </details>
        `;
    }
    
    messageDiv.innerHTML = html;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageId;
}

// Helper function to escape HTML for user messages
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Session History Management
function saveCurrentSession() {
    if (currentSessionIndex >= 0 && sessionHistory[currentSessionIndex]) {
        // Save current session content
        const sessionContent = chatMessages.innerHTML;
        const sessionData = {
            id: currentSessionId,
            content: sessionContent,
            timestamp: new Date().toISOString(),
            title: generateSessionTitle()
        };
        sessionHistory[currentSessionIndex] = sessionData;
    }
}

function generateSessionTitle() {
    // Generate a title from the first user message
    const userMessages = chatMessages.querySelectorAll('.message.user .message-content');
    if (userMessages.length > 0) {
        const firstMessage = userMessages[0].textContent.trim();
        return firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage;
    }
    return 'New Chat';
}

function addSessionToHistory() {
    const sessionContent = chatMessages.innerHTML;
    const sessionData = {
        id: currentSessionId,
        content: sessionContent,
        timestamp: new Date().toISOString(),
        title: generateSessionTitle()
    };
    
    sessionHistory.push(sessionData);
    currentSessionIndex = sessionHistory.length - 1;
    
    // Update sidebar with session history
    updateSessionHistorySidebar();
}

function updateSessionHistorySidebar() {
    const sessionHistoryContainer = document.getElementById('sessionHistory');
    if (!sessionHistoryContainer) return;
    
    if (sessionHistory.length === 0) {
        sessionHistoryContainer.innerHTML = '<div class="no-sessions">No previous chats</div>';
        return;
    }
    
    const sessionsHtml = sessionHistory.map((session, index) => {
        const isActive = index === currentSessionIndex;
        const timestamp = new Date(session.timestamp).toLocaleString();
        
        return `
            <div class="session-item ${isActive ? 'active' : ''}" data-session-index="${index}">
                <div class="session-icon">${index + 1}</div>
                <div class="session-content">
                    <div class="session-title">${session.title}</div>
                    <div class="session-timestamp">${timestamp}</div>
                </div>
            </div>
        `;
    }).join('');
    
    sessionHistoryContainer.innerHTML = sessionsHtml;
    
    // Add click handlers for session items
    sessionHistoryContainer.querySelectorAll('.session-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't trigger if clicking delete button
            if (e.target.classList.contains('delete-session')) return;
            
            const sessionIndex = parseInt(item.dataset.sessionIndex);
            loadSession(sessionIndex);
        });
        
        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-session';
        deleteBtn.innerHTML = '×';
        deleteBtn.style.cssText = `
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            width: 20px;
            height: 20px;
            border: none;
            background: var(--error);
            color: white;
            border-radius: 50%;
            cursor: pointer;
            font-size: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        
        item.style.position = 'relative';
        item.appendChild(deleteBtn);
        
        // Show delete button on hover
        item.addEventListener('mouseenter', () => {
            deleteBtn.style.opacity = '1';
        });
        
        item.addEventListener('mouseleave', () => {
            deleteBtn.style.opacity = '0';
        });
        
        // Handle delete
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const sessionIndex = parseInt(item.dataset.sessionIndex);
            deleteSession(sessionIndex);
        });
    });
}

function loadSession(sessionIndex) {
    if (sessionIndex < 0 || sessionIndex >= sessionHistory.length) return;
    
    const session = sessionHistory[sessionIndex];
    
    // Save current session if it has content
    if (currentSessionId && chatMessages.children.length > 0) {
        saveCurrentSession();
    }
    
    // Load the selected session
    currentSessionIndex = sessionIndex;
    currentSessionId = session.id;
    
    // Clear and load session content
    chatMessages.style.opacity = '0.5';
    chatMessages.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        chatMessages.innerHTML = session.content;
        chatMessages.style.opacity = '1';
        chatMessages.style.transform = 'translateY(0)';
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Update sidebar to show active session
        updateSessionHistorySidebar();
    }, 200);
}

function deleteSession(sessionIndex) {
    if (sessionIndex < 0 || sessionIndex >= sessionHistory.length) return;
    
    // If deleting the current session, clear the chat
    if (sessionIndex === currentSessionIndex) {
        chatMessages.innerHTML = '';
        currentSessionId = null;
        currentSessionIndex = -1;
    } else if (sessionIndex < currentSessionIndex) {
        // Adjust current session index if we're deleting a session before the current one
        currentSessionIndex--;
    }
    
    // Remove the session from history
    sessionHistory.splice(sessionIndex, 1);
    
    // Update the sidebar
    updateSessionHistorySidebar();
    
    console.log('Session deleted:', sessionIndex);
}

async function createNewSession() {
    // Save current session if it has content
    const hasContent = chatMessages.children.length > 0;
    if (hasContent && currentSessionId) {
        saveCurrentSession();
    }
    
    // Clear current session
    currentSessionId = null;
    
    // Clear chat messages with animation
    chatMessages.style.opacity = '0.5';
    chatMessages.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        chatMessages.innerHTML = '';
        chatMessages.style.opacity = '1';
        chatMessages.style.transform = 'translateY(0)';
    }, 200);
    
    // Reset any loading states
    chatInput.disabled = false;
    sendButton.disabled = false;
    
    // Add welcome message with slight delay for smooth transition
    setTimeout(() => {
        addMessage('Welcome to the Course Materials Assistant! I can help you with questions about courses, lessons and specific content. What would you like to know?', 'assistant', null, true);
    }, 300);
    
    // Focus on input
    setTimeout(() => {
        chatInput.focus();
    }, 400);
    
    // Add visual feedback to New Chat button
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.style.transform = 'scale(0.95)';
        newChatBtn.textContent = 'New Chat ✓';
        newChatBtn.style.background = 'var(--success)';
        
        setTimeout(() => {
            newChatBtn.style.transform = 'scale(1)';
            setTimeout(() => {
                newChatBtn.textContent = 'New Chat';
                newChatBtn.style.background = 'var(--primary-gradient)';
            }, 1000);
        }, 150);
    }
    
    console.log('New chat session started');
}

// Load course statistics
async function loadCourseStats() {
    try {
        console.log('Loading course stats...');
        const response = await fetch(`${API_URL}/courses`);
        if (!response.ok) throw new Error('Failed to load course stats');
        
        const data = await response.json();
        console.log('Course data received:', data);
        
        // Update stats in UI
        if (totalCourses) {
            totalCourses.textContent = data.total_courses;
        }
        
        // Update course titles
        if (courseTitles) {
            if (data.course_titles && data.course_titles.length > 0) {
                courseTitles.innerHTML = data.course_titles
                    .map(title => `<div class="course-title-item">${title}</div>`)
                    .join('');
            } else {
                courseTitles.innerHTML = '<span class="no-courses">No courses available</span>';
            }
        }
        
    } catch (error) {
        console.error('Error loading course stats:', error);
        // Set default values on error
        if (totalCourses) {
            totalCourses.textContent = '0';
        }
        if (courseTitles) {
            courseTitles.innerHTML = '<span class="error">Failed to load courses</span>';
        }
    }
}