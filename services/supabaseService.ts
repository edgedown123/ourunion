
import { createClient } from '@supabase/supabase-js';
import { SiteSettings, Post, Member } from '../types';

const supabaseUrl = (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '') || (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : '') || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseEnabled = () => !!supabase;

/**
 * 전 종목 최신 데이터 1회 강제 조회
 */
export const fetchAllData = async () => {
  if (!supabase) return null;
  try {
    const [settingsRes, postsRes, membersRes, deletedRes] = await Promise.all([
      supabase.from('union_settings').select('data, updated_at').eq('id', 'main').maybeSingle(),
      supabase.from('union_posts').select('data, updated_at').eq('id', 'main').maybeSingle(),
      supabase.from('union_members').select('data, updated_at').eq('id', 'main').maybeSingle(),
      supabase.from('union_deleted_posts').select('data, updated_at').eq('id', 'main').maybeSingle()
    ]);

    return {
      settings: { data: settingsRes.data?.data || null, updatedAt: settingsRes.data?.updated_at },
      posts: { data: postsRes.data?.data || null, updatedAt: postsRes.data?.updated_at },
      members: { data: membersRes.data?.data || null, updatedAt: membersRes.data?.updated_at },
      deletedPosts: { data: deletedRes.data?.data || null, updatedAt: deletedRes.data?.updated_at }
    };
  } catch (error) {
    console.error("❌ 데이터 로드 실패:", error);
    return null;
  }
};

/**
 * 실시간 변경 구독
 */
export const subscribeToChanges = (tableName: string, callback: (newData: any) => void) => {
  if (!supabase) return null;

  return supabase
    .channel(`any-${tableName}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tableName, filter: 'id=eq.main' },
      (payload: any) => {
        if (payload.new && payload.new.data) {
          callback(payload.new.data);
        }
      }
    )
    .subscribe();
};

/**
 * 클라우드에 데이터 저장
 */
const upsertData = async (tableName: string, data: any) => {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from(tableName)
      .upsert({ 
        id: 'main', 
        data: data, 
        updated_at: new Date().toISOString() 
      });
    if (error) throw error;
  } catch (error) {
    console.error(`❌ [${tableName}] 저장 실패:`, error);
  }
};

export const syncSettings = (settings: SiteSettings) => upsertData('union_settings', settings);
export const syncPosts = (posts: Post[]) => upsertData('union_posts', posts);
export const syncMembers = (members: Member[]) => upsertData('union_members', members);
export const syncDeletedPosts = (deletedPosts: Post[]) => upsertData('union_deleted_posts', deletedPosts);
