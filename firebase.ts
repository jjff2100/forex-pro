
// Fix: Use ESM URLs to ensure modular exports are correctly resolved in the browser
import { initializeApp } from "https://esm.sh/firebase/app";
import { getFirestore } from "https://esm.sh/firebase/firestore";

// ملاحظة: استبدل هذه القيم ببيانات مشروعك الحقيقية من console.firebase.google.com
const firebaseConfig = {
  apiKey: "AIzaSyCY92Lcrj428lLTnAOlbdrAXgbslgO6F6k",
  authDomain: "forexpro-66b56.firebaseapp.com",
  projectId: "forexpro-66b56",
  storageBucket: "forexpro-66b56.firebasestorage.app",
  messagingSenderId: "1095701637247",
  appId: "1:1095701637247:web:826686ab45f05045ae774a",
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
