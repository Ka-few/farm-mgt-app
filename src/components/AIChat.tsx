import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { MessageSquare, Send, X, Bot, User, Sparkles } from 'lucide-react';
import '../styles/AIChat.css';

interface Message {
    role: 'user' | 'assistant' | 'tool';
    content: string;
}

import { useToast } from '../context/ToastContext';

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

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
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
        } catch (error) {
            console.error('AI Chat Error:', error);
            addToast(`AI Error: ${error}`, 'error');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Error: ${error}. Make sure Ollama is running and Llama 3.1 is installed.`
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
                        <button className="close-chat-btn" onClick={() => setIsOpen(false)}>
                            <X size={20} />
                        </button>
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

                    <div className="chat-input-area">
                        <input
                            type="text"
                            placeholder="Ask something..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isLoading}
                        />
                        <button className="send-btn" onClick={handleSend} disabled={isLoading}>
                            <Send size={18} />
                        </button>
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
