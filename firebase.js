import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAIjG815pzd8SmLoNsFBbO-CK61U-bqnhU",
  authDomain: "maureen-massage-booking.firebaseapp.com",
  projectId: "maureen-massage-booking",
  storageBucket: "maureen-massage-booking.firebasestorage.app",
  messagingSenderId: "763430446289",
  appId: "1:763430446289:web:c98a2d061715b087c791f0",
  measurementId: "G-CY4HYW7FXH"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
