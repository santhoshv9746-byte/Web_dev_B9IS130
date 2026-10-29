import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
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
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const user = res.user;
        
        await setDoc(doc(db, "users", user.uid), {
            id: user.uid,
            username: username.toLowerCase(), // Fixed typo here
            email,
            name: "",
            avatar: "", // This will later be replaced by your Cloudinary image URL!
            bio: "Hey, There i am using chat app",
            lastSeen: Date.now()
        });
        
        await setDoc(doc(db, "chats", user.uid), {
            chatData: []
        });

        toast.success("Account created successfully!");
    } catch (error) {
        console.error(error);
        toast.error(error.code);
    }
}

export { signup };