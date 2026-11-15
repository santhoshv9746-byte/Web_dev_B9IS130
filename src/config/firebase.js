
import { initializeApp } from "firebase/app";

import {createUserWithEmailAndPassword,getAuth,sendPasswordResetEmail,signInWithEmailAndPassword,signOut} from "firebase/auth";

import {getFirestore,doc,setDoc,updateDoc} from "firebase/firestore";

import { toast } from "react-toastify";

const firebaseConfig = {
    apiKey: "AIzaSyAZ7KsncVmUWYSJFWJNh9dJ_ejYAoO__xw",
    authDomain: "chat-app-gs-9c535.firebaseapp.com",
    projectId: "chat-app-gs-9c535",
    storageBucket: "chat-app-gs-9c535.firebasestorage.app",
    messagingSenderId: "299079983326",
    appId: "1:299079983326:web:85817848dfd4e0f120624f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

const signup = async (username, email, password) => {
    try {
        const res = await createUserWithEmailAndPassword(
            auth, email, password
        );

        const user = res.user;

        await setDoc(doc(db, "users", user.uid), {
            id: user.uid,
            username: username.toLowerCase(),
            email,
            name: "",
            avatar: "",
            bio: "Hey, There i am using chat app",
            lastSeen: Date.now()
        });

        await setDoc(doc(db, "chats", user.uid), {
            chatsData: []
        });

        toast.success("Account created successfully!");

    } catch (error) {
        console.error(error);
        toast.error(error.message);
    }
};

const login = async (email, password) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);

    } catch (error) {
        console.error(error);
        toast.error(error.message);
    }
};


const logout = async () => {
    try {
        const user = auth.currentUser;

        if (user) {
            try {
                await updateDoc(doc(db, "users", user.uid), {
                    lastSeen: 0
                });
            } catch (error) {
                console.error("Error updating offline status:", error);
            }
        }

        await signOut(auth);

    } catch (error) {
        console.error(error);
        toast.error(error.message);
    }
};

// Reset password
const resetPass = async (email) => {
    if (!email) {
        toast.error("Please enter your email");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);

        toast.success("Password reset request sent");

    } catch (error) {
        console.error(error);
        toast.error("Unable to process password reset");
    }
};

export { signup, login, logout, resetPass };
