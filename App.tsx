
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { isSupabaseEnabled, fetchAllData, syncSettings, syncPosts, syncMembers, syncDeletedPosts, subscribeToChanges } from './services/supabaseService';

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
  
  const [userRole, setUserRole] = useState<UserRole>(() => (localStorage.getItem('union_user_role') as UserRole) || 'guest');
  const [loggedInMember, setLoggedInMember] = useState<Member | null>(() => {
    try {
      const saved = localStorage.getItem('union_logged_in_member');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(() => localStorage.getItem('union_is_admin_auth') === 'true');
  
  const [showNewMemberPopup, setShowNewMemberPopup] = useState(false);
  const [lastReportedCount, setLastReportedCount] = useState<number>(() => Number(localStorage.getItem('union_last_report_count') || 0));

  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [deletedPosts, setDeletedPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // 동기화 제어용 Refs
  const lastSyncHash = useRef<{ [key: string]: string }>({});
  const isInternalUpdate = useRef(false);

  /**
   * 클라우드로부터 모든 데이터를 긁어와서 로컬과 대조 후 업데이트
   */
  const refreshEverything = useCallback(async () => {
    if (!isSupabaseEnabled()) return;
    
    const cloud = await fetchAllData();
    if (!cloud) return;

    // 데이터가 있고, 마지막으로 동기화했던 문자열과 다를 때만 상태 업데이트
    const updateIfChanged = (key: string, newData: any, setter: Function) => {
      if (!newData) return;
      const dataStr = JSON.stringify(newData);
      if (dataStr !== lastSyncHash.current[key]) {
        console.log(`🔄 [${key}] 클라우드 데이터로 동기화됨`);
        lastSyncHash.current[key] = dataStr;
        isInternalUpdate.current = true;
        setter(newData);
        setTimeout(() => { isInternalUpdate.current = false; }, 100);
      }
    };

    updateIfChanged('settings', cloud.settings.data, setSettings);
    updateIfChanged('posts', cloud.posts.data, setPosts);
    updateIfChanged('members', cloud.members.data, setMembers);
    updateIfChanged('deletedPosts', cloud.deletedPosts.data, setDeletedPosts);
  }, []);

  // 1. 초기 로드 및 주기적 동기화 (Polling) + 이벤트 리스너
  useEffect(() => {
    refreshEverything();

    // 10초마다 자동 체크 (안전장치)
    const pollInterval = setInterval(refreshEverything, 10000);

    // 사용자가 탭을 다시 볼 때 즉시 체크
    const handleFocus = () => {
      console.log("👀 화면이 보입니다. 최신 데이터를 가져옵니다.");
      refreshEverything();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refreshEverything();
    });

    // 실시간 구독 (Instant)
    const subSettings = subscribeToChanges('union_settings', refreshEverything);
    const subPosts = subscribeToChanges('union_posts', refreshEverything);
    const subMembers = subscribeToChanges('union_members', refreshEverything);
    const subDeleted = subscribeToChanges('union_deleted_posts', refreshEverything);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      subSettings?.unsubscribe();
      subPosts?.unsubscribe();
      subMembers?.unsubscribe();
      subDeleted?.unsubscribe();
    };
  }, [refreshEverything]);

  // 2. 로컬에서 데이터 변경 시 클라우드 전송
  useEffect(() => {
    if (!isInternalUpdate.current) {
      const dataStr = JSON.stringify(settings);
      if (dataStr !== lastSyncHash.current['settings']) {
        lastSyncHash.current['settings'] = dataStr;
        localStorage.setItem('union_settings', dataStr);
        if (isSupabaseEnabled()) syncSettings(settings);
      }
    }
  }, [settings]);

  useEffect(() => {
    if (!isInternalUpdate.current) {
      const dataStr = JSON.stringify(posts);
      if (dataStr !== lastSyncHash.current['posts']) {
        lastSyncHash.current['posts'] = dataStr;
        localStorage.setItem('union_posts', dataStr);
        if (isSupabaseEnabled()) syncPosts(posts);
      }
    }
  }, [posts]);

  useEffect(() => {
    if (!isInternalUpdate.current) {
      const dataStr = JSON.stringify(members);
      if (dataStr !== lastSyncHash.current['members']) {
        lastSyncHash.current['members'] = dataStr;
        localStorage.setItem('union_members', dataStr);
        if (isSupabaseEnabled()) syncMembers(members);
      }
    }
  }, [members]);

  useEffect(() => {
    if (!isInternalUpdate.current) {
      const dataStr = JSON.stringify(deletedPosts);
      if (dataStr !== lastSyncHash.current['deletedPosts']) {
        lastSyncHash.current['deletedPosts'] = dataStr;
        localStorage.setItem('union_deleted_posts', dataStr);
        if (isSupabaseEnabled()) syncDeletedPosts(deletedPosts);
      }
    }
  }, [deletedPosts]);

  // 로그인 상태 및 역할 저장
  useEffect(() => {
    localStorage.setItem('union_user_role', userRole);
    localStorage.setItem('union_is_admin_auth', isAdminAuth.toString());
    if (loggedInMember) localStorage.setItem('union_logged_in_member', JSON.stringify(loggedInMember));
    else localStorage.removeItem('union_logged_in_member');
  }, [userRole, loggedInMember, isAdminAuth]);

  // 관리자 알림 팝업 제어
  useEffect(() => {
    if (isAdminAuth && members.length > lastReportedCount) {
      setShowNewMemberPopup(true);
    }
  }, [isAdminAuth, members.length, lastReportedCount]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsWriting(false);
    setWritingType(null);
    setEditingPost(null);
    setSelectedPostId(null);
    window.scrollTo(0, 0);
  };

  const handleSavePost = (title: string, content: string, attachments?: PostAttachment[], postPassword?: string, id?: string) => {
    if (id) {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, title, content, attachments, password: postPassword } : p));
      alert('게시글이 수정되었습니다.');
    } else {
      const newPost: Post = {
        id: Date.now().toString(),
        type: (writingType || activeTab) as BoardType,
        title,
        content,
        author: userRole === 'admin' ? '관리자' : (loggedInMember?.name || '조합원'),
        createdAt: new Date().toISOString().split('T')[0],
        views: 0,
        attachments: attachments,
        password: postPassword,
        comments: []
      };
      setPosts(prev => [newPost, ...prev]);
      alert('게시글이 등록되었습니다.');
    }
    setIsWriting(false);
    setWritingType(null);
    setEditingPost(null);
  };

  const handleSaveComment = (postId: string, content: string, parentId?: string) => {
    if (userRole === 'guest') return alert('댓글은 회원만 작성 가능합니다.');
    const newComment: Comment = {
      id: Date.now().toString(),
      author: userRole === 'admin' ? '관리자' : (loggedInMember?.name || '조합원'),
      content,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      replies: []
    };
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        if (!parentId) return { ...post, comments: [...(post.comments || []), newComment] };
        else return { ...post, comments: (post.comments || []).map(comment => comment.id === parentId ? { ...comment, replies: [...(comment.replies || []), newComment] } : comment) };
      }
      return post;
    }));
  };

  const handleDeletePost = (postId: string, inputPassword?: string) => {
    const postToDelete = posts.find(p => p.id === postId);
    if (!postToDelete) return;
    if (postToDelete.password && inputPassword !== postToDelete.password) return alert('비밀번호가 일치하지 않습니다.');
    setPosts(prev => prev.filter(p => p.id !== postId));
    setDeletedPosts(prev => [postToDelete, ...prev]);
    setSelectedPostId(null);
    alert('삭제 처리되었습니다.');
  };

  const handleRestorePost = (postId: string) => {
    const postToRestore = deletedPosts.find(p => p.id === postId);
    if (!postToRestore) return;
    setDeletedPosts(prev => prev.filter(p => p.id !== postId));
    setPosts(prev => [postToRestore, ...prev]);
    alert('게시글이 복구되었습니다.');
  };

  const handlePermanentDelete = (postId: string) => {
    if (!window.confirm('영구 삭제하시겠습니까?')) return;
    setDeletedPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleAddMember = (memberData: Omit<Member, 'id' | 'signupDate'>) => {
    const newMember: Member = { ...memberData, id: Date.now().toString(), signupDate: new Date().toISOString().split('T')[0] };
    setMembers(prev => [newMember, ...prev]);
  };

  const handleWriteClick = (specificType?: BoardType) => {
    const targetType = specificType || activeTab;
    if (['notice', 'notice_all', 'family_events', 'resources'].includes(targetType as string) && userRole !== 'admin') {
      setWritingType(targetType as BoardType);
      setShowAdminLogin(true);
      return;
    }
    if (userRole === 'guest') {
      alert('회원 전용 기능입니다.');
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
    if (id) setPosts(prev => prev.map(p => p.id === id ? { ...p, views: (p.views || 0) + 1 } : p));
  };

  const handleAdminLogin = () => {
    if (adminPassword === '1229') {
      setIsAdminAuth(true);
      setUserRole('admin');
      setShowAdminLogin(false);
      setAdminPassword('');
      alert('관리자 인증 성공');
    } else alert('비밀번호 오류');
  };

  const handleMemberLogin = () => {
    const member = members.find(m => m.loginId === loginId && m.password === loginPassword);
    if (member) {
      setLoggedInMember(member);
      setUserRole('member');
      setIsAdminAuth(false);
      setShowMemberLogin(false);
      setLoginId('');
      setLoginPassword('');
      alert(`${member.name}님 환영합니다!`);
    } else alert('정보가 일치하지 않습니다.');
  };

  const handleLogout = () => {
    setUserRole('guest');
    setLoggedInMember(null);
    setIsAdminAuth(false);
    handleTabChange('home');
    alert('로그아웃 되었습니다.');
  };

  const handleConfirmNewMembers = () => {
    localStorage.setItem('union_last_report_count', members.length.toString());
    setLastReportedCount(members.length);
    setShowNewMemberPopup(false);
  };

  const handleViewPostFromAdmin = (postId: string, type: BoardType) => {
    if (type === 'notice_all' || type === 'family_events') setActiveTab('notice');
    else setActiveTab(type);
    handleSelectPost(postId);
    window.scrollTo(0, 0);
  };

  const renderContent = () => {
    if (isWriting) return <PostEditor type={writingType || (activeTab as BoardType)} initialPost={editingPost} onSave={handleSavePost} onCancel={() => { setIsWriting(false); setEditingPost(null); }} />;
    if (activeTab === 'admin') {
      if (!isAdminAuth) return <div className="flex flex-col items-center justify-center py-20"><button onClick={() => setShowAdminLogin(true)} className="px-8 py-3 bg-sky-primary text-white rounded-xl font-bold shadow-lg hover:opacity-90">관리자 인증</button></div>;
      return <AdminPanel settings={settings} setSettings={setSettings} members={members} posts={posts} deletedPosts={deletedPosts} onRestorePost={handleRestorePost} onPermanentDelete={handlePermanentDelete} onEditPost={handleEditClick} onViewPost={handleViewPostFromAdmin} onClose={() => handleTabChange('home')} onReported={() => { setLastReportedCount(members.length); localStorage.setItem('union_last_report_count', members.length.toString()); }} />;
    }
    if (activeTab === 'home') return <><Hero title={settings.heroTitle} subtitle={settings.heroSubtitle} imageUrl={settings.heroImageUrl} onJoinClick={() => handleTabChange('signup')} /><Board type="notice" posts={posts.slice(0, 10)} onWriteClick={handleWriteClick} onEditClick={handleEditClick} selectedPostId={selectedPostId} onSelectPost={handleSelectPost} userRole={userRole} onDeletePost={handleDeletePost} onSaveComment={handleSaveComment} /></>;
    if (['intro', 'greeting', 'history', 'map'].includes(activeTab)) return <Introduction settings={settings} activeTab={activeTab} />;
    if (activeTab === 'signup') return <SignupForm onGoHome={() => handleTabChange('home')} onAddMember={handleAddMember} existingMembers={members} />;
    return <Board type={activeTab as BoardType} posts={posts} onWriteClick={handleWriteClick} onEditClick={handleEditClick} selectedPostId={selectedPostId} onSelectPost={handleSelectPost} userRole={userRole} onDeletePost={handleDeletePost} onSaveComment={handleSaveComment} />;
  };

  return (
    <Layout settings={settings}>
      <Navbar siteName={settings.siteName} activeTab={activeTab} onTabChange={handleTabChange} userRole={userRole} memberName={userRole === 'admin' ? '관리자' : loggedInMember?.name} onToggleLogin={userRole === 'guest' ? () => setShowMemberLogin(true) : handleLogout} />
      <main className="flex-grow">{renderContent()}</main>
      
      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-10 max-w-[320px] w-full shadow-2xl relative">
            <button onClick={() => setShowAdminLogin(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"><i className="fas fa-times text-lg"></i></button>
            <h3 className="text-xl font-black mb-6 text-center uppercase tracking-widest">Admin</h3>
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
              {/* Fix: Added missing onClick handler and corrected syntax which was breaking JSX parsing */}
              <button onClick={handleMemberLogin} className="w-full py-3.5 bg-sky-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-100 hover:opacity-90 active:scale-95 transition-all mt-2">로그인</button>
              <button onClick={() => { handleTabChange('signup'); setShowMemberLogin(false); }} className="w-full text-center text-xs text-gray-400 font-bold hover:text-sky-primary mt-2">아직 회원이 아니신가요? 가입하기</button>
            </div>
          </div>
        </div>
      )}

      {showNewMemberPopup && (
        <div className="fixed bottom-8 right-8 z-[110] animate-fadeIn">
          <div className="bg-gray-900 text-white rounded-2xl p-6 max-w-xs shadow-2xl border border-white/10">
            <h3 className="text-lg font-bold mb-2 flex items-center"><i className="fas fa-user-plus text-sky-400 mr-2"></i> 신규 가입 발생</h3>
            <p className="text-sm text-gray-300 mb-6">{members.length - lastReportedCount}명의 신청이 대기 중입니다.</p>
            <button onClick={handleConfirmNewMembers} className="w-full py-2 bg-sky-primary rounded-lg text-xs font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all">확인</button>
          </div>
        </div>
      )}
      <Footer siteName={settings.siteName} onTabChange={handleTabChange} />
    </Layout>
  );
};

export default App;
