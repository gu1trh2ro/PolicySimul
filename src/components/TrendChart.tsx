"use client";

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

function computeMonthlyPayment(principal: number, annualRatePercent: number, termMonths: number): number {
  if (termMonths <= 0) return 0;
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return principal / termMonths;
  const num = principal * r;
  const den = 1 - Math.pow(1 + r, -termMonths);
  return num / den;
}

function buildYearly(values: FormValues) {
  let remaining = values.desiredLoanAmount;
  const totalMonths = values.desiredLoanTermMonths;
  let curRate = values.interestRatePercent;
  let payment = computeMonthlyPayment(remaining, curRate, totalMonths);
  const yearly: Array<{ year: number; interest: number; principal: number }> = [];
  for (let m = 1; m <= totalMonths; m++) {
    if (values.rateMode === "twoStep" && values.stepMonth && values.ratePercentAfter != null && m === values.stepMonth + 1) {
      curRate = values.ratePercentAfter;
      const remTerm = Math.max(1, totalMonths - values.stepMonth);
      payment = computeMonthlyPayment(remaining, curRate, remTerm);
    }
    const rMonthly = curRate / 100 / 12;
    const interest = remaining * rMonthly;
    const principal = Math.max(0, payment - interest);
    remaining = Math.max(0, remaining - principal);
    const yIdx = Math.ceil(m / 12) - 1;
    if (!yearly[yIdx]) yearly[yIdx] = { year: yIdx + 1, interest: 0, principal: 0 };
    yearly[yIdx].interest += interest;
    yearly[yIdx].principal += principal;
    if (remaining <= 0) break;
  }
  return yearly.map((y) => ({ ...y, interest: Math.round(y.interest), principal: Math.round(y.principal) }));
}

export default function TrendChart({ beforeVals, afterVals }: { beforeVals: FormValues; afterVals: FormValues }) {
  const before = buildYearly(beforeVals);
  const after = buildYearly(afterVals);
  const years = Math.max(before.length, after.length);
  const currency = new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 });

  return (
    <div className="card">
      <h2>연간 상환 추이(원금/이자)</h2>
      <div className="trend">
        {Array.from({ length: years }).map((_, i) => {
          const b = before[i] || { year: i + 1, interest: 0, principal: 0 };
          const a = after[i] || { year: i + 1, interest: 0, principal: 0 };
          const max = Math.max(b.interest + b.principal, a.interest + a.principal, 1);
          const bP = ((b.principal) / max) * 100;
          const bI = ((b.interest) / max) * 100;
          const aP = ((a.principal) / max) * 100;
          const aI = ((a.interest) / max) * 100;
          return (
            <div className="trend-year" key={i}>
              <div className="trend-year-label">Y{i + 1}</div>
              <div className="trend-bars">
                <div className="trend-stack before">
                  <div className="seg principal" style={{ width: `${bP}%` }} title={`전 원금 ${currency.format(b.principal)}`}></div>
                  <div className="seg interest" style={{ width: `${bI}%` }} title={`전 이자 ${currency.format(b.interest)}`}></div>
                </div>
                <div className="trend-stack after">
                  <div className="seg principal" style={{ width: `${aP}%` }} title={`후 원금 ${currency.format(a.principal)}`}></div>
                  <div className="seg interest" style={{ width: `${aI}%` }} title={`후 이자 ${currency.format(a.interest)}`}></div>
                </div>
              </div>
              <div className="trend-values">
                <span className="notes">전 {currency.format(b.principal + b.interest)}</span>
                <span className="notes">후 {currency.format(a.principal + a.interest)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="chart-legend">
        <span className="legend-item principal">원금</span>
        <span className="legend-item interest">이자</span>
        <span className="legend-item before">전</span>
        <span className="legend-item after">후</span>
      </div>
    </div>
  );
}






