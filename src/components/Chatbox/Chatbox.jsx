
import React, { useContext, useEffect, useState } from 'react';
import './Chatbox.css';
import assets from '../../assets/assets';

import { doc, getDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';

import { toast } from 'react-toastify';
import { db } from '../../config/firebase';
import { AppContext } from '../../context/AppContext';
import uploadToCloudinary from '../../config/upload';

const Chatbox = () => {

  const {
    userData,
    messagesId,
    chatUser,
    messages,
    setMessages,
    chatVisible,
    setChatVisible,
    isChatUserOnline
  } = useContext(AppContext);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const updateChatSummaries = async (lastMessage) => {

    const userIDs = [...new Set([
      userData.id,
      chatUser.rId
    ])];

    for (const id of userIDs) {

      const userChatsRef = doc(db, 'chats', id);
      const userChatsSnapshot = await getDoc(userChatsRef);

      if (!userChatsSnapshot.exists()) {
        continue;
      }

      const data = userChatsSnapshot.data();

      const chats = data.chatsData ?? data.chatData ?? [];

      const chatIndex = chats.findIndex(
        (chat) => chat.messageId === messagesId
      );

      if (chatIndex === -1) {
        continue;
      }

      const updatedChats = chats.map((chat, index) => {

        if (index !== chatIndex) {
          return chat;
        }

        return {
          ...chat,
          lastMessage,
          updatedAt: Date.now(),
          messageSeen: id === userData.id
        };
      });

      await updateDoc(userChatsRef, {
        chatsData: updatedChats
      });
    }
  };

  const sendMessage = async () => {

    const text = input.trim();

    if (
      !text ||
      !messagesId ||
      !userData?.id ||
      !chatUser?.rId ||
      sending
    ) {
      return;
    }

    setSending(true);

    try {

      await updateDoc(doc(db, 'messages', messagesId), {
        messages: arrayUnion({
          sId: userData.id,
          text: text,
          createdAt: new Date()
        })
      });

      setInput('');

      await updateChatSummaries(text.slice(0, 30));

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const sendImage = async (event) => {

    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!messagesId || !userData?.id || !chatUser?.rId) {
      toast.error('Please select a conversation first');
      return;
    }

    if (uploading) {
      return;
    }

    setUploading(true);

    try {

      const fileUrl = await uploadToCloudinary(file);

      await updateDoc(doc(db, 'messages', messagesId), {
        messages: arrayUnion({
          sId: userData.id,
          image: fileUrl,
          createdAt: new Date()
        })
      });

      await updateChatSummaries('Image');

      toast.success('Image sent successfully');

    } catch (error) {
      console.error('Error sending image:', error);
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const convertTimestamp = (timestamp) => {

    if (!timestamp) {
      return '';
    }

    const date = typeof timestamp.toDate === 'function'
      ? timestamp.toDate()
      : new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  useEffect(() => {

    if (!messagesId) {
      setMessages([]);
      return;
    }

    const messageRef = doc(db, 'messages', messagesId);

    const unsubscribe = onSnapshot(
      messageRef,
      (snapshot) => {

        const storedMessages = snapshot.data()?.messages ?? [];

        setMessages([...storedMessages].reverse());
      },
      (error) => {
        console.error('Message listener error:', error);
        toast.error('Unable to load messages');
      }
    );

    return () => {
      unsubscribe();
    };

  }, [messagesId, setMessages]);

  return chatUser?.userData && userData ? (

    <div className={`chat-box ${chatVisible ? '' : 'hidden'}`}>

      <div className="chat-user">

        <img
          src={chatUser.userData.avatar || assets.avatar_icon}
          alt="User"
        />

        <p>
          {chatUser.userData.name}

          {isChatUserOnline ? (
            <img
              className="dot"
              src={assets.green_dot}
              alt="Online"
            />
          ) : null}
        </p>

        <img
          src={assets.help_icon}
          className="help"
          alt="Help"
        />

        <img
          onClick={() => setChatVisible(false)}
          src={assets.arrow_icon}
          className="arrow"
          alt="Back"
        />

      </div>

      <div className="chat-msg">

        {messages.map((msg, index) => (

          <div
            key={index}
            className={msg.sId === userData.id ? 's-msg' : 'r-msg'}
          >

            {msg.image ? (

              <img
                className="msg-img"
                src={msg.image}
                alt="Shared image"
              />

            ) : (

              <p className="msg">{msg.text}</p>

            )}

            <div>

              <img
                src={
                  msg.sId === userData.id
                    ? userData.avatar
                    : chatUser.userData.avatar
                }
                alt="Profile"
              />

              <p>
                {convertTimestamp(
                  msg.createdAt || msg.createAt
                )}
              </p>

            </div>

          </div>

        ))}

      </div>

      <div className="chat-input">

        <input
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              sendMessage();
            }
          }}
          value={input}
          type="text"
          placeholder="Send a message"
        />

        <input
          onChange={sendImage}
          type="file"
          id="image"
          accept="image/png,image/jpeg"
          hidden
          disabled={uploading}
        />

        <label htmlFor="image">
          <img
            src={assets.gallery_icon}
            alt="Upload image"
          />
        </label>

        <img
          onClick={sendMessage}
          src={assets.send_button}
          alt="Send"
        />

      </div>

    </div>

  ) : (

    <div className={`chat-welcome ${chatVisible ? '' : 'hidden'}`}>

      <img
        src={assets.logo_icon}
        alt="Chat App"
      />

      <p>Chat anytime, anywhere</p>

    </div>

  );
};

export default Chatbox;
