
import React, { useState } from 'react';
import { Member } from '../types';

interface SignupFormProps {
  onGoHome: () => void;
  onAddMember: (member: Omit<Member, 'id' | 'signupDate'>) => void;
  onRemoveMember?: (id: string, pass: string) => void;
  existingMembers: Member[];
}

const SignupForm: React.FC<SignupFormProps> = ({ onGoHome, onAddMember, onRemoveMember, existingMembers }) => {
  const [submitted, setSubmitted] = useState(false);
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [idError, setIdError] = useState('');
  const [isWithdrawMode, setIsWithdrawMode] = useState(false);
  
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    passwordConfirm: '',
    name: '',
    birthDate: '',
    phone: '',
    email: '',
    garage: ''
  });

  const [withdrawData, setWithdrawData] = useState({
    loginId: '',
    password: ''
  });

  // 전화번호 자동 하이픈 삽입 함수
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
    if (name === 'phone') {
      processedValue = formatPhoneNumber(value);
    }

    setFormData({ ...formData, [name]: processedValue });
    
    if (name === 'loginId') {
      setIsIdChecked(false);
      setIdError('');
    }
  };

  const handleWithdrawChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWithdrawData({ ...withdrawData, [name]: value });
  };

  const handleCheckId = () => {
    if (!formData.loginId) return alert('아이디를 입력해주세요.');
    if (formData.loginId.length < 3) return alert('아이디는 최소 3자 이상이어야 합니다.');
    
    const exists = existingMembers.some(m => m.loginId === formData.loginId);
    if (exists) {
      setIdError('이미 사용 중인 아이디입니다.');
      setIsIdChecked(false);
    } else {
      setIdError('');
      setIsIdChecked(true);
      alert('사용 가능한 아이디입니다.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isIdChecked) return alert('아이디 중복 확인을 해주세요.');
    if (formData.password !== formData.passwordConfirm) return alert('비밀번호가 일치하지 않습니다.');
    
    const { passwordConfirm, ...submitData } = formData;
    onAddMember(submitData);
    setSubmitted(true);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawData.loginId || !withdrawData.password) return alert('탈퇴할 아이디와 비밀번호를 입력해주세요.');
    onRemoveMember?.(withdrawData.loginId, withdrawData.password);
  };

  const isPasswordMismatch = formData.password && formData.passwordConfirm && formData.password !== formData.passwordConfirm;

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center animate-fadeIn">
        <div className="bg-sky-50 rounded-3xl p-12 border border-sky-100 shadow-sm">
          <i className="fas fa-check-circle text-6xl text-sky-primary mb-6"></i>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">가입 신청 완료</h2>
          <p className="text-lg text-gray-600 mb-8">
            우리노동조합 가입 신청이 정상적으로 접수되었습니다.<br/>
            지금부터 입력하신 아이디로 로그인이 가능합니다.
          </p>
          <button 
            onClick={onGoHome}
            className="bg-sky-primary text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-md mx-auto block"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-fadeIn">
      {isWithdrawMode ? (
        <div className="bg-white border rounded-3xl p-10 shadow-sm space-y-8 animate-fadeInShort">
          <div className="text-center">
            <h2 className="text-2xl font-black text-gray-900 mb-2">회원 탈퇴</h2>
            <p className="text-xs text-gray-400 font-bold">탈퇴를 위해 가입 시 등록한 정보를 입력해주세요.</p>
          </div>
          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">아이디</label>
              <input 
                required
                type="text" 
                name="loginId"
                value={withdrawData.loginId}
                onChange={handleWithdrawChange}
                className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-red-400 transition-all"
                placeholder="아이디 입력"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">비밀번호</label>
              <input 
                required
                type="password" 
                name="password"
                value={withdrawData.password}
                onChange={handleWithdrawChange}
                className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-red-400 transition-all"
                placeholder="비밀번호 입력"
              />
            </div>
            <div className="pt-4 flex space-x-2">
              <button 
                type="button"
                onClick={() => setIsWithdrawMode(false)}
                className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                취소
              </button>
              <button 
                type="submit"
                className="flex-1 py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-50 transition-all"
              >
                탈퇴 완료
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">조합원 가입 신청</h2>
            <p className="text-gray-500">노동자의 권리, 우리가 함께 지킵니다.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border rounded-3xl p-8 shadow-sm space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-black text-sky-primary uppercase tracking-widest border-b pb-2">로그인 정보</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
                <div className="flex space-x-2">
                  <input 
                    required
                    type="text" 
                    name="loginId"
                    value={formData.loginId}
                    onChange={handleChange}
                    className={`flex-1 border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-sky-primary outline-none transition-all ${isIdChecked ? 'bg-emerald-50 border-emerald-200' : ''}`}
                    placeholder=""
                  />
                  <button 
                    type="button"
                    onClick={handleCheckId}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black whitespace-nowrap"
                  >
                    중복확인
                  </button>
                </div>
                {idError && <p className="text-red-500 text-xs mt-1">{idError}</p>}
                {isIdChecked && <p className="text-emerald-500 text-xs mt-1">사용 가능한 아이디입니다.</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                  <input 
                    required
                    type="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-sky-primary outline-none ${isPasswordMismatch ? 'border-red-300 bg-red-50' : ''}`}
                    placeholder=""
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                  <input 
                    required
                    type="password" 
                    name="passwordConfirm"
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    className={`w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-sky-primary outline-none ${isPasswordMismatch ? 'border-red-300 bg-red-50' : ''}`}
                    placeholder=""
                  />
                  {isPasswordMismatch && (
                    <p className="text-red-500 text-xs mt-1 font-medium animate-fadeIn">
                      비밀번호가 일치하지 않습니다.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-black text-sky-primary uppercase tracking-widest border-b pb-2">인적 사항</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">성함</label>
                  <input 
                    required
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-sky-primary outline-none"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">생년월일 (6자리)</label>
                  <input 
                    required
                    type="text" 
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    maxLength={6}
                    pattern="\d{6}"
                    className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-sky-primary outline-none"
                    placeholder="예: 650718"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연락처(숫자만 입력하세요)</label>
                <input 
                  required
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-sky-primary outline-none"
                  placeholder="010-0000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input 
                  required
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-sky-primary outline-none"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">소속 차고지</label>
                <input 
                  required
                  type="text" 
                  name="garage"
                  value={formData.garage}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-sky-primary outline-none"
                  placeholder="예: 진관차고지, 도봉차고지, 송파차고지"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-500 leading-relaxed">
              <p className="font-bold mb-2 text-gray-700">[개인정보 수집 및 이용 동의]</p>
              입력하신 정보는 노동조합 가입 처리 및 조합원 관리를 위해서만 사용됩니다. 
              귀하는 정보 수집에 거부할 권리가 있으나, 거부 시 가입 처리가 제한될 수 있습니다.
            </div>

            <div className="space-y-3">
              <div className="flex items-start">
                <input required type="checkbox" id="agree-privacy" className="mt-1 w-4 h-4 text-sky-primary border-gray-300 rounded focus:ring-sky-primary" />
                <label htmlFor="agree-privacy" className="ml-2 text-sm text-gray-600">개인정보 수집 및 이용에 동의합니다.</label>
              </div>
              <div className="flex items-start">
                <input required type="checkbox" id="agree-manual" className="mt-1 w-4 h-4 text-sky-primary border-gray-300 rounded focus:ring-sky-primary" />
                <label htmlFor="agree-manual" className="ml-2 text-sm text-gray-600">실제 조합의 가입과 탈퇴는 문서로 작성해 제출하여야 합니다.</label>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-sky-primary text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-md"
            >
              가입 신청하기
            </button>

            <div className="pt-4 text-center border-t border-gray-100">
              <button 
                type="button"
                onClick={() => setIsWithdrawMode(true)}
                className="text-[11px] text-gray-300 font-bold hover:text-red-400 transition-colors"
              >
                이미 회원이신가요? 회원 탈퇴하기
              </button>
            </div>
          </form>
        </>
      )}
      
      <style>{`
        .animate-fadeInShort { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default SignupForm;
