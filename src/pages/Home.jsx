// src/pages/Home.jsx
import { useState } from 'react';
import {
  doc, setDoc, getDoc, serverTimestamp, collection
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth.jsx';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

function getConversationId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

export default function Home() {
  const { user } = useAuth();
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeOtherUser, setActiveOtherUser] = useState(null);

  const handleSelectChat = (chatId, otherUser) => {
    setActiveChatId(chatId);
    setActiveOtherUser(otherUser);
  };

  const handleNewChat = async (otherUser) => {
    if (!otherUser?.uid) return;
    
    try {
      const convId = getConversationId(user.uid, otherUser.uid);
      const convRef = doc(db, 'conversations', convId);
      const snap = await getDoc(convRef);

      if (!snap.exists()) {
        await setDoc(convRef, {
          participants: [user.uid, otherUser.uid],
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
          lastMessage: '',
        });
      }

      setActiveChatId(convId);
      setActiveOtherUser(otherUser);
    } catch (err) {
      console.error("Failed to start new chat:", err);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />
      <ChatWindow chatId={activeChatId} otherUser={activeOtherUser} />
    </div>
  );
}