
import React from 'react';
import { NAV_ITEMS } from '../constants';
import { UserRole } from '../types';

interface NavbarProps {
  siteName: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: UserRole;
  memberName?: string;
  onToggleLogin: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ siteName, activeTab, onTabChange, userRole, memberName, onToggleLogin }) => {
  const activeParent = NAV_ITEMS.find(item => 
    item.id === activeTab || item.children?.some(child => child.id === activeTab)
  );

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="bg-white px-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          <button 
            onClick={() => onTabChange('home')}
            className="flex items-center cursor-pointer relative group"
          >
            <i className="fas fa-users text-sky-primary text-xl mr-2"></i>
            <span className="font-black text-lg tracking-tight text-gray-900">{siteName}</span>
          </button>

          <div className="flex items-center space-x-2">
            {userRole !== 'guest' && (
              <div className="flex items-center mr-2">
                <span className="text-[11px] font-bold text-gray-700">
                  {memberName} <span className="text-gray-400 font-normal">님</span>
                </span>
                {/* 관리자 배지(ADMIN)가 여기서 제거되었습니다 */}
              </div>
            )}
            
            <button
              onClick={onToggleLogin}
              className={`text-[11px] px-3 py-1.5 rounded-full border transition-all whitespace-nowrap font-bold ${
                userRole !== 'guest' 
                  ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200' 
                  : 'bg-sky-primary text-white border-sky-primary hover:opacity-90 shadow-sm'
              }`}
            >
              {userRole === 'guest' ? '로그인' : '로그아웃'}
            </button>
            
            <button
              onClick={() => onTabChange('admin')}
              className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${activeTab === 'admin' ? 'text-sky-primary' : 'text-gray-400'}`}
              title="관리자 설정"
            >
              <i className="fas fa-cog text-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white px-4 border-b border-gray-50">
        <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-hide no-scrollbar flex items-center h-12">
          <div className="flex space-x-1 h-full items-center min-w-max">
            {NAV_ITEMS.map((item) => {
              const isActive = activeParent?.id === item.id;
              const isSignup = item.id === 'signup';
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`${
                    isActive
                      ? 'text-sky-primary font-black'
                      : 'text-gray-500 hover:text-gray-800'
                  } px-4 py-2 text-sm font-bold transition-all h-full border-b-2 ${
                    isActive ? 'border-sky-primary' : 'border-transparent'
                  } ${isSignup ? 'hidden sm:flex' : 'flex'} items-center whitespace-nowrap`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeParent && activeParent.children && (
        <div className="bg-gray-50 px-4 animate-slideDown">
          <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-hide no-scrollbar flex items-center h-10">
            <div className="flex space-x-2 h-full items-center min-w-max">
              {activeParent.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => onTabChange(child.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    activeTab === child.id 
                      ? 'bg-sky-primary text-white shadow-sm' 
                      : 'text-gray-500 hover:text-sky-primary hover:bg-white'
                  }`}
                >
                  {child.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
