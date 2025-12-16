/**
 * Gemini Agent - Client-Side AI Integration
 * Handles API communication, session management, and UI updates.
 */

class GeminiAgent {
    constructor() {
        this.apiKey = localStorage.getItem('gemini_api_key');
        this.chatHistory = [];
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

        // UI Elements
        this.chatContainer = document.getElementById('chat-history');
        this.inputField = document.getElementById('user-input');
        this.sendBtn = document.getElementById('send-btn');
        this.statusIndicator = document.querySelector('.ai-status');
        this.memoryBank = document.getElementById('memory-bank');

        this.init();
    }

    init() {
        // Event Listeners
        this.sendBtn.addEventListener('click', () => this.handleUserInput());
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserInput();
        });

        // Initial Greeting
        if (this.chatHistory.length === 0) {
            const savedKey = localStorage.getItem('gemini_api_key');
            if (savedKey) {
                this.addToUI('agent', "System online. Neural link active (Key stored). Ready for input.");
                this.statusIndicator.style.backgroundColor = 'var(--accent-cyan)';
            } else {
                this.addToUI('agent', "System online. I am ready. Please provide your API Core Key to activate my neural link (commands: /apikey &lt;key&gt;).");
            }
        }

        // Restore Memory Visualization
        this.updateMemoryVisuals();
    }

    setApiKey(key) {
        if (!key || key.length < 10) {
            this.addToUI('agent', "Critical Error: Invalid API Key format.");
            return;
        }
        this.apiKey = key;
        localStorage.setItem('gemini_api_key', key);
        this.addToUI('agent', "API Key accepted. Neural link established. I am listening.");
        this.statusIndicator.style.backgroundColor = 'var(--accent-cyan)';
    }

    async handleUserInput() {
        const text = this.inputField.value.trim();
        if (!text) return;

        this.inputField.value = '';
        this.addToUI('user', text);

        // Check for Commands
        if (text.startsWith('/')) {
            this.handleCommand(text);
            return;
        }

        if (!this.apiKey) {
            this.addToUI('agent', "Access Denied: Missing API Key. Use '/apikey <your-key>' to authorize.");
            return;
        }

        // Process Chat
        this.setStatus('thinking');
        try {
            const response = await this.callGeminiAPI(text);
            this.addToUI('agent', response);
            this.updateMemory(text, response);
        } catch (error) {
            console.error("Gemini API Error:", error);
            this.addToUI('agent', `**System Error**: ${error.message}`);
        } finally {
            this.setStatus('idle');
        }
    }

    handleCommand(cmd) {
        const [command, ...args] = cmd.split(' ');
        if (command === '/apikey') {
            this.setApiKey(args[0]);
        } else if (command === '/clear') {
            this.chatHistory = [];
            this.chatContainer.innerHTML = '';
            this.addToUI('agent', "Memory Core Flushed.");
            this.updateMemoryVisuals();
        } else {
            this.addToUI('agent', `Unknown command: ${command}`);
        }
    }

    async callGeminiAPI(userPrompt) {
        if (!this.currentModel) {
            this.currentModel = localStorage.getItem('gemini_model_id') || 'gemini-1.5-flash';
        }

        try {
            return await this.generateContent(this.currentModel, userPrompt);
        } catch (error) {
            if (error.message.includes('not found') || error.message.includes('supported')) {
                this.addToUI('agent', "✨ Detecting available AI models for your key...");
                try {
                    const newModel = await this.autoDiscoverModel();
                    this.currentModel = newModel;
                    localStorage.setItem('gemini_model_id', newModel);
                    this.addToUI('agent', `✓ Switched to **${newModel}**`);
                    return await this.generateContent(newModel, userPrompt);
                } catch (discoveryError) {
                    throw new Error(`Model detection failed: ${discoveryError.message}`);
                }
            }
            throw error;
        }
    }

    async autoDiscoverModel() {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to list models');
        }

        // Find the best model that supports generateContent
        const validModels = data.models.filter(m =>
            m.supportedGenerationMethods &&
            m.supportedGenerationMethods.includes('generateContent') &&
            m.name.includes('gemini')
        );

        if (validModels.length === 0) {
            throw new Error("No Gemini models found for this API key.");
        }

        // Prefer 1.5-flash, then pro, then any
        const preferred = validModels.find(m => m.name.includes('1.5-flash')) ||
            validModels.find(m => m.name.includes('pro')) ||
            validModels[0];

        // The name comes back like 'models/gemini-pro', we usually just need the name part or full resource
        // The API expects models/[name]:generateContent. m.name IS models/[name]
        return preferred.name.replace('models/', '');
    }

    async generateContent(modelId, userPrompt) {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

        // Construct History for Context
        const contents = this.chatHistory.map(msg => ({
            role: msg.role === 'agent' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));

        contents.push({
            role: 'user',
            parts: [{ text: userPrompt }]
        });

        const response = await fetch(`${apiUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error("⚠️ Neural Overload: API Rate Limit Exceeded. Please wait 60 seconds.");
            }
            throw new Error(data.error?.message || `API Error ${response.status}`);
        }

        // Check for safety blocks
        if (data.promptFeedback?.blockReason) {
            throw new Error(`Blocked: ${data.promptFeedback.blockReason}`);
        }

        const candidate = data.candidates?.[0];
        if (!candidate) throw new Error("No response candidate.");

        if (candidate.finishReason === 'SAFETY') {
            throw new Error("Content filtered by safety settings.");
        }

        const text = candidate.content?.parts?.[0]?.text;
        if (!text) throw new Error("Empty response.");

        return text;
    }

    addToUI(role, text) {
        this.chatHistory.push({ role, text });

        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;

        if (role === 'agent') {
            // Render Markdown
            msgDiv.innerHTML = marked.parse(text);
        } else {
            msgDiv.textContent = text;
        }

        this.chatContainer.appendChild(msgDiv);
        this.scrollToBottom();
    }

    setStatus(status) {
        if (status === 'thinking') {
            this.statusIndicator.classList.add('thinking');
            // Add typing indicator
            const typingDiv = document.createElement('div');
            typingDiv.id = 'typing-indicator';
            typingDiv.className = 'message agent';
            typingDiv.innerHTML = `
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>`;
            this.chatContainer.appendChild(typingDiv);
            this.scrollToBottom();
        } else {
            this.statusIndicator.classList.remove('thinking');
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    // Optional: Visual 'Memory Banks' update purely for aesthetic effect
    updateMemory(user, agent) {
        // Simplistic keyword extraction as pseudo-memory
        const keywords = user.split(' ').filter(w => w.length > 5);
        if (keywords.length > 0) {
            const lastKey = keywords[keywords.length - 1];
            this.addMemoryCard('TOPIC', lastKey);
        }

        // Update basic stats
        this.addMemoryCard('TOKENS', agent.length.toString());
    }

    addMemoryCard(label, val) {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.innerHTML = `
            <div class="memory-label">${label}</div>
            <div class="memory-val">${val}</div>
        `;
        this.memoryBank.prepend(card);

        // Keep only top 5 memories visually
        if (this.memoryBank.children.length > 5) {
            this.memoryBank.lastElementChild.remove();
        }
    }

    updateMemoryVisuals() {
        this.memoryBank.innerHTML = '';
        this.addMemoryCard('STATUS', 'ONLINE');
        this.addMemoryCard('MODEL', 'GEMINI-PRO');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.agent = new GeminiAgent();
});
