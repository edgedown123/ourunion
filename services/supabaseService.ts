
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
  if (!supabase) throw new Error('Supabase is not enabled');

  // members 테이블 스키마가 프로젝트마다 다를 수 있어서,
  // (camelCase / snake_case / created_at 존재 여부) 여러 형태로 저장을 시도합니다.
  const tryUpsert = async (payload: any) => {
    const { error } = await supabase.from('members').upsert(payload);
    if (error) throw error;
  };

  // 후보 payload들을 순서대로 시도
  const payloads: any[] = [];

  // 1) 기존(앱 내부) 필드 그대로 + created_at
  payloads.push({
    ...member,
    created_at: member.signupDate,
  });

  // 2) created_at 없이 (컬럼이 없는 경우 대비)
  payloads.push({
    ...member,
  });

  // 3) snake_case 변환 + created_at
  payloads.push({
    id: member.id,
    login_id: member.loginId,
    password: member.password,
    name: member.name,
    birth_date: member.birthDate,
    phone: member.phone,
    email: member.email,
    garage: member.garage,
    created_at: member.signupDate,
  });

  // 4) snake_case 변환 without created_at
  payloads.push({
    id: member.id,
    login_id: member.loginId,
    password: member.password,
    name: member.name,
    birth_date: member.birthDate,
    phone: member.phone,
    email: member.email,
    garage: member.garage,
  });

  let lastErr: any = null;

  for (const p of payloads) {
    try {
      await tryUpsert(p);
      console.log(`회원 정보 클라우드 저장 완료: ${member.name}`);
      return;
    } catch (err: any) {
      lastErr = err;
      // 계속 시도
    }
  }

  // 최종 실패 시: 에러를 상위로 던져서 UI에서 메시지를 표시하게 함
  console.error('클라우드 회원 저장 실패:', lastErr);
  throw lastErr;
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
