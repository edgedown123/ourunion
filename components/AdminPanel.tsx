
import React, { useRef, useState } from 'react';
import { SiteSettings, Member, Post, BoardType } from '../types';

interface AdminPanelProps {
  settings: SiteSettings;
  setSettings: (settings: SiteSettings) => void;
  members: Member[];
  posts: Post[];
  deletedPosts: Post[];
  onRestorePost: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEditPost: (post: Post) => void;
  onViewPost: (id: string, type: BoardType) => void;
  onClose: () => void;
  onRemoveMember?: (id: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  settings, setSettings, members, posts, deletedPosts, 
  onRestorePost, onPermanentDelete, onEditPost, onViewPost, onClose, onRemoveMember
}) => {
  const heroImageRef = useRef<HTMLInputElement>(null);
  const greetingImageRef = useRef<HTMLInputElement>(null);
  const officeMapInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  
  const [adminTab, setAdminTab] = useState<'members' | 'intro' | 'offices' | 'posts' | 'settings'>('members');
  const [activeOfficeId, setActiveOfficeId] = useState<string | null>(settings.offices[0]?.id || null);

  const [newYear, setNewYear] = useState('');
  const [newMonth, setNewMonth] = useState('');
  const [newDay, setNewDay] = useState('');
  const [newText, setNewText] = useState('');

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'heroImageUrl' | 'greetingImageUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setSettings({ ...settings, [field]: reader.result as string }); };
      reader.readAsDataURL(file);
    }
  };

  const handleOfficeMapUpload = (e: React.ChangeEvent<HTMLInputElement>, officeId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedOffices = settings.offices.map(off => off.id === officeId ? { ...off, mapImageUrl: reader.result as string } : off);
        setSettings({ ...settings, offices: updatedOffices });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddHistory = () => {
    if (!newYear || !newText) return alert('연도와 내용은 필수로 입력해주세요.');
    let dateStr = `${newYear}년`;
    if (newMonth) dateStr += ` ${newMonth}월`;
    if (newDay) dateStr += ` ${newDay}일`;
    const updatedHistory = [{ year: dateStr, text: newText }, ...(settings.history || [])];
    setSettings({ ...settings, history: updatedHistory });
    setNewYear(''); setNewMonth(''); setNewDay(''); setNewText('');
  };

  const handleDeleteHistory = (index: number) => {
    const updatedHistory = settings.history.filter((_, i) => i !== index);
    setSettings({ ...settings, history: updatedHistory });
  };

  const handleDownloadExcel = () => {
    if (members.length === 0) return alert('다운로드할 명단이 없습니다.');
    const headers = ['성함', '연락처', '이메일', '차고지', '가입일'];
    const rows = members.map(m => [m.name, m.phone, m.email, m.garage, m.signupDate]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `우리노동조합_조합원명단.csv`;
    link.click();
  };

  const handleExportData = () => {
    const backupData = { settings, posts, members, deletedPosts, version: "1.2", date: new Date().toLocaleString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `우리노동조합_전체백업_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (confirm('전체 데이터를 덮어씌우시겠습니까? 이 작업은 취소할 수 없습니다.')) {
          localStorage.setItem('union_settings', JSON.stringify(json.settings));
          localStorage.setItem('union_posts', JSON.stringify(json.posts));
          localStorage.setItem('union_members', JSON.stringify(json.members));
          localStorage.setItem('union_deleted_posts', JSON.stringify(json.deletedPosts || []));
          alert('데이터 복원이 완료되었습니다. 페이지를 새로고침합니다.');
          window.location.reload();
        }
      } catch (err) { alert('파일을 읽는 중 오류가 발생했습니다.'); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 animate-fadeIn">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl border shadow-sm">
        <div className="flex items-center">
          <div className="w-14 h-14 bg-sky-primary text-white rounded-2xl flex items-center justify-center mr-5 shadow-lg shadow-sky-100">
            <i className="fas fa-shield-alt text-2xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">관리자 커맨드 센터</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
              Secure System Management
            </p>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-gray-400">
          <i className="fas fa-times text-2xl"></i>
        </button>
      </div>

      <div className="flex space-x-1 mb-8 bg-gray-100/50 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide no-scrollbar">
        {[ 
          { id: 'members', label: '조합원 관리', icon: 'fa-users' }, 
          { id: 'intro', label: '인사말/소개 관리', icon: 'fa-info-circle' }, 
          { id: 'offices', label: '찾아오시는 길', icon: 'fa-map-marker-alt' }, 
          { id: 'posts', label: '게시글/휴지통', icon: 'fa-file-alt' }, 
          { id: 'settings', label: '시스템 설정', icon: 'fa-cog' } 
        ].map((tab) => (
          <button key={tab.id} onClick={() => setAdminTab(tab.id as any)} className={`flex items-center space-x-2 px-6 py-3.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${adminTab === tab.id ? 'bg-white text-sky-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            <i className={`fas ${tab.icon}`}></i><span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {adminTab === 'members' && (
          <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/30">
              <div><h3 className="text-xl font-black text-gray-900">가입 신청 명단</h3><p className="text-xs text-gray-400 mt-1 font-bold">현재 총 {members.length}명의 신청자가 있습니다.</p></div>
              <button onClick={handleDownloadExcel} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-50 hover:bg-emerald-700 transition-all"><i className="fas fa-file-excel mr-2"></i> 엑셀로 내려받기</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">성함</th>
                    <th className="px-8 py-5">연락처</th>
                    <th className="px-8 py-5">이메일</th>
                    <th className="px-8 py-5">차고지</th>
                    <th className="px-8 py-5">가입일</th>
                    <th className="px-8 py-5">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {members.length === 0 ? (
                    <tr><td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-bold italic">아직 가입 신청자가 없습니다.</td></tr>
                  ) : members.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5 font-black text-gray-900">{m.name}</td>
                      <td className="px-8 py-5 text-gray-600">{m.phone}</td>
                      <td className="px-8 py-5 text-gray-600 font-medium">{m.email}</td>
                      <td className="px-8 py-5 text-gray-600 font-bold">{m.garage}</td>
                      <td className="px-8 py-5 text-gray-400 text-xs font-medium">{m.signupDate}</td>
                      <td className="px-8 py-5">
                        <button 
                          onClick={() => {
                            if (confirm(`${m.name} 조합원을 강제 탈퇴시키겠습니까?`)) {
                              onRemoveMember?.(m.id);
                            }
                          }}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm active:scale-95"
                        >
                          강제탈퇴
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {adminTab === 'intro' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-8">
              <h3 className="font-black text-gray-900 text-lg flex items-center"><i className="fas fa-comment-dots mr-3 text-sky-primary"></i> 인사말 편집</h3>
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border relative group">
                  <img src={settings.greetingImageUrl} className="w-full h-full object-cover" />
                  <button onClick={() => greetingImageRef.current?.click()} className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold">사진 교체하기</button>
                  <input type="file" ref={greetingImageRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'greetingImageUrl')} />
                </div>
                <input type="text" name="greetingTitle" value={settings.greetingTitle} onChange={handleSettingsChange} className="w-full border-2 border-gray-100 rounded-xl p-4 text-sm font-bold focus:border-sky-primary outline-none" placeholder="인사말 제목" />
                <textarea name="greetingMessage" value={settings.greetingMessage} onChange={handleSettingsChange} className="w-full border-2 border-gray-100 rounded-xl p-4 text-sm h-40 focus:border-sky-primary outline-none resize-none" placeholder="인사말 본문" />
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-8">
              <h3 className="font-black text-gray-900 text-lg flex items-center"><i className="fas fa-history mr-3 text-sky-primary"></i> 연혁 데이터 관리</h3>
              <div className="bg-sky-50/50 p-6 rounded-2xl border border-sky-100 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" placeholder="연(2025)" value={newYear} onChange={e => setNewYear(e.target.value)} className="border rounded-lg p-3 text-sm outline-none focus:border-sky-primary" />
                  <input type="text" placeholder="월(01)" value={newMonth} onChange={e => setNewMonth(e.target.value)} className="border rounded-lg p-3 text-sm outline-none focus:border-sky-primary" />
                  <input type="text" placeholder="일(01)" value={newDay} onChange={e => setNewDay(e.target.value)} className="border rounded-lg p-3 text-sm outline-none focus:border-sky-primary" />
                </div>
                <div className="flex space-x-2">
                  <input type="text" placeholder="연혁 내용을 입력하세요" value={newText} onChange={e => setNewText(e.target.value)} className="flex-1 border rounded-lg p-3 text-sm outline-none focus:border-sky-primary" />
                  <button onClick={handleAddHistory} className="px-6 py-3 bg-sky-primary text-white rounded-lg font-black text-sm whitespace-nowrap shadow-md">추가</button>
                </div>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {settings.history.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl group border border-transparent hover:border-sky-100 transition-all">
                    <div className="flex items-center space-x-4">
                      <span className="font-black text-sky-700 text-sm w-32">{item.year}</span>
                      <span className="text-sm text-gray-700 font-medium">{item.text}</span>
                    </div>
                    <button onClick={() => handleDeleteHistory(idx)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fas fa-trash-alt"></i></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {adminTab === 'offices' && (
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm animate-fadeIn">
            <h3 className="font-black text-gray-900 text-lg mb-8 flex items-center"><i className="fas fa-map-marked-alt mr-3 text-sky-primary"></i> 찾아오시는 길 관리</h3>
            <div className="flex space-x-2 mb-8 border-b pb-4 overflow-x-auto scrollbar-hide no-scrollbar">
              {settings.offices.map(off => (
                <button key={off.id} onClick={() => setActiveOfficeId(off.id)} className={`px-6 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap ${activeOfficeId === off.id ? 'bg-sky-primary text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>{off.name}</button>
              ))}
            </div>
            {settings.offices.find(o => o.id === activeOfficeId) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1 tracking-widest uppercase">사업소 이름</label>
                    <input type="text" value={settings.offices.find(o => o.id === activeOfficeId)?.name} onChange={(e) => { const updated = settings.offices.map(o => o.id === activeOfficeId ? { ...o, name: e.target.value } : o); setSettings({ ...settings, offices: updated }); }} className="w-full border-2 border-gray-100 rounded-xl p-4 font-bold text-sm outline-none focus:border-sky-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1 tracking-widest uppercase">주소</label>
                    <input type="text" value={settings.offices.find(o => o.id === activeOfficeId)?.address} onChange={(e) => { const updated = settings.offices.map(o => o.id === activeOfficeId ? { ...o, address: e.target.value } : o); setSettings({ ...settings, offices: updated }); }} className="w-full border-2 border-gray-100 rounded-xl p-4 font-bold text-sm outline-none focus:border-sky-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1 tracking-widest uppercase">전화번호</label>
                    <input type="text" value={settings.offices.find(o => o.id === activeOfficeId)?.phone} onChange={(e) => { const updated = settings.offices.map(o => o.id === activeOfficeId ? { ...o, phone: e.target.value } : o); setSettings({ ...settings, offices: updated }); }} className="w-full border-2 border-gray-100 rounded-xl p-4 font-bold text-sm outline-none focus:border-sky-primary" />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-400 mb-1 tracking-widest uppercase">지도/전경 이미지</label>
                  <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border relative group shadow-inner">
                    <img src={settings.offices.find(o => o.id === activeOfficeId)?.mapImageUrl} className="w-full h-full object-cover" />
                    <button onClick={() => officeMapInputRef.current?.click()} className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold">이미지 변경</button>
                    <input type="file" ref={officeMapInputRef} className="hidden" accept="image/*" onChange={(e) => handleOfficeMapUpload(e, activeOfficeId!)} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {adminTab === 'posts' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
              <div className="p-8 border-b bg-gray-50/30 flex justify-between items-center">
                <h3 className="font-black text-gray-900">게시글 관리</h3>
                <span className="text-xs text-gray-400 font-bold">총 {posts.length}개</span>
              </div>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
                    <tr><th className="px-8 py-4">구분</th><th className="px-8 py-4">제목</th><th className="px-8 py-4">작성자</th><th className="px-8 py-4">관리</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {posts.length === 0 ? (
                      <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-bold italic">게시글이 없습니다.</td></tr>
                    ) : posts.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/50">
                        <td className="px-8 py-4"><span className="text-[10px] bg-sky-50 text-sky-600 px-2 py-1 rounded font-black">{p.type}</span></td>
                        <td className="px-8 py-4 font-bold text-gray-700 truncate max-w-xs">{p.title}</td>
                        <td className="px-8 py-4 text-gray-400">{p.author}</td>
                        <td className="px-8 py-4 space-x-4">
                          <button onClick={() => onViewPost(p.id, p.type)} className="text-sky-500 hover:underline font-bold text-xs">보기</button>
                          <button onClick={() => onEditPost(p)} className="text-gray-500 hover:text-gray-900 font-bold text-xs">수정</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-red-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b bg-red-50/30 flex justify-between items-center">
                <h3 className="font-black text-red-900 flex items-center"><i className="fas fa-trash-alt mr-3"></i> 휴지통</h3>
                <span className="text-xs text-red-400 font-bold">{deletedPosts.length}개의 삭제된 글</span>
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-gray-50">
                    {deletedPosts.length === 0 ? (
                      <tr><td className="px-8 py-10 text-center text-gray-300 font-bold italic">휴지통이 비어 있습니다.</td></tr>
                    ) : deletedPosts.map(p => (
                      <tr key={p.id} className="hover:bg-red-50/20">
                        <td className="px-8 py-4 font-bold text-gray-500 truncate max-w-sm">{p.title}</td>
                        <td className="px-8 py-4 text-right space-x-4">
                          <button onClick={() => onRestorePost(p.id)} className="text-sky-500 font-black text-xs hover:underline">복구</button>
                          <button onClick={() => onPermanentDelete(p.id)} className="text-red-400 font-black text-xs hover:underline">영구삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {adminTab === 'settings' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm space-y-12">
              <div>
                <h3 className="font-black text-gray-900 text-lg mb-8 flex items-center"><i className="fas fa-palette mr-3 text-sky-primary"></i> 메인 화면 설정</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-gray-400 mb-1 tracking-widest uppercase">대표 이미지</label>
                    <div className="aspect-video bg-gray-50 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl relative group">
                      <img src={settings.heroImageUrl} className="w-full h-full object-cover" />
                      <button onClick={() => heroImageRef.current?.click()} className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center font-black"><i className="fas fa-camera text-3xl mb-2"></i>사진 변경하기</button>
                      <input type="file" ref={heroImageRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'heroImageUrl')} />
                    </div>
                  </div>
                  <div className="space-y-6 flex flex-col justify-center">
                    <div><label className="block text-[10px] font-black text-gray-400 mb-2 tracking-widest uppercase">사이트 이름</label><input type="text" name="siteName" value={settings.siteName} onChange={handleSettingsChange} className="w-full border-2 border-gray-100 rounded-2xl p-4 font-black text-xl text-sky-primary outline-none focus:border-sky-primary shadow-sm" /></div>
                    <div><label className="block text-[10px] font-black text-gray-400 mb-2 tracking-widest uppercase">메인 슬로건</label><input type="text" name="heroTitle" value={settings.heroTitle} onChange={handleSettingsChange} className="w-full border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:border-sky-primary" /></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl space-y-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-black mb-2 flex items-center"><i className="fas fa-sync-alt mr-3 text-sky-400"></i> 데이터 백업 및 관리</h3>
                  <p className="text-sm text-gray-400 font-bold leading-relaxed">다른 기기로 데이터를 옮기기 위해 백업 파일을 활용하세요.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={handleExportData} className="group flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all active:scale-95">
                  <div className="w-12 h-12 bg-sky-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform"><i className="fas fa-file-export text-xl"></i></div>
                  <span className="font-black text-sm mb-1">데이터 내보내기</span>
                </button>
                <button onClick={() => importFileInputRef.current?.click()} className="group flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all active:scale-95">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform"><i className="fas fa-file-import text-xl"></i></div>
                  <span className="font-black text-sm mb-1">데이터 가져오기</span>
                  <input type="file" ref={importFileInputRef} className="hidden" accept="application/json" onChange={handleImportData} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{` .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; } `}</style>
    </div>
  );
};

export default AdminPanel;
