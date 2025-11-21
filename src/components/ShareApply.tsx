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

export default function ShareApply({ payload }: { payload: { before: FormValues; after: FormValues } }) {
  const params = new URLSearchParams();
  (Object.keys(payload.before) as (keyof FormValues)[]).forEach((k) => params.set(`before_${k}`, String((payload.before as any)[k] ?? "")));
  (Object.keys(payload.after) as (keyof FormValues)[]).forEach((k) => params.set(`after_${k}`, String((payload.after as any)[k] ?? "")));
  const relative = `/?${params.toString()}`;

  async function copyLink() {
    const absolute = typeof window !== "undefined" ? new URL(relative, window.location.origin).toString() : relative;
    await navigator.clipboard.writeText(absolute);
    alert("시뮬레이터 링크가 복사되었습니다.");
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <a href={relative}><button type="button">시뮬레이터에서 열기</button></a>
      <button type="button" onClick={copyLink}>링크 복사</button>
    </div>
  );
}






