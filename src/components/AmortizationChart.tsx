"use client";

import { CalculationResult } from "@/types";

export default function AmortizationChart({ before, after }: { before: CalculationResult | null; after: CalculationResult | null }) {
  if (!before || !after) return null;

  const currency = new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 });

  function Bar({ label, principal, interest, tone }: { label: string; principal: number; interest: number; tone: "before" | "after" }) {
    const total = Math.max(principal + interest, 1);
    const pPct = (principal / total) * 100;
    const iPct = (interest / total) * 100;
    return (
      <div className="amort-row">
        <div className="amort-label">{label}</div>
        <div className={`amort-bar ${tone}`}>
          <div className="amort-seg principal" style={{ width: `${pPct}%` }} title={`원금 ${currency.format(principal)}`}></div>
          <div className="amort-seg interest" style={{ width: `${iPct}%` }} title={`이자 ${currency.format(interest)}`}></div>
        </div>
        <div className="amort-values">
          <span>원금 {currency.format(principal)}</span>
          <span>이자 {currency.format(interest)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>총 원리금 구성 비교</h2>
      <div className="amort">
        <Bar label="전" principal={before.totalPrincipal} interest={before.totalInterest} tone="before" />
        <Bar label="후" principal={after.totalPrincipal} interest={after.totalInterest} tone="after" />
      </div>
      <div className="chart-legend">
        <span className="legend-item before">전</span>
        <span className="legend-item after">후</span>
        <span className="legend-item principal">원금</span>
        <span className="legend-item interest">이자</span>
      </div>
    </div>
  );
}




