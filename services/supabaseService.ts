
import { createClient } from '@supabase/supabase-js';
import { Post, SiteSettings } from '../types';

// --------------------------------------
// Supabase 연결 (Vite 환경변수)
// --------------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseEnabled = () =>
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

const supabase = isSupabaseEnabled()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// --------------------------------------
// 게시글 동기화
// --------------------------------------
export const fetchPostsFromCloud = async (): Promise<Post[] | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetch error:', error);
    return null;
  }

  return data.map((p) => ({
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
  });

  if (error) console.error('Supabase save error:', error);
};

export const deletePostFromCloud = async (id: string) => {
  if (!supabase) return;
  await supabase.from('posts').delete().eq('id', id);
};

// --------------------------------------
// 사이트 설정 동기화
// --------------------------------------
export const fetchSettingsFromCloud = async (): Promise<SiteSettings | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('settings')
    .select('data')
    .eq('id', 'main')
    .single();

  return data && !error ? data.data : null;
};

export const saveSettingsToCloud = async (settings: SiteSettings) => {
  if (!supabase) return;

  await supabase
    .from('settings')
    .upsert({ id: 'main', data: settings });
};
