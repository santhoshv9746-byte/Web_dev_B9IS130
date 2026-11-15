
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

            const userInfo = userSnap.data();
            setUserData(userInfo);

            if (userInfo.avatar && userInfo.name) {
                navigate('/chat');
            } else {
                navigate('/profile');
            }

            await updateDoc(userRef, {
                lastSeen: Date.now()
            });

        } catch (error) {
            console.error("Error loading user data:", error);
        }
    };

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
                    console.error(
                        "Error updating online status:",
                        error
                    );
                }
            }

        }, 60000);

        return () => clearInterval(interval);

    }, [userData?.id]);

    useEffect(() => {

        if (!userData?.id) {
            setChatData([]);
            return;
        }

        let active = true;

        const chatRef = doc(db, 'chats', userData.id);

        const unsubscribe = onSnapshot(
            chatRef,
            async (snapshot) => {

                try {
                    const chatItems =
                        snapshot.data()?.chatsData ??
                        snapshot.data()?.chatData ??
                        [];

                    const tempData = await Promise.all(
                        chatItems.map(async (item) => {

                            const userRef = doc(
                                db,
                                'users',
                                item.rId
                            );

                            const userSnap = await getDoc(userRef);

                            if (!userSnap.exists()) {
                                return null;
                            }

                            return {
                                ...item,
                                userData: userSnap.data()
                            };
                        })
                    );

                    const sortedChats = tempData
                        .filter(Boolean)
                        .sort(
                            (a, b) =>
                                (b.updatedAt ?? 0) -
                                (a.updatedAt ?? 0)
                        );

                    if (active) {
                        setChatData(sortedChats);
                    }

                } catch (error) {
                    console.error(
                        "Error loading chat data:",
                        error
                    );
                }
            },
            (error) => {
                console.error(
                    "Chat listener error:",
                    error
                );
            }
        );
        return () => {
            active = false;
            unsubscribe();
        };
    }, [userData?.id]);

    const value = {
        userData,
        setUserData,
        chatData,
        setChatData,
        loadUserData,
        messages,
        setMessages,
        messagesId,
        setMessagesId,
        chatUser,
        setChatUser,
        chatVisible,
        setChatVisible
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;
