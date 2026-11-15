import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { createContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = (props) => {

    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [chatData, setChatData] = useState([]);
    const [messagesId, setMessagesId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatUser, setChatUser] = useState(null);
    const [chatVisible, setChatVisible] = useState(false);

    const loadUserData = async (uid) => {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
                console.error("User profile not found in Firestore.");
                return;
            }

            const userData = userSnap.data();
            setUserData(userData);

            if (userData.avatar && userData.name) {
                navigate('/chat');
            }
            else {
                navigate('/profile')
            }
            await updateDoc(userRef, {
                lastSeen: Date.now()
            })
            useEffect(() => {
    if (!userData?.id) return;

    const userRef = doc(db, 'users', userData.id);

    const interval = setInterval(async () => {
        if (auth.currentUser?.uid === userData.id) {
            try {
                await updateDoc(userRef, {
                    lastSeen: Date.now()
                });
            } catch (error) {
                console.error('Error updating online status:', error);
            }
        }
    }, 60000);

    return () => clearInterval(interval);

}, [userData?.id]);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    useEffect(() => {
        if (userData) {
            const chatRef = doc(db, 'chats', userData.id);
            const unSub = onSnapshot(chatRef, async (res) => {
                const chatItems = res.data()?.chatsData ?? res.data()?.chatData ?? [];
                console.log(res.data());
                const tempData = [];
                for (const item of chatItems) {
                    const userRef = doc(db, 'users', item.rId);
                    const userSnap = await getDoc(userRef);
                    const userData = userSnap.data();
                    tempData.push({ ...item, userData })
                }
                setChatData(tempData.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
                )
                );
            })
            return () => {
                unSub();
            }

        }
    }, [userData])

    const value = {
        userData, setUserData,
        chatData, setChatData,
        loadUserData,
        messages, setMessages,
        messagesId, setMessagesId,
        chatUser, setChatUser,
        chatVisible, setChatVisible
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}

export default AppContextProvider