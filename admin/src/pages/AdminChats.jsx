import React, { useState, useEffect } from 'react';
import './AdminChats.css';

const API = import.meta.env.VITE_API_URL;

const AdminChats = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'Sell' | 'Rent'

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `${API}/${imagePath.replace(/^\//, "")}`;
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/admin/chats?limit=50', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      if (res.ok) setChats(data.conversations || []);
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (chat) => {
    setSelectedChat(chat);
    setMsgLoading(true);
    setMessages([]);
    try {
      const res = await fetch(`/api/admin/chats/${chat._id}/messages`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      if (res.ok) setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setMsgLoading(false);
    }
  };

  const closeChat = () => {
    setSelectedChat(null);
    setMessages([]);
  };

  const filteredChats = chats.filter(c => {
    const term = searchTerm.toLowerCase();
    const buyerName = c.buyerId?.name?.toLowerCase() || '';
    const sellerName = c.sellerId?.name?.toLowerCase() || '';
    const propTitle = c.propertyId?.adInfo?.title?.toLowerCase() || '';
    
    const matchesSearch = buyerName.includes(term) || sellerName.includes(term) || propTitle.includes(term);
    const matchesType = filterType === 'all' || c.propertyId?.purpose === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="admin-chats-container">
      <div className="admin-chats-header">
        <div className="admin-chats-header-top">
            <div>
                <h2>Chat Monitor</h2>
                <p>Monitor buyer and seller communications for safety and quality assurance.</p>
            </div>
            <div className="admin-chats-tabs">
                <button className={`chat-filter-btn ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>All</button>
                <button className={`chat-filter-btn ${filterType === 'Sell' ? 'active' : ''}`} onClick={() => setFilterType('Sell')}>Sale</button>
                <button className={`chat-filter-btn ${filterType === 'Rent' ? 'active' : ''}`} onClick={() => setFilterType('Rent')}>Rent</button>
            </div>
        </div>
      </div>

      <div className="admin-chats-main">
        <div className={`admin-chats-list ${selectedChat ? 'shrink' : ''}`}>
          <div className="admin-chats-toolbar">
            <input 
              type="text" 
              placeholder="Search by user or property name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-chats-search"
            />
          </div>

          {loading ? (
             <div className="admin-loading">Loading conversations...</div>
          ) : filteredChats.length === 0 ? (
             <div className="admin-empty">No conversations found.</div>
          ) : (
            <div className="admin-chats-grid">
              {filteredChats.map(chat => (
                <div 
                  key={chat._id} 
                  className={`admin-chat-card ${selectedChat?._id === chat._id ? 'active' : ''}`}
                  onClick={() => openChat(chat)}
                >
                  <div className="chat-card-body">
                      {chat.propertyId?.media?.images?.[0] && (
                          <div className="chat-card-image-wrap">
                              <img 
                                  src={getImageUrl(chat.propertyId.media.images[0])} 
                                  alt="Property" 
                                  className="chat-card-img" 
                                  onError={(e) => { e.target.src = "https://via.placeholder.com/80?text=No+Image"; }}
                              />
                              <span className={`chat-card-purpose-badge ${chat.propertyId.purpose === 'Rent' ? 'rent' : 'sell'}`}>
                                  {chat.propertyId.purpose === 'Rent' ? 'Rent' : 'Sale'}
                              </span>
                          </div>
                      )}
                      <div className="chat-card-info-content">
                          <div className="chat-card-title">
                             <strong>{chat.propertyId?.adInfo?.title || 'Unknown Property'}</strong>
                             {chat.propertyId && (
                                <div className="chat-card-sub-info">
                                   {chat.propertyId.location?.city} • {chat.propertyId.propertyType?.subCategory}
                                   <span className="chat-card-price">PKR {chat.propertyId.price?.value?.toLocaleString()}</span>
                                </div>
                             )}
                          </div>
                          <div className="chat-card-users">
                             <span className="user-badge buyer">Buyer: {chat.buyerId?.name || 'Unknown'}</span>
                             <span className="user-badge flex-spacer">⇄</span>
                             <span className="user-badge seller">Seller: {chat.sellerId?.name || 'Unknown'}</span>
                          </div>
                          <div className="chat-card-footer">
                             Last activity: {new Date(chat.updatedAt).toLocaleDateString()}
                          </div>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedChat && (
          <div className="admin-chat-viewer">
            <div className="chat-viewer-header">
              <div className="chat-viewer-info">
                  <h3>
                     <a 
                        href={`http://localhost:5173/properties/${selectedChat.propertyId?._id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="viewer-property-link"
                        title="View Property on Main Site"
                     >
                        {selectedChat.propertyId?.adInfo?.title || 'Unknown Property'}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginLeft: '6px', display: 'inline-block', verticalAlign: 'middle'}}>
                           <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                           <polyline points="15 3 21 3 21 9"></polyline>
                           <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                     </a>
                  </h3>
                  <div className="chat-context">
                      <span className="viewer-price">PKR {selectedChat.propertyId?.price?.value?.toLocaleString()}</span>
                      &nbsp;•&nbsp; {selectedChat.propertyId?.location?.city}
                  </div>
                  <div className="chat-context mt-1">
                      <strong>Buyer:</strong> {selectedChat.buyerId?.name} &nbsp;|&nbsp; 
                      <strong>Seller:</strong> {selectedChat.sellerId?.name}
                  </div>
              </div>
              <button className="chat-close-btn" onClick={closeChat}>×</button>
            </div>
            
            <div className="chat-viewer-messages">
                {msgLoading ? (
                    <div className="admin-loading mt">Loading message history...</div>
                ) : messages.length === 0 ? (
                    <div className="admin-empty mt">No messages in this conversation.</div>
                ) : (
                    messages.map((m, idx) => {
                        const isBuyer = m.senderId?._id === selectedChat.buyerId?._id;
                        return (
                            <div key={idx} className={`admin-msg-bubble ${isBuyer ? 'buyer-msg' : 'seller-msg'}`}>
                                <div className="admin-msg-header">
                                    <span className="admin-msg-sender">{m.senderId?.name} ({m.senderId?.role})</span>
                                    <span className="admin-msg-time">{new Date(m.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="admin-msg-content">{m.content}</div>
                            </div>
                        )
                    })
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChats;
