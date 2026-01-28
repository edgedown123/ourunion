import React from "react";

interface BoardProps {
  title: string;
  writeLink?: string;
}

const Board: React.FC<React.PropsWithChildren<BoardProps>> = ({
  title,
  writeLink,
  children,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">{title}</h1>

        {writeLink && (
          <a
            href={writeLink}
            className="bg-sky-500 text-white rounded-full px-4 py-2 text-xs md:px-8 md:py-4 md:text-sm flex items-center gap-2"
          >
            ✏️ 글쓰기
          </a>
        )}
      </div>
      {children}
    </div>
  );
};

export default Board;
