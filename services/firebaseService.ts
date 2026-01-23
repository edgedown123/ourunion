
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

/**
 * Vercel 환경 변수에서 값을 가져옵니다.
 * 선생님이 캡처 화면에 넣으신 'apiKey', 'projectId' 등 소문자 이름도 모두 지원하도록 설계했습니다.
 */
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.apiKey || "",
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.projectId || "",
  appId: process.env.FIREBASE_APP_ID || process.env.appId || "1:572838067175:web:8fb0f1852f178bf165b42", // 캡처의 값을 기본값으로 보완
  authDomain: `${process.env.FIREBASE_PROJECT_ID || process.env.projectId || "ourunion-3b395"}.firebaseapp.com`,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID || process.env.projectId || "ourunion-3b395"}.appspot.com`,
};

// 필수 설정값이 있는지 확인 후 초기화
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;
const app = isConfigValid ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;

export const isFirebaseEnabled = () => !!db;

/**
 * 실시간 데이터 감시 (Snapshot)
 */
export const listenToData = (collectionName: string, documentId: string, callback: (data: any) => void) => {
  if (!db) {
    console.warn(`Firebase DB가 초기화되지 않아 ${documentId} 감시를 시작할 수 없습니다.`);
    return null;
  }
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
    console.error(`Firebase 저장 오류 (${documentId}):`, error);
  }
};
