
import React, { useContext, useState } from 'react';
import './LeftSidebar.css';
import assets from '../../assets/assets';

import { useNavigate } from 'react-router-dom';
import { collection,doc,getDocs,query,where,serverTimestamp,runTransaction } from 'firebase/firestore';

import { AppContext } from '../../context/AppContext';
import { auth, db, logout } from '../../config/firebase';
import { toast } from 'react-toastify';

const LeftSidebar = () => {

  const navigate = useNavigate();

  const {
    userData,
    chatData,
    setChatUser,
    setMessagesId,
    messagesId,
    chatVisible,
    setChatVisible
  } = useContext(AppContext);

  const [user, setUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [adding, setAdding] = useState(false);

  const inputHandler = async (e) => {

    const input = e.target.value.trim().toLowerCase();

    setSearchText(input);
    setShowSearch(Boolean(input));
    setUser(null);

    if (!input || !userData) return;

    try {
      const q = query(
        collection(db, 'users'),
        where('username', '==', input)
      );

      const querySnap = await getDocs(q);

      const foundUser = querySnap.docs
        .map((item) => item.data())
        .find((item) =>
          item.id !== userData.id &&
          !chatData.some((chat) => chat.rId === item.id)
        );

      const currentSearch = document.getElementById('chat-search');

      if (currentSearch?.value.trim().toLowerCase() === input) {
        setUser(foundUser || null);
      }

    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.message);
    }
  };

  const setChat = async (item) => {

    if (!userData || !item?.messageId) return;

    setMessagesId(item.messageId);
    setChatUser(item);
    setChatVisible(true);

    try {
      const chatsRef = doc(db, 'chats', userData.id);

      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(chatsRef);

        if (!snapshot.exists()) return;

        const data = snapshot.data();
        const chats = data.chatsData ?? data.chatData ?? [];

        const updatedChats = chats.map((chat) =>
          chat.messageId === item.messageId
            ? { ...chat, messageSeen: true }
            : chat
        );

        transaction.set(
          chatsRef,
          { chatsData: updatedChats },
          { merge: true }
        );
      });

    } catch (error) {
      console.error('Chat selection error:', error);
      toast.error(error.message);
    }
  };

  const addChat = async () => {

    if (!user || !userData || adding || !auth.currentUser) {
      return;
    }

    setAdding(true);

    try {
      const myRef = doc(db, 'chats', userData.id);
      const otherRef = doc(db, 'chats', user.id);
      const newMessageRef = doc(collection(db, 'messages'));

      const chatItem = await runTransaction(
        db,
        async (transaction) => {

          const mySnap = await transaction.get(myRef);
          const otherSnap = await transaction.get(otherRef);

          const myData = mySnap.data() || {};
          const otherData = otherSnap.data() || {};

          const myChats =
            myData.chatsData ?? myData.chatData ?? [];

          const otherChats =
            otherData.chatsData ?? otherData.chatData ?? [];

          const existingChat = myChats.find(
            (chat) => chat.rId === user.id
          );

          if (existingChat) {
            return existingChat;
          }

          const now = Date.now();

          const myChat = {
            messageId: newMessageRef.id,
            lastMessage: '',
            rId: user.id,
            updatedAt: now,
            messageSeen: true
          };

          const otherChat = {
            messageId: newMessageRef.id,
            lastMessage: '',
            rId: userData.id,
            updatedAt: now,
            messageSeen: true
          };

          transaction.set(newMessageRef, {
            createdAt: serverTimestamp(),
            messages: []
          });

          transaction.set(
            myRef,
            { chatsData: [...myChats, myChat] },
            { merge: true }
          );

          transaction.set(
            otherRef,
            { chatsData: [...otherChats, otherChat] },
            { merge: true }
          );

          return myChat;
        }
      );

      await setChat({
        ...chatItem,
        userData: user
      });

      setShowSearch(false);
      setSearchText('');
      setUser(null);

    } catch (error) {
      console.error('Add chat error:', error);
      toast.error(error.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={`ls ${chatVisible ? 'hidden' : ''}`}>

      <div className="ls-top">

        <div className="ls-nav">
          <img
            src={assets.logo}
            className="logo"
            alt="Chat App"
          />

          <div className="menu">
            <img src={assets.menu_icon} alt="Menu" />

            <div className="sub-menu">
              <p onClick={() => navigate('/profile')}>
                Edit Profile
              </p>

              <hr />

              <p onClick={() => logout()}>
                Logout
              </p>
            </div>
          </div>
        </div>

        <div className="ls-search">
          <img src={assets.search_icon} alt="Search" />

          <input
            id="chat-search"
            onChange={inputHandler}
            value={searchText}
            type="text"
            placeholder="Search username..."
          />
        </div>
      </div>

      <div className="ls-list">

        {showSearch ? (
          user ? (
            <div
              onClick={addChat}
              className="friends add-user"
              style={{
                opacity: adding ? 0.6 : 1,
                pointerEvents: adding ? 'none' : 'auto'
              }}
            >
              <img
                src={user.avatar || assets.avatar_icon}
                alt="User"
              />
              <p>{user.name || user.username}</p>
            </div>
          ) : (
            <p style={{ padding: '15px', fontSize: '12px' }}>
              No new user found
            </p>
          )
        ) : (
          chatData.map((item) => (
            <div
              onClick={() => setChat(item)}
              key={item.messageId}
              className={`friends ${
                item.messageSeen ||
                item.messageId === messagesId
                  ? ''
                  : 'border'
              }`}
            >
              <img
                src={item.userData?.avatar || assets.avatar_icon}
                alt="Profile"
              />

              <div>
                <p>
                  {item.userData?.name ||
                   item.userData?.username ||
                   'User'}
                </p>

                <span>{item.lastMessage}</span>
              </div>
            </div>
          ))
        )}

      </div>
    </div>
  );
};

export default LeftSidebar;
