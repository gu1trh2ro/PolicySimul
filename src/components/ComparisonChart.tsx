"use client";

import { CalculationResult } from "@/types";

export default function ComparisonChart({
  before,
  after
}: {
  before: CalculationResult | null;
  after: CalculationResult | null;
}) {
  if (!before || !after) return null;

  const currency = new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 });
  const fmt = {
    won: (n: number) => currency.format(n),
    pct: (n: number) => `${n.toFixed(1)}%`
  };

  const sections: Array<{
    key: keyof CalculationResult;
    label: string;
    format: (n: number) => string;
  }> = [
    { key: "maxLoanAllowed", label: "가능 대출 최대 금액", format: fmt.won },
    { key: "monthlyPayment", label: "신규 월 상환액", format: fmt.won },
    { key: "dsrAfterPercent", label: "예상 총 DSR", format: fmt.pct }
  ];

  return (
    <div className="card">
      <h2>전/후 비교 그래프</h2>
      <div className="chart">
        {sections.map((s) => {
          const bv = before[s.key] as unknown as number;
          const av = after[s.key] as unknown as number;
          const max = Math.max(bv, av, 1);
          const bw = Math.max(4, (bv / max) * 100);
          const aw = Math.max(4, (av / max) * 100);
          return (
            <div className="chart-section" key={String(s.key)}>
              <div className="chart-label">{s.label}</div>
              <div className="chart-bars">
                <div className="bar before" style={{ width: `${bw}%` }}>
                  <span className="bar-value">전 {s.format(bv)}</span>
                </div>
                <div className="bar after" style={{ width: `${aw}%` }}>
                  <span className="bar-value">후 {s.format(av)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div className="chart-legend">
          <span className="legend-item before">전</span>
          <span className="legend-item after">후</span>
        </div>
      </div>
    </div>
  );
}


