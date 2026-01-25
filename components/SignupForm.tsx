import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력하세요");
      return;
    }

    if (password !== password2) {
      alert("비밀번호가 일치하지 않습니다");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert("회원가입 완료! 바로 로그인하세요.");
      window.location.href = "/login";
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto" }}>
      <h2>회원가입</h2>

      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <input
        type="password"
        placeholder="비밀번호 (6자리 이상)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <input
        type="password"
        placeholder="비밀번호 확인"
        value={password2}
        onChange={(e) => setPassword2(e.target.value)}
        style={{ width: "100%", marginBottom: 20 }}
      />

      <button
        onClick={handleSignup}
        disabled={loading}
        style={{ width: "100%" }}
      >
        {loading ? "가입 중..." : "회원가입"}
      </button>
    </div>
  );
}
