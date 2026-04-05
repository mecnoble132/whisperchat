// src/components/ChatWindow.jsx
import { useState, useEffect, useRef } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, setDoc, getDoc, updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth.jsx';
import { format } from 'date-fns';

function getConversationId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

export default function ChatWindow({ chatId, otherUser, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeout = useRef(null);

  // Listen to messages
  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, 'conversations', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [chatId]);

  // Listen for other user typing
  useEffect(() => {
    if (!chatId || !otherUser) return;
    const typingRef = doc(db, 'conversations', chatId, 'typing', otherUser.uid);
    const unsub = onSnapshot(typingRef, snap => {
      if (snap.exists()) {
        const data = snap.data();
        const age = Date.now() - (data.updatedAt?.toMillis?.() || 0);
        setIsTyping(data.isTyping && age < 4000);
      } else {
        setIsTyping(false);
      }
    });
    return unsub;
  }, [chatId, otherUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleTyping = () => {
    if (!chatId) return;
    const typingRef = doc(db, 'conversations', chatId, 'typing', user.uid);
    setDoc(typingRef, { isTyping: true, updatedAt: serverTimestamp() });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setDoc(typingRef, { isTyping: false, updatedAt: serverTimestamp() });
    }, 2500);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !chatId) return;

    const text = input.trim();
    setInput('');

    // Clear typing indicator
    const typingRef = doc(db, 'conversations', chatId, 'typing', user.uid);
    setDoc(typingRef, { isTyping: false, updatedAt: serverTimestamp() });

    // Add message
    await addDoc(collection(db, 'conversations', chatId, 'messages'), {
      text,
      senderId: user.uid,
      senderName: user.displayName,
      senderPhoto: user.photoURL,
      createdAt: serverTimestamp(),
    });

    // Update conversation metadata
    await updateDoc(doc(db, 'conversations', chatId), {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    // Handle cases where timestamp isn't resolved yet
    let dateKey = 'Just now';
    if (msg.createdAt) {
      dateKey = format(msg.createdAt.toDate(), 'MMMM d, yyyy');
    }
    
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  if (!chatId) {
    return (
      <div className="chat-empty">
        <div className="chat-empty-inner">
          <div className="chat-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
              <path d="M8 9.5l-2 2 2 2m8-4l2 2-2 2M12 4v16m8-16H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" />
            </svg>
          </div>
          <h2>Your messages</h2>
          <p>Search for someone above to start a private conversation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <button className="back-btn" onClick={onBack} aria-label="Back to sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <img
          src={otherUser?.photoURL || `https://ui-avatars.com/api/?name=${otherUser?.displayName}`}
          alt={otherUser?.displayName}
          className="avatar sm"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="chat-header-name">{otherUser?.displayName}</p>
          <p className="chat-header-status">{isTyping ? 'typing...' : otherUser?.email}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="date-divider"><span>{date}</span></div>
            {msgs.map((msg, i) => {
              const isOwn = msg.senderId === user.uid;
              const prevMsg = msgs[i - 1];
              const isFirst = !prevMsg || prevMsg.senderId !== msg.senderId;
              return (
                <div key={msg.id} className={`message-row ${isOwn ? 'own' : 'other'}`}>
                  {!isOwn && (
                    <img
                      src={msg.senderPhoto || `https://ui-avatars.com/api/?name=${msg.senderName}`}
                      alt={msg.senderName}
                      className={`avatar sm msg-avatar ${isFirst ? '' : 'invisible'}`}
                    />
                  )}
                  <div className={`bubble ${isOwn ? 'own' : ''} ${isFirst ? 'first' : ''}`}>
                    <p>{msg.text}</p>
                    {msg.createdAt && (
                      <span className="msg-time">{format(msg.createdAt.toDate(), 'h:mm a')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="message-row other">
            <img
              src={otherUser?.photoURL || `https://ui-avatars.com/api/?name=${otherUser?.displayName}`}
              alt=""
              className="avatar sm msg-avatar"
            />
            <div className="bubble typing-bubble">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className="chat-input-bar" onSubmit={sendMessage}>
        <input
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={e => { setInput(e.target.value); handleTyping(); }}
          placeholder={`Message ${otherUser?.displayName || ''}...`}
          autoComplete="off"
        />
        <button type="submit" className="send-btn" disabled={!input.trim()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  );
}