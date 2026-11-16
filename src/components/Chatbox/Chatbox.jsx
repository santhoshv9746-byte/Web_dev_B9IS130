
import React, { useContext, useEffect, useState } from 'react';
import './Chatbox.css';
import assets from '../../assets/assets';

import { doc, getDoc, updateDoc, arrayUnion, onSnapshot, runTransaction } from 'firebase/firestore';

import { toast } from 'react-toastify';
import { auth, db } from '../../config/firebase';
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

  const [editingId, setEditingId] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

  const saveEditedMessage = async () => {

    const newText = editedText.trim();

    if (
      !newText ||
      !editingId ||
      !messagesId ||
      savingEdit
    ) {
      return;
    }

    if (auth.currentUser?.uid !== userData?.id) {
      toast.error('Please log in again');
      return;
    }

    setSavingEdit(true);

    try {

      const messageRef = doc(db, 'messages', messagesId);
      let isLatestMessage = false;

      await runTransaction(db, async (transaction) => {

        const snapshot = await transaction.get(messageRef);

        if (!snapshot.exists()) {
          throw new Error('Conversation not found');
        }

        const storedMessages = snapshot.data().messages || [];

        const index = storedMessages.findIndex(
          (message) => message.id === editingId
        );

        if (index === -1) {
          throw new Error('Message not found');
        }

        const originalMessage = storedMessages[index];

        if (
          originalMessage.sId !== auth.currentUser?.uid ||
          originalMessage.image
        ) {
          throw new Error('You cannot edit this message');
        }

        isLatestMessage = index === storedMessages.length - 1;

        const updatedMessages = storedMessages.map((message) =>
          message.id === editingId
            ? {
              ...message,
              text: newText,
              editedAt: new Date()
            }
            : message
        );

        transaction.update(messageRef, {
          messages: updatedMessages
        });
      });

      setEditingId(null);
      setEditedText('');

      toast.success('Message updated successfully');

      if (isLatestMessage) {
        try {
          await updateChatSummaries(newText.slice(0, 30));
        } catch (error) {
          console.error('Chat preview update error:', error);
        }
      }

    } catch (error) {
      console.error('Error editing message:', error);
      toast.error(error.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteMessage = async (messageId) => {

    if (!messageId || !messagesId || deletingId) {
      return;
    }

    if (auth.currentUser?.uid !== userData?.id) {
      toast.error('Please log in again');
      return;
    }

    const confirmed = window.confirm(
      'Delete this message for everyone?'
    );

    if (!confirmed) return;

    setDeletingId(messageId);

    try {
      const messageRef = doc(db, 'messages', messageId);

      let wasLatestMessage = false;
      let nextPreview = '';


      await runTransaction(db, async (transaction) => {

        const snapshot = await transaction.get(messageRef);

        if (!snapshot.exists()) {
          throw new Error('Conversation not found');
        }

        const storedMessages = snapshot.data().messages || [];

        const index = storedMessages.findIndex(
          (message) => message.id === messageId
        );

        if (index === -1) {
          throw new Error('Message not found');
        }

        const selectedMessage = storedMessages[index];

        if (
          selectedMessage.sId !== auth.currentUser?.uid ||
          selectedMessage.image
        ) {
          throw new Error('You cannot delete this message');
        }

        wasLatestMessage = index === storedMessages.length - 1;

        const updatedMessages = storedMessages.filter(
          (message) => message.id !== messageId
        );

        const lastMessage =
          updatedMessages[updatedMessages.length - 1];

        nextPreview = lastMessage
          ? lastMessage.image
            ? 'Image'
            : (lastMessage.text || '').slice(0, 30)
          : '';


        transaction.update(messageRef, {
          messages: updatedMessages
        });
      });

      toast.success('Message deleted successfully');

    if (wasLatestMessage) {
      try {
        await updateChatSummaries(nextPreview);
      } catch (error) {
        console.error('Chat preview update error:', error);
      }
    }

    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error(error.message);
    } finally {
      setDeletingId(null);
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
            id: crypto.randomUUID(),
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
            id: crypto.randomUUID(),
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

      return () => unsubscribe();

    }, [messagesId, setMessages]);

    useEffect(() => {
      setEditingId(null);
      setEditedText('');
    }, [messagesId]);

    return chatUser?.userData && userData ? (

      <div className={`chat-box ${chatVisible ? '' : 'hidden'}`}>

        <div className="chat-user">

          <img
            src={chatUser.userData.avatar || assets.avatar_icon}
            alt="User"
          />

          <p>
            {chatUser.userData.name || chatUser.userData.username}

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
              key={msg.id || index}
              className={msg.sId === userData.id ? 's-msg' : 'r-msg'}
            >

              {msg.image ? (

                <img
                  className="msg-img"
                  src={msg.image}
                  alt="Shared image"
                />

              ) : editingId === msg.id && msg.id ? (

                <div className="message-editor">

                  <input
                    type="text"
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    maxLength={1000}
                    disabled={savingEdit}
                  />

                  <div className="message-edit-actions">

                    <button
                      type="button"
                      onClick={saveEditedMessage}
                      disabled={savingEdit || !editedText.trim()}
                    >
                      {savingEdit ? 'Saving...' : 'Save'}
                    </button>

                    <button
                      type="button"
                      disabled={savingEdit}
                      onClick={() => {
                        setEditingId(null);
                        setEditedText('');
                      }}
                    >
                      Cancel
                    </button>

                  </div>

                </div>

              ) : (

                <p className="msg">
                  {msg.text}
                  {msg.editedAt ? ' (edited)' : ''}
                </p>

              )}

              {msg.sId === userData.id &&
                msg.id &&
                !msg.image &&
                editingId !== msg.id && (

                  <button
                    type="button"
                    className="edit-message-btn"
                    disabled={savingEdit}
                    onClick={() => {
                      setEditingId(msg.id);
                      setEditedText(msg.text || '');
                    }}
                  >
                    Edit
                  </button>

                )}

              <div>

                <img
                  src={
                    (msg.sId === userData.id
                      ? userData.avatar
                      : chatUser.userData.avatar) || assets.avatar_icon
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
