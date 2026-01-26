
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
import { isSupabaseEnabled } from './services/supabaseService';

const App: React.FC = () => {
  useEffect(() => {
    console.log('🔥 Supabase 연동 상태:', isSupabaseEnabled());
  }, []);

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
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [deletedPosts, setDeletedPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const syncData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      if (cloud.isSupabaseEnabled()) {
        const [pData, mData, sData] = await Promise.all([
          cloud.fetchPostsFromCloud(),
          cloud.fetchMembersFromCloud(),
          cloud.fetchSettingsFromCloud(),
        ]);

        if (pData) setPosts(pData);
        if (mData) {
          setMembers(mData);
          localStorage.setItem('union_members', JSON.stringify(mData));
        }
        if (sData) setSettings(sData);
      } else {
        const sPosts = localStorage.getItem('union_posts');
        const sMembers = localStorage.getItem('union_members');
        const sSettings = localStorage.getItem('union_settings');
        if (sPosts) setPosts(JSON.parse(sPosts));
        if (sMembers) setMembers(JSON.parse(sMembers));
        if (sSettings) setSettings(JSON.parse(sSettings));
      }
    } catch (e) {
      console.error('데이터 동기화 오류:', e);
    } finally {
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
    const restrictedTabs = ['notice', 'notice_all', 'family_events', 'resources'];
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSavePost = async (title: string, content: string, attachments?: PostAttachment[], postPassword?: string, id?: string) => {
    let targetPost: Post;
    if (id) {
      const existing = posts.find(p => p.id === id);
      targetPost = { ...existing!, title, content, attachments, password: postPassword };
    } else {
      targetPost = {
        id: Date.now().toString(),
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
    
    alert('성공적으로 저장되었습니다.');
    setIsWriting(false);
    setEditingPost(null);
  };

  const handleSaveComment = async (postId: string, content: string, parentId?: string) => {
    if (userRole === 'guest') return alert('댓글 작성을 위해 로그인이 필요합니다.');
    
    const newComment: Comment = {
      id: Date.now().toString(),
      author: userRole === 'admin' ? '관리자' : (loggedInMember?.name || '조합원'),
      content,
      createdAt: new Date().toISOString(),
      replies: []
    };
    
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        let updatedPost;
        if (!parentId) {
          updatedPost = { ...post, comments: [...(post.comments || []), newComment] };
        } else {
          updatedPost = { 
            ...post, 
            comments: (post.comments || []).map(c => 
              c.id === parentId ? { ...c, replies: [...(c.replies || []), newComment] } : c
            ) 
          };
        }
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
    
    // 관리자가 아니면 비밀번호 확인
    if (userRole !== 'admin' && postToDelete.password && inputPassword !== postToDelete.password) {
      return alert('비밀번호가 일치하지 않습니다.');
    }
    
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    const updatedPosts = posts.filter(p => p.id !== postId);
    setPosts(updatedPosts);
    setDeletedPosts([postToDelete, ...deletedPosts]);
    saveToLocal('posts', updatedPosts);
    await cloud.deletePostFromCloud(postId);
    
    setSelectedPostId(null);
    alert('삭제가 완료되었습니다.');
  };

  const handleAddMember = async (memberData: Omit<Member, 'id' | 'signupDate'>) => {
    const newMember: Member = { 
      ...memberData, 
      id: Date.now().toString(), 
      signupDate: new Date().toISOString(),
      isApproved: false // 기본적으로 미승인 상태
    };
    
    try {
      // 1. 상태 업데이트 및 로컬 저장
      const updatedMembers = [newMember, ...members];
      setMembers(updatedMembers);
      saveToLocal('members', updatedMembers);
      
      // 2. 클라우드 저장 (Supabase)
      await cloud.saveMemberToCloud(newMember);
      console.log("신규 회원 가입 및 동기화 완료");
    } catch (error) {
      console.error("회원 가입 처리 중 오류:", error);
      alert("서버 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const handleApproveMember = async (memberId: string) => {
    const updatedMembers = members.map(m => m.id === memberId ? { ...m, isApproved: true } : m);
    setMembers(updatedMembers);
    saveToLocal('members', updatedMembers);
    
    const approvedMember = updatedMembers.find(m => m.id === memberId);
    if (approvedMember) {
      await cloud.saveMemberToCloud(approvedMember);
      alert(`${approvedMember.name}님의 가입이 승인되었습니다.`);
    }
  };

  const handleRemoveMemberByAdmin = async (memberId: string) => {
    const memberToRemove = members.find(m => m.id === memberId);
    if (!memberToRemove) return;
    
    if (!window.confirm(`${memberToRemove.name} 조합원을 강제 탈퇴 처리하시겠습니까?`)) return;

    const updatedMembers = members.filter(m => m.id !== memberId);
    setMembers(updatedMembers);
    saveToLocal('members', updatedMembers);
    await cloud.deleteMemberFromCloud(memberId);
    alert('정상적으로 처리되었습니다.');
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
      alert('관리자 모드로 접속되었습니다.');
    } else {
      alert('비밀번호가 일치하지 않습니다.');
    }
  };

  const handleMemberLogin = () => {
    if (!loginId) return alert('아이디를 입력해주세요.');
    
    const localSavedMembersStr = localStorage.getItem('union_members');
    const allMembers = localSavedMembersStr ? JSON.parse(localSavedMembersStr) : members;
    
    const found = allMembers.find((m: Member) => m.loginId === loginId);
    
    if (found) {
      if (!found.isApproved) {
        return alert('가입 승인 대기 중입니다. 관리자 승인 후 로그인이 가능합니다.');
      }
      setUserRole('member');
      const { password, ...sessionData } = found;
      setLoggedInMember(found);
      localStorage.setItem('union_role', 'member');
      localStorage.setItem('union_member', JSON.stringify(sessionData));
      setShowMemberLogin(false);
      setLoginId('');
      setLoginPassword('');
      alert(`${found.name}님, 환영합니다!`);
    } else {
      alert('회원 정보를 찾을 수 없습니다. 아이디를 확인해주세요.');
    }
  };

  const handleLogout = () => {
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
      setShowAdminLogin(true);
      return;
    }
    if (userRole === 'guest') { 
      alert('글 작성을 위해 로그인이 필요합니다.'); 
      handleTabChange('signup'); 
      return; 
    }
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-sky-100 border-t-sky-primary rounded-full animate-spin mb-6"></div>
        <p className="text-gray-400 font-bold text-sm tracking-widest animate-pulse">우리노동조합 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <Layout settings={settings}>
      <Navbar 
        siteName={settings.siteName} 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        userRole={userRole} 
        memberName={userRole === 'admin' ? '관리자' : (loggedInMember?.name || '')} 
        onToggleLogin={userRole === 'guest' ? () => setShowMemberLogin(true) : handleLogout}
      />
      
      <main className="flex-grow">
        {isWriting ? (
          <PostEditor 
            type={writingType || (activeTab as BoardType)} 
            initialPost={editingPost} 
            onSave={handleSavePost} 
            onCancel={() => { setIsWriting(false); setEditingPost(null); }} 
          />
        ) : activeTab === 'admin' ? (
          isAdminAuth ? (
            <AdminPanel 
              settings={settings} 
              setSettings={handleUpdateSettings} 
              members={members} 
              posts={posts} 
              deletedPosts={deletedPosts} 
              onRestorePost={() => {}} 
              onPermanentDelete={() => {}} 
              onEditPost={handleEditClick} 
              onViewPost={handleViewPostFromAdmin} 
              onClose={() => handleTabChange('home')} 
              onRemoveMember={handleRemoveMemberByAdmin} 
              onApproveMember={handleApproveMember}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-40">
              <i className="fas fa-lock text-4xl text-gray-200 mb-6"></i>
              <button onClick={() => setShowAdminLogin(true)} className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all">관리자 인증</button>
            </div>
          )
        ) : activeTab === 'home' ? (
          <Hero title={settings.heroTitle} subtitle={settings.heroSubtitle} imageUrls={settings.heroImageUrls || [settings.heroImageUrl]} onJoinClick={() => handleTabChange('signup')} />
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
                className={`fixed bottom-10 right-10 w-14 h-14 bg-white border border-gray-100 shadow-2xl rounded-full flex items-center justify-center text-sky-primary transition-all active:scale-90 z-40 ${isRefreshing ? 'animate-spin' : ''}`}
                title="새로고침"
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            )}
          </div>
        )}
      </main>

      {/* 로그인 모달 레이어 (Z-INDEX 100) */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] p-12 max-w-[340px] w-[90%] shadow-2xl relative text-center">
            <button onClick={() => setShowAdminLogin(false)} className="absolute top-8 right-8 text-gray-300 hover:text-gray-500 transition-colors"><i className="fas fa-times text-xl"></i></button>
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6"><i className="fas fa-key text-gray-900 text-2xl"></i></div>
            <h3 className="text-xl font-black mb-2 text-gray-900">ADMIN AUTH</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-8">관리자 비밀번호를 입력하세요</p>
            <div className="space-y-4">
              <input type="password" name="admin_pass" className="w-full border-2 border-gray-50 rounded-2xl p-4 text-center text-2xl tracking-[0.5em] focus:border-sky-primary outline-none transition-all bg-gray-50/50" autoFocus value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()} />
              <button onClick={handleAdminLogin} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl">인증하기</button>
            </div>
          </div>
        </div>
      )}

      {showMemberLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[3rem] p-10 max-w-[360px] w-[90%] shadow-2xl relative">
            <button onClick={() => setShowMemberLogin(false)} className="absolute top-8 right-8 text-gray-300 hover:text-gray-500 transition-colors"><i className="fas fa-times text-xl"></i></button>
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-sky-50 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm shadow-sky-100"><i className="fas fa-user-check text-sky-primary text-2xl"></i></div>
              <h3 className="text-2xl font-black text-gray-900">조합원 로그인</h3>
              <p className="text-[11px] text-gray-400 font-bold mt-2 tracking-tight">우리노동조합 커뮤니티에 오신 것을 환영합니다</p>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="아이디(연락처)" className="w-full border-2 border-gray-50 rounded-2xl p-4 text-sm outline-none focus:border-sky-primary transition-colors bg-gray-50/50 font-bold" value={loginId} onChange={(e) => setLoginId(e.target.value)} />
              <button onClick={handleMemberLogin} className="w-full py-4.5 bg-sky-primary text-white rounded-2xl font-black text-base shadow-xl shadow-sky-100 hover:opacity-95 active:scale-95 transition-all mt-4">로그인</button>
              <button onClick={() => { handleTabChange('signup'); setShowMemberLogin(false); }} className="w-full text-center text-xs text-gray-400 font-bold hover:text-sky-primary mt-6 transition-colors">아직 회원이 아니신가요? <span className="underline decoration-2 underline-offset-4 ml-1">신규 가입하기</span></button>
            </div>
          </div>
        </div>
      )}

      <Footer siteName={settings.siteName} onTabChange={handleTabChange} />
    </Layout>
  );
};

export default App;
