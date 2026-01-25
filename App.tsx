
import React, { useState, useEffect, useCallback } from 'react';
import { BoardType, Post, SiteSettings, UserRole, Member, PostAttachment, Comment } from './types';
import { INITIAL_POSTS, INITIAL_SETTINGS } from './constants';
import Layout from './components/Layout';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Board from './components/Board';
import AdminPanel from './components/AdminPanel';
import PostEditor from './components/PostEditor';
import Introduction from './components/Introduction';
import Footer from './components/Footer';
import SignupForm from './components/SignupForm';
import * as cloud from './services/supabaseService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isWriting, setIsWriting] = useState(false);
  const [writingType, setWritingType] = useState<BoardType | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showMemberLogin, setShowMemberLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [userRole, setUserRole] = useState<UserRole>(() => (localStorage.getItem('union_role') as UserRole) || 'guest');
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(() => localStorage.getItem('union_is_admin') === 'true');
  const [loggedInMember, setLoggedInMember] = useState<Member | null>(() => {
    const saved = localStorage.getItem('union_member');
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);


// ✅ 새로고침/다른 기기에서도 로그인 유지(Supabase session)
useEffect(() => {
  (async () => {
    try {
      const profile = await cloud.fetchMyProfile();
      if (!profile) return;

      const member: Member = {
        id: profile.id,
        loginId: profile.login_id || '',
        name: profile.name || '',
        birthDate: profile.birth_date || '',
        phone: profile.phone || '',
        email: profile.email || '',
        garage: profile.garage || '',
        signupDate: (profile.created_at || '').split('T')[0] || '',
      };

      setLoggedInMember(member);
      setUserRole('member');
      localStorage.setItem('union_role', 'member');
      localStorage.setItem('union_member', JSON.stringify(member));
    } catch (e) {
      // ignore
    }
  })();
}, []);

  // ✅ 안전장치: Supabase에 site_safeSettings.data가 비어있거나 일부 키가 빠져도 화면이 죽지 않도록 초기값과 병합
  const safeSettings: SiteSettings = { ...INITIAL_SETTINGS, ...(settings || ({} as SiteSettings)) };
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [deletedPosts, setDeletedPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // 데이터 동기화 함수
// 데이터 동기화 함수
const syncData = useCallback(async (showLoading = true) => {
  if (showLoading) setIsLoading(true);
  else setIsRefreshing(true);

  try {
    if (cloud.isSupabaseEnabled()) {
      const results = await Promise.allSettled([
        cloud.fetchPostsFromCloud(),
        cloud.fetchMembersFromCloud(),
        cloud.fetchSettingsFromCloud(),
      ]);

      const postsResult = results[0];
      const membersResult = results[1];
      const settingsResult = results[2];

      if (postsResult.status === 'fulfilled' && postsResult.value) setPosts(postsResult.value);
      if (membersResult.status === 'fulfilled' && membersResult.value) setMembers(membersResult.value);
      if (settingsResult.status === 'fulfilled' && settingsResult.value) setSettings({ ...INITIAL_SETTINGS, ...settingsResult.value });

      // 실패한 게 있으면 콘솔에 찍어두기(진단용)
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error('syncData failed:', ['posts', 'members', 'settings'][i], r.reason);
        }
      });
    } else {
      const sPosts = localStorage.getItem('union_posts');
      const sMembers = localStorage.getItem('union_members');
      const sSettings = localStorage.getItem('union_settings');
      if (sPosts) setPosts(JSON.parse(sPosts));
      if (sMembers) setMembers(JSON.parse(sMembers));
      if (sSettings) setSettings({ ...INITIAL_SETTINGS, ...JSON.parse(sSettings) });
    }
  } catch (e) {
    console.error('syncData error:', e);
  } finally {
    // ⭐ 어떤 상황이든 로딩은 반드시 종료
    setIsLoading(false);
    setIsRefreshing(false);
  }
}, []);


  useEffect(() => {
    syncData();
  }, [syncData]);

  const saveToLocal = (key: string, data: any) => {
    localStorage.setItem(`union_${key}`, JSON.stringify(data));
  };

  const handleTabChange = (tab: string) => {
    const restrictedTabs = ['notice', 'notice_all', 'family_events', 'free', 'resources'];
    if (userRole === 'guest' && restrictedTabs.includes(tab)) {
      alert('조합원 전용 메뉴입니다. 로그인이 필요합니다.');
      setShowMemberLogin(true);
      return;
    }
    setActiveTab(tab);
    setIsWriting(false);
    setWritingType(null);
    setEditingPost(null);
    setSelectedPostId(null);
    window.scrollTo(0, 0);
  };

  const handleSavePost = async (title: string, content: string, attachments?: PostAttachment[], postPassword?: string, id?: string) => {
    let targetPost: Post;
    if (id) {
      const existing = posts.find(p => p.id === id);
      targetPost = { ...existing!, title, content, attachments, password: postPassword };
    } else {
      targetPost = {
        id: crypto.randomUUID(),
        type: (writingType || activeTab) as BoardType,
        title,
        content,
        author: userRole === 'admin' ? '관리자' : (loggedInMember?.name || '조합원'),
        createdAt: new Date().toISOString(),
        views: 0,
        attachments: attachments,
        password: postPassword,
        comments: []
      };
    }

    const newPosts = id ? posts.map(p => p.id === id ? targetPost : p) : [targetPost, ...posts];
    setPosts(newPosts);
    saveToLocal('posts', newPosts);
    await cloud.savePostToCloud(targetPost);
    
    alert('저장되었습니다.');
    setIsWriting(false);
    setEditingPost(null);
  };

  const handleSaveComment = async (postId: string, content: string, parentId?: string) => {
    if (userRole === 'guest') return alert('댓글은 회원만 작성 가능합니다.');
    const newComment: Comment = {
      id: crypto.randomUUID(),
      author: userRole === 'admin' ? '관리자' : (loggedInMember?.name || '조합원'),
      content,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      replies: []
    };
    
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        let updatedPost;
        if (!parentId) updatedPost = { ...post, comments: [...(post.comments || []), newComment] };
        else updatedPost = { ...post, comments: (post.comments || []).map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), newComment] } : c) };
        
        cloud.savePostToCloud(updatedPost);
        return updatedPost;
      }
      return post;
    });
    
    setPosts(updatedPosts);
    saveToLocal('posts', updatedPosts);
  };

  const handleDeletePost = async (postId: string, inputPassword?: string) => {
    const postToDelete = posts.find(p => p.id === postId);
    if (!postToDelete) return;
    if (postToDelete.password && inputPassword !== postToDelete.password && userRole !== 'admin') return alert('비밀번호 불일치');
    
    const updatedPosts = posts.filter(p => p.id !== postId);
    setPosts(updatedPosts);
    setDeletedPosts([postToDelete, ...deletedPosts]);
    saveToLocal('posts', updatedPosts);
    await cloud.deletePostFromCloud(postId);
    
    setSelectedPostId(null);
    alert('삭제되었습니다.');
  };

  const handleAddMember = async (memberData: Omit<Member, 'id' | 'signupDate'>) => {
  try {
    // ✅ 정석: Supabase Auth + profiles 저장
    await cloud.signUpMember(memberData);

    // 가입 후 profiles 재로드(아이디 중복 체크/관리자 목록용)
    const refreshed = await cloud.fetchMembersFromCloud();
    if (refreshed) setMembers(refreshed);

  } catch (err: any) {
    console.error('❌ 회원가입 실패:', err);
    alert(err?.message || '회원가입에 실패했습니다.');
    throw err; // SignupForm의 submitted 처리 막기 위해 throw
  }
};
    const updatedMembers = [newMember, ...members];
    setMembers(updatedMembers);
    saveToLocal('members', updatedMembers);
    await cloud.saveMemberToCloud(newMember);
  };

  // 관리자용 회원 삭제 핸들러
  const handleRemoveMemberByAdmin = async (memberId: string) => {
    const updatedMembers = members.filter(m => m.id !== memberId);
    setMembers(updatedMembers);
    saveToLocal('members', updatedMembers);
    alert('회원 탈퇴 처리가 완료되었습니다.');
  };

  const handleUpdateSettings = async (newSettings: SiteSettings) => {
    setSettings(newSettings);
    saveToLocal('settings', newSettings);
    await cloud.saveSettingsToCloud(newSettings);
  };

  const handleAdminLogin = () => {
    if (adminPassword === '1229') {
      setIsAdminAuth(true);
      setUserRole('admin');
      localStorage.setItem('union_role', 'admin');
      localStorage.setItem('union_is_admin', 'true');
      setShowAdminLogin(false);
      setAdminPassword('');
      alert('관리자 인증 성공');
    } else alert('비밀번호 오류');
  };

