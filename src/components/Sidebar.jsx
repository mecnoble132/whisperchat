// src/components/Sidebar.jsx
import { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot,
  doc, getDoc, orderBy, limit, getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth.jsx';
import { formatDistanceToNow } from 'date-fns';

export default function Sidebar({ activeChatId, onSelectChat, onNewChat }) {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Listen to conversations the current user is part of
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );
    const unsub = onSnapshot(q, async (snap) => {
      const convos = await Promise.all(
        snap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const otherId = data.participants.find(id => id !== user.uid);
          const otherUserDoc = otherId ? await getDoc(doc(db, 'users', otherId)) : null;
          return {
            id: docSnap.id,
            ...data,
            otherUser: otherUserDoc?.exists()
              ? { ...otherUserDoc.data(), uid: otherUserDoc.id }
              : null,
          };
        })
      );
      setConversations(convos);
    });
    return unsub;
  }, [user]);

  // Search users
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      const q = query(collection(db, 'users'), limit(10));
      const snap = await getDocs(q);
      const results = snap.docs
        .map(d => ({ uid: d.id, ...d.data() }))
        .filter(u =>
          u.uid !== user.uid &&
          (u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
           u.email?.toLowerCase().includes(search.toLowerCase()))
        );
      setSearchResults(results);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, user]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <path d="M4 8C4 6.34315 5.34315 5 7 5H17C18.6569 5 20 6.34315 20 8V14C20 15.6569 18.6569 17 17 17H14L10 20V17H7C5.34315 17 4 15.6569 4 14V8Z" fill="var(--accent)"/>
          </svg>
          <span>whisper</span>
        </div>
        <button className="logout-btn" onClick={logout} title="Sign out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
        </button>
      </div>

      <div className="search-wrapper">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="search-icon">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          className="search-input"
          placeholder="Search people..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <p className="results-label">People</p>
          {searchResults.map(u => (
            <button key={u.uid} className="search-result-item" onClick={() => { onNewChat(u); setSearch(''); }}>
              <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}&background=random`} alt={u.displayName} className="avatar sm" />
              <div>
                <p className="result-name">{u.displayName}</p>
                <p className="result-email">{u.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="conversations-list">
        {conversations.length === 0 && !search && (
          <div className="empty-sidebar">
            <p>No conversations yet.</p>
            <p>Search for someone to start chatting!</p>
          </div>
        )}
        {conversations.map(c => (
          <button
            key={c.id}
            className={`conversation-item ${c.id === activeChatId ? 'active' : ''}`}
            onClick={() => onSelectChat(c.id, c.otherUser)}
          >
            <div className="avatar-wrapper">
              <img
                src={c.otherUser?.photoURL || `https://ui-avatars.com/api/?name=${c.otherUser?.displayName}&background=random`}
                alt={c.otherUser?.displayName}
                className="avatar"
              />
              <span className="online-dot" />
            </div>
            <div className="conversation-info">
              <div className="conversation-top">
                <span className="conversation-name">{c.otherUser?.displayName || 'Unknown'}</span>
                {c.lastMessageAt && (
                  <span className="conversation-time">
                    {formatDistanceToNow(c.lastMessageAt.toDate(), { addSuffix: false })}
                  </span>
                )}
              </div>
              <p className="conversation-preview">{c.lastMessage || 'Start a conversation'}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <img
          src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}`}
          alt={user?.displayName}
          className="avatar sm"
        />
        <span className="current-user-name">{user?.displayName}</span>
      </div>
    </aside>
  );
}