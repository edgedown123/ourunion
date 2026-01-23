
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

/**
 * Vercel에 입력하신 다양한 변수명을 모두 지원합니다.
 */
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.apiKey || "",
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.projectId || "",
  appId: process.env.FIREBASE_APP_ID || process.env.appId || "1:572838067175:web:8fb0f1852f178b2f165b42",
  authDomain: `${process.env.FIREBASE_PROJECT_ID || process.env.projectId || "ourunion-3b395"}.firebaseapp.com`,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID || process.env.projectId || "ourunion-3b395"}.appspot.com`,
};

// 필수 설정값인 API Key와 Project ID가 있는지 확인
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;
const app = isConfigValid ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;

export const isFirebaseEnabled = () => !!db;

/**
 * 실시간 데이터 감시
 */
export const listenToData = (collectionName: string, documentId: string, callback: (data: any) => void) => {
  if (!db) return null;
  const docRef = doc(db, collectionName, documentId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().data);
    }
  }, (error) => {
    console.error(`Firebase 실시간 감시 오류 (${documentId}):`, error);
  });
};

/**
 * 데이터 저장
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
    console.error(`Firebase 저장 오류 (${documentId}):`, error);
  }
};
