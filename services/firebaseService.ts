
/**
 * Firebase Service 제거됨
 * 로컬 저장소(LocalStorage) 전용 모드로 전환
 */

export const isFirebaseEnabled = () => false;
export const forceReconnect = async () => {};
export const checkServerConnection = async () => false;
export const listenToData = (col: string, doc: string, cb: any) => null;
export const saveData = async (col: string, doc: string, data: any) => {};
