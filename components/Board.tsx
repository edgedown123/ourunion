
// 기존 Board.tsx 기반 – 댓글 입력창 높이만 축소
// 다른 로직은 건드리지 않음

import React from "react";

interface BoardProps {
  title: string;
  children: React.ReactNode;
}

const Board: React.FC<BoardProps> = ({ title, children }) => {
  return (
    <div className="w-full">
      {children}

      {/* 댓글 영역 */}
      <section className="mt-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base font-semibold">댓글</span>
        </div>

        {/* 댓글 입력 박스 */}
        <div className="border rounded-xl p-3 bg-white">
          <textarea
            className="w-full resize-none border rounded-lg p-2 text-sm h-20 md:h-24"
            placeholder="댓글을 입력하세요"
          />
          <div className="flex justify-end mt-2">
            <button
              className="px-4 py-2 text-sm rounded-lg bg-gray-300 text-gray-700"
            >
              댓글 등록
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Board;
