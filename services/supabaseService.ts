import { createClient } from '@supabase/supabase-js';
import type { Post, SiteSettings, Member } from '../types';

// --------------------------------------
// Supabase 연결 (Vite 환경변수)
// --------------------------------------
const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined;

const supabaseUrl = env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseEnabled = () =>
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

export const supabase = isSupabaseEnabled()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// --------------------------------------
// 게시글 동기화 (posts)
// --------------------------------------
export const fetchPostsFromCloud = async (): Promise<Post[] | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Supabase posts fetch error:', error);
    return null;
  }

  return (data || []).map((p: any) => ({
    ...p,
    createdAt: p.created_at,
  }));
};

export const savePostToCloud = async (post: Post) => {
  if (!supabase) return;

  const { error } = await supabase.from('posts').upsert({
    id: post.id,
    type: post.type,
    title: post.title,
    content: post.content,
    author: post.author,
    created_at: post.createdAt,
    views: post.views,
    attachments: post.attachments,
    comments: post.comments,
    password: (post as any).password ?? null,
  });

  if (error) console.error('❌ Supabase post save error:', error);
};

export const deletePostFromCloud = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) console.error('❌ Supabase post delete error:', error);
};

// --------------------------------------
// 사이트 설정 동기화 (site_settings 권장, 없으면 settings도 지원)
// --------------------------------------
export const fetchSettingsFromCloud = async (): Promise<SiteSettings | null> => {
  if (!supabase) return null;

  // 1) site_settings 우선
  let res = await supabase
    .from('site_settings')
    .select('data')
    .eq('id', 'main')
    .single();

  if (!res.error && res.data?.data) return res.data.data as SiteSettings;

  // 2) settings fallback
  res = await supabase
    .from('settings')
    .select('data')
    .eq('id', 'main')
    .single();

  return !res.error && res.data?.data ? (res.data.data as SiteSettings) : null;
};

export const saveSettingsToCloud = async (settings: SiteSettings) => {
  if (!supabase) return;

  // site_settings 우선 저장
  const a = await supabase.from('site_settings').upsert({ id: 'main', data: settings });
  if (a.error) {
    // settings fallback
    const b = await supabase.from('settings').upsert({ id: 'main', data: settings });
    if (b.error) console.error('❌ Supabase settings save error:', b.error);
  }
};

// --------------------------------------
// ✅ Supabase Auth + profiles(조합원) - 아이디(login_id) 로그인 지원
//
// 핵심: profiles는 "트리거"가 생성한다.
// -> 회원가입 시 profiles에 직접 insert하지 않음 (401 문제 원천 차단)
// --------------------------------------

export type ProfileRow = {
  id: string; // uuid
  login_id: string | null;
  name: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  garage: string | null;
  created_at: string | null;
};

// 회원가입: Auth signUp(email/password) + raw_user_meta_data에 프로필 정보 저장
export const signUpMember = async (memberData: Omit<Member, 'id' | 'signupDate'>) => {
  if (!supabase) throw new Error('Supabase is not enabled');

  const email = (memberData.email || '').trim();
  const password = (memberData.password || '').trim();

  if (!email) throw new Error('이메일이 필요합니다.');
  if (!password) throw new Error('비밀번호가 필요합니다.');
  if (password.length < 6) throw new Error('비밀번호는 6자리 이상이어야 합니다.');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        login_id: memberData.loginId,
        name: memberData.name,
        birth_date: memberData.birthDate,
        phone: memberData.phone,
        garage: memberData.garage,
      },
    },
  });

  if (error) throw error;

  // Confirm email OFF면 session이 바로 생김. ON이면 이메일 인증 후 로그인 필요.
  const user = data.user;
  if (!user) throw new Error('회원가입은 되었지만 user 정보가 없습니다.');

  return { userId: user.id };
};

// 로그인: 아이디면 get_email_by_login_id RPC로 이메일 조회 후 Auth 로그인
export const signInMember = async (loginOrEmail: string, password: string) => {
  if (!supabase) throw new Error('Supabase is not enabled');

  const login = (loginOrEmail || '').trim();
  const pass = (password || '').trim();

  if (!login || !pass) throw new Error('아이디/이메일과 비밀번호를 입력해주세요.');
  if (pass.length < 6) throw new Error('비밀번호는 6자리 이상이어야 합니다.');

  let email = login;

  // 아이디로 입력했으면 email을 RPC로 조회
  if (!login.includes('@')) {
    const { data, error } = await supabase.rpc('get_email_by_login_id', { p_login_id: login });
    if (error) throw error;
    if (!data) throw new Error('해당 아이디를 찾을 수 없습니다.');
    email = String(data);
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });
  if (signInError) throw signInError;

  const user = signInData.user;
  if (!user) throw new Error('로그인 user 정보가 없습니다.');

  // 프로필 로드
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) throw profileError;

  return profile as ProfileRow;
};

export const signOutMember = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
};

export const fetchMyProfile = async (): Promise<ProfileRow | null> => {
  if (!supabase) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data as ProfileRow;
};

// 관리자 화면 목록용(전체 profiles)
export const fetchMembersFromCloud = async (): Promise<Member[] | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ profiles fetch error:', error);
    return null;
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    loginId: p.login_id || '',
    name: p.name || '',
    birthDate: p.birth_date || '',
    phone: p.phone || '',
    email: p.email || '',
    garage: p.garage || '',
    signupDate: (p.created_at || '').split('T')[0] || '',
    password: '', // 절대 저장/로드하지 않음
  }));
};

// 프로필 수정(본인/관리자)
export const saveMemberToCloud = async (member: Member) => {
  if (!supabase) return;

  const payload = {
    id: member.id,
    login_id: member.loginId,
    name: member.name,
    birth_date: member.birthDate,
    phone: member.phone,
    email: member.email,
    garage: member.garage,
  };

  const { error } = await supabase.from('profiles').upsert(payload);
  if (error) console.error('❌ profiles save error:', error);
};

// ⚠️ Auth 사용자 삭제는 브라우저에서 불가(서비스키 필요). 여기서는 프로필만 삭제.
export const deleteMemberFromCloud = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) console.error('❌ profiles delete error:', error);
};
