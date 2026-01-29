import React, { useEffect, useRef } from "react";
import Board from "./Board";
import { Post, BoardType, UserRole, Comment } from "../types";

interface NoticeCombinedProps {
  posts: Post[];
  userRole: UserRole;
  activeTab: string; // 'notice_all' | 'family_events' (and parent 'notice' is normalized in App)
  selectedPostId: string | null;

  onWriteClick: (specificType?: BoardType) => void;
  onEditClick: (post: Post) => void;
  onSelectPost: (id: string | null) => void;
  onDeletePost: (postId: string, inputPassword?: string) => void;

  onSaveComment: (postId: string, content: string, parentId?: string) => void;
  onEditComment: (postId: string, commentId: string, content: string, parentId?: string) => void;
  onDeleteComment: (postId: string, commentId: string, parentId?: string) => void;
}

const NoticeCombined: React.FC<NoticeCombinedProps> = ({
  posts,
  userRole,
  activeTab,
  selectedPostId,
  onWriteClick,
  onEditClick,
  onSelectPost,
  onDeletePost,
  onSaveComment,
  onEditComment,
  onDeleteComment,
}) => {
  const generalRef = useRef<HTMLDivElement | null>(null);
  const familyRef = useRef<HTMLDivElement | null>(null);

  // 하위 탭(공고/공지 or 경조사)을 눌렀을 때 해당 섹션으로 스크롤
  useEffect(() => {
    const id = activeTab === "family_events" ? "notice-section-family" : "notice-section-general";
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-10">
      <div id="notice-section-general" ref={generalRef} className="scroll-mt-24">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg md:text-xl font-black text-gray-900">공고 / 공지</h2>
          <span className="text-xs text-gray-400 font-bold">공지사항</span>
        </div>

        <div className="rounded-3xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <Board
            type={"notice_all" as BoardType}
            posts={posts}
            onWriteClick={() => onWriteClick("notice_all")}
            onEditClick={onEditClick}
            selectedPostId={selectedPostId}
            onSelectPost={onSelectPost}
            userRole={userRole}
            onDeletePost={onDeletePost}
            onSaveComment={onSaveComment}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
          />
        </div>
      </div>

      <div id="notice-section-family" ref={familyRef} className="scroll-mt-24">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg md:text-xl font-black text-gray-900">경조사</h2>
          <span className="text-xs text-gray-400 font-bold">공지사항</span>
        </div>

        <div className="rounded-3xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <Board
            type={"family_events" as BoardType}
            posts={posts}
            onWriteClick={() => onWriteClick("family_events")}
            onEditClick={onEditClick}
            selectedPostId={selectedPostId}
            onSelectPost={onSelectPost}
            userRole={userRole}
            onDeletePost={onDeletePost}
            onSaveComment={onSaveComment}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
          />
        </div>
      </div>
    </div>
  );
};

export default NoticeCombined;
