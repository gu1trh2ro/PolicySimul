"use client";

import { useState } from "react";

type FormValues = {
  monthlyIncome: number;
  existingDebtBalance: number;
  existingMonthlyPayment: number;
  desiredLoanAmount: number;
  desiredLoanTermMonths: number;
  interestRatePercent: number;
  dsrLimitPercent: number;
  loanType: "unsecured" | "mortgage";
  collateralValue?: number;
  ltvLimitPercent?: number;
  rateMode: "fixed" | "twoStep";
  stepMonth?: number;
  ratePercentAfter?: number;
};

export default function ScenarioActions({ before, after, onImport }: { before: FormValues; after: FormValues; onImport?: (payload: { before: FormValues; after: FormValues }) => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const [list, setList] = useState<Array<{ id: string; name: string }>>([]);
  const [name, setName] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  async function saveToServer() {
    setMessage(null);
    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "시나리오", payload: { before, after } })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "에러");
      setMessage("서버에 저장되었습니다.");
      setTimeout(() => setMessage(null), 2000);
    } catch (e) {
      setMessage("로그인 후 다시 시도해주세요.");
    }
  }

  async function loadMyList() {
    setMessage(null);
    try {
      const res = await fetch("/api/scenarios");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "에러");
      setList(json.map((s: any) => ({ id: s.id, name: s.name })));
    } catch {
      setMessage("목록을 불러오지 못했습니다(로그인 필요).");
    }
  }

  async function copyShareLink(id: string) {
    try {
      const res = await fetch(`/api/scenarios/${id}/share`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enable: true }) });
      const json = await res.json();
      if (!res.ok || !json?.url) throw new Error();
      await navigator.clipboard.writeText(json.url);
      setMessage("공유 링크가 복사되었습니다.");
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage("공유 링크 생성 실패(로그인 필요).");
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="시나리오 이름" style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "#0b1220", color: "var(--text)" }} />
      <button type="button" onClick={saveToServer}>서버에 저장</button>
      <button type="button" onClick={loadMyList}>내 시나리오 목록</button>
      <button type="button" onClick={() => {
        const blob = new Blob([JSON.stringify({ before, after }, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `policysimul_scenario_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }}>JSON 내보내기</button>
      <label style={{ display: "inline-block" }}>
        <span className="notes" style={{ cursor: "pointer" }}>JSON 가져오기</span>
        <input type="file" accept="application/json" style={{ display: "none" }} onChange={async (e) => {
          setImportError(null);
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 512 * 1024) { setImportError("파일이 너무 큽니다(512KB 초과). "); return; }
          try {
            const text = await file.text();
            const json = JSON.parse(text);
            // 최소 구성 검증
            if (!json?.before || !json?.after) throw new Error();
            onImport?.(json);
            setMessage("JSON 시나리오를 불러왔습니다.");
            setTimeout(() => setMessage(null), 1600);
          } catch {
            setImportError("유효하지 않은 JSON 형식입니다.");
          } finally {
            e.currentTarget.value = "";
          }
        }} />
      </label>
      {message && <span className="notes">{message}</span>}
      {importError && <span className="error">{importError}</span>}
      {list.length > 0 && (
        <div style={{ width: "100%", marginTop: 8 }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {list.map((s) => (
              <li key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border)" }}>
                <span>{s.name}</span>
                <button type="button" onClick={() => copyShareLink(s.id)}>공유 링크 복사</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


