
import { createClient } from '@supabase/supabase-js';
import { Post, Member, SiteSettings } from '../types';

// Vercel/Vite 환경에서 환경변수를 안전하게 가져옵니다.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseEnabled = () => 
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0 && supabaseUrl !== 'undefined';

const supabase = isSupabaseEnabled() 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 게시글 동기화
export const fetchPostsFromCloud = async (): Promise<Post[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(p => ({
      ...p,
      createdAt: p.created_at
    }));
  } catch (err) {
    console.error('클라우드 게시글 로드 실패:', err);
    return null;
  }
};

export const savePostToCloud = async (post: Post) => {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('posts')
      .upsert({
        id: post.id,
        type: post.type,
        title: post.title,
        content: post.content,
        author: post.author,
        created_at: post.createdAt,
        views: post.views,
        attachments: post.attachments,
        password: post.password,
        comments: post.comments
      });
    if (error) throw error;
  } catch (err) {
    console.error('클라우드 게시글 저장 실패:', err);
  }
};

export const deletePostFromCloud = async (id: string) => {
  if (!supabase) return;
  await supabase.from('posts').delete().eq('id', id);
};

// 회원 관리 동기화
export const fetchMembersFromCloud = async (): Promise<Member[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('members').select('*');
    if (error) throw error;
    return data.map(m => ({
      ...m,
      loginId: m.login_id,
      birthDate: m.birth_date,
      signupDate: m.signup_date
    }));
  } catch (err) {
    return null;
  }
};

export const saveMemberToCloud = async (member: Member) => {
  if (!supabase) return;
  await supabase.from('members').upsert({
    id: member.id,
    login_id: member.loginId,
    password: member.password,
    name: member.name,
    birth_date: member.birthDate,
    phone: member.phone,
    email: member.email,
    garage: member.garage,
    signup_date: member.signupDate
  });
};

// 회원 삭제 동기화 추가
export const deleteMemberFromCloud = async (id: string) => {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error('클라우드 회원 삭제 실패:', err);
  }
};

// 설정값 동기화
export const fetchSettingsFromCloud = async (): Promise<SiteSettings | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('settings').select('data').eq('id', 'main').single();
    if (error) return null;
    return data.data;
  } catch (err) {
    return null;
  }
};

export const saveSettingsToCloud = async (settings: SiteSettings) => {
  if (!supabase) return;
  await supabase.from('settings').upsert({ id: 'main', data: settings });
};
