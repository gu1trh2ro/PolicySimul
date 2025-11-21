"use client";

import { useMemo, useState, useEffect } from "react";
import { CalculationResult } from "@/types";

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

export default function CalculatorForm({
  idPrefix,
  defaults,
  onResultChange,
  onValuesChange
}: {
  idPrefix: string;
  defaults: FormValues;
  onResultChange?: (res: CalculationResult | null) => void;
  onValuesChange?: (vals: FormValues) => void;
}) {
  const [values, setValues] = useState(defaults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null as string | null);
  const [result, setResult] = useState(null as CalculationResult | null);
  const [message, setMessage] = useState(null as string | null);
  const [autoCalc, setAutoCalc] = useState(true);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }),
    []
  );

  function handleChange(key: keyof FormValues, next: number) {
    setValues((prev: FormValues) => {
      const merged = { ...prev, [key]: next } as FormValues;
      onValuesChange?.(merged);
      return merged;
    });
  }

  function handleChangeString(key: keyof FormValues, next: string) {
    setValues((prev: FormValues) => {
      const merged = { ...prev, [key]: next } as unknown as FormValues;
      onValuesChange?.(merged);
      return merged;
    });
  }

  // Initialize from URL query once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const readNum = (key: keyof FormValues): number | undefined => {
      const raw = sp.get(`${idPrefix}_${key}`);
      if (raw == null) return undefined;
      const num = Number(raw);
      return Number.isFinite(num) ? num : undefined;
    };
    const maybe: Partial<FormValues> = {
      monthlyIncome: readNum("monthlyIncome"),
      existingDebtBalance: readNum("existingDebtBalance"),
      existingMonthlyPayment: readNum("existingMonthlyPayment"),
      desiredLoanAmount: readNum("desiredLoanAmount"),
      desiredLoanTermMonths: readNum("desiredLoanTermMonths"),
      interestRatePercent: readNum("interestRatePercent"),
      dsrLimitPercent: readNum("dsrLimitPercent"),
      collateralValue: readNum("collateralValue"),
      ltvLimitPercent: readNum("ltvLimitPercent"),
      stepMonth: readNum("stepMonth"),
      ratePercentAfter: readNum("ratePercentAfter")
    };
    const ls = sp.get(`${idPrefix}_loanType`);
    const loanType = ls === "mortgage" || ls === "unsecured" ? ls : undefined;
    const rm = sp.get(`${idPrefix}_rateMode`);
    const rateMode = rm === "twoStep" || rm === "fixed" ? rm : undefined;
    const next: FormValues = { ...defaults, ...Object.fromEntries(Object.entries(maybe).filter(([, v]) => v != null)), ...(loanType ? { loanType } : {}), ...(rateMode ? { rateMode } : {}) } as FormValues;
    setValues(next);
    onValuesChange?.(next);
  }, []);

  async function performCalc() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "계산에 실패했습니다.");
        onResultChange?.(null);
      } else {
        const r = json as CalculationResult;
        setResult(r);
        onResultChange?.(r);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      onResultChange?.(null);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await performCalc();
  }

  const signalText: Record<string, string> = {
    safe: "안전",
    caution: "주의",
    risk: "위험"
  };

  function saveLocal() {
    try {
      localStorage.setItem(`policysimul:scenario:${idPrefix}`, JSON.stringify(values));
      setMessage("시나리오가 저장되었습니다.");
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setError("저장에 실패했습니다.");
    }
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(`policysimul:scenario:${idPrefix}`);
      if (!raw) {
        setMessage("저장된 시나리오가 없습니다.");
        setTimeout(() => setMessage(null), 1800);
        return;
      }
      const parsed = JSON.parse(raw) as FormValues;
      // Basic numeric validation
      const cleaned: FormValues = {
        monthlyIncome: Number(parsed.monthlyIncome) || 0,
        existingDebtBalance: Number(parsed.existingDebtBalance) || 0,
        existingMonthlyPayment: Number(parsed.existingMonthlyPayment) || 0,
        desiredLoanAmount: Number(parsed.desiredLoanAmount) || 0,
        desiredLoanTermMonths: Number(parsed.desiredLoanTermMonths) || 1,
        interestRatePercent: Number(parsed.interestRatePercent) || 0,
        dsrLimitPercent: Number(parsed.dsrLimitPercent) || 30,
        loanType: (parsed.loanType === "mortgage" || parsed.loanType === "unsecured") ? parsed.loanType : "unsecured",
        collateralValue: Number(parsed.collateralValue) || 0,
        ltvLimitPercent: Number(parsed.ltvLimitPercent) || (parsed.loanType === "mortgage" ? 70 : undefined),
        rateMode: (parsed as any).rateMode === "twoStep" ? "twoStep" : "fixed",
        stepMonth: Number((parsed as any).stepMonth) || undefined,
        ratePercentAfter: Number((parsed as any).ratePercentAfter) || undefined
      };
      setValues(cleaned);
      setMessage("시나리오를 불러왔습니다.");
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setError("불러오기에 실패했습니다.");
    }
  }

  function copyLinkWithQuery() {
    try {
      const url = new URL(window.location.href);
      const sp = url.searchParams;
      (Object.keys(values) as (keyof FormValues)[]).forEach((k) => {
        sp.set(`${idPrefix}_${k}`, String((values as any)[k] ?? ""));
      });
      url.search = sp.toString();
      navigator.clipboard.writeText(url.toString());
      setMessage("현재 값을 포함한 링크가 복사되었습니다.");
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setError("링크 복사에 실패했습니다.");
    }
  }

  function applyPreset(kind: "relaxed" | "base" | "tight") {
    const changes: Partial<FormValues> = {};
    if (kind === "relaxed") {
      changes.interestRatePercent = Math.max(0, values.interestRatePercent - 1);
      changes.dsrLimitPercent = Math.min(80, values.dsrLimitPercent + 5);
      if (values.loanType === "mortgage") changes.ltvLimitPercent = Math.min(85, (values.ltvLimitPercent ?? 70) + 5);
    } else if (kind === "base") {
      changes.interestRatePercent = 4.0;
      changes.dsrLimitPercent = 40;
      if (values.loanType === "mortgage") changes.ltvLimitPercent = 70;
    } else if (kind === "tight") {
      changes.interestRatePercent = values.interestRatePercent + 1;
      changes.dsrLimitPercent = Math.max(10, values.dsrLimitPercent - 5);
      if (values.loanType === "mortgage") changes.ltvLimitPercent = Math.max(40, (values.ltvLimitPercent ?? 70) - 5);
    }
    setValues((prev: FormValues) => {
      const merged = { ...prev, ...changes } as FormValues;
      onValuesChange?.(merged);
      return merged;
    });
  }

  // Debounced auto calculation on value change
  useEffect(() => {
    if (!autoCalc) return;
    const t = setTimeout(() => {
      performCalc();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, autoCalc]);

  return (
    <form onSubmit={onSubmit} className="form">
      <div className="grid two-col gap-md">
        <div className="field">
          <label>대출 유형</label>
          <select
            value={values.loanType}
            onChange={(e) => handleChangeString("loanType", e.target.value)}
          >
            <option value="unsecured">신용</option>
            <option value="mortgage">주담대</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-monthlyIncome`}>월 소득 (원)</label>
          <input
            id={`${idPrefix}-monthlyIncome`}
            type="number"
            min={0}
            step={10000}
            value={values.monthlyIncome}
            onChange={(e) => handleChange("monthlyIncome", Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-existingDebtBalance`}>기존 대출 잔액 (원)</label>
          <input
            id={`${idPrefix}-existingDebtBalance`}
            type="number"
            min={0}
            step={10000}
            value={values.existingDebtBalance}
            onChange={(e) => handleChange("existingDebtBalance", Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-existingMonthlyPayment`}>기존 월 상환액 (원)</label>
          <input
            id={`${idPrefix}-existingMonthlyPayment`}
            type="number"
            min={0}
            step={10000}
            value={values.existingMonthlyPayment}
            onChange={(e) => handleChange("existingMonthlyPayment", Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-desiredLoanAmount`}>희망 대출 금액 (원)</label>
          <input
            id={`${idPrefix}-desiredLoanAmount`}
            type="number"
            min={0}
            step={1000000}
            value={values.desiredLoanAmount}
            onChange={(e) => handleChange("desiredLoanAmount", Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-desiredLoanTermMonths`}>희망 기간 (개월)</label>
          <input
            id={`${idPrefix}-desiredLoanTermMonths`}
            type="number"
            min={1}
            max={1200}
            step={12}
            value={values.desiredLoanTermMonths}
            onChange={(e) => handleChange("desiredLoanTermMonths", Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>금리: {values.interestRatePercent.toFixed(2)}%</label>
          <input
            type="range"
            min={0}
            max={20}
            step={0.05}
            value={values.interestRatePercent}
            onChange={(e) => handleChange("interestRatePercent", Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>금리 모드</label>
          <select value={values.rateMode} onChange={(e) => handleChangeString("rateMode", e.target.value)}>
            <option value="fixed">고정</option>
            <option value="twoStep">2단계 변동</option>
          </select>
        </div>
        {values.rateMode === "twoStep" && (
          <>
            <div className="field">
              <label htmlFor={`${idPrefix}-stepMonth`}>변동 시점 (개월)</label>
              <input
                id={`${idPrefix}-stepMonth`}
                type="number"
                min={1}
                max={Math.max(1, values.desiredLoanTermMonths - 1)}
                step={1}
                value={values.stepMonth ?? 24}
                onChange={(e) => handleChange("stepMonth", Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>변동 후 금리: {(values.ratePercentAfter ?? values.interestRatePercent).toFixed(2)}%</label>
              <input
                type="range"
                min={0}
                max={20}
                step={0.05}
                value={values.ratePercentAfter ?? values.interestRatePercent}
                onChange={(e) => handleChange("ratePercentAfter", Number(e.target.value))}
              />
            </div>
          </>
        )}
        <div className="field">
          <label>DSR 한도: {values.dsrLimitPercent}%</label>
          <input
            type="range"
            min={10}
            max={80}
            step={1}
            value={values.dsrLimitPercent}
            onChange={(e) => handleChange("dsrLimitPercent", Number(e.target.value))}
          />
        </div>

        {values.loanType === "mortgage" && (
          <>
            <div className="field">
              <label htmlFor={`${idPrefix}-collateralValue`}>담보가치 (원)</label>
              <input
                id={`${idPrefix}-collateralValue`}
                type="number"
                min={0}
                step={1000000}
                value={values.collateralValue ?? 0}
                onChange={(e) => handleChange("collateralValue", Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>LTV 한도: {values.ltvLimitPercent ?? 70}%</label>
              <input
                type="range"
                min={30}
                max={90}
                step={1}
                value={values.ltvLimitPercent ?? 70}
                onChange={(e) => handleChange("ltvLimitPercent", Number(e.target.value))}
              />
            </div>
          </>
        )}
      </div>

      <div className="actions">
        <button type="submit" disabled={loading}>
          {loading ? "계산 중..." : "계산하기"}
        </button>
        <button type="button" onClick={saveLocal} style={{ marginLeft: 8 }}>저장</button>
        <button type="button" onClick={loadLocal} style={{ marginLeft: 8 }}>불러오기</button>
        <button type="button" onClick={copyLinkWithQuery} style={{ marginLeft: 8 }}>링크 복사</button>
        <label style={{ marginLeft: 12, fontSize: 12, color: "var(--muted)" }}>
          <input type="checkbox" checked={autoCalc} onChange={(e) => setAutoCalc(e.target.checked)} style={{ marginRight: 6 }} />
          자동 계산
        </label>
        <div style={{ marginTop: 8 }}>
          <button type="button" onClick={() => applyPreset("relaxed")}>완화</button>
          <button type="button" onClick={() => applyPreset("base")} style={{ marginLeft: 8 }}>기준</button>
          <button type="button" onClick={() => applyPreset("tight")} style={{ marginLeft: 8 }}>강화</button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p className="notes">{message}</p>}

      {result && (
        <div className="results">
          <div className={`badge ${result.safetySignal}`}>{signalText[result.safetySignal]}</div>
          <div style={{ marginTop: 8 }}>
            {values.desiredLoanAmount > result.maxLoanAllowed ? (
              <span className="limit-badge over">희망 금액이 한도를 초과했습니다</span>
            ) : (
              <span className="limit-badge ok">희망 금액이 한도 이내입니다</span>
            )}
          </div>
          <ul className="stats">
            <li>
              <span className="label">가능 대출 최대 금액</span>
              <span className="value">{currencyFormatter.format(result.maxLoanAllowed)}</span>
            </li>
            <li>
              <span className="label">신규 월 상환액</span>
              <span className="value">{currencyFormatter.format(result.monthlyPayment)}</span>
            </li>
            {result.monthlyPaymentAfterStep != null && (
              <li>
                <span className="label">변동 이후 월 상환액</span>
                <span className="value">{currencyFormatter.format(result.monthlyPaymentAfterStep)}</span>
              </li>
            )}
            <li>
              <span className="label">예상 총 DSR</span>
              <span className="value">{result.dsrAfterPercent.toFixed(1)}%</span>
            </li>
          </ul>
          <details className="details">
            <summary>계산 근거 보기</summary>
            <div className="grid two-col gap-sm explanation">
              <div>
                <div className="kv"><span>월 소득</span><span>{currencyFormatter.format(result.explanation.monthlyIncome)}</span></div>
                <div className="kv"><span>DSR 한도</span><span>{result.explanation.dsrLimitPercent}%</span></div>
                <div className="kv"><span>허용 총 부채상환</span><span>{currencyFormatter.format(result.explanation.allowedTotalDebtService)}</span></div>
              </div>
              <div>
                <div className="kv"><span>기존 월 상환</span><span>{currencyFormatter.format(result.explanation.existingMonthlyPayment)}</span></div>
                <div className="kv"><span>신규에 허용</span><span>{currencyFormatter.format(result.explanation.allowedForNewLoan)}</span></div>
                <div className="kv"><span>금리/기간</span><span>{result.explanation.interestRatePercent}% · {result.explanation.desiredLoanTermMonths}개월</span></div>
              </div>
            </div>
            <p className="notes">{result.explanation.notes}</p>
          </details>
        </div>
      )}
    </form>
  );
}


