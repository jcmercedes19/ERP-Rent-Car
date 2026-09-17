import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  projectId: "rentcar-erp-jcm-2026",
  appId: "1:701896935574:web:d708b42c04c5256c77dab7",
  storageBucket: "rentcar-erp-jcm-2026.firebasestorage.app",
  apiKey: "AIzaSyCD1QSaQ6Yyr87HLMdmcRyTRyP7YAda654",
  authDomain: "rentcar-erp-jcm-2026.firebaseapp.com",
  messagingSenderId: "701896935574",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
