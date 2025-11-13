import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

// Configuração do Firebase da tua aplicação web
const firebaseConfig = {
  apiKey: "AIzaSyDrG_9_IOSKJtHz4_tfKfNwiG4pgQehBv4",
  authDomain: "showapp-7d2d1.firebaseapp.com",
  projectId: "showapp-7d2d1",
  storageBucket: "showapp-7d2d1.firebasestorage.app",
  messagingSenderId: "855816129643",
  appId: "1:855816129643:web:46390be744335e4195b52e",
  measurementId: "G-L205EH36XL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app); 
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, storage, provider, db};