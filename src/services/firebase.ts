import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// TODO: Firebase Console の「プロジェクトの設定」からコピーしてください
// Realtime Database を有効化してから databaseURL を必ず設定してください
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "bloodrecall-web.firebaseapp.com",
  databaseURL: "https://bloodrecall-web-default-rtdb.firebaseio.com",
  projectId: "bloodrecall-web",
  storageBucket: "bloodrecall-web.firebasestorage.app",
  messagingSenderId: "888960287528",
  appId: "1:888960287528:web:8fa459f303d70783f3461d",
  measurementId: "G-32ZJYSC5PW"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getDatabase(firebaseApp);
