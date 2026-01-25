
import React, { useState } from 'react';
import { Post, BoardType, UserRole, Comment } from '../types';
import { NAV_ITEMS } from '../constants';

interface BoardProps {
  type: BoardType;
  posts: Post[];
  onWriteClick: (specificType?: BoardType) => void;
  onEditClick: (post: Post) => void;
  selectedPostId: string | null;
  onSelectPost: (id: string | null) => void;
  userRole: UserRole;
  onDeletePost?: (id: string, password?: string) => void;
  onSaveComment?: (postId: string, content: string, parentId?: string) => void;
}

const Board: React.FC<BoardProps> = ({ 
  type, posts, onWriteClick, onEditClick, selectedPostId, 
  onSelectPost, userRole, onDeletePost, onSaveComment 
}) => {
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isEditVerifyMode, setIsEditVerifyMode] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  const selectedPost = selectedPostId ? posts.find(p => p.id === selectedPostId) : null;
  
  // 현재 보드 정보 찾기
  let boardInfo = NAV_ITEMS.find(item => item.id === type);
  if (!boardInfo) {
    for (const item of NAV_ITEMS) {
      const child = item.children?.find(c => c.id === type);
      if (child) {
        boardInfo = { id: child.id, label: child.label, icon: item.icon };
        break;
      }
    }
  }

  const handleEditAttempt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedPost) return;
    
    // 관리자 포함 모든 사용자에게 비밀번호 확인 모달 표시
    setIsEditVerifyMode(true);
    setIsDeleteMode(false);
    setVerifyPassword('');
  };

  const handleDeleteAttempt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedPost || !onDeletePost) return;
    
    // 관리자 포함 모든 사용자에게 비밀번호 확인 모달 표시
    setIsDeleteMode(true);
    setIsEditVerifyMode(false);
    setVerifyPassword('');
  };

  const handleConfirmVerify = () => {
    if (!selectedPost) return;
    if (verifyPassword !== selectedPost.password) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (isEditVerifyMode) {
      onEditClick(selectedPost);
      setIsEditVerifyMode(false);
    } else if (isDeleteMode) {
      onDeletePost?.(selectedPost.id, verifyPassword);
      setIsDeleteMode(false);
    }
    setVerifyPassword('');
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !onSaveComment || !selectedPost) return;
    onSaveComment(selectedPost.id, newComment);
    setNewComment('');
  };

  const handleReplySubmit = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim() || !onSaveComment || !selectedPost) return;
    onSaveComment(selectedPost.id, replyContent, parentId);
    setReplyContent('');
    setReplyingToId(null);
  };

  // 상세 보기 모드
  if (selectedPost) {
    const imageAttachments = selectedPost.attachments?.filter(a => a.type.startsWith('image/')) || [];
    const hasPassword = !!selectedPost.password;
    const isNoticeCategory = selectedPost.type === 'notice_all' || selectedPost.type === 'family_events';

    return (
      <div className="max-w-4xl mx-auto py-8 px-5 animate-fadeIn">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => onSelectPost(null)} className="flex items-center text-gray-500 hover:text-sky-primary group font-bold">
            <i className="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> 목록으로
          </button>
          
          <div className="flex space-x-2">
            {(userRole === 'admin' || (hasPassword && !isDeleteMode && !isEditVerifyMode)) && (
              <>
                <button 
                  onClick={handleEditAttempt} 
                  className="flex items-center font-black text-xs px-5 py-3 rounded-2xl bg-sky-50 text-sky-600 hover:bg-sky-100 transition-all shadow-md active:scale-95 border border-sky-100"
                >
                  <i className="fas fa-edit mr-2"></i> 수정
                </button>
                <button 
                  onClick={handleDeleteAttempt} 
                  className="flex items-center font-black text-xs px-5 py-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-all shadow-md active:scale-95 border border-red-100"
                >
                  <i className="fas fa-trash-alt mr-2"></i> 삭제
                </button>
              </>
            )}
          </div>
        </div>

        <article className="bg-white rounded-[2.5rem] border p-10 md:p-14 shadow-sm relative overflow-hidden mb-10">
          {(isDeleteMode || isEditVerifyMode) && (
            <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-md flex items-center justify-center p-8">
              <div className="max-w-xs w-full text-center">
                <i className={`fas ${isEditVerifyMode ? 'fa-key' : 'fa-lock'} text-5xl ${isEditVerifyMode ? 'text-sky-500' : 'text-red-500'} mb-5`}></i>
                <h4 className="text-xl font-black mb-4">{isEditVerifyMode ? '수정 비밀번호' : '삭제 비밀번호'}</h4>
                {userRole === 'admin' && (
                  <p className="text-[10px] text-gray-400 font-bold mb-4">
                    아래 표시된 <span className="text-red-500">관리자용 비번</span>을 입력해주세요.
                  </p>
                )}
                <input 
                  type="password" 
                  value={verifyPassword} 
                  onChange={(e) => setVerifyPassword(e.target.value)} 
                  className={`w-full border-2 rounded-2xl p-4 mb-6 text-center text-xl tracking-widest outline-none focus:border-opacity-100 ${isEditVerifyMode ? 'border-sky-100 focus:border-sky-500' : 'border-red-100 focus:border-red-500'}`} 
                  placeholder="****" 
                  autoFocus 
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmVerify()}
                />
                <div className="flex space-x-3">
                  <button onClick={() => { setIsDeleteMode(false); setIsEditVerifyMode(false); }} className="flex-1 py-4 bg-gray-100 rounded-2xl text-sm font-black">취소</button>
                  <button onClick={handleConfirmVerify} className={`flex-1 py-4 text-white rounded-2xl text-sm font-black shadow-lg ${isEditVerifyMode ? 'bg-sky-500' : 'bg-red-500'}`}>확인</button>
                </div>
              </div>
            </div>
          )}

          <header className="mb-12">
            {isNoticeCategory && (
              <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black border mb-4 ${selectedPost.type === 'notice_all' ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                {selectedPost.type === 'notice_all' ? '공고/공지' : '경조사'}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-black mb-8 text-gray-900 leading-tight">{selectedPost.title}</h1>
            <div className="flex flex-wrap items-center text-xs md:text-sm font-bold text-gray-400 border-b border-gray-50 pb-8 gap-y-2">
              <span className="flex items-center mr-8"><i className="fas fa-user-circle mr-2.5 text-sky-primary/50"></i>{selectedPost.author}</span>
              <span className="flex items-center mr-8"><i className="fas fa-calendar-alt mr-2.5"></i>{selectedPost.createdAt?.split('T')[0]}</span>
              <span className="flex items-center mr-8"><i className="fas fa-eye mr-2.5"></i>조회 {selectedPost.views}</span>
              {userRole === 'admin' && selectedPost.password && (
                <span className="flex items-center text-red-500 bg-red-50 px-3 py-1 rounded-full text-[10px] font-black border border-red-100 ml-auto md:ml-0">
                  <i className="fas fa-key mr-1.5"></i>관리자용 비번: {selectedPost.password}
                </span>
              )}
            </div>
          </header>

          <div className="prose prose-sky max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[200px] text-base md:text-lg">
            {selectedPost.content}
          </div>

          {imageAttachments.length > 0 && (
            <div className="mt-14 space-y-8">
              {imageAttachments.map((img, idx) => (
                <div key={idx} className="rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                  <img src={img.data} alt={`첨부 이미지 ${idx + 1}`} className="w-full h-auto object-contain bg-gray-50" />
                </div>
              ))}
            </div>
          )}

          {selectedPost.attachments && selectedPost.attachments.length > 0 && (
            <div className="mt-20 p-8 md:p-10 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
              <p className="text-xs font-black text-gray-400 mb-6 uppercase tracking-widest flex items-center">
                <i className="fas fa-paperclip mr-2.5 text-sky-primary text-base"></i> 첨부파일 ({selectedPost.attachments.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPost.attachments.map((file, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border flex items-center justify-between shadow-sm hover:border-sky-primary transition-all group">
                    <div className="flex items-center overflow-hidden">
                      <i className={`fas ${file.type.startsWith('image/') ? 'fa-file-image' : 'fa-file-alt'} text-gray-300 mr-4 text-xl`}></i>
                      <span className="text-sm font-bold text-gray-700 truncate">{file.name}</span>
                    </div>
                    <a href={file.data} download={file.name} className="ml-4 px-5 py-2 bg-sky-primary text-white text-[11px] font-black rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all">다운</a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* 댓글 섹션 */}
        <section className="bg-white rounded-[2.5rem] border p-10 md:p-14 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 mb-10 flex items-center">
            <i className="fas fa-comments mr-3 text-sky-primary"></i> 댓글 
            <span className="ml-3 bg-sky-50 text-sky-primary px-3 py-1 rounded-xl text-sm">
              {selectedPost.comments?.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0) || 0}
            </span>
          </h3>
          
          <div className="space-y-8 mb-14">
            {selectedPost.comments?.map((comment) => (
              <div key={comment.id} className="border-b border-gray-50 last:border-0 pb-8 animate-fadeIn">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-base font-black text-gray-900 flex items-center">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3 text-xs text-gray-400">
                      <i className="fas fa-user"></i>
                    </div>
                    {comment.author}
                  </span>
                  <span className="text-[11px] font-bold text-gray-300 uppercase">{comment.createdAt?.split('T')[0]}</span>
                </div>
                <p className="text-base text-gray-600 leading-relaxed pl-11 mb-3">{comment.content}</p>
                
                <div className="pl-11 flex space-x-6">
                  {userRole !== 'guest' && (
                    <button 
                      onClick={() => {
                        setReplyingToId(replyingToId === comment.id ? null : comment.id);
                        setReplyContent('');
                      }}
                      className="text-xs font-black text-sky-primary hover:underline flex items-center"
                    >
                      <i className="fas fa-reply fa-rotate-180 mr-1.5"></i> 답글쓰기
                    </button>
                  )}
                </div>

                {replyingToId === comment.id && (
                  <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="mt-6 ml-11 animate-fadeIn">
                    <div className="relative">
                      <textarea 
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="따뜻한 답글을 남겨주세요."
                        className="w-full border-2 border-sky-50 rounded-2xl p-5 text-sm focus:border-sky-primary outline-none min-h-[100px] resize-none pr-24 bg-gray-50/50"
                        autoFocus
                      />
                      <button 
                        type="submit"
                        disabled={!replyContent.trim()}
                        className="absolute right-4 bottom-4 bg-sky-primary text-white px-5 py-2.5 rounded-xl text-xs font-black disabled:opacity-30 shadow-lg"
                      >
                        등록
                      </button>
                    </div>
                  </form>
                )}

                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-6 ml-11 space-y-6 border-l-2 border-gray-100 pl-6">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-black text-gray-700 flex items-center">
                            <i className="fas fa-reply fa-rotate-180 mr-3 text-gray-300 text-xs"></i>
                            {reply.author}
                          </span>
                          <span className="text-[10px] font-bold text-gray-300 uppercase">{reply.createdAt?.split('T')[0]}</span>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed pl-7">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {userRole !== 'guest' && (
            <form onSubmit={handleCommentSubmit} className="relative pt-10 border-t">
              <textarea 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)} 
                placeholder="댓글은 댓글은 조합원의 큰 힘이 됩니다." 
                className="w-full border-2 border-gray-100 rounded-[2rem] p-6 md:p-8 text-base focus:border-sky-primary outline-none min-h-[160px] resize-none pr-32 transition-all bg-gray-50/30"
              />
              <button 
                type="submit" 
                disabled={!newComment.trim()} 
                className="absolute right-6 bottom-6 md:right-8 md:bottom-8 bg-gray-900 text-white px-8 py-3.5 rounded-2xl text-sm font-black hover:bg-black disabled:opacity-30 shadow-xl active:scale-95 transition-all"
              >
                댓글 등록
              </button>
            </form>
          )}
        </section>
      </div>
    );
  }

  // 듀얼 보드 렌더링 함수 (메인 공지사항 탭용)
  const renderDualBoard = () => {
    const noticeAllPosts = posts.filter(p => p.type === 'notice_all').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
    const familyEventPosts = posts.filter(p => p.type === 'family_events').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    const PostList = ({ title, icon, colorClass, data, typeKey }: { title: string, icon: string, colorClass: string, data: Post[], typeKey: BoardType }) => (
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
        <div className={`p-8 border-b border-gray-50 flex justify-between items-center ${colorClass}`}>
          <h3 className="text-xl font-black flex items-center">
            <i className={`fas ${icon} mr-3`}></i>
            {title}
          </h3>
        </div>
        <div className="flex-grow">
          {data.length === 0 ? (
            <div className="py-20 text-center text-gray-300 font-bold italic">최근 게시글이 없습니다.</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {data.map(post => (
                <li key={post.id}>
                  <button onClick={() => onSelectPost(post.id)} className="w-full text-left p-6 hover:bg-gray-50 transition-colors group">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-gray-700 truncate group-hover:text-sky-primary transition-colors flex-1 mr-4">{post.title}</p>
                      <span className="text-[11px] text-gray-300 font-black whitespace-nowrap">{post.createdAt?.split('T')[0]}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
        <PostList title="공고/공지" icon="fa-bullhorn" colorClass="bg-sky-primary text-white" data={noticeAllPosts} typeKey="notice_all" />
        <PostList title="경조사" icon="fa-bullhorn" colorClass="bg-sky-primary text-white" data={familyEventPosts} typeKey="family_events" />
      </div>
    );
  };

  // 일반 단일 보드 렌더링
  const filteredPosts = posts.filter(p => p.type === type).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-7xl mx-auto py-10 px-5 animate-fadeIn">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 flex items-center tracking-tight">
            <i className={`fas ${boardInfo?.icon || 'fa-list'} mr-5 text-sky-primary`}></i>
            {boardInfo?.label}
          </h2>
          <p className="text-gray-400 font-bold text-xs mt-2 ml-1">우리노동조합 소통 공간</p>
        </div>
        {userRole !== 'guest' && (userRole === 'admin' || type === 'free') && type !== 'notice' && (
          <button 
            onClick={() => onWriteClick()} 
            className="bg-sky-primary text-white px-8 py-4 rounded-[1.5rem] font-black text-sm md:text-base shadow-xl shadow-sky-100 hover:opacity-90 active:scale-95 transition-all"
          >
            <i className="fas fa-pen-nib mr-2"></i> 글쓰기
          </button>
        )}
      </div>

      {type === 'notice' ? (
        renderDualBoard()
      ) : (
        <div className="bg-white shadow-xl rounded-[3rem] border border-gray-50 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {filteredPosts.length === 0 ? (
              <li className="px-6 py-40 text-center text-gray-300 font-bold italic text-lg">작성된 게시글이 없습니다.</li>
            ) : (
              filteredPosts.map((post) => (
                <li key={post.id}>
                  <button onClick={() => onSelectPost(post.id)} className="block w-full text-left p-8 md:p-10 hover:bg-gray-50/40 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 pr-4">
                        <p className="text-lg md:text-xl font-black text-gray-800 truncate group-hover:text-sky-primary transition-colors">{post.title}</p>
                        <div className="mt-3 flex items-center space-x-4 text-xs md:text-sm text-gray-400 font-bold uppercase tracking-wider">
                          <span className="flex items-center"><i className="fas fa-user-circle mr-2 text-sky-primary/30"></i>{post.author}</span>
                          <span className="flex items-center"><i className="fas fa-eye mr-2"></i>조회 {post.views}</span>
                          {(post.comments?.length || 0) > 0 && (
                            <span className="flex items-center text-sky-500 font-black"><i className="fas fa-comment-dots mr-2"></i>{post.comments?.length}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs md:text-sm text-gray-300 font-black whitespace-nowrap pt-1">{post.createdAt?.split('T')[0]}</span>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Board;
