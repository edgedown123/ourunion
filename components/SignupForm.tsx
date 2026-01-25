import React, { useMemo, useState } from 'react';
import { Member } from '../types';

type Props = {
  onAddMember: (memberData: Omit<Member, 'id' | 'signupDate'>) => Promise<void> | void;
  onCancel: () => void;
  existingMembers: Member[];
};

const onlyDigits = (s: string) => s.replace(/\D/g, '');

export default function SignupForm({ onAddMember, onCancel, existingMembers }: Props) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [garage, setGarage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginIdTaken = useMemo(() => {
    const id = loginId.trim();
    if (!id) return false;
    return existingMembers.some(m => (m.loginId || '').toLowerCase() === id.toLowerCase());
  }, [loginId, existingMembers]);

  const validate = () => {
    const id = loginId.trim();
    if (!id) return '아이디를 입력해주세요.';
    if (loginIdTaken) return '이미 사용 중인 아이디입니다.';
    if (password.length < 6) return '비밀번호는 6자리 이상이어야 합니다. (예: 숫자 6자리)';
    if (password !== password2) return '비밀번호 확인이 일치하지 않습니다.';
    if (!name.trim()) return '성함을 입력해주세요.';
    const bd = onlyDigits(birthDate);
    if (bd.length != 6) return '생년월일은 6자리로 입력해주세요. (예: 900101)';
    const ph = onlyDigits(phone);
    if (ph.length < 9) return '연락처를 숫자만으로 입력해주세요.';
    const em = email.trim();
    if (!em.includes('@')) return '이메일을 올바르게 입력해주세요.';
    if (!garage.trim()) return '소속 차고지를 입력해주세요.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);

    setLoading(true);
    try {
      await onAddMember({
        loginId: loginId.trim(),
        password: password.trim(),
        name: name.trim(),
        birthDate: onlyDigits(birthDate),
        phone: onlyDigits(phone),
        email: email.trim(),
        garage: garage.trim(),
      } as any);

      setSubmitted(true);
    } catch (e: any) {
      // onAddMember에서 alert 처리
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center p-6">
        <h2 className="text-xl font-bold mb-2">회원가입 완료</h2>
        <p className="text-gray-600 mb-4">이제 아이디/비밀번호로 로그인하세요.</p>
        <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={onCancel}>닫기</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm mb-1">아이디</label>
        <input className="w-full border rounded px-3 py-2" value={loginId} onChange={e => setLoginId(e.target.value)} />
        {loginIdTaken && <div className="text-red-600 text-xs mt-1">이미 사용 중인 아이디입니다.</div>}
      </div>

      <div>
        <label className="block text-sm mb-1">비밀번호 (6자리 이상)</label>
        <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={e => setPassword(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm mb-1">비밀번호 확인</label>
        <input type="password" className="w-full border rounded px-3 py-2" value={password2} onChange={e => setPassword2(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm mb-1">성함</label>
        <input className="w-full border rounded px-3 py-2" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm mb-1">생년월일 (6자리)</label>
        <input className="w-full border rounded px-3 py-2" value={birthDate} onChange={e => setBirthDate(onlyDigits(e.target.value))} placeholder="예: 900101" />
      </div>

      <div>
        <label className="block text-sm mb-1">연락처 (숫자만)</label>
        <input className="w-full border rounded px-3 py-2" value={phone} onChange={e => setPhone(onlyDigits(e.target.value))} placeholder="예: 01012345678" />
      </div>

      <div>
        <label className="block text-sm mb-1">이메일</label>
        <input className="w-full border rounded px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} placeholder="예: user@example.com" />
      </div>

      <div>
        <label className="block text-sm mb-1">소속 차고지</label>
        <input className="w-full border rounded px-3 py-2" value={garage} onChange={e => setGarage(e.target.value)} />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" className="flex-1 rounded bg-blue-600 text-white py-2" disabled={loading}>
          {loading ? '처리중...' : '회원가입'}
        </button>
        <button type="button" className="flex-1 rounded border py-2" onClick={onCancel} disabled={loading}>
          취소
        </button>
      </div>
    </form>
  );
}
