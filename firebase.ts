
// Fix: Use ESM URLs to ensure modular exports are correctly resolved in the browser
import { initializeApp } from "https://esm.sh/firebase/app";
import { getFirestore } from "https://esm.sh/firebase/firestore";

// ملاحظة: استبدل هذه القيم ببيانات مشروعك الحقيقية من console.firebase.google.com
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-id",
  appId: "your-app-id"
};

// التحقق مما إذا كانت الإعدادات حقيقية أم مجرد قيم افتراضية
export const isFirebaseValid = 
  firebaseConfig.apiKey !== "YOUR_API_KEY" && 
  firebaseConfig.projectId !== "your-project-id";

let app;
let db: any = null;

if (isFirebaseValid) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
}

export { db };
