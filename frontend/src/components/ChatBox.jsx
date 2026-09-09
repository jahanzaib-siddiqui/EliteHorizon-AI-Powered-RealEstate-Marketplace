import React, { useState, useEffect, useRef } from "react";
import "./ChatBox.css";

const API = import.meta.env.VITE_API_URL;

const ChatBox = ({ conversationId, onClose, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editContent, setEditContent] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${API}/api/chat/messages/${conversationId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setMessages(data.messages || []);
                setLoading(false);
                scrollToBottom();
            } catch (err) {
                console.error("Error fetching messages:", err);
                setLoading(false);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds for simplicity

        return () => clearInterval(interval);
    }, [conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API}/api/chat/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ conversationId, content: newMessage })
            });
            const data = await res.json();
            setMessages([...messages, data.message]);
            setNewMessage("");
            scrollToBottom();
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    const handleEditMessage = async (msgId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API}/api/chat/message/${msgId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: editContent })
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(messages.map(m => m._id === msgId ? data.message : m));
                setEditingMessageId(null);
                setEditContent("");
            }
        } catch (err) {
            console.error("Error editing message:", err);
        }
    };

    const handleDeleteMessage = async (msgId) => {
        if (!window.confirm("Delete this message?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API}/api/chat/message/${msgId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setMessages(messages.filter(m => m._id !== msgId));
            }
        } catch (err) {
            console.error("Error deleting message:", err);
        }
    };

    return (
        <div className="chat-box-container">
            <div className="chat-box-header">
                <h3>Chat</h3>
                <button className="chat-close-btn" onClick={onClose}>×</button>
            </div>
            <div className="chat-messages">
                {loading ? (
                    <div className="chat-loading">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="chat-empty">No messages yet. Say hi!</div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg._id} className={`chat-message ${msg.senderId === currentUser.id ? "sent" : "received"}`}>
                            {editingMessageId === msg._id ? (
                                <div className="edit-message-container">
                                    <input 
                                        type="text" 
                                        value={editContent} 
                                        onChange={(e) => setEditContent(e.target.value)} 
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleEditMessage(msg._id)}
                                    />
                                    <div className="edit-actions">
                                        <button onClick={() => handleEditMessage(msg._id)}>Save</button>
                                        <button onClick={() => setEditingMessageId(null)}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="message-content">{msg.content}</div>
                                    <div className="message-time">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {msg.createdAt !== msg.updatedAt && <span className="edited-mark"> (edited)</span>}
                                    </div>
                                    {msg.senderId === currentUser.id && (
                                        <div className="message-actions">
                                            <button className="action-btn edit-btn" title="Edit" onClick={() => { setEditingMessageId(msg._id); setEditContent(msg.content); }}>✎</button>
                                            <button className="action-btn delete-btn" title="Delete" onClick={() => handleDeleteMessage(msg._id)}>🗑</button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default ChatBox;
