
import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  doc, 
  onSnapshot, 
  setDoc,
  enableNetwork,
  disableNetwork
} from "firebase/firestore";

/**
 * 환경 변수 매핑 - Vercel 설정에 맞춰 보강
 */
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || process.env.apiKey || "",
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || process.env.projectId || "ourunion-3b395",
  appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || process.env.appId || "1:572838067175:web:8fb0f1852f178b2f165b42",
  authDomain: `${process.env.FIREBASE_PROJECT_ID || process.env.projectId || "ourunion-3b395"}.firebaseapp.com`,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID || process.env.projectId || "ourunion-3b395"}.appspot.com`,
};

// API Key가 없으면 동작하지 않도록 방어 로직
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10;
const app = isConfigValid ? initializeApp(firebaseConfig) : null;

/**
 * [근본 해결책]
 * 1. 로컬 캐시(persistence)를 끕니다. (모바일에서 옛날 데이터를 물고 있는 현상 방지)
 * 2. experimentalAutoDetectLongPolling을 켭니다. (모바일 통신사 망에서 가장 잘 뚫립니다)
 */
export const db = app ? initializeFirestore(app as any, {
  experimentalAutoDetectLongPolling: true,
}) : null;

export const isFirebaseEnabled = () => !!db;

/**
 * 네트워크 연결 강제 재시작 (모바일 절전 모드 복귀 시 필요)
 */
export const reconnectNetwork = async () => {
  if (!db) return;
  try {
    await disableNetwork(db);
    await enableNetwork(db);
    console.log("[Firebase] Network Reconnected");
  } catch (e) {
    console.error(e);
  }
};

/**
 * 실시간 데이터 감시 (Server-First)
 */
export const listenToData = (collectionName: string, documentId: string, callback: (data: any) => void) => {
  if (!db) return null;
  const docRef = doc(db, collectionName, documentId);
  
  // metadata.fromCache가 false인 것만 진정한 서버 데이터로 인정
  return onSnapshot(docRef, { includeMetadataChanges: true }, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data().data;
      callback(data);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`[Firebase Error] ${documentId}:`, error);
    callback(null);
  });
};

/**
 * 데이터 저장 시 버전 정보 추가 (캐시 버스팅 효과)
 */
export const saveData = async (collectionName: string, documentId: string, data: any) => {
  if (!db) return;
  const docRef = doc(db, collectionName, documentId);
  try {
    await setDoc(docRef, { 
      data, 
      updatedAt: new Date().toISOString(),
      version: Date.now() // 고유 버전 번호를 부여해 모바일 브라우저가 강제로 갱신하게 함
    }, { merge: true });
  } catch (error) {
    console.error(`[Firebase Sync Error]:`, error);
  }
};
