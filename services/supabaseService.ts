
import { createClient } from '@supabase/supabase-js';
import { SiteSettings, Post, Member } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// 수파베이스 클라이언트 초기화
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseEnabled = () => !!supabase;

/**
 * 전체 데이터 초기 로드
 */
export const fetchAllData = async () => {
  if (!supabase) return null;

  try {
    const [settingsRes, postsRes, membersRes, deletedRes] = await Promise.all([
      supabase.from('union_settings').select('data').eq('id', 'main').maybeSingle(),
      supabase.from('union_posts').select('data').eq('id', 'main').maybeSingle(),
      supabase.from('union_members').select('data').eq('id', 'main').maybeSingle(),
      supabase.from('union_deleted_posts').select('data').eq('id', 'main').maybeSingle()
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
 * 실시간 변경사항 구독 설정
 */
export const subscribeToChanges = (tableName: string, callback: (newData: any) => void) => {
  if (!supabase) return null;

  return supabase
    .channel(`public:${tableName}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: tableName, filter: 'id=eq.main' },
      (payload) => {
        if (payload.new && payload.new.data) {
          callback(payload.new.data);
        }
      }
    )
    .subscribe();
};

/**
 * 데이터 업데이트 (Upsert)
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
