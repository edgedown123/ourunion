
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

// Vercel 환경 변수에서 값을 가져옵니다. 
// (사용자에게 FIREBASE_... 접두사를 붙이도록 안내함)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.apiKey || "",
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.projectId || "",
  appId: process.env.FIREBASE_APP_ID || process.env.appId || "",
  authDomain: `${process.env.FIREBASE_PROJECT_ID || process.env.projectId}.firebaseapp.com`,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID || process.env.projectId}.appspot.com`,
};

// 필수 설정값이 있는지 확인 후 초기화
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId;
const app = isConfigValid ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;

export const isFirebaseEnabled = () => !!db;

/**
 * 실시간 데이터 감시 (Snapshot)
 * 데이터가 변경될 때마다 콜백 함수를 실행합니다.
 */
export const listenToData = (collectionName: string, documentId: string, callback: (data: any) => void) => {
  if (!db) return null;
  const docRef = doc(db, collectionName, documentId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().data);
    }
  }, (error) => {
    console.error(`Firebase Listen Error (${documentId}):`, error);
  });
};

/**
 * 데이터 저장 (Upsert)
 */
export const saveData = async (collectionName: string, documentId: string, data: any) => {
  if (!db) return;
  const docRef = doc(db, collectionName, documentId);
  try {
    await setDoc(docRef, { 
      data, 
      updatedAt: new Date().toISOString() 
    }, { merge: true });
  } catch (error) {
    console.error(`Firebase Save Error (${collectionName}/${documentId}):`, error);
  }
};
