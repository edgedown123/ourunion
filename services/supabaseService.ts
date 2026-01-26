
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
// - 기본: public.site_settings (id='main', data jsonb NOT NULL)
// - 호환: public.settings (id='main', data jsonb)
// --------------------------------------
export const fetchSettingsFromCloud = async (): Promise<SiteSettings | null> => {
  if (!supabase) return null;

  // 1) 우선 site_settings에서 읽기 (권장)
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('data, main_slogan, sub_slogan')
      .eq('id', 'main')
      .single();

    if (error) throw error;

    const settings = (data as any)?.data as SiteSettings | null;

    // data(jsonb)가 비어있는 경우는 null로 처리 (App에서 로컬 fallback)
    if (!settings) return null;

    // 컬럼(main_slogan/sub_slogan)이 있으면 heroTitle/Subtitle을 덮어써서 일관성 유지
    const main = (data as any)?.main_slogan;
    const sub = (data as any)?.sub_slogan;

    return {
      ...settings,
      heroTitle: typeof main === 'string' && main.length ? main : settings.heroTitle,
      heroSubtitle: typeof sub === 'string' && sub.length ? sub : settings.heroSubtitle,
    };
  } catch (err) {
    // 2) (구버전) settings 테이블 fallback
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('data')
        .eq('id', 'main')
        .single();

      if (error) throw error;
      return ((data as any)?.data ?? null) as SiteSettings | null;
    } catch (err2) {
      console.error('클라우드 설정 로드 실패:', err2);
      return null;
    }
  }
};

export const saveSettingsToCloud = async (settings: SiteSettings) => {
  if (!supabase) return;

  // 1) 우선 site_settings에 저장 (권장)
  try {
    const payload: any = {
      id: 'main',
      data: settings, // NOT NULL 컬럼
      main_slogan: settings.heroTitle ?? null,
      sub_slogan: settings.heroSubtitle ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('site_settings')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
    return;
  } catch (err) {
    // 2) (구버전) settings 테이블 fallback
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ id: 'main', data: settings }, { onConflict: 'id' });

      if (error) throw error;
    } catch (err2) {
      console.error('클라우드 설정 저장 실패:', err2);
    }
  }
};

