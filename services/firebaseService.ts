
import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  initializeFirestore, 
  doc, 
  onSnapshot, 
  setDoc,
  enableNetwork,
  disableNetwork,
  getDoc,
  Firestore
} from "firebase/firestore";

/**
 * 환경 변수 매핑 - Vercel에서 주입되는 변수들을 가장 확실하게 잡습니다.
 */
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || process.env.apiKey || "",
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || process.env.projectId || "ourunion-3b395",
  appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || process.env.appId || "1:572838067175:web:8fb0f1852f178b2f165b42",
  authDomain: `${process.env.FIREBASE_PROJECT_ID || process.env.projectId || "ourunion-3b395"}.firebaseapp.com`,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID || process.env.projectId || "ourunion-3b395"}.appspot.com`,
};

// 중복 초기화 방지 및 앱 생성
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * [근본 해결책 - 모바일 뚫기]
 * 1. experimentalForceLongPolling: 모바일 통신사의 WebSocket 차단을 우회
 * 2. useFetchStreams: false -> 모바일 브라우저 캐싱 문제를 피하기 위해 스트림 대신 일반 fetch 사용
 */
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false, 
} as any);

export const isFirebaseEnabled = () => !!firebaseConfig.apiKey;

/**
 * 네트워크 강제 리프레시
 * 모바일에서 화면을 다시 켰을 때(Background -> Foreground) 필수입니다.
 */
export const forceReconnect = async () => {
  if (!db) return;
  try {
    await disableNetwork(db);
    await enableNetwork(db);
    console.log("[Firebase] Network Refreshed for Mobile");
  } catch (e) {
    console.error(e);
  }
};

/**
 * 서버 생존 확인 (초록 점을 즉시 띄우기 위함)
 */
export const checkServerConnection = async (): Promise<boolean> => {
  if (!db) return false;
  try {
    // 가장 가벼운 문서 하나를 가져와서 서버 응답 확인
    const testRef = doc(db, 'union', 'settings');
    await getDoc(testRef);
    return true;
  } catch (e) {
    console.error("[Firebase] Connection Test Failed:", e);
    return false;
  }
};

/**
 * 실시간 데이터 감시 (모바일 동기화 핵심)
 */
export const listenToData = (collectionName: string, documentId: string, callback: (data: any) => void) => {
  if (!db) return null;
  const docRef = doc(db, collectionName, documentId);
  
  // includeMetadataChanges: true 옵션으로 로컬 데이터가 아닌 서버 확정 데이터를 감시
  return onSnapshot(docRef, { includeMetadataChanges: true }, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().data);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`[Firebase Listen Error] ${documentId}:`, error);
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
      version: Date.now() // 캐시 방지용 버전 번호
    }, { merge: true });
    console.log(`[Cloud Sync Success] ${documentId}`);
  } catch (error) {
    console.error(`[Cloud Sync Error] ${documentId}:`, error);
  }
};
