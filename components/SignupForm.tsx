
import React, { useState } from 'react';
import { Member } from '../types';

interface SignupFormProps {
  onGoHome: () => void;
  onAddMember: (member: Omit<Member, 'id' | 'signupDate'>) => void;
  existingMembers: Member[];
}

const SignupForm: React.FC<SignupFormProps> = ({ onGoHome, onAddMember }) => {
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    phone: '',
    email: '',
    garage: ''
  });

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const len = phoneNumber.length;
    if (len < 4) return phoneNumber;
    if (len < 8) return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    if (len < 11) return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7)}`;
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'phone') processedValue = formatPhoneNumber(value);
    setFormData({ ...formData, [name]: processedValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 인적 사항 확인
    if (!formData.name || !formData.phone || !formData.garage) {
      return alert('필수 항목을 모두 입력해주세요.');
    }

    // 아이디가 없는 시스템이므로, 내부 관리를 위해 연락처를 loginId 대용으로 사용하거나 비워둡니다.
    // 여기서는 연락처(하이픈 제거)를 임시 loginId로 할당하여 기존 로직과의 호환성을 유지합니다.
    const submitData = {
      ...formData,
      loginId: formData.phone.replace(/-/g, '')
    };

    onAddMember(submitData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center animate-fadeIn">
        <div className="bg-sky-50 rounded-3xl p-12 border border-sky-100 shadow-sm">
          <i className="fas fa-check-circle text-6xl text-sky-primary mb-6"></i>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">가입 신청 완료</h2>
          <p className="text-lg text-gray-600 mb-8">우리노동조합 가입 신청이 정상적으로 접수되었습니다.<br/>관리자 확인 후 개별 연락드리겠습니다.</p>
          <button onClick={onGoHome} className="bg-sky-primary text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 shadow-md mx-auto block">홈으로 돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-fadeIn">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">조합원 가입 신청</h2>
        <p className="text-gray-500">노동자의 권리, 우리가 함께 지킵니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-3xl p-8 shadow-sm space-y-8">
        <div className="space-y-6">
          <h3 className="text-sm font-black text-sky-primary uppercase tracking-widest border-b pb-2 flex items-center">
            <i className="fas fa-id-card mr-2"></i> 인적 사항
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">성함</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-sky-primary outline-none transition-all" placeholder="성함을 입력하세요" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">생년월일 (6자리)</label>
              <input required type="text" name="birthDate" value={formData.birthDate} onChange={handleChange} maxLength={6} pattern="\d{6}" className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-sky-primary outline-none transition-all" placeholder="예: 650718" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">연락처</label>
            <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-sky-primary outline-none transition-all" placeholder="010-0000-0000" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">이메일 주소</label>
            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-sky-primary outline-none transition-all" placeholder="example@email.com" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">소속 차고지</label>
            <input required type="text" name="garage" value={formData.garage} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-sky-primary outline-none transition-all" placeholder="예: 진관, 도봉, 송파 등" />
          </div>
        </div>

        <div className="pt-4">
          <button type="submit" className="w-full bg-sky-primary text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 shadow-xl shadow-sky-100 transition-all active:scale-[0.98]">가입 신청서 제출하기</button>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl text-center">
          <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
            신청하신 정보는 개인정보처리방침에 따라 보호되며,<br/>
            조합 가입 승인 및 연락 이외의 용도로 사용되지 않습니다.
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignupForm;
