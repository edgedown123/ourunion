
import { createClient } from '@supabase/supabase-js';
import { SiteSettings, Post, Member } from '../types';

// Vite와 Vercel 환경 모두 지원하도록 환경 변수 로드
const supabaseUrl = (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '') || (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : '') || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }) 
  : null;

export const isSupabaseEnabled = () => {
  return !!supabase;
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
    console.error("❌ 초기 데이터 로드 실패:", error);
    return null;
  }
};

export const subscribeToChanges = (tableName: string, callback: (newData: any) => void) => {
  if (!supabase) return null;

  console.log(`📡 [${tableName}] 실시간 감시단 가동...`);
  
  const channel = supabase
    .channel(`public:${tableName}:main`)
    .on(
      'postgres_changes',
      { 
        event: '*', // UPDATE뿐만 아니라 INSERT 등 모든 변화 감지
        schema: 'public', 
        table: tableName,
        filter: 'id=eq.main' 
      },
      (payload) => {
        // 데이터가 실제로 존재하고 변화가 있을 때만 콜백 실행
        if (payload.new && payload.new.data) {
          console.log(`✨ [${tableName}] 클라우드에서 새 신호 감지!`);
          callback(payload.new.data);
        }
      }
    );

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`✅ [${tableName}] 실시간 연결 성공!`);
    }
    if (status === 'CHANNEL_ERROR') {
      console.error(`❌ [${tableName}] 연결 오류! 대시보드 설정을 확인하세요.`);
    }
  });

  return channel;
};

const upsertData = async (tableName: string, data: any) => {
  if (!supabase) return;
  try {
    // 업데이트 시각을 포함하여 upsert 수행
    const { error } = await supabase
      .from(tableName)
      .upsert({ 
        id: 'main', 
        data: data, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'id' });
      
    if (error) throw error;
  } catch (error) {
    console.error(`❌ [${tableName}] 데이터 전송 실패:`, error);
  }
};

export const syncSettings = (settings: SiteSettings) => upsertData('union_settings', settings);
export const syncPosts = (posts: Post[]) => upsertData('union_posts', posts);
export const syncMembers = (members: Member[]) => upsertData('union_members', members);
export const syncDeletedPosts = (deletedPosts: Post[]) => upsertData('union_deleted_posts', deletedPosts);
