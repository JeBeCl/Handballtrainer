import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAiZOs0weENkQVNSrq9DyT7BmFOLiPTMaQ",
  authDomain: "handballtrainer-b4daf.firebaseapp.com",
  projectId: "handballtrainer-b4daf",
  storageBucket: "handballtrainer-b4daf.firebasestorage.app",
  messagingSenderId: "401098326689",
  appId: "1:401098326689:web:0933786351b3ee4e30e6e0"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
