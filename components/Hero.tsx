
import React from 'react';

interface HeroProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  onJoinClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ title, subtitle, imageUrl, onJoinClick }) => {
  const benefits = [
    { icon: 'fa-shield-alt', title: '권익 보호', desc: '부당한 대우와 차별로부터 당신을 지키는 든든한 방패가 됩니다.' },
    { icon: 'fa-handshake', title: '고용 안정', desc: '안정적인 근로 환경과 공정한 임금 체계를 위해 함께 협상합니다.' },
    { icon: 'fa-heart', title: '복지 증진', desc: '조합원만을 위한 다양한 교육, 여가 및 의료 지원 혜택을 제공합니다.' }
  ];

  return (
    <div className="flex flex-col">
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            {/* 배경용 사선 장식 */}
            <svg
              className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
              fill="currentColor"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>

            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl animate-fadeIn">
                  <span className="block xl:inline leading-tight">{title.split(' ')[0]}</span>{' '}
                  <span className="block text-sky-primary xl:inline leading-tight">{title.split(' ').slice(1).join(' ')}</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0 font-medium">
                  {subtitle}
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-2xl shadow-xl shadow-sky-100">
                    <button
                      onClick={onJoinClick}
                      className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-black rounded-2xl text-white bg-sky-primary hover:bg-sky-600 md:py-5 md:text-lg md:px-12 transition-all active:scale-95"
                    >
                      조합 가입 신청하기
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
          />
        </div>
      </div>

      {/* 가입 홍보 섹션 */}
      <section className="bg-gray-50 py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">왜 우리노동조합과 함께해야 할까요?</h2>
            <p className="text-gray-500 font-medium">당신의 내일을 바꾸는 3가지 핵심 약속</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {benefits.map((item, idx) => (
              <div key={idx} className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-sky-primary transition-colors">
                  <i className={`fas ${item.icon} text-2xl text-sky-primary group-hover:text-white transition-colors`}></i>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
