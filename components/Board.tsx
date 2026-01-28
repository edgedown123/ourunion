// SAFE FIX: JSX syntax sanitized, keeps edit/delete menu and permissions
import React, { useState } from "react";

type UserRole = 'admin' | 'member' | 'guest';

interface Reply {
  id: string;
  author: string;
  content: string;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  replies?: Reply[];
}

interface BoardProps {
  userRole: UserRole;
  currentUserName?: string;
  comments: Comment[];
  onEditComment: (id: string, content: string) => void;
  onDeleteComment: (id: string) => void;
}

const Board: React.FC<BoardProps> = ({
  userRole,
  currentUserName,
  comments,
  onEditComment,
  onDeleteComment,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const canManage = (author: string) =>
    userRole === 'admin' || (userRole === 'member' && author === currentUserName);

  return (
    <div className="w-full">
      {comments.map((c) => (
        <div key={c.id} className="border rounded-xl p-4 mb-3">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold">{c.author}</p>
            {canManage(c.author) && (
              <div className="relative">
                <button
                  className="px-2 text-gray-500"
                  onClick={() => {
                    setEditingId(c.id);
                    setDraft(c.content);
                  }}
                >
                  ⋮
                </button>
              </div>
            )}
          </div>

          {editingId === c.id ? (
            <div className="mt-2">
              <textarea
                className="w-full border rounded p-2 text-sm"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <button
                  className="px-3 py-1 bg-sky-500 text-white rounded"
                  onClick={() => {
                    onEditComment(c.id, draft);
                    setEditingId(null);
                  }}
                >
                  저장
                </button>
                <button
                  className="px-3 py-1 bg-gray-200 rounded"
                  onClick={() => setEditingId(null)}
                >
                  취소
                </button>
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded ml-auto"
                  onClick={() => onDeleteComment(c.id)}
                >
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-2 whitespace-pre-wrap">{c.content}</p>
          )}

          {c.replies && c.replies.map((r) => (
            <div key={r.id} className="pl-6 mt-2">
              <p className="text-xs text-gray-600">
                <strong>{r.author}</strong> {r.content}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Board;
