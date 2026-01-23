
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
    setIsEditVerifyMode(true);
    setIsDeleteMode(false);
    setVerifyPassword('');
  };

  const handleDeleteAttempt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedPost || !onDeletePost) return;
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

  const renderPostItem = (post: Post) => (
    <li key={post.id}>
      <button onClick={() => { onSelectPost(post.id); setIsDeleteMode(false); setIsEditVerifyMode(false); setVerifyPassword(''); }} className="block w-full text-left hover:bg-gray-50 transition-colors border-b last:border-0">
        <div className="px-4 py-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center flex-1 truncate">
              {post.attachments && post.attachments.length > 0 && <span className="mr-2 text-gray-400 text-[10px] flex items-center"><i className="fas fa-paperclip"></i></span>}
              <p className="text-[13px] font-medium text-gray-900 truncate">{post.title}</p>
              {(post.comments?.length || 0) > 0 && (
                <span className="ml-2 text-[9px] bg-sky-50 text-sky-600 px-1 py-0.5 rounded font-bold">
                  {post.comments?.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0)}
                </span>
              )}
            </div>
            <span className="ml-2 text-[10px] text-gray-400 whitespace-nowrap">{post.createdAt}</span>
          </div>
          <div className="flex justify-between items-center text-[9px] text-gray-500">
             <span>{post.author}</span>
             <span><i className="fas fa-eye mr-1"></i>{post.views}</span>
          </div>
        </div>
      </button>
    </li>
  );

  if (selectedPost) {
    const imageAttachments = selectedPost.attachments?.filter(a => a.type.startsWith('image/')) || [];
    const hasPassword = !!selectedPost.password;

    return (
      <div className="max-w-4xl mx-auto py-8 px-4 animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => onSelectPost(null)} className="flex items-center text-gray-500 hover:text-sky-primary group">
            <i className="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> 목록으로 돌아가기
          </button>
          
          <div className="flex space-x-2">
            {hasPassword && !isDeleteMode && !isEditVerifyMode && (
              <>
                <button 
                  onClick={handleEditAttempt} 
                  className="flex items-center font-black text-xs px-5 py-2.5 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 transition-all shadow-md active:scale-95 border border-sky-100"
                >
                  <i className="fas fa-edit mr-2"></i> 수정
                </button>
                <button 
                  onClick={handleDeleteAttempt} 
                  className="flex items-center font-black text-xs px-5 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all shadow-md active:scale-95"
                >
                  <i className="fas fa-trash-alt mr-2"></i> 삭제
                </button>
              </>
            )}
          </div>
        </div>

        <article className="bg-white rounded-[2rem] border p-8 sm:p-12 shadow-sm relative overflow-hidden mb-8">
          {(isDeleteMode || isEditVerifyMode) && (
            <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="max-w-xs w-full text-center">
                <i className={`fas ${isEditVerifyMode ? 'fa-key' : 'fa-lock'} text-4xl ${isEditVerifyMode ? 'text-sky-500' : 'text-red-500'} mb-4`}></i>
                <h4 className="text-lg font-bold mb-2">{isEditVerifyMode ? '수정 비밀번호' : '삭제 비밀번호'} 확인</h4>
                <input 
                  type="password" 
                  value={verifyPassword} 
                  onChange={(e) => setVerifyPassword(e.target.value)} 
                  className={`w-full border-2 rounded-xl p-3 mb-4 text-center outline-none focus:border-opacity-100 ${isEditVerifyMode ? 'border-sky-100 focus:border-sky-500' : 'border-red-100 focus:border-red-500'}`} 
                  placeholder="비밀번호 입력" 
                  autoFocus 
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmVerify()}
                />
                <div className="flex space-x-2">
                  <button onClick={() => { setIsDeleteMode(false); setIsEditVerifyMode(false); }} className="flex-1 py-3 bg-gray-100 rounded-xl text-sm font-bold">취소</button>
                  <button onClick={handleConfirmVerify} className={`flex-1 py-3 text-white rounded-xl text-sm font-bold ${isEditVerifyMode ? 'bg-sky-500' : 'bg-red-500'}`}>확인</button>
                </div>
              </div>
            </div>
          )}

          <header className="mb-10">
            <h1 className="text-3xl font-black mb-6 text-gray-900 leading-tight">{selectedPost.title}</h1>
            <div className="flex flex-wrap items-center text-xs font-bold text-gray-400 border-b border-gray-50 pb-6">
              <span className="flex items-center mr-6"><i className="fas fa-user-circle mr-2"></i>{selectedPost.author}</span>
              <span className="flex items-center mr-6"><i className="fas fa-calendar-alt mr-2"></i>{selectedPost.createdAt}</span>
              <span className="flex items-center mr-6"><i className="fas fa-eye mr-2"></i>조회 {selectedPost.views}</span>
              
              {userRole === 'admin' && selectedPost.password && (
                <span className="flex items-center bg-amber-50 text-amber-600 px-3 py-1 rounded-full border border-amber-100 ml-auto">
                  <i className="fas fa-key mr-2"></i> 등록된 비밀번호: <span className="ml-1 font-black">{selectedPost.password}</span>
                </span>
              )}
            </div>
          </header>

          <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[150px]">
            {selectedPost.content}
          </div>

          {imageAttachments.length > 0 && (
            <div className="mt-12 space-y-6">
              {imageAttachments.map((img, idx) => (
                <div key={idx} className="rounded-2xl overflow-hidden shadow-lg border">
                  <img src={img.data} alt={`첨부 이미지 ${idx + 1}`} className="w-full h-auto object-contain bg-gray-50" />
                  <div className="bg-gray-50 px-4 py-2 text-[10px] font-bold text-gray-400 italic">
                    <i className="fas fa-image mr-1"></i> {img.name}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedPost.attachments && selectedPost.attachments.length > 0 && (
            <div className="mt-16 p-8 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
              <p className="text-xs font-black text-gray-400 mb-6 uppercase tracking-widest flex items-center">
                <i className="fas fa-paperclip mr-2 text-sky-primary"></i> 첨부파일 ({selectedPost.attachments.length})
              </p>
              <div className="grid grid-cols-1 gap-3">
                {selectedPost.attachments.map((file, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border flex items-center justify-between shadow-sm hover:border-sky-primary transition-colors group">
                    <div className="flex items-center">
                      <i className={`fas ${file.type.startsWith('image/') ? 'fa-file-image' : 'fa-file-alt'} text-gray-300 mr-3 group-hover:text-sky-primary transition-colors`}></i>
                      <span className="text-sm font-bold text-gray-700 truncate max-w-[200px] sm:max-w-md">{file.name}</span>
                    </div>
                    <a href={file.data} download={file.name} className="px-4 py-1.5 bg-sky-primary text-white text-[11px] font-black rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all">다운로드</a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        <section className="bg-white rounded-[2rem] border p-8 sm:p-12 shadow-sm">
          <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center">
            <i className="fas fa-comments mr-2 text-sky-primary"></i> 댓글 
            <span className="ml-2 bg-sky-50 text-sky-primary px-2 py-0.5 rounded-lg text-sm">
              {selectedPost.comments?.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0) || 0}
            </span>
          </h3>
          
          <div className="space-y-6 mb-12">
            {selectedPost.comments?.map((comment) => (
              <div key={comment.id} className="border-b border-gray-50 last:border-0 pb-6 animate-fadeIn">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-black text-gray-900 flex items-center">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-2 text-[10px] text-gray-400">
                      <i className="fas fa-user"></i>
                    </div>
                    {comment.author}
                  </span>
                  <span className="text-[10px] font-bold text-gray-300 uppercase">{comment.createdAt}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed pl-8 mb-2">{comment.content}</p>
                
                <div className="pl-8 flex space-x-4">
                  {userRole !== 'guest' && (
                    <button 
                      onClick={() => {
                        setReplyingToId(replyingToId === comment.id ? null : comment.id);
                        setReplyContent('');
                      }}
                      className="text-[11px] font-black text-sky-primary hover:underline"
                    >
                      답글쓰기
                    </button>
                  )}
                </div>

                {replyingToId === comment.id && (
                  <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="mt-4 ml-8 animate-fadeInShort">
                    <div className="relative">
                      <textarea 
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="답글 내용을 입력하세요."
                        className="w-full border-2 border-sky-50 rounded-xl p-4 text-xs focus:border-sky-primary outline-none min-h-[80px] resize-none pr-20 bg-gray-50/50"
                        autoFocus
                      />
                      <button 
                        type="submit"
                        disabled={!replyContent.trim()}
                        className="absolute right-3 bottom-3 bg-sky-primary text-white px-4 py-1.5 rounded-lg text-[10px] font-black disabled:opacity-30"
                      >
                        등록
                      </button>
                    </div>
                  </form>
                )}

                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 ml-8 space-y-4 border-l-2 border-gray-100 pl-4">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-black text-gray-700 flex items-center">
                            <i className="fas fa-reply fa-rotate-180 mr-2 text-gray-300 text-[10px]"></i>
                            {reply.author}
                          </span>
                          <span className="text-[9px] font-bold text-gray-300 uppercase">{reply.createdAt}</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed pl-6">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {userRole !== 'guest' && (
            <form onSubmit={handleCommentSubmit} className="relative pt-8 border-t">
              <textarea 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)} 
                placeholder="댓글을 입력해주세요." 
                className="w-full border-2 border-gray-100 rounded-2xl p-5 text-sm focus:border-sky-primary outline-none min-h-[120px] resize-none pr-28 transition-all bg-gray-50/30"
              />
              <button 
                type="submit" 
                disabled={!newComment.trim()} 
                className="absolute right-4 bottom-4 bg-gray-900 text-white px-6 py-2.5 rounded-xl text-xs font-black hover:bg-black disabled:opacity-30 shadow-lg active:scale-95 transition-all"
              >
                등록
              </button>
            </form>
          )}
        </section>
      </div>
    );
  }

  if (type === 'notice') {
    const noticeAllPosts = posts.filter(p => p.type === 'notice_all' || p.type === 'notice');
    const familyEventPosts = posts.filter(p => p.type === 'family_events');
    return (
      <div className="max-w-7xl mx-auto py-4 px-4 animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="bg-white rounded-2xl border shadow-sm overflow-hidden border-t-4 border-t-sky-primary">
            <div className="p-3 border-b bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-900 flex items-center">
                <i className="fas fa-bullhorn mr-2 text-sky-primary"></i> 공고/공지
              </h3>
            </div>
            <ul className="divide-y divide-gray-100 min-h-[180px]">
              {noticeAllPosts.length === 0 ? <li className="px-6 py-12 text-center text-gray-400 text-[11px] font-bold italic">공지사항이 없습니다.</li> : noticeAllPosts.map(renderPostItem)}
            </ul>
          </section>
          <section className="bg-white rounded-2xl border shadow-sm overflow-hidden border-t-4 border-t-rose-500">
            <div className="p-3 border-b bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-900 flex items-center">
                <i className="fas fa-calendar-alt mr-2 text-rose-500"></i> 경조사 안내
              </h3>
            </div>
            <ul className="divide-y divide-gray-100 min-h-[180px]">
              {familyEventPosts.length === 0 ? <li className="px-6 py-12 text-center text-gray-400 text-[11px] font-bold italic">경조사 소식이 없습니다.</li> : familyEventPosts.map(renderPostItem)}
            </ul>
          </section>
        </div>
      </div>
    );
  }

  const filteredPosts = posts.filter(p => p.type === type);
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 animate-fadeIn">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-gray-900 flex items-center">
          <i className={`fas ${boardInfo?.icon || 'fa-list'} mr-4 text-sky-primary`}></i>
          {boardInfo?.label || '게시판'}
        </h2>
        {userRole !== 'guest' && (userRole === 'admin' || type === 'free') && (
          <button 
            onClick={() => onWriteClick()} 
            className="bg-sky-primary text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl hover:opacity-90 transition-all"
          >
            글쓰기
          </button>
        )}
      </div>
      <div className="bg-white shadow-xl rounded-[2.5rem] border overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {filteredPosts.length === 0 ? <li className="px-6 py-32 text-center text-gray-500 font-bold italic">작성된 게시글이 없습니다.</li> : filteredPosts.map((post) => (
            <li key={post.id}>
              <button onClick={() => onSelectPost(post.id)} className="block w-full text-left p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center"><p className="text-sm font-black text-gray-800 truncate">{post.title}</p><span className="text-xs text-gray-300 font-bold">{post.createdAt}</span></div>
                <div className="mt-2 flex text-[10px] text-gray-400 font-bold uppercase tracking-wider"><span className="mr-4">작성자: {post.author}</span><span>조회: {post.views}</span></div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Board;
