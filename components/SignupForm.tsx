import React from 'react'
import { signUp } from '../lib/auth'

export default function SignupForm() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [nickname, setNickname] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      await signUp(email.trim(), password, nickname.trim() || undefined)
      setMessage('회원가입 완료! (이메일 확인이 켜져있다면 메일을 확인해 주세요)')
    } catch (e: any) {
      setError(e?.message ?? '회원가입 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div>
        <label>이메일</label><br />
        <input value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div style={{ marginTop: 8 }}>
        <label>비밀번호</label><br />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>

      <div style={{ marginTop: 8 }}>
        <label>닉네임(선택)</label><br />
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} />
      </div>

      <button style={{ marginTop: 12 }} type="submit" disabled={loading}>
        {loading ? '가입 중...' : '회원가입'}
      </button>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}
      {error && <p style={{ marginTop: 10 }}>{error}</p>}
    </form>
  )
}
