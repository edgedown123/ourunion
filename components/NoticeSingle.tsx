import React from "react";
import Board from "./Board";
import { Post, BoardType, UserRole } from "../types";

interface NoticeSingleProps {
  posts: Post[];
  userRole: UserRole;
  type: BoardType; // 'notice_all' | 'family_events'
  selectedPostId: string | null;
  onWriteClick: (specificType?: BoardType) => void;
  onEditClick: (post: Post) => void;
  onSelectPost: (id: string | null) => void;
  onDeletePost: (postId: string, inputPassword?: string) => void;
  onSaveComment: (postId: string, content: string, parentId?: string) => void;
  onEditComment: (post: string, commentId: string, content: string, parentId?: string) => void;
  onDeleteComment: (post: string, commentId: string, parentId?: string) => void;
}

const NoticeSingle: React.FC<NoticeSingleProps> = ({
  posts,
  userRole,
  type,
  selectedPostId,
  onWriteClick,
  onEditClick,
  onSelectPost,
  onDeletePost,
  onSaveComment,
  onEditComment,
  onDeleteComment,
}) => {
  const title = type === "family_events" ? "경조사" : "공고 / 공지";
  const subtitle = "공지사항";

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="scroll-mt-24">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg md:text-xl font-black text-gray-900">{title}</h2>
          <span className="text-xs text-gray-400 font-bold">{subtitle}</span>
        </div>

        <div className="rounded-3xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <Board
            type={type}
            posts={posts}
            onWriteClick={() => onWriteClick(type)}
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

export default NoticeSingle;
