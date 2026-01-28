import React from 'react';

interface FooterProps {
  siteName: string;
  onTabChange: (tab: string) => void;
  /** 로그인/승인된 조합원에게만 노출 */
  showWithdrawButton?: boolean;
  /** 회원 탈퇴 모달 열기 */
  onRequestWithdraw?: () => void;
}

const Footer: React.FC<FooterProps> = ({ siteName, onTabChange, showWithdrawButton = false, onRequestWithdraw }) => {
  return (
    <footer className="bg-gray-100 border-t mt-auto py-12 text-gray-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          {/* 사이트 정보 및 통합 고객지원 정보 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-8 md:space-y-0">
            <div className="max-w-xl">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-sky-primary rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  <i className="fas fa-users text-white text-sm"></i>
                </div>
                <span className="font-black text-xl text-gray-900 tracking-tight">{siteName}</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-500 font-medium">
                우리는 노동자의 정당한 권리를 찾고, 더 안전하고 민주적인 노동 환경을 만들기 위해 함께합니다. 
                조합원의 목소리가 우리의 힘입니다.
              </p>
            </div>
            
            {/* 유튜브 채널 + 회원 탈퇴 버튼
                - 모바일: 2열 그리드(김동걸TV 아래 오른쪽 칸)
                - PC(md+): 3열 그리드(겸손은 힘들다 아래)
            */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 justify-start md:justify-end items-center">
              <a 
                href="https://www.youtube.com/@brt4866" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center bg-[#FF0000] text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95 text-xs font-black"
              >
                <i className="fab fa-youtube mr-2 text-base"></i> 
                한국brt축구단
              </a>
              <a 
                href="https://www.youtube.com/@SeoulCityBusDriver" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center bg-[#FF0000] text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95 text-xs font-black"
              >
                <i className="fab fa-youtube mr-2 text-base"></i> 
                김동걸TV
              </a>
              <a 
                href="https://www.youtube.com/@gyeomsonisnothing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center bg-[#FF0000] text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95 text-xs font-black"
              >
                <i className="fab fa-youtube mr-2 text-base"></i> 
                겸손은 힘들다
              </a>

              {/* 회원 탈퇴 (조합원 로그인/승인된 경우만 표시) */}
              {showWithdrawButton && (
                <button
                  type="button"
                  onClick={() => onRequestWithdraw?.()}
                  className="flex items-center bg-[#FF0000] text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95 text-xs font-black md:col-start-3 md:row-start-2"
                  aria-label="회원 탈퇴"
                >
                  <i className="fas fa-user-slash mr-2 text-base"></i>
                  회원 탈퇴
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 하단 상세 정보 */}
        <div className="border-t border-gray-200 pt-10">
          <div className="text-[11px] leading-6 font-medium text-gray-400 space-y-1">
            <p className="flex flex-wrap items-center">
              <span className="font-black text-gray-600 mr-4 text-xs">{siteName}</span>
              <span className="mr-4">위원장: 홍길동</span>
              <span>사업자등록번호: 123-45-67890</span>
            </p>
            <p>서울특별시 은평구 통일로 1190 (진관사업소 내) | FAX: 02-371-0000</p>
            <p className="mt-4 opacity-70 italic">Copyright © 2024 {siteName}. All rights reserved.</p>
          </div>
          
          <div className="flex space-x-6 mt-8 text-[11px] font-black uppercase tracking-wider">
            <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors">이용약관</a>
            <a href="#" className="text-gray-900 hover:underline">개인정보처리방침</a>
            <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors">이메일무단수집거부</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;