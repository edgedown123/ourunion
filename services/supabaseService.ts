
import { createClient } from '@supabase/supabase-js';
import type { Post, Member, SiteSettings } from '../types';

// --------------------------------------
// Supabase 연결 (Vite 환경변수)
// --------------------------------------
const env = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;

const supabaseUrl = env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseEnabled = () =>
  supabaseUrl.length > 0 &&
  supabaseAnonKey.length > 0 &&
  supabaseUrl !== 'undefined' &&
  supabaseAnonKey !== 'undefined';

const supabase = isSupabaseEnabled()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// --------------------------------------
// 게시글 동기화
// --------------------------------------
export const fetchPostsFromCloud = async (): Promise<Post[] | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((p: any) => ({
      ...p,
      createdAt: p.created_at || p.createdAt,
    })) as Post[];
  } catch (err) {
    console.error('클라우드 게시글 로드 실패:', err);
    return null;
  }
};

export const savePostToCloud = async (post: Post) => {
  if (!supabase) return;

  try {
    const { error } = await supabase.from('posts').upsert({
      id: post.id,
      type: post.type,
      title: post.title,
      content: post.content,
      author: post.author,
      created_at: post.createdAt,
      views: post.views,
      attachments: post.attachments,
      password: post.password,
      comments: post.comments,
    });

    if (error) throw error;
  } catch (err) {
    console.error('클라우드 게시글 저장 실패:', err);
  }
};

export const deletePostFromCloud = async (id: string) => {
  if (!supabase) return;

  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) console.error('클라우드 게시글 삭제 실패:', error);
};

// --------------------------------------
// 회원 관리 동기화
// --------------------------------------
export const fetchMembersFromCloud = async (): Promise<Member[] | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // DB의 created_at 컬럼을 앱 내부에서 사용하는 signupDate로 변환하여 리턴
    return (data ?? []).map((m: any) => {
      const { created_at, ...rest } = m;
      return {
        ...rest,
        signupDate: created_at || m.signupDate
      };
    }) as Member[];
  } catch (err) {
    console.error('클라우드 회원 로드 실패:', err);
    return null;
  }
};

export const saveMemberToCloud = async (member: Member) => {
  if (!supabase) throw new Error('Supabase not enabled');

  // Supabase 테이블 컬럼명이 camelCase / snake_case 혼재할 수 있어서
  // 1) snake_case로 저장 시도 → 2) 실패하면 camelCase로 재시도
  const tryUpsert = async (payload: any, onConflict?: string) => {
    const { error } = await supabase
      .from('members')
      .upsert(payload, onConflict ? { onConflict } : undefined as any);
    if (error) throw error;
  };

  // Member 타입의 signupDate는 DB의 created_at으로 저장
  // (프로젝트에서 created_at 컬럼을 쓰고 있는 것으로 보임)
  const createdAt = member.signupDate ?? new Date().toISOString();

  try {
    // ✅ 1차: snake_case 컬럼(권장)
    const payload1 = {
      login_id: (member as any).loginId ?? (member as any).login_id ?? null,
      password: (member as any).password ?? null,
      name: (member as any).name ?? null,
      birth_date: (member as any).birthDate ?? (member as any).birth_date ?? null,
      phone: (member as any).phone ?? null,
      email: (member as any).email ?? null,
      garage: (member as any).garage ?? null,
      role: (member as any).role ?? 'member',
      status: (member as any).status ?? 'pending',
      created_at: createdAt,
    };

    // login_id가 없으면 onConflict를 걸 수 없어서 그냥 upsert
    await tryUpsert(payload1, payload1.login_id ? 'login_id' : undefined);
    console.log(`회원 정보 클라우드 저장 완료(snake_case): ${(member as any).name ?? ''}`);
    return;
  } catch (err1) {
    console.warn('snake_case 저장 실패, camelCase로 재시도:', err1);
  }

  // ✅ 2차: camelCase 컬럼(기존 코드 호환)
  const payload2 = {
    ...(member as any),
    created_at: createdAt,
  };

  await tryUpsert(payload2);
  console.log(`회원 정보 클라우드 저장 완료(camelCase): ${(member as any).name ?? ''}`);
};


export const deleteMemberFromCloud = async (id: string) => {
  if (!supabase) return;

  try {
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error('클라우드 회원 삭제 실패:', err);
  }
};

// --------------------------------------
// 사이트 설정 동기화
// --------------------------------------
export const fetchSettingsFromCloud = async (): Promise<SiteSettings | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('data')
      .eq('id', 'main')
      .single();

    if (error) throw error;
    return (data?.data ?? null) as SiteSettings | null;
  } catch (err) {
    console.error('클라우드 설정 로드 실패:', err);
    return null;
  }
};

export const saveSettingsToCloud = async (settings: SiteSettings) => {
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ id: 'main', data: settings });

    if (error) throw error;
  } catch (err) {
    console.error('클라우드 설정 저장 실패:', err);
  }
};
