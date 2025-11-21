"use client";

import CalculatorForm from "@/components/CalculatorForm";
import ComparisonChart from "@/components/ComparisonChart";
import { useState } from "react";
import { CalculationResult } from "@/types";
import AmortizationChart from "@/components/AmortizationChart";
import TrendChart from "@/components/TrendChart";
import AuthBar from "@/components/AuthBar";
import ScenarioActions from "@/components/ScenarioActions";
import PolicyTemplatesPanel from "@/components/PolicyTemplatesPanel";

export default function Page() {
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
  };

  const beforeDefaults: FormValues = {
    monthlyIncome: 4000000,
    existingDebtBalance: 20000000,
    existingMonthlyPayment: 300000,
    desiredLoanAmount: 300000000,
    desiredLoanTermMonths: 360,
    interestRatePercent: 4.0,
    dsrLimitPercent: 40,
    loanType: "unsecured",
    rateMode: "fixed"
  };
  const afterDefaults: FormValues = {
    monthlyIncome: 4000000,
    existingDebtBalance: 20000000,
    existingMonthlyPayment: 300000,
    desiredLoanAmount: 300000000,
    desiredLoanTermMonths: 360,
    interestRatePercent: 5.0,
    dsrLimitPercent: 35,
    loanType: "mortgage",
    collateralValue: 500000000,
    ltvLimitPercent: 70,
    rateMode: "twoStep",
    stepMonth: 24,
    ratePercentAfter: 6.0
  };

  const [beforeVals, setBeforeVals] = useState<FormValues>(beforeDefaults);
  const [afterVals, setAfterVals] = useState<FormValues>(afterDefaults);
  const [beforeRes, setBeforeRes] = useState<CalculationResult | null>(null);
  const [afterRes, setAfterRes] = useState<CalculationResult | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  function copyCombinedLink() {
    try {
      const url = new URL(window.location.href);
      const sp = url.searchParams;
      (Object.keys(beforeVals) as (keyof FormValues)[]).forEach((k) => sp.set(`before_${k}`, String(beforeVals[k])));
      (Object.keys(afterVals) as (keyof FormValues)[]).forEach((k) => sp.set(`after_${k}`, String(afterVals[k])));
      url.search = sp.toString();
      navigator.clipboard.writeText(url.toString());
      setCopyMsg("전/후 값을 포함한 링크가 복사되었습니다.");
      setTimeout(() => setCopyMsg(null), 2000);
    } catch {
      setCopyMsg("링크 복사에 실패했습니다.");
      setTimeout(() => setCopyMsg(null), 2000);
    }
  }

  function applyPolicy(target: "before" | "after", params: Partial<FormValues>) {
    const apply = (src: FormValues) => ({
      ...src,
      interestRatePercent: params.interestRatePercent ?? src.interestRatePercent,
      dsrLimitPercent: params.dsrLimitPercent ?? src.dsrLimitPercent,
      loanType: (params.loanType as any) ?? src.loanType,
      ltvLimitPercent: params.ltvLimitPercent ?? src.ltvLimitPercent,
      rateMode: (params.rateMode as any) ?? src.rateMode,
      stepMonth: params.stepMonth ?? src.stepMonth,
      ratePercentAfter: params.ratePercentAfter ?? src.ratePercentAfter
    });
    if (target === "before") setBeforeVals((prev) => apply(prev));
    else setAfterVals((prev) => apply(prev));
  }

  return (
    <>
      <section className="card" style={{ marginBottom: 16 }}>
        <div className="grid two-col gap-lg">
          <div>
            <h2 style={{ marginTop: 0 }}>로그인</h2>
            <AuthBar />
          </div>
          <div>
            <h2 style={{ marginTop: 0 }}>공유 / 저장</h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p className="notes" style={{ margin: 0 }}>두 시나리오 값을 포함한 링크 복사 또는 서버 저장.</p>
              </div>
              <div>
                <button type="button" onClick={copyCombinedLink}>전/후 전체 링크 복사</button>
              </div>
            </div>
            {copyMsg && <p className="notes" style={{ marginTop: 8 }}>{copyMsg}</p>}
            <div style={{ marginTop: 10 }}>
              <ScenarioActions
                before={beforeVals}
                after={afterVals}
                onImport={(payload) => {
                  setBeforeVals(payload.before);
                  setAfterVals(payload.after);
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid two-col gap-lg">
        <section className="card">
          <h2>정책 전</h2>
          <CalculatorForm
            idPrefix="before"
            defaults={beforeDefaults}
            onValuesChange={setBeforeVals}
            onResultChange={setBeforeRes}
          />
        </section>
        <section className="card">
          <h2>정책 후</h2>
          <CalculatorForm
            idPrefix="after"
            defaults={afterDefaults}
            onValuesChange={setAfterVals}
            onResultChange={setAfterRes}
          />
        </section>
      </div>

      <div style={{ marginTop: 16 }}>
        <ComparisonChart before={beforeRes} after={afterRes} />
      </div>
      <div style={{ marginTop: 16 }}>
        <AmortizationChart before={beforeRes} after={afterRes} />
      </div>
      <div style={{ marginTop: 16 }}>
        <TrendChart beforeVals={beforeVals} afterVals={afterVals} />
      </div>
      <PolicyTemplatesPanel before={beforeVals} after={afterVals} onApply={applyPolicy} />
    </>
  );
}


