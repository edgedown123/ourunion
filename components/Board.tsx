
import React from "react";
import { Link } from "react-router-dom";

interface BoardProps {
  title: string;
  writeLink?: string;
}

const Board: React.FC<BoardProps> = ({ title, writeLink, children }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">{title}</h1>
        {writeLink && (
          <Link
            to={writeLink}
            className="
              bg-sky-500 text-white rounded-full
              px-4 py-2 text-xs
              md:px-8 md:py-4 md:text-sm
              flex items-center gap-2
            "
          >
            ✏️ 글쓰기
          </Link>
        )}
      </div>
      {children}
    </div>
  );
};

export default Board;
