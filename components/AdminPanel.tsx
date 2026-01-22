
import React, { useRef, useState } from 'react';
import { SiteSettings, Member, OfficeItem, Post, BoardType } from '../types';

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
  onReported?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  settings, setSettings, members, posts, deletedPosts, 
  onRestorePost, onPermanentDelete, onEditPost, onViewPost, onClose 
}) => {
  const heroImageRef = useRef<HTMLInputElement>(null);
  const greetingImageRef = useRef<HTMLInputElement>(null);
  const officeMapInputRef = useRef<HTMLInputElement>(null);
  
  const [activeOfficeId, setActiveOfficeId] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'members' | 'intro' | 'offices' | 'posts' | 'settings'>('members');
  
  const [newYear, setNewYear] = useState('');
  const [newText, setNewText] = useState('');
  const [newMissionItem, setNewMissionItem] = useState('');

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'heroImageUrl' | 'greetingImageUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOfficeChange = (officeId: string, field: keyof OfficeItem, value: string) => {
    const updatedOffices = settings.offices.map(off => 
      off.id === officeId ? { ...off, [field]: value } : off
    );
    setSettings({ ...settings, offices: updatedOffices });
  };

  const handleOfficeMapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeOfficeId) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedOffices = settings.offices.map(off => 
          off.id === activeOfficeId ? { ...off, mapImageUrl: reader.result as string } : off
        );
        setSettings({ ...settings, offices: updatedOffices });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddHistory = () => {
    if (!newYear || !newText) return alert('연도와 내용을 모두 입력해주세요.');
    const updatedHistory = [{ year: newYear, text: newText }, ...(settings.history || [])];
    setSettings({ ...settings, history: updatedHistory });
    setNewYear('');
    setNewText('');
  };

  const handleDeleteHistory = (index: number) => {
    const updatedHistory = settings.history.filter((_, i) => i !== index);
    setSettings({ ...settings, history: updatedHistory });
  };

  const handleAddMission = () => {
    if (!newMissionItem) return;
    setSettings({ ...settings, missionItems: [...(settings.missionItems || []), newMissionItem] });
    setNewMissionItem('');
  };

  const handleDeleteMission = (index: number) => {
    const updated = (settings.missionItems || []).filter((_, i) => i !== index);
    setSettings({ ...settings, missionItems: updated });
  };

  const handleDownloadExcel = () => {
    if (members.length === 0) return alert('다운로드할 명단이 없습니다.');
    const headers = ['이름', '연락처', '이메일', '차고지', '가입일'];
    const rows = members.map(m => [m.name, m.phone, m.email, m.garage, m.signupDate]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `조합원_가입신청_명단_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFullSystemBackup = () => {
    const now = new Date();
    const timestamp = now.getFullYear() + 
      String(now.getMonth() + 1).padStart(2, '0') + 
      String(now.getDate()).padStart(2, '0') + '_' + 
      String(now.getHours()).padStart(2, '0') + 
      String(now.getMinutes()).padStart(2, '0') + 
      String(now.getSeconds()).padStart(2, '0');

    const backupData = {
      siteSettings: settings,
      allPosts: posts,
      deletedPosts: deletedPosts,
      members: members,
      backupVersion: "1.0",
      generatedAt: now.toLocaleString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `우리노동조합_전체백업_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('시스템 전체 백업 파일이 생성되었습니다.');
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 animate-fadeIn">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-sky-primary/10 rounded-xl flex items-center justify-center mr-4">
            <i className="fas fa-shield-alt text-sky-primary text-2xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">관리자 커맨드 센터</h2>
            <p className="text-sm text-gray-500">사이트의 모든 설정과 게시글을 강제 제어합니다.</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
          <i className="fas fa-times text-2xl"></i>
        </button>
      </div>

      <div className="flex space-x-2 mb-8 border-b pb-px overflow-x-auto whitespace-nowrap scrollbar-hide text-gray-400">
        <button onClick={() => setAdminTab('members')} className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${adminTab === 'members' ? 'border-sky-primary text-sky-primary' : 'border-transparent hover:text-gray-600'}`}>조합원 관리</button>
        <button onClick={() => setAdminTab('intro')} className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${adminTab === 'intro' ? 'border-sky-primary text-sky-primary' : 'border-transparent hover:text-gray-600'}`}>인사말/소개 관리</button>
        <button onClick={() => setAdminTab('offices')} className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${adminTab === 'offices' ? 'border-sky-primary text-sky-primary' : 'border-transparent hover:text-gray-600'}`}>찾아오시는 길</button>
        <button onClick={() => setAdminTab('posts')} className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${adminTab === 'posts' ? 'border-sky-primary text-sky-primary' : 'border-transparent hover:text-gray-600'}`}>게시물/휴지통</button>
        <button onClick={() => setAdminTab('settings')} className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${adminTab === 'settings' ? 'border-sky-primary text-sky-primary' : 'border-transparent hover:text-gray-600'}`}>시스템 설정</button>
      </div>

      <div className="space-y-6">
        {adminTab === 'members' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800">조합원 가입 신청 명단 ({members.length}명)</h3>
              <button onClick={handleDownloadExcel} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-emerald-700 transition-all flex items-center active:scale-95">
                <i className="fas fa-file-excel mr-2"></i> 전체 명단 엑셀 다운로드
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase">
                  <tr>
                    <th className="px-6 py-4">이름</th>
                    <th className="px-6 py-4">연락처</th>
                    <th className="px-6 py-4">이메일</th>
                    <th className="px-6 py-4">차고지</th>
                    <th className="px-6 py-4">가입일</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{m.name}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono">{m.phone}</td>
                      <td className="px-6 py-4 text-gray-600">{m.email}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{m.garage}</td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{m.signupDate}</td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">가입 신청 내역이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminTab === 'intro' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center"><i className="fas fa-comment-dots mr-2 text-sky-primary"></i> 인사말 편집</h3>
                <div className="space-y-4">
                  <div><label className="block text-[10px] font-black text-gray-400 mb-1">인사말 제목</label><input type="text" name="greetingTitle" value={settings.greetingTitle} onChange={handleSettingsChange} className="w-full border rounded-lg p-2.5 text-sm outline-none focus:border-sky-primary" /></div>
                  <div><label className="block text-[10px] font-black text-gray-400 mb-1">인사말 본문</label><textarea name="greetingMessage" value={settings.greetingMessage} onChange={handleSettingsChange} className="w-full border rounded-lg p-2.5 text-sm h-40 outline-none focus:border-sky-primary resize-none" /></div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-2">인사말 이미지</label>
                    <div className="flex items-center space-x-4">
                      <img src={settings.greetingImageUrl} className="w-20 h-20 object-cover rounded-lg border shadow-sm" />
                      <button onClick={() => greetingImageRef.current?.click()} className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200">이미지 변경</button>
                      <input type="file" ref={greetingImageRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'greetingImageUrl')} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center"><i className="fas fa-list-check mr-2 text-sky-primary"></i> 핵심 사명 관리</h3>
                <div className="space-y-3 mb-6">
                  {(settings.missionItems || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border group">
                      <span className="text-sm text-gray-700">{item}</span>
                      <button onClick={() => handleDeleteMission(idx)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><i className="fas fa-times"></i></button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input type="text" value={newMissionItem} onChange={e => setNewMissionItem(e.target.value)} className="flex-1 border rounded-lg p-2 text-sm outline-none" placeholder="새로운 사명 추가" />
                  <button onClick={handleAddMission} className="px-4 py-2 bg-sky-primary text-white rounded-lg text-sm font-bold">추가</button>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center"><i className="fas fa-history mr-2 text-sky-primary"></i> 연혁 데이터 편집</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex space-x-2 mb-4">
                    <input type="text" placeholder="연도" value={newYear} onChange={e => setNewYear(e.target.value)} className="w-24 border rounded-lg p-2 text-sm outline-none" />
                    <input type="text" placeholder="내용" value={newText} onChange={e => setNewText(e.target.value)} className="flex-1 border rounded-lg p-2 text-sm outline-none" />
                    <button onClick={handleAddHistory} className="px-4 py-2 bg-sky-primary text-white rounded-lg text-sm font-bold">추가</button>
                  </div>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {settings.history.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 group transition-colors">
                      <div className="flex items-center"><span className="font-bold text-sky-700 w-16">{item.year}</span><span className="text-sm text-gray-600">{item.text}</span></div>
                      <button onClick={() => handleDeleteHistory(idx)} className="text-gray-300 group-hover:text-red-500"><i className="fas fa-trash-alt"></i></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {adminTab === 'offices' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center"><i className="fas fa-map-marker-alt mr-2 text-sky-primary"></i> 사업소(찾아오시는 길) 정보 관리</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {settings.offices.map((office) => (
                  <div key={office.id} className="border rounded-2xl overflow-hidden bg-gray-50 shadow-inner">
                    <div className="h-40 bg-gray-200 relative group overflow-hidden">
                      <img src={office.mapImageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => { setActiveOfficeId(office.id); officeMapInputRef.current?.click(); }} className="px-3 py-1.5 bg-white text-gray-900 text-[11px] font-black rounded-lg">지도 이미지 변경</button>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div><label className="block text-[10px] font-black text-gray-400 mb-1">명칭</label><input type="text" value={office.name} onChange={(e) => handleOfficeChange(office.id, 'name', e.target.value)} className="w-full border rounded-lg p-2 text-sm font-bold" /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 mb-1">주소</label><input type="text" value={office.address} onChange={(e) => handleOfficeChange(office.id, 'address', e.target.value)} className="w-full border rounded-lg p-2 text-xs" /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 mb-1">연락처</label><input type="text" value={office.phone} onChange={(e) => handleOfficeChange(office.id, 'phone', e.target.value)} className="w-full border rounded-lg p-2 text-xs" /></div>
                    </div>
                  </div>
                ))}
              </div>
              <input type="file" ref={officeMapInputRef} className="hidden" accept="image/*" onChange={handleOfficeMapUpload} />
            </div>
          </div>
        )}

        {adminTab === 'posts' && (
          <div className="space-y-12 animate-fadeIn">
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden border-t-4 border-t-sky-primary">
              <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-800 flex items-center"><i className="fas fa-list mr-2 text-sky-primary"></i> 운영 중인 모든 게시물 관리</h3>
                <span className="text-xs text-gray-400 font-bold">비밀번호를 확인하여 수정/삭제 시 사용하세요.</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-[11px] font-black text-gray-400">
                    <tr><th className="px-6 py-4">제목</th><th className="px-6 py-4">작성자</th><th className="px-6 py-4">게시판</th><th className="px-6 py-4">비밀번호</th><th className="px-6 py-4">조회수</th><th className="px-6 py-4 text-center">관리</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {posts.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 font-bold text-gray-800 truncate max-w-[200px]">
                          <button onClick={() => onViewPost(p.id, p.type)} className="hover:text-sky-primary hover:underline transition-all text-left truncate w-full">{p.title}</button>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{p.author}</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-500 uppercase">{p.type}</span></td>
                        <td className="px-6 py-4 font-mono text-sky-600 font-black">{p.password || '-'}</td>
                        <td className="px-6 py-4 text-gray-400 text-xs">{p.views}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => onEditPost(p)} className="px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg text-[11px] font-black hover:bg-sky-600 hover:text-white transition-all shadow-sm">수정</button>
                        </td>
                      </tr>
                    ))}
                    {posts.length === 0 && (<tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">게시물이 없습니다.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden border-t-4 border-t-red-500">
              <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-red-600 flex items-center"><i className="fas fa-trash-alt mr-2"></i> 삭제된 게시물 (휴지통)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-[11px] font-black text-gray-400">
                    <tr><th className="px-6 py-4">제목</th><th className="px-6 py-4">작성자</th><th className="px-6 py-4">비밀번호</th><th className="px-6 py-4 text-center">관리</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {deletedPosts.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-500">{p.title}</td>
                        <td className="px-6 py-4 text-gray-400">{p.author}</td>
                        <td className="px-6 py-4 font-mono text-gray-400">{p.password || '-'}</td>
                        <td className="px-6 py-4 text-center space-x-2">
                          <button onClick={() => onRestorePost(p.id)} className="px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg text-[11px] font-bold">복구</button>
                          <button onClick={() => onPermanentDelete(p.id)} className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-[11px] font-bold">영구삭제</button>
                        </td>
                      </tr>
                    ))}
                    {deletedPosts.length === 0 && (<tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">휴지통이 비어 있습니다.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {adminTab === 'settings' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center"><i className="fas fa-desktop mr-2 text-sky-primary"></i> 메인 화면 및 시스템 관리</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div><label className="block text-[10px] font-black text-gray-400 mb-1">사이트 이름</label><input type="text" name="siteName" value={settings.siteName} onChange={handleSettingsChange} className="w-full border rounded-lg p-2.5 text-sm outline-none" /></div>
                  <div><label className="block text-[10px] font-black text-gray-400 mb-1">메인 제목</label><input type="text" name="heroTitle" value={settings.heroTitle} onChange={handleSettingsChange} className="w-full border rounded-lg p-2.5 text-sm outline-none" /></div>
                  <div><label className="block text-[10px] font-black text-gray-400 mb-1">메인 설명</label><textarea name="heroSubtitle" value={settings.heroSubtitle} onChange={handleSettingsChange} className="w-full border rounded-lg p-2.5 text-sm h-24 outline-none resize-none" /></div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-2">메인 배경 이미지</label>
                  <div className="aspect-video w-full rounded-xl overflow-hidden border bg-gray-100 mb-3"><img src={settings.heroImageUrl} className="w-full h-full object-cover" /></div>
                  <button onClick={() => heroImageRef.current?.click()} className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-lg">이미지 교체</button>
                  <input type="file" ref={heroImageRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'heroImageUrl')} />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-8 text-white shadow-2xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center"><i className="fas fa-database mr-3 text-sky-400"></i> 시스템 전체 데이터 백업</h3>
                  <p className="text-sm text-gray-400">현재까지의 모든 설정, 게시물, 회원 정보를 하나의 파일로 저장합니다.</p>
                </div>
                <button 
                  onClick={handleFullSystemBackup}
                  className="px-8 py-4 bg-sky-primary text-white rounded-xl font-bold shadow-lg hover:bg-sky-500 transition-all active:scale-95 flex items-center whitespace-nowrap"
                >
                  <i className="fas fa-download mr-3"></i> 전체 데이터 백업 다운로드 (.json)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