const handleMemberLogin = async () => {
  try {
    const profile = await cloud.signInMember(loginId, loginPassword);

    const member: Member = {
      id: profile.id,
      loginId: profile.login_id || loginId,
      name: profile.name || '',
      birthDate: profile.birth_date || '',
      phone: profile.phone || '',
      email: profile.email || '',
      garage: profile.garage || '',
      signupDate: (profile.created_at || '').split('T')[0] || '',
    };

    setLoggedInMember(member);
    setUserRole('member');
    setShowMemberLogin(false);
    setLoginPassword('');

    localStorage.setItem('union_role', 'member');
    localStorage.setItem('union_member', JSON.stringify(member));
  } catch (err: any) {
    console.error('❌ 회원 로그인 실패:', err);
    alert(err?.message || '로그인에 실패했습니다.');
  }
};

  const handleLogout = async () => {
    await cloud.signOutMember();
    if (!window.confirm('로그아웃 하시겠습니까?')) return;
    setUserRole('guest');
    setLoggedInMember(null);
    setIsAdminAuth(false);
    localStorage.removeItem('union_role');
    localStorage.removeItem('union_is_admin');
    localStorage.removeItem('union_member');
    handleTabChange('home');
  };

  const handleWriteClick = (specificType?: BoardType) => {
    const targetType = specificType || activeTab;
    if (['notice', 'notice_all', 'family_events', 'resources'].includes(targetType as string) && userRole !== 'admin') {
      setWritingType(targetType as BoardType);
      setShowAdminLogin(true);
      return;
    }
    if (userRole === 'guest') { alert('회원 전용 기능입니다.'); handleTabChange('signup'); return; }
    setWritingType(targetType as BoardType);
    setIsWriting(true);
  };

  const handleEditClick = (post: Post) => {
    setEditingPost(post);
    setWritingType(post.type);
    setIsWriting(true);
    setSelectedPostId(null);
  };

  const handleSelectPost = (id: string | null) => {
    setSelectedPostId(id);
    if (id) {
      const updatedPosts = posts.map(p => {
        if (p.id === id) {
          const updated = { ...p, views: (p.views || 0) + 1 };
          cloud.savePostToCloud(updated);
          return updated;
        }
        return p;
      });
      setPosts(updatedPosts);
      saveToLocal('posts', updatedPosts);
    }
  };

  const handleViewPostFromAdmin = (postId: string, type: BoardType) => {
    if (type === 'notice_all' || type === 'family_events') setActiveTab('notice');
    else setActiveTab(type);
    handleSelectPost(postId);
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-sky-200 border-t-sky-primary rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-black animate-pulse">중앙 서버와 연결 중...</p>
      </div>
    );
  }

  return (
    <Layout settings={settings}>
      <Navbar 
        siteName={safeSettings.siteName} 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        userRole={userRole} 
        memberName={userRole === 'admin' ? '관리자' : (loggedInMember?.name || '')} 
        onToggleLogin={userRole === 'guest' ? () => setShowMemberLogin(true) : handleLogout}
      />
      
      <main className="flex-grow">
        {isWriting ? (
          <PostEditor type={writingType || (activeTab as BoardType)} initialPost={editingPost} onSave={handleSavePost} onCancel={() => { setIsWriting(false); setEditingPost(null); }} />
        ) : activeTab === 'admin' ? (
          isAdminAuth ? (
            <AdminPanel settings={safeSettings} setSettings={handleUpdateSettings} members={members} posts={posts} deletedPosts={deletedPosts} onRestorePost={() => {}} onPermanentDelete={() => {}} onEditPost={handleEditClick} onViewPost={handleViewPostFromAdmin} onClose={() => handleTabChange('home')} onRemoveMember={handleRemoveMemberByAdmin} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20"><button onClick={() => setShowAdminLogin(true)} className="px-8 py-3 bg-sky-primary text-white rounded-xl font-bold">관리자 인증</button></div>
          )
        ) : activeTab === 'home' ? (
          <Hero title={safeSettings.heroTitle} subtitle={safeSettings.heroSubtitle} imageUrl={safeSettings.heroImageUrl} onJoinClick={() => handleTabChange('signup')} />
        ) : ['intro', 'greeting', 'history', 'map'].includes(activeTab) ? (
          <Introduction settings={settings} activeTab={activeTab} />
        ) : activeTab === 'signup' ? (
          <SignupForm onGoHome={() => handleTabChange('home')} onAddMember={handleAddMember} existingMembers={members} />
        ) : (
          <div className="relative">
            <Board 
              type={activeTab as BoardType} 
              posts={posts} 
              onWriteClick={handleWriteClick} 
              onEditClick={handleEditClick} 
              selectedPostId={selectedPostId} 
              onSelectPost={handleSelectPost} 
              userRole={userRole} 
              onDeletePost={handleDeletePost} 
              onSaveComment={handleSaveComment} 
            />
            {!selectedPostId && (
              <button 
                onClick={() => syncData(false)}
                className={`fixed bottom-8 right-8 w-12 h-12 bg-white border shadow-lg rounded-full flex items-center justify-center text-sky-primary transition-all active:scale-95 z-40 ${isRefreshing ? 'animate-spin' : ''}`}
                title="데이터 새로고침"
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            )}
          </div>
        )}
      </main>
      
      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-10 max-w-[320px] w-full shadow-2xl relative">
            <button onClick={() => setShowAdminLogin(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"><i className="fas fa-times text-lg"></i></button>
            <h3 className="text-xl font-black mb-6 text-center uppercase tracking-widest text-gray-900">Admin Login</h3>
            <div className="space-y-4">
              <input type="password" name="admin_pass" className="w-full border-2 border-gray-100 rounded-2xl p-3 text-center text-xl tracking-[0.4em] focus:border-sky-primary outline-none transition-all" autoFocus value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()} />
              <button onClick={handleAdminLogin} className="w-full py-3 bg-gray-900 text-white rounded-2xl font-bold text-base hover:bg-black transition-all">인증하기</button>
            </div>
          </div>
        </div>
      )}

      {showMemberLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2rem] p-8 max-w-[320px] w-[90%] shadow-2xl relative">
            <button onClick={() => setShowMemberLogin(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><i className="fas fa-times text-lg"></i></button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><i className="fas fa-user-circle text-sky-primary text-2xl"></i></div>
              <h3 className="text-xl font-black text-gray-900">조합원 로그인</h3>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="아이디" className="w-full border-2 border-gray-50 rounded-xl p-3 text-sm outline-none focus:border-sky-primary transition-colors bg-gray-50/50" value={loginId} onChange={(e) => setLoginId(e.target.value)} />
              <input type="password" placeholder="비밀번호" className="w-full border-2 border-gray-50 rounded-xl p-3 text-sm outline-none focus:border-sky-primary transition-colors bg-gray-50/50" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleMemberLogin()} />
              <button onClick={handleMemberLogin} className="w-full py-3.5 bg-sky-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-100 hover:opacity-90 active:scale-95 transition-all mt-2">로그인</button>
              <button onClick={() => { handleTabChange('signup'); setShowMemberLogin(false); }} className="w-full text-center text-xs text-gray-400 font-bold hover:text-sky-primary mt-4">신규 회원가입</button>
            </div>
          </div>
        </div>
      )}

      <Footer siteName={safeSettings.siteName} onTabChange={handleTabChange} />
    </Layout>
  );
};

export default App;