import { supabase } from './supabaseService';

const VAPID_PUBLIC_KEY_RAW = (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY : undefined) || '';
const VAPID_PUBLIC_KEY = (VAPID_PUBLIC_KEY_RAW || '').trim();

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
      applicationServerKey: appServerKey,
    }));

  // 서버(API)로 구독 저장 (service_role로 upsert)
  const session = await supabase.auth.getSession();
  const accessToken = session.data.session?.access_token || null;

  const json = sub.toJSON();
  const endpoint = sub.endpoint;
  const p256dh = (json.keys as any)?.p256dh || null;
  const auth = (json.keys as any)?.auth || null;

  // 로그인 세션이 아직 준비되지 않은 상태면, 구독은 만들어지지만 DB 저장은 실패할 수 있으니
  // 명확하게 안내한다.
  if (!accessToken) {
    throw new Error('로그인 정보를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.');
  }

  // 1) API로 저장 (권장)
  const res = await fetch('/api/push-subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ endpoint, p256dh, auth }),
  });

  if (!res.ok) {
  const text = await res.text().catch(() => '');
  console.error('push-subscribe API failed', res.status, text);
  throw new Error(`push-subscribe API 실패 (${res.status}): ${text}`);
}

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
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token || null;
    if (accessToken) {
      await fetch('/api/push-unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ endpoint }),
      });
    } else {
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    }
  } catch {}
  return ok;
}
