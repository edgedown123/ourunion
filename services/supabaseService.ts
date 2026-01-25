import { createClient } from '@supabase/supabase-js';
import type { Post, Member, SiteSettings } from '../types';

// --------------------------------------
// Supabase 연결 (Vite 환경변수)
// --------------------------------------
const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined;

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
      createdAt: p.created_at,
    })) as Post[];
  } catch (err) {
    console.error('클라우드 게시글 로드 실패:', err);
    return null;
  }
};

export const savePostToCloud = async (post: Post) => {
  console.log('✅ savePostToCloud called', post.id);
  if (!supabase) {
    console.log('❌ supabase is null (env missing)');
    return;
  }

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
      password: (post as any).password, // 타입에 없으면 무시되지만, 있으면 저장됨
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
// (네 DB 컬럼은 id/email/name/created_at 만 있음)
// --------------------------------------




// --------------------------------------
// 사이트 설정 동기화
// --------------------------------------
export const fetchSettingsFromCloud = async (): Promise<SiteSettings | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('site_settings')
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
      .from('site_settings')
      .upsert({ id: 'main', data: settings });

    if (error) throw error;
  } catch (err) {
    console.error('클라우드 설정 저장 실패:', err);
  }
};


// --------------------------------------
// ✅ Supabase Auth + profiles(조합원) 동기화 (정석)
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

// 회원가입: Supabase Auth(email/password) + profiles 저장
export const signUpMember = async (memberData: Omit<Member, 'id' | 'signupDate'>) => {
  if (!supabase) throw new Error('Supabase is not enabled');

  const email = memberData.email?.trim();
  const password = memberData.password?.trim();

  if (!email) throw new Error('이메일이 필요합니다.');
  if (!password) throw new Error('비밀번호가 필요합니다.');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error('회원가입은 되었지만 user 정보가 없습니다.');

  const profilePayload = {
    id: user.id,
    login_id: memberData.loginId,
    name: memberData.name,
    birth_date: memberData.birthDate,
    phone: memberData.phone,
    email: memberData.email,
    garage: memberData.garage,
  };

  const { error: profileError } = await supabase.from('profiles').upsert(profilePayload);
  if (profileError) throw profileError;

  return { userId: user.id };
};

// 로그인: 사용자가 입력한 값이 이메일이면 그대로, 아이디면 RPC로 이메일 조회 후 로그인
export const signInMember = async (loginOrEmail: string, password: string) => {
  if (!supabase) throw new Error('Supabase is not enabled');
  const login = (loginOrEmail || '').trim();
  const pass = (password || '').trim();
  if (!login || !pass) throw new Error('아이디/이메일과 비밀번호를 입력해주세요.');

  let email = login;

  // 아이디로 입력했으면 email을 profiles에서 찾아서 Auth 로그인
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

// ✅ 기존 members 동기화 함수는 profiles 기반으로 변경
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
    // password는 절대 저장/로드하지 않음
    name: p.name || '',
    birthDate: p.birth_date || '',
    phone: p.phone || '',
    email: p.email || '',
    garage: p.garage || '',
    signupDate: (p.created_at || '').split('T')[0] || '',
  }));
};

export const saveMemberToCloud = async (member: Member) => {
  if (!supabase) return;

  const payload = {
    id: member.id, // auth uid(uuid)
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

export const deleteMemberFromCloud = async (id: string) => {
  // ⚠️ Auth 사용자 삭제는 client에서 불가(서비스키 필요)
  // 여기서는 프로필만 삭제 가능(원하면 관리자 서버가 필요)
  if (!supabase) return;
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) console.error('❌ profiles delete error:', error);
};
