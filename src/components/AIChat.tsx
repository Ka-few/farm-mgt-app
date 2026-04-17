import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { MessageSquare, Send, X, Bot, User, Sparkles, Trash2, Zap } from 'lucide-react';
import '../styles/AIChat.css';

interface Message {
    role: 'user' | 'assistant' | 'tool';
    content: string;
}

import { useToast } from '../context/ToastContext';

const SUGGESTED_PROMPTS = [
    "List my workers",
    "Show me all livestock",
    "Recent expenses",
    "Irrigation status",
    "Crop harvesting plan"
];

const AIChat: React.FC = () => {
    const { addToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const clearMessages = () => {
        setMessages([]);
        addToast('Chat history cleared', 'info');
    };

    const handleSuggestionClick = (prompt: string) => {
        setInput(prompt);
        // We delay sending slightly to allow the user to see the input population if they want, 
        // but here we just send it immediately for a punchy UX
        setTimeout(() => handleSend(prompt), 100);
    };

    const handleSend = async (customInput?: string) => {
        const messageText = customInput || input;
        if (!messageText.trim() || isLoading) return;

        // Diagnostic: Check if we are in a Tauri environment
        if (typeof window === 'undefined' || !(window as any).__TAURI_INTERNALS__) {
            addToast('Tauri IPC not found. Make sure you are running via "npm run tauri dev"', 'error');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Error: Tauri environment not detected. Please run the app using "npm run tauri dev".'
            }]);
            return;
        }

        const userMessage: Message = { role: 'user', content: messageText };
        setMessages(prev => [...prev, userMessage]);
        if (!customInput) setInput('');
        setIsLoading(true);

        try {
            const response = await invoke<any>('chat_with_ai', {
                history: [...messages, userMessage].map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            });

            // Check if tool calls were made and notify user
            if (response.message.tool_calls && response.message.tool_calls.length > 0) {
                response.message.tool_calls.forEach((call: any) => {
                    addToast(`AI is calling tool: ${call.function.name}`, 'info', 3000);
                });
            }

            const aiMessage: Message = {
                role: 'assistant',
                content: response.message.content
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error: any) {
            console.error('AI Chat Error:', error);

            let errorMsg = error.toString();
            if (errorMsg.includes('command chat_with_ai not found')) {
                errorMsg = 'Command "chat_with_ai" not found. Check if it is allowed in capabilities/default.json';
            }

            addToast(`AI Error: ${errorMsg}`, 'error');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Error: ${errorMsg}. Make sure Ollama is running and Llama 3.1 is installed.`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="ai-chat-container">
            {isOpen && (
                <div className="ai-chat-window glass">
                    <div className="chat-header">
                        <h3><Sparkles size={18} className="text-accent" /> Farm Assistant</h3>
                        <div className="header-actions">
                            <button className="clear-chat-btn" onClick={clearMessages} title="Clear history">
                                <Trash2 size={18} />
                            </button>
                            <button className="close-chat-btn" onClick={() => setIsOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {messages.length === 0 && (
                            <div className="message message-ai">
                                Hello! I'm your Farm AI. How can I help you today?
                                <br /><br />
                                Try asking:
                                <ul>
                                    <li>"List my workers"</li>
                                    <li>"How much was our total expense today?"</li>
                                    <li>"Show me all livestock"</li>
                                </ul>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`message ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
                                <div className="message-icon">
                                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                </div>
                                <div className="message-content">{msg.content}</div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="typing-indicator">
                                <Sparkles size={14} className="animate-pulse" /> Assistant is thinking...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-footer">
                        <div className="suggestions-row">
                            {SUGGESTED_PROMPTS.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    className="suggestion-bubble"
                                    onClick={() => handleSuggestionClick(prompt)}
                                    disabled={isLoading}
                                >
                                    <Zap size={12} /> {prompt}
                                </button>
                            ))}
                        </div>
                        <div className="chat-input-area">
                            <input
                                type="text"
                                placeholder="Ask something..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                disabled={isLoading}
                            />
                            <button className="send-btn" onClick={() => handleSend()} disabled={isLoading}>
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button className="chat-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
        </div>
    );
};

export default AIChat;
