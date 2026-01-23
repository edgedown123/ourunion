
import { createClient } from '@supabase/supabase-js';
import { SiteSettings, Post, Member } from '../types';

// 환경 변수 가져오기 (Vite define 또는 기본 process.env)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseEnabled = () => {
  const enabled = !!supabase;
  if (!enabled) console.warn("⚠️ Supabase 설정이 누락되었습니다.");
  return enabled;
};

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
      settings: settingsRes.data?.data || null,
      posts: postsRes.data?.data || null,
      members: membersRes.data?.data || null,
      deletedPosts: deletedRes.data?.data || null
    };
  } catch (error) {
    console.error("❌ 초기 로드 실패:", error);
    return null;
  }
};

export const subscribeToChanges = (tableName: string, callback: (newData: any) => void) => {
  if (!supabase) return null;

  console.log(`📡 [${tableName}] 실시간 구독 시작...`);
  
  return supabase
    .channel(`any-name-${tableName}`) // 고유 채널명
    .on(
      'postgres_changes',
      { 
        event: 'UPDATE', // 업데이트 이벤트에 집중
        schema: 'public', 
        table: tableName,
        filter: 'id=eq.main' 
      },
      (payload) => {
        if (payload.new && payload.new.data) {
          console.log(`✨ [${tableName}] 실시간 데이터 도착!`, payload.new.data);
          callback(payload.new.data);
        }
      }
    )
    .subscribe((status) => {
      console.log(`📡 [${tableName}] 구독 상태:`, status);
      if (status === 'CHANNEL_ERROR') {
        console.error(`❗ [${tableName}] 실시간 설정 확인 필요: Supabase 대시보드 > Database > Replication에서 이 테이블의 Realtime이 켜져있나요?`);
      }
    });
};

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
    console.log(`✅ [${tableName}] 클라우드 저장 완료`);
  } catch (error) {
    console.error(`❌ [${tableName}] 저장 실패:`, error);
  }
};

export const syncSettings = (settings: SiteSettings) => upsertData('union_settings', settings);
export const syncPosts = (posts: Post[]) => upsertData('union_posts', posts);
export const syncMembers = (members: Member[]) => upsertData('union_members', members);
export const syncDeletedPosts = (deletedPosts: Post[]) => upsertData('union_deleted_posts', deletedPosts);
