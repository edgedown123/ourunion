import React from 'react';

interface NoticeLandingProps {
  onSelect: (tab: string) => void;
}

const NoticeLanding: React.FC<NoticeLandingProps> = ({ onSelect }) => {
  return (
    <div className="md:hidden">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">공지사항</h1>

        <div className="space-y-3">
          <button
            onClick={() => onSelect('notice_all')}
            className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm hover:bg-gray-50 active:scale-[0.99] transition"
          >
            <span className="text-base font-semibold text-gray-900">공고/공지</span>
            <i className="fas fa-chevron-right text-gray-400"></i>
          </button>

          <button
            onClick={() => onSelect('family_events')}
            className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm hover:bg-gray-50 active:scale-[0.99] transition"
          >
            <span className="text-base font-semibold text-gray-900">경조사</span>
            <i className="fas fa-chevron-right text-gray-400"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticeLanding;
