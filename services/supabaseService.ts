
import { createClient } from '@supabase/supabase-js';
import { SiteSettings, Post, Member } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// 수파베이스 클라이언트 초기화 (설정이 없을 경우 null 반환)
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * 수파베이스 연결 상태 확인
 */
export const isSupabaseEnabled = () => !!supabase;

/**
 * 전체 데이터 동기화 (불러오기)
 */
export const fetchAllData = async () => {
  if (!supabase) return null;

  try {
    const [settingsRes, postsRes, membersRes, deletedRes] = await Promise.all([
      supabase.from('union_settings').select('data').single(),
      supabase.from('union_posts').select('data').single(),
      supabase.from('union_members').select('data').single(),
      supabase.from('union_deleted_posts').select('data').single()
    ]);

    return {
      settings: settingsRes.data?.data as SiteSettings | null,
      posts: postsRes.data?.data as Post[] | null,
      members: membersRes.data?.data as Member[] | null,
      deletedPosts: deletedRes.data?.data as Post[] | null
    };
  } catch (error) {
    console.error("Supabase fetch error:", error);
    return null;
  }
};

/**
 * 개별 테이블 데이터 업데이트 (Upsert)
 * 테이블 구조: id (text, PK), data (jsonb), updated_at (timestamptz)
 */
const upsertData = async (tableName: string, data: any) => {
  if (!supabase) return;
  
  try {
    const { error } = await supabase
      .from(tableName)
      .upsert({ id: 'main', data, updated_at: new Date().toISOString() });
    
    if (error) throw error;
  } catch (error) {
    console.error(`Supabase save error (${tableName}):`, error);
  }
};

export const syncSettings = (settings: SiteSettings) => upsertData('union_settings', settings);
export const syncPosts = (posts: Post[]) => upsertData('union_posts', posts);
export const syncMembers = (members: Member[]) => upsertData('union_members', members);
export const syncDeletedPosts = (deletedPosts: Post[]) => upsertData('union_deleted_posts', deletedPosts);
