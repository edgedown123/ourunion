
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

    const rows = (data ?? []) as any[];

    return rows.map((m: any) => {
      // snake_case / camelCase 모두 호환
      const createdAt = m.created_at || m.signupDate || m.createdAt;
      return {
        id: String(m.id),
        loginId: m.loginId ?? m.login_id ?? '',
        password: m.password ?? m.pass ?? m.pw,
        name: m.name ?? '',
        birthDate: m.birthDate ?? m.birth_date ?? '',
        phone: m.phone ?? '',
        email: m.email ?? '',
        garage: m.garage ?? '',
        signupDate: createdAt ? String(createdAt) : new Date().toISOString(),
      } as Member;
    });
  } catch (err) {
    console.error('클라우드 회원 로드 실패:', err);
    return null;
  }
};

export const saveMemberToCloud = async (member: Member) => {
  if (!supabase) return;

  // DB 스키마가 프로젝트마다 달라( camelCase / snake_case ) 둘 다 시도한다.
  // - 성공하면 true
  // - 실패하면 error throw (상위에서 알림/롤백 가능)
  const created_at = member.signupDate || new Date().toISOString();

  // 1) camelCase 시도
  const camelPayload: any = {
    id: member.id,
    loginId: member.loginId,
    password: member.password ?? null,
    name: member.name,
    birthDate: member.birthDate,
    phone: member.phone,
    email: member.email,
    garage: member.garage,
    created_at,
  };

  // 2) snake_case 시도
  const snakePayload: any = {
    id: member.id,
    login_id: member.loginId,
    password: member.password ?? null,
    name: member.name,
    birth_date: member.birthDate,
    phone: member.phone,
    email: member.email,
    garage: member.garage,
    created_at,
  };

  try {
    const { error } = await supabase.from('members').upsert(camelPayload);
    if (error) {
      // 컬럼 미존재(42703)나 RLS/권한(42501) 등일 수 있음 → snake_case로 재시도
      console.warn('members upsert(camelCase) 실패, snake_case로 재시도:', error);
      const { error: error2 } = await supabase.from('members').upsert(snakePayload);
      if (error2) throw error2;
    }
    console.log(`회원 정보 클라우드 저장 완료: ${member.name}`);
  } catch (err) {
    console.error('클라우드 회원 저장 실패:', err);
    throw err;
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


// --------------------------------------
// 이미지 업로드 (Supabase Storage: site-assets)
// settings에는 base64 대신 URL을 저장하세요.
// --------------------------------------
export const uploadSiteImage = async (file: File, pathPrefix: string): Promise<string> => {
  if (!supabase) throw new Error('Supabase is not enabled');

  const ext = file.name.split('.').pop() || 'png';
  const safeName = `${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;
  const path = `${pathPrefix}/${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from('site-assets')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
  return data.publicUrl;
};
