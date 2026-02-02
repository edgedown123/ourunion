import { supabase } from './services/supabaseService';

/**
 * PWA + (웹 푸시) 클라이언트 초기화
 * - Service Worker 등록
 * - (선택) Supabase Realtime로 새 게시글 감지 시, 앱이 열려있는 동안 알림 표시
 * - (선택) Web Push 구독 저장 (VAPID 공개키가 있을 때)
 */

declare global {
  interface Window {
    ourunionPwa?: {
      register: () => Promise<void>;
      enableNotifications: () => Promise<void>;
      subscribeWebPush: () => Promise<void>;
      getStatus: () => Promise<{ sw: boolean; permission: NotificationPermission; pushSubscribed: boolean }>;
    };
  }
}

const VAPID_PUBLIC_KEY = (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY as string | undefined;

// base64url -> Uint8Array
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
};

const isSwSupported = () => 'serviceWorker' in navigator;

const registerServiceWorker = async () => {
  if (!isSwSupported()) return;
  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch (e) {
    console.warn('Service Worker 등록 실패:', e);
  }
};

const ensureNotificationPermission = async () => {
  if (!('Notification' in window)) return 'denied' as NotificationPermission;
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
};

const getSwRegistration = async () => {
  if (!isSwSupported()) return null;
  return await navigator.serviceWorker.ready;
};

const getPushSubscription = async () => {
  const reg = await getSwRegistration();
  if (!reg || !reg.pushManager) return null;
  return await reg.pushManager.getSubscription();
};

const saveSubscriptionToSupabase = async (sub: PushSubscription) => {
  if (!supabase) return;
  try {
    const json = sub.toJSON();
    // 테이블: push_subscriptions (sql/001_push_subscriptions.sql 참고)
    await supabase.from('push_subscriptions').upsert({
      endpoint: json.endpoint,
      p256dh: (json.keys as any)?.p256dh || null,
      auth: (json.keys as any)?.auth || null,
      user_agent: navigator.userAgent,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'endpoint' });
  } catch (e) {
    console.warn('푸시 구독 저장 실패(테이블 미생성일 수 있음):', e);
  }
};

const subscribeWebPush = async () => {
  const permission = await ensureNotificationPermission();
  if (permission !== 'granted') return;

  if (!VAPID_PUBLIC_KEY) {
    alert('웹 푸시(VAPID) 공개키가 설정되어 있지 않습니다.\n\n테스트 단계에서는 "앱이 열려있는 동안" 새 글 알림만 동작합니다.\nPlay스토어/진짜 푸시(백그라운드)까지 하려면 VAPID 키 + 발송 함수가 필요합니다.');
    return;
  }

  const reg = await getSwRegistration();
  if (!reg || !reg.pushManager) return;

  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    await saveSubscriptionToSupabase(existing);
    return;
  }

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  await saveSubscriptionToSupabase(sub);
};

const showLocalNotification = async (title: string, body: string, url: string) => {
  try {
    const reg = await getSwRegistration();
    if (!reg) return;
    await reg.showNotification(title, {
      body,
      data: { url },
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    });
  } catch (e) {
    console.warn('로컬 알림 표시 실패:', e);
  }
};

const listenNewPostsWhileOpen = async () => {
  if (!supabase) return;
  // 앱이 "열려있는 동안" 새 글 감지 (테스트용)
  try {
    const channel = supabase
      .channel('posts-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload: any) => {
        const permission = Notification.permission;
        if (permission !== 'granted') return;

        const p = payload?.new;
        const title = '우리노동조합';
        const body = p?.title ? `새 게시글: ${p.title}` : '새 게시글이 등록되었습니다.';
        const url = p?.id ? `/notice/${p.id}` : '/';
        await showLocalNotification(title, body, url);
      })
      .subscribe();

    // 페이지 종료 시 unsubscribe는 SPA 특성상 생략(중복 생성 방지 위해 1회만 호출)
    void channel;
  } catch (e) {
    console.warn('Realtime 구독 실패:', e);
  }
};

const getStatus = async () => {
  const sw = isSwSupported();
  const permission = ('Notification' in window ? Notification.permission : 'denied') as NotificationPermission;
  const sub = await getPushSubscription();
  return { sw, permission, pushSubscribed: !!sub };
};

const init = async () => {
  await registerServiceWorker();
  // 테스트 단계에서 "앱이 열려있는 동안" 알림이라도 체감되게
  await listenNewPostsWhileOpen();
};

// window helper (관리자 화면 버튼에서 호출)
window.ourunionPwa = {
  register: init,
  enableNotifications: async () => {
    await ensureNotificationPermission();
  },
  subscribeWebPush,
  getStatus,
};

// auto init once
void init();
