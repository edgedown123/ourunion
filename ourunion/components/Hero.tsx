
import React from 'react';

interface HeroProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  onJoinClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ title, subtitle, imageUrl, onJoinClick }) => {
  return (
    <div className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block xl:inline">{title.split(' ')[0]}</span>{' '}
                <span className="block text-sky-primary xl:inline">{title.split(' ').slice(1).join(' ')}</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                {subtitle}
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <button
                    onClick={onJoinClick}
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sky-primary hover:opacity-90 md:py-4 md:text-lg md:px-10 transition-all"
                  >
                    조합 가입 안내
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <img
          className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full transition-opacity duration-700"
          src={imageUrl}
          alt="Main Hero Visual"
          // 사용자가 업로드한 파일이 우선적으로 보여지도록 에러 핸들러의 폴백 로직을 제거했습니다.
        />
      </div>
    </div>
  );
};

export default Hero;
