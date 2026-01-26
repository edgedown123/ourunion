
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
  ? createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options) => fetch(url as any, { ...(options as any), cache: 'no-store' as any }),
  },
})
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
  if (!supabase) return;

  try {
    // 1. signupDate를 제외한 나머지 데이터 추출
    // 2. DB 스키마(created_at)에 맞춰 데이터 구성하여 upsert
    const { signupDate, ...dbMember } = member;
    
    const { error } = await supabase.from('members').upsert({
      ...dbMember,
      created_at: member.signupDate // signupDate를 created_at 컬럼에 저장
    });
    
    if (error) throw error;
    console.log(`회원 정보 클라우드 저장 완료: ${member.name}`);
  } catch (err) {
    console.error('클라우드 회원 저장 실패:', err);
    throw err; // 상위에서 에러를 인지할 수 있게 던짐
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

  // 1) Prefer site_settings(id='main') if exists (matches your current DB)
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('data, main_slogan, sub_slogan')
      .eq('id', 'main')
      .single();

    if (!error && data) {
      const base = (data.data ?? {}) as any;
      // If dedicated slogan columns exist, map them into settings (backward compatible)
      const merged = {
        ...base,
        ...(data.main_slogan ? { heroTitle: data.main_slogan } : {}),
        ...(data.sub_slogan ? { heroSubtitle: data.sub_slogan } : {}),
      };
      return merged as SiteSettings;
    }
  } catch {
    // ignore and fallback
  }

  // 2) Fallback to legacy settings table
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

  // Always keep an object in data (site_settings.data is NOT NULL in your DB)
  const safeSettings: any = settings ?? {};

  // 1) Try saving to site_settings first
  try {
    // Read existing data so we don't accidentally erase fields written by other clients
    const { data: existing } = await supabase
      .from('site_settings')
      .select('data')
      .eq('id', 'main')
      .single();

    const existingData = (existing?.data ?? {}) as any;
    const merged = { ...existingData, ...safeSettings };

    const payload: any = { id: 'main', data: merged, updated_at: new Date().toISOString() };

    // Keep dedicated slogan columns in sync if present in your schema
    if (typeof (safeSettings as any).heroTitle === 'string') payload.main_slogan = (safeSettings as any).heroTitle;
    if (typeof (safeSettings as any).heroSubtitle === 'string') payload.sub_slogan = (safeSettings as any).heroSubtitle;

    const { error } = await supabase
      .from('site_settings')
      .upsert(payload);

    if (!error) return;
    // if error, fall through to legacy table
  } catch {
    // fall through
  }

  // 2) Legacy table fallback
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ id: 'main', data: safeSettings });

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
