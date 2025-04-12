document.addEventListener("DOMContentLoaded", () => {
    console.log("Chat.js loaded");
    const sendBtn = document.getElementById("send-message");
    const chatInput = document.getElementById("chat-input");
    const chatMessages = document.getElementById("chat-messages");

    if (!sendBtn || !chatInput || !chatMessages) {
        console.error("Required elements not found:", { sendBtn, chatInput, chatMessages });
        return;
    }

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
        console.log("No authentication token found");
        appendMessage("⚠️ Please log in to use the chat feature.", "ai");
        return;
    }

    const appendMessage = (message, sender = "user") => {
        console.log(`Appending message from ${sender}:`, message);
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", sender);

        const content = document.createElement("div");
        content.classList.add("message-content");
        content.textContent = message;

        messageElement.appendChild(content);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    // Function to show typing indicator
    const showTypingIndicator = () => {
        console.log("Showing typing indicator");
        const typingElement = document.createElement("div");
        typingElement.classList.add("message", "ai", "typing-indicator");
        typingElement.id = "typing-indicator";
        
        const content = document.createElement("div");
        content.classList.add("message-content");
        content.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
        
        typingElement.appendChild(content);
        chatMessages.appendChild(typingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    // Function to remove typing indicator
    const removeTypingIndicator = () => {
        console.log("Removing typing indicator");
        const typingElement = document.getElementById("typing-indicator");
        if (typingElement) {
            typingElement.remove();
        }
    };

    const sendMessage = async () => {
        const message = chatInput.value.trim();
        if (!message) return;

        console.log("Sending message:", message);
        // Append user's message
        appendMessage(message, "user");
        chatInput.value = "";

        // Show typing indicator
        showTypingIndicator();

        try {
            console.log("Making API request to /api/chat");
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ message })
            });

            // Remove typing indicator before processing response
            removeTypingIndicator();

            console.log("API response status:", res.status);
            const data = await res.json();
            console.log("API response data:", data);

            if (res.ok) {
                appendMessage(data.response, "ai");
            } else {
                console.error("API error:", data.error);
                if (res.status === 401) {
                    appendMessage("⚠️ Your session has expired. Please log in again.", "ai");
                    // Redirect to login page after 2 seconds
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    appendMessage(`⚠️ ${data.error || 'There was an error. Please try again later.'}`, "ai");
                }
            }
        } catch (err) {
            // Remove typing indicator in case of error
            removeTypingIndicator();
            
            console.error("Chat request failed:", err);
            appendMessage("⚠️ Failed to connect to the server. Please check your internet connection.", "ai");
        }
    };

    // Send message on button click
    sendBtn.addEventListener("click", () => {
        console.log("Send button clicked");
        sendMessage();
    });

    // Send message on Enter key
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            console.log("Enter key pressed");
            sendMessage();
        }
    });

    // Quick action buttons
    document.querySelectorAll(".quick-action-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            console.log("Quick action button clicked:", btn.dataset.query);
            chatInput.value = btn.dataset.query;
            sendMessage();
        });
    });

    // Auto-resize textarea
    chatInput.addEventListener("input", function() {
        this.style.height = "auto";
        this.style.height = (this.scrollHeight) + "px";
    });
});
