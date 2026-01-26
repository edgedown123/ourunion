
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

    return (data ?? []).map((m: any) => ({
      id: m.id ?? m.member_id ?? m.user_id ?? (m.login_id || m.loginId) ?? String(Math.random()),
      loginId: m.login_id ?? m.loginId ?? '',
      password: m.password ?? undefined,
      name: m.name ?? '',
      birthDate: m.birth_date ?? m.birthDate ?? '',
      phone: m.phone ?? '',
      email: m.email ?? '',
      garage: m.garage ?? '',
      signupDate: m.created_at ?? m.signupDate ?? new Date().toISOString(),
    })) as Member[];
  } catch (err) {
    console.error('클라우드 회원 로드 실패:', err);
    return null;
  }
};

export const saveMemberToCloud = async (member: Member) => {
  if (!supabase) throw new Error('Supabase not enabled');

  // NOTE:
  // Supabase 테이블 컬럼명이 프로젝트마다 다를 수 있어 (camelCase vs snake_case).
  // 그래서 1) snake_case로 먼저 저장 시도 → 2) 실패하면 camelCase로 재시도한다.
  const tryUpsert = async (payload: any, onConflict?: string) => {
    const q = supabase.from('members').upsert(payload, onConflict ? { onConflict } : undefined as any);
    const { error } = await q;
    if (error) throw error;
  };

  try {
    // ✅ 1차 시도: snake_case 컬럼 (일반적인 DB 스키마)
    const payload1 = {
      // id가 text PK가 아닌 경우도 있어서, onConflict를 login_id로 걸어둠
      login_id: member.loginId,
      password: member.password ?? null,
      name: member.name,
      birth_date: member.birthDate,
      phone: member.phone,
      email: member.email,
      garage: member.garage,
      created_at: member.signupDate,
    };
    await tryUpsert(payload1, 'login_id');
    console.log(`회원 정보 클라우드 저장 완료(snake_case): ${member.name}`);
    return;
  } catch (err1: any) {
    console.warn('snake_case 저장 실패, camelCase로 재시도:', err1);

    // ✅ 2차 시도: camelCase 컬럼 (앱 타입 그대로)
    const payload2 = {
      id: member.id,
      loginId: member.loginId,
      password: member.password ?? null,
      name: member.name,
      birthDate: member.birthDate,
      phone: member.phone,
      email: member.email,
      garage: member.garage,
      created_at: member.signupDate,
    };

    const { error } = await supabase.from('members').upsert(payload2);
    if (error) {
      console.error('클라우드 회원 저장 실패:', error);
      throw error;
    }
    console.log(`회원 정보 클라우드 저장 완료(camelCase): ${member.name}`);
  }
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
