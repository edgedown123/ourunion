
import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  enableIndexedDbPersistence,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED
} from "firebase/firestore";

/**
 * Vercel 환경 변수 설정
 */
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.apiKey || "",
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.projectId || "",
  appId: process.env.FIREBASE_APP_ID || process.env.appId || "1:572838067175:web:8fb0f1852f178b2f165b42",
  authDomain: `${process.env.FIREBASE_PROJECT_ID || process.env.projectId || "ourunion-3b395"}.firebaseapp.com`,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID || process.env.projectId || "ourunion-3b395"}.appspot.com`,
};

const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;
const app = isConfigValid ? initializeApp(firebaseConfig) : null;

/**
 * [핵심 해결책] 
 * 1. experimentalForceLongPolling: 모바일 통신사의 WebSocket 차단을 우회하여 데이터 연동 보장
 * 2. localCache: 오프라인에서도 데이터를 유지하고 온라인 시 자동 동기화
 */
export const db = app ? initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
}) : null;

export const isFirebaseEnabled = () => !!db;

/**
 * 실시간 데이터 감시
 * 서버 데이터가 도착하면 즉시 콜백 실행
 */
export const listenToData = (collectionName: string, documentId: string, callback: (data: any) => void) => {
  if (!db) return null;
  const docRef = doc(db, collectionName, documentId);
  
  return onSnapshot(docRef, { includeMetadataChanges: true }, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().data);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`Firebase 동기화 실패 (${documentId}):`, error);
    callback(null);
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
      updatedAt: new Date().toISOString(),
      source: 'web_app'
    }, { merge: true });
    console.log(`[Cloud Save Success] ${documentId}`);
  } catch (error) {
    console.error(`[Cloud Save Failed] ${documentId}:`, error);
  }
};
