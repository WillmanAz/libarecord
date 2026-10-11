import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Isi dari Firebase Console > Project settings > Your apps > Web app
const firebaseConfig = {
  apiKey: "AIzaSyBZ7534dhU9IgoVmgs_HmYsPLXCJHJ1lO0",
  authDomain: "libarecord.firebaseapp.com",
  projectId: "libarecord",
  storageBucket: "libarecord.firebasestorage.app",
  messagingSenderId: "568300274195",
  appId: "1:568300274195:web:240c784d41db0083e3f5e6",
  measurementId: "G-ZVQ4D77B46"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
