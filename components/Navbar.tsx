
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
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 md:h-18">
          <button 
            onClick={() => onTabChange('home')}
            className="flex items-center cursor-pointer relative group"
          >
            <i className="fas fa-users text-sky-primary text-xl md:text-2xl mr-2"></i>
            <span className="font-black text-lg md:text-xl tracking-tight text-gray-900">{siteName}</span>
          </button>

          <div className="flex items-center space-x-3">
            {userRole !== 'guest' && (
  <div className="flex items-center mr-2">
    {userRole === 'admin' ? (
      <span className="text-[11px] md:text-xs font-bold text-gray-700">
        관리자 <span className="text-gray-400 font-normal">님</span>
      </span>
    ) : (
      <span className="text-[11px] md:text-xs font-bold text-gray-700">
        {memberName} <span className="text-gray-400 font-normal">님</span>
      </span>
    )}
  </div>
)}
            
            <button
              onClick={onToggleLogin}
              className={`text-[11px] md:text-xs px-4 py-2 rounded-full border transition-all whitespace-nowrap font-bold ${
                userRole !== 'guest' 
                  ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200' 
                  : 'bg-sky-primary text-white border-sky-primary hover:opacity-90 shadow-sm'
              }`}
            >
              {userRole === 'guest' ? '로그인' : '로그아웃'}
            </button>
            
            <button
              onClick={() => onTabChange('admin')}
              className={`p-2.5 md:p-3 rounded-full hover:bg-gray-100 transition-colors ${activeTab === 'admin' ? 'text-sky-primary' : 'text-gray-400'}`}
              title="관리자 설정"
            >
              <i className="fas fa-cog text-xl"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white px-2 md:px-4 border-b border-gray-50">
        <div className="max-w-7xl mx-auto md:overflow-visible overflow-x-auto scrollbar-hide flex items-center h-14">
          <div className="flex space-x-1 md:space-x-2 h-full items-center min-w-max md:min-w-0 md:w-full md:justify-start">
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
                  } px-2.5 md:px-5 py-2 text-[14px] md:text-base font-bold transition-all h-full border-b-2 ${
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
        <div className="bg-gray-50 px-4 animate-slideDown border-b border-gray-100">
          <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-hide flex items-center h-12">
            <div className="flex space-x-3 h-full items-center min-w-max">
              {activeParent.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => onTabChange(child.id)}
                  className={`px-4 py-1.5 text-xs md:text-sm font-bold rounded-xl transition-all ${
                    activeTab === child.id 
                      ? 'bg-sky-primary text-white shadow-md' 
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
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out forwards;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
