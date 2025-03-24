import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAMvrkis7CNXem8fqUIhjKWqAtBVlL5YoE",
  authDomain: "chat2-32e4a.firebaseapp.com",
  projectId: "chat2-32e4a",
  storageBucket: "chat2-32e4a.appspot.com",
  messagingSenderId: "67524898370",
  appId: "1:67524898370:web:95b69f318c3f0b0a9147db",
  measurementId: "G-NGEG3KFJTD"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const storage = getStorage();
export const db = getFirestore()
