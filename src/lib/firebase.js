// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgeqDbmMUJFFAgZVlZfB1QKEkZkm6zf3A",
  authDomain: "whisperchat-843a9.firebaseapp.com",
  projectId: "whisperchat-843a9",
  storageBucket: "whisperchat-843a9.firebasestorage.app",
  messagingSenderId: "251745606967",
  appId: "1:251745606967:web:159c2d12cbceab9e104eb2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();