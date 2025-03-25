// Chat Elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMessage = document.getElementById('sendMessage');

// Message Templates
function createUserMessage(text) {
    return `
        <div class="message user-message">
            <div class="message-content">
                ${text}
            </div>
        </div>
    `;
}

function createAIMessage(text) {
    return `
        <div class="message ai-message">
            <div class="message-avatar">
                <span>AI</span>
            </div>
            <div class="message-content">
                ${text}
            </div>
        </div>
    `;
}

// Chat History
let chatHistory = [];

// Send Message Handler
async function handleSendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Clear input
    chatInput.value = '';

    // Add user message to chat
    chatMessages.insertAdjacentHTML('beforeend', createUserMessage(message));
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Add to chat history
    chatHistory.push({ role: 'user', content: message });

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Please log in to use the chat');
        }

        // Show typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message bot-message typing';
        typingDiv.innerHTML = '<div class="message-content"><div class="typing-indicator">AI is typing...</div></div>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Send message to server
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message })
        });

        // Remove typing indicator
        typingDiv.remove();

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to get response');
        }

        const data = await response.json();
        chatMessages.insertAdjacentHTML('beforeend', createAIMessage(data.response));
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Add to chat history
        chatHistory.push({ role: 'assistant', content: data.response });
    } catch (error) {
        console.error('Error:', error);
        chatMessages.insertAdjacentHTML('beforeend', createAIMessage('Sorry, I encountered an error. Please try again.'));
    }
}

// Event Listeners
sendMessage.addEventListener('click', handleSendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSendMessage();
    }
});

// Context-aware suggestions
const commonQuestions = [
    'How do I perform a proper squat?',
    'What should I eat before workout?',
    'How can I prevent injury during exercise?',
    'What\'s the best way to warm up?',
    'How many rest days do I need?'
];

function addSuggestions() {
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'chat-suggestions';
    suggestionsDiv.innerHTML = `
        <p>Common Questions:</p>
        <div class="suggestion-buttons">
            ${commonQuestions.map(q => `
                <button class="suggestion-btn" onclick="suggestQuestion('${q}')">${q}</button>
            `).join('')}
        </div>
    `;
    chatMessages.appendChild(suggestionsDiv);
}

function suggestQuestion(question) {
    chatInput.value = question;
    handleSendMessage();
}

// Initialize chat
function initChat() {
    // Add welcome message
    chatMessages.innerHTML = createAIMessage(`
        Hello! I'm your AI Fitness Coach. I'm here to help you with your fitness journey. 
        You can ask me questions about:
        - Workout techniques and form
        - Nutrition advice
        - Injury prevention
        - Progress tracking
        - Workout modifications
        
        How can I assist you today?
    `);
    
    // Add suggestion buttons
    addSuggestions();
}

// Initialize chat when the chat section is shown
document.addEventListener('DOMContentLoaded', () => {
    if (chatMessages && chatMessages.children.length === 0) {
        initChat();
    }
});

class ChatUI {
    constructor() {
        this.messagesContainer = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-message');
        this.quickActions = document.querySelectorAll('.quick-action-btn');
        
        this.initializeEventListeners();
        this.adjustTextareaHeight();
    }

    initializeEventListeners() {
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // Send message on Enter (but new line on Shift+Enter)
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.chatInput.addEventListener('input', () => this.adjustTextareaHeight());

        // Quick action buttons
        this.quickActions.forEach(button => {
            button.addEventListener('click', () => {
                const query = button.dataset.query;
                if (query) {
                    this.chatInput.value = query;
                    this.sendMessage();
                }
            });
        });
    }

    adjustTextareaHeight() {
        const textarea = this.chatInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        this.chatInput.value = '';
        this.adjustTextareaHeight();

        try {
            // Show typing indicator
            this.showTypingIndicator();

            // Send to backend and get response
            const response = await this.sendToBackend(message);
            
            // Remove typing indicator and show response
            this.removeTypingIndicator();
            this.addMessage(response, 'ai');
        } catch (error) {
            console.error('Error sending message:', error);
            this.removeTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'ai');
        }
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                ${content}
            </div>
        `;
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message ai typing-indicator';
        indicator.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(indicator);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const indicator = this.messagesContainer.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async sendToBackend(message) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
}

// Initialize chat when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    new ChatUI();
}); 