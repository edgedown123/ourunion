import { supabase } from './supabaseService';

const VAPID_PUBLIC_KEY =
  (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY : undefined) || '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function getNotificationPermission() {
  if (!('Notification' in window)) return 'denied' as NotificationPermission;
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'denied' as NotificationPermission;
  return await Notification.requestPermission();
}

export async function ensurePushSubscribed() {
  if (!isPushSupported()) throw new Error('이 브라우저는 푸시 알림을 지원하지 않습니다.');
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.');
  if (!VAPID_PUBLIC_KEY) throw new Error('VAPID 공개키(VITE_VAPID_PUBLIC_KEY)가 설정되지 않았습니다.');

  const perm = await getNotificationPermission();
  if (perm !== 'granted') {
    const p = await requestNotificationPermission();
    if (p !== 'granted') throw new Error('알림 권한이 허용되지 않았습니다.');
  }

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  // Supabase에 구독 저장
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user?.id || null;

  const json = sub.toJSON();
  const endpoint = sub.endpoint;
  const p256dh = (json.keys as any)?.p256dh || null;
  const auth = (json.keys as any)?.auth || null;

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint,
      p256dh,
      auth,
      user_id: userId,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  );

  if (error) throw error;
  return sub;
}

export async function unsubscribePush() {
  if (!isPushSupported()) return false;
  if (!supabase) return false;

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;

  const endpoint = sub.endpoint;
  const ok = await sub.unsubscribe();

  // DB에서도 삭제 시도 (실패해도 ok)
  try {
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  } catch {}
  return ok;
}
