import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyCC7WvYYhdD9_iKjFRQVJuMl8JAWwD363g",
    authDomain: "fir-comment-system-1517a.firebaseapp.com",
    projectId: "fir-comment-system-1517a",
    storageBucket: "fir-comment-system-1517a.appspot.com",
    messagingSenderId: "577484957373",
    appId: "1:577484957373:web:c0e88e40573fb8408bb9d4",
    measurementId: "G-DVVP14YB08"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { firestore, storage, auth };
