"use client";

import { useEffect, useState } from "react";

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

type PolicyParams = Pick<FormValues, "interestRatePercent" | "dsrLimitPercent" | "loanType" | "ltvLimitPercent" | "rateMode" | "stepMonth" | "ratePercentAfter">;

export default function PolicyTemplatesPanel({ before, after, onApply }: { before: FormValues; after: FormValues; onApply: (target: "before" | "after", params: Partial<FormValues>) => void }) {
  const [name, setName] = useState("");
  const [list, setList] = useState<Array<{ id: string; name: string; params: PolicyParams }>>([]);
  const [publicList, setPublicList] = useState<Array<{ id: string; name: string; params: PolicyParams }>>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/policies");
      const json = await res.json();
      if (!res.ok) throw new Error();
      setList(json.map((t: any) => ({ id: t.id, name: t.name, params: t.params })));
    } catch {
      setMsg("템플릿 목록을 불러오지 못했습니다(로그인 필요).");
    }
  }

  useEffect(() => {
    refresh();
    fetch("/api/policies/public").then(async (r) => {
      const j = await r.json();
      if (r.ok) setPublicList(j.map((t: any) => ({ id: t.id, name: t.name, params: t.params })));
    }).catch(() => {});
  }, []);

  function collect(from: FormValues): PolicyParams {
    return {
      interestRatePercent: from.interestRatePercent,
      dsrLimitPercent: from.dsrLimitPercent,
      loanType: from.loanType,
      ltvLimitPercent: from.ltvLimitPercent,
      rateMode: from.rateMode,
      stepMonth: from.stepMonth,
      ratePercentAfter: from.ratePercentAfter
    };
  }

  async function saveFrom(target: "before" | "after") {
    setMsg(null);
    try {
      const params = collect(target === "before" ? before : after);
      const res = await fetch("/api/policies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name || `${target} 정책`, params }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "에러");
      setMsg("정책 템플릿이 저장되었습니다.");
      setName("");
      refresh();
      setTimeout(() => setMsg(null), 1600);
    } catch {
      setMsg("저장 실패(로그인 필요).");
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/policies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      refresh();
    } catch {
      setMsg("삭제 실패");
    }
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>정책 템플릿</h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="템플릿 이름" style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "#0b1220", color: "var(--text)" }} />
        <button type="button" onClick={() => saveFrom("before")}>현재 전 값 저장</button>
        <button type="button" onClick={() => saveFrom("after")}>현재 후 값 저장</button>
        {msg && <span className="notes">{msg}</span>}
      </div>
      <div style={{ marginTop: 10 }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {list.map((t) => (
            <li key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border)" }}>
              <span>{t.name}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => onApply("before", t.params)}>전 적용</button>
                <button type="button" onClick={() => onApply("after", t.params)}>후 적용</button>
                <button type="button" onClick={async () => { try { const r = await fetch(`/api/policies/${t.id}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enable: true }) }); if (!r.ok) throw new Error(); setMsg("공개 설정되었습니다."); setTimeout(() => setMsg(null), 1200); } catch { setMsg("공개 실패(로그인 필요)"); } }}>공개</button>
                <button type="button" onClick={async () => { try { const r = await fetch(`/api/policies/${t.id}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enable: false }) }); if (!r.ok) throw new Error(); setMsg("비공개로 변경되었습니다."); setTimeout(() => setMsg(null), 1200); } catch { setMsg("변경 실패"); } }}>비공개</button>
                <button type="button" onClick={() => remove(t.id)}>삭제</button>
              </div>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button" onClick={() => {
            try {
              const exportable = list.map((t) => ({ name: t.name, params: t.params }));
              const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `policy_templates_${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            } catch {}
          }}>템플릿 내보내기</button>
          <label style={{ display: "inline-block" }}>
            <span className="notes" style={{ cursor: "pointer" }}>템플릿 가져오기</span>
            <input type="file" accept="application/json" style={{ display: "none" }} onChange={async (e) => {
              setImportError(null);
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 512 * 1024) { setImportError("파일이 너무 큽니다(512KB 초과). "); return; }
              try {
                const text = await file.text();
                const json = JSON.parse(text);
                if (!Array.isArray(json)) throw new Error();
                for (const item of json) {
                  if (!item?.name || !item?.params) continue;
                  await fetch("/api/policies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: String(item.name).slice(0, 100), params: item.params }) });
                }
                setMsg("가져오기가 완료되었습니다.");
                refresh();
                setTimeout(() => setMsg(null), 1600);
              } catch {
                setImportError("유효하지 않은 템플릿 JSON입니다.");
              } finally {
                e.currentTarget.value = "";
              }
            }} />
          </label>
          {importError && <span className="error">{importError}</span>}
        </div>
      </div>
      {publicList.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h3 style={{ margin: 0 }}>공개 템플릿</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {publicList.map((t) => (
              <li key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border)" }}>
                <span>{t.name}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => onApply("before", t.params)}>전 적용</button>
                  <button type="button" onClick={() => onApply("after", t.params)}>후 적용</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


