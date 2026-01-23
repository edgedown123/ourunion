
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

/**
 * Vercel의 Environment Variables가 정확히 매칭되도록 
 * 모든 가능한 변수명을 체크합니다.
 */
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.apiKey || "",
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.projectId || "",
  appId: process.env.FIREBASE_APP_ID || process.env.appId || "1:572838067175:web:8fb0f1852f178b2f165b42",
  authDomain: `${process.env.FIREBASE_PROJECT_ID || process.env.projectId || "ourunion-3b395"}.firebaseapp.com`,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID || process.env.projectId || "ourunion-3b395"}.appspot.com`,
};

// 설정값이 하나라도 비어있으면 Firebase를 비활성화하여 에러 방지
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;

const app = isConfigValid ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;

export const isFirebaseEnabled = () => !!db;

/**
 * 실시간 데이터 감시 (Snapshot)
 */
export const listenToData = (collectionName: string, documentId: string, callback: (data: any) => void) => {
  if (!db) return null;
  const docRef = doc(db, collectionName, documentId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().data);
    } else {
      // 데이터가 없는 초기 상태면 null 전달
      callback(null);
    }
  }, (error) => {
    console.error(`Firebase 실시간 감시 실패 (${documentId}):`, error);
    callback(null);
  });
};

/**
 * 데이터 명시적 저장
 */
export const saveData = async (collectionName: string, documentId: string, data: any) => {
  if (!db) return;
  const docRef = doc(db, collectionName, documentId);
  try {
    await setDoc(docRef, { 
      data, 
      updatedAt: new Date().toISOString() 
    }, { merge: true });
    console.log(`[Firebase] ${documentId} 저장 완료`);
  } catch (error) {
    console.error(`[Firebase] ${documentId} 저장 실패:`, error);
  }
};
