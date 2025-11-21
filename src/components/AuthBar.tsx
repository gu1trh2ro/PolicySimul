"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthBar() {
  const { data: session } = useSession();
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // Attempt migration on mount (no-op if not eligible)
    fetch("/api/auth/migrate", { method: "POST" }).catch(() => {});
  }, []);

  async function signInGuest() {
    setStatus(null);
    try {
      const res = await fetch("/api/auth/guest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nickname }) });
      if (!res.ok) throw new Error();
      setStatus(nickname ? `${nickname} 님 게스트 세션 발급됨` : `게스트 세션 발급됨`);
    } catch {
      setStatus("게스트 발급 실패");
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="닉네임(선택)" style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "#0b1220", color: "var(--text)" }} />
      <button type="button" onClick={signInGuest}>게스트 세션</button>
      <button type="button" onClick={() => signIn("github")}>GitHub 로그인</button>
      <button type="button" onClick={() => signOut()}>로그아웃</button>
      {session?.user && <span className="notes">{session.user.name || "로그인됨"}</span>}
      {status && <span className="notes">{status}</span>}
    </div>
  );
}


