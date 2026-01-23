
import React, { useState, useEffect } from 'react';
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
  
  // --- 데이터 초기 로드 (새로고침 시 유지의 핵심) ---
  const [userRole, setUserRole] = useState<UserRole>(() => (localStorage.getItem('union_role') as UserRole) || 'guest');
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(() => localStorage.getItem('union_is_admin') === 'true');
  const [loggedInMember, setLoggedInMember] = useState<Member | null>(() => {
    const saved = localStorage.getItem('union_member');
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  
  const [settings, setSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('union_settings');
    try { return saved ? JSON.parse(saved) : INITIAL_SETTINGS; } catch { return INITIAL_SETTINGS; }
  });
  
  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('union_posts');
    try { return saved ? JSON.parse(saved) : INITIAL_POSTS; } catch { return INITIAL_POSTS; }
  });
  
  const [deletedPosts, setDeletedPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('union_deleted_posts');
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('union_members');
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  // 로컬 저장 모드이므로 로딩 대기는 더이상 필요 없음
  const [isLoadingData, setIsLoadingData] = useState(false);

  // --- 모든 상태 변경 시 로컬 저장소에 즉시 기록하는 헬퍼 ---
  const saveToLocal = (key: string, data: any) => {
    localStorage.setItem(`union_${key}`, JSON.stringify(data));
  };

  const handleTabChange = (tab: string) => {
    // 회원 전용 접근 제한 로직
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

  const handleSavePost = (title: string, content: string, attachments?: PostAttachment[], postPassword?: string, id?: string) => {
    let updatedPosts;
    if (id) {
      updatedPosts = posts.map(p => p.id === id ? { ...p, title, content, attachments, password: postPassword } : p);
      alert('수정되었습니다.');
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
      updatedPosts = [newPost, ...posts];
      alert('등록되었습니다.');
    }
    setPosts(updatedPosts);
    saveToLocal('posts', updatedPosts); // 즉시 저장
    setIsWriting(false);
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
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        if (!parentId) return { ...post, comments: [...(post.comments || []), newComment] };
        else return { ...post, comments: (post.comments || []).map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), newComment] } : c) };
      }
      return post;
    });
    setPosts(updatedPosts);
    saveToLocal('posts', updatedPosts); // 즉시 저장
  };

  const handleDeletePost = (postId: string, inputPassword?: string) => {
    const postToDelete = posts.find(p => p.id === postId);
    if (!postToDelete) return;
    if (postToDelete.password && inputPassword !== postToDelete.password) return alert('비밀번호 불일치');
    const updatedPosts = posts.filter(p => p.id !== postId);
    const updatedDeleted = [postToDelete, ...deletedPosts];
    setPosts(updatedPosts);
    setDeletedPosts(updatedDeleted);
    saveToLocal('posts', updatedPosts);
    saveToLocal('deleted_posts', updatedDeleted);
    setSelectedPostId(null);
    alert('삭제되었습니다.');
  };

  const handleRestorePost = (postId: string) => {
    const postToRestore = deletedPosts.find(p => p.id === postId);
    if (!postToRestore) return;
    const updatedDeleted = deletedPosts.filter(p => p.id !== postId);
    const updatedPosts = [postToRestore, ...posts];
    setDeletedPosts(updatedDeleted);
    setPosts(updatedPosts);
    saveToLocal('deleted_posts', updatedDeleted);
    saveToLocal('posts', updatedPosts);
    alert('복구되었습니다.');
  };

  const handlePermanentDelete = (postId: string) => {
    if (!window.confirm('완전 삭제하시겠습니까?')) return;
    const updatedDeleted = deletedPosts.filter(p => p.id !== postId);
    setDeletedPosts(updatedDeleted);
    saveToLocal('deleted_posts', updatedDeleted);
  };

  const handleAddMember = (memberData: Omit<Member, 'id' | 'signupDate'>) => {
    const newMember: Member = { ...memberData, id: Date.now().toString(), signupDate: new Date().toISOString().split('T')[0] };
    const updatedMembers = [newMember, ...members];
    setMembers(updatedMembers);
    saveToLocal('members', updatedMembers);
  };

  const handleUpdateSettings = (newSettings: SiteSettings) => {
    setSettings(newSettings);
    saveToLocal('settings', newSettings);
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

  const handleMemberLogin = () => {
    const member = members.find(m => m.loginId === loginId && m.password === loginPassword);
    if (member) {
      setLoggedInMember(member);
      setUserRole('member');
      localStorage.setItem('union_role', 'member');
      localStorage.setItem('union_member', JSON.stringify(member));
      setShowMemberLogin(false);
      setLoginId('');
      setLoginPassword('');
    } else alert('정보 불일치');
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

  const renderContent = () => {
    if (isWriting) return <PostEditor type={writingType || (activeTab as BoardType)} initialPost={editingPost} onSave={handleSavePost} onCancel={() => { setIsWriting(false); setEditingPost(null); }} />;
    if (activeTab === 'admin') {
      if (!isAdminAuth) return <div className="flex flex-col items-center justify-center py-20"><button onClick={() => setShowAdminLogin(true)} className="px-8 py-3 bg-sky-primary text-white rounded-xl font-bold shadow-lg hover:opacity-90">관리자 인증</button></div>;
      return <AdminPanel settings={settings} setSettings={handleUpdateSettings} members={members} posts={posts} deletedPosts={deletedPosts} onRestorePost={handleRestorePost} onPermanentDelete={handlePermanentDelete} onEditPost={handleEditClick} onViewPost={handleViewPostFromAdmin} onClose={() => handleTabChange('home')} onReported={() => {}} />;
    }
    // 첫 화면(home)에서 하단 게시판 영역 삭제
    if (activeTab === 'home') return <Hero title={settings.heroTitle} subtitle={settings.heroSubtitle} imageUrl={settings.heroImageUrl} onJoinClick={() => handleTabChange('signup')} />;
    
    if (['intro', 'greeting', 'history', 'map'].includes(activeTab)) return <Introduction settings={settings} activeTab={activeTab} />;
    if (activeTab === 'signup') return <SignupForm onGoHome={() => handleTabChange('home')} onAddMember={handleAddMember} existingMembers={members} />;
    
    // 게시판 렌더링 시 게스트라면 렌더링하지 않음 (이중 방어)
    const restrictedTabs = ['notice', 'notice_all', 'family_events', 'free', 'resources'];
    if (userRole === 'guest' && restrictedTabs.includes(activeTab)) {
        return <div className="flex flex-col items-center justify-center py-40 text-gray-400 font-bold">조합원 전용 페이지입니다.</div>;
    }

    return <Board type={activeTab as BoardType} posts={posts} onWriteClick={handleWriteClick} onEditClick={handleEditClick} selectedPostId={selectedPostId} onSelectPost={handleSelectPost} userRole={userRole} onDeletePost={handleDeletePost} onSaveComment={handleSaveComment} />;
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
      const updatedPosts = posts.map(p => p.id === id ? { ...p, views: (p.views || 0) + 1 } : p);
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
              {/* Fix: changed 'handleMemberLogin' to 'onClick' to fix TypeScript error */}
              <button onClick={handleMemberLogin} className="w-full py-3.5 bg-sky-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-100 hover:opacity-90 active:scale-95 transition-all mt-2">로그인</button>
              <button onClick={() => { handleTabChange('signup'); setShowMemberLogin(false); }} className="w-full text-center text-xs text-gray-400 font-bold hover:text-sky-primary mt-2">회원가입</button>
            </div>
          </div>
        </div>
      )}

      <Footer siteName={settings.siteName} onTabChange={handleTabChange} />
    </Layout>
  );
};

export default App;
